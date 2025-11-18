/**
 * Cancel Booking Lambda Function
 *
 * Cancels a booking and restores room availability
 * Implements DELETE /bookings/{bookingId} from API_SPECIFICATIONS.md
 */

const {
  getItem,
  updateItem,
  transactWrite,
  queryDynamoDB,
  successResponse,
  getUserId,
  getDatesBetween,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  handleErrors
} = require('../shared/utils');

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Cancel Booking Event:', JSON.stringify(event));

  const bookingId = event.pathParameters?.bookingId;
  const userId = getUserId(event);

  if (!bookingId) {
    throw new ValidationError('Booking ID is required');
  }

  // Get booking details
  const booking = await getItem({
    TableName: BOOKINGS_TABLE,
    Key: {
      PK: `BOOKING#${bookingId}`,
      SK: 'METADATA'
    }
  });

  if (!booking) {
    throw new NotFoundError(`Booking not found: ${bookingId}`);
  }

  // Verify user owns this booking
  if (userId && booking.UserId !== userId) {
    throw new UnauthorizedError('You are not authorized to cancel this booking');
  }

  // Check if booking can be cancelled
  if (booking.Status === 'cancelled') {
    throw new ValidationError('Booking is already cancelled');
  }

  if (booking.Status === 'completed') {
    throw new ValidationError('Cannot cancel a completed booking');
  }

  // Check cancellation policy
  const checkInDate = new Date(booking.CheckInDate);
  const today = new Date();
  const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilCheckIn < 0) {
    throw new ValidationError('Cannot cancel a booking that has already started');
  }

  // Calculate refund based on cancellation policy
  const refund = calculateRefund(booking.TotalAmount, daysUntilCheckIn);

  // Get booking room details to restore availability
  const bookingRooms = await queryDynamoDB({
    TableName: BOOKINGS_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `BOOKING#${bookingId}`,
      ':sk': 'ROOM#'
    }
  });

  const timestamp = new Date().toISOString();

  // Prepare transaction to cancel booking and restore availability
  const transactionItems = [];

  // 1. Update booking status
  transactionItems.push({
    Update: {
      TableName: BOOKINGS_TABLE,
      Key: {
        PK: `BOOKING#${bookingId}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET #status = :cancelled, CancelledAt = :timestamp, UpdatedAt = :timestamp, RefundAmount = :refund, GSI4PK = :statusIndex',
      ExpressionAttributeNames: {
        '#status': 'Status'
      },
      ExpressionAttributeValues: {
        ':cancelled': 'cancelled',
        ':timestamp': timestamp,
        ':refund': refund,
        ':statusIndex': 'STATUS#cancelled'
      }
    }
  });

  // 2. Restore availability for each room type
  for (const room of bookingRooms.Items || []) {
    const dates = getDatesBetween(booking.CheckInDate, booking.CheckOutDate);
    const roomsToRestore = room.NumberOfRooms || 1;

    for (const date of dates) {
      transactionItems.push({
        Update: {
          TableName: AVAILABILITY_TABLE,
          Key: {
            PK: `ROOM#${room.RoomTypeId}`,
            SK: `DATE#${date}`
          },
          UpdateExpression: 'SET AvailableRooms = AvailableRooms + :increment, UpdatedAt = :timestamp',
          ExpressionAttributeValues: {
            ':increment': roomsToRestore,
            ':timestamp': timestamp
          }
        }
      });
    }
  }

  // Execute transaction
  await transactWrite({
    TransactItems: transactionItems
  });

  return successResponse(
    {
      bookingId,
      status: 'cancelled',
      cancelledAt: timestamp,
      refund: {
        amount: refund,
        currency: booking.Currency,
        method: 'original_payment_method',
        processingTime: '5-10 business days'
      }
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Calculate refund amount based on cancellation policy
 */
function calculateRefund(totalAmount, daysUntilCheckIn) {
  // Flexible cancellation policy:
  // - 14+ days: 100% refund
  // - 7-13 days: 50% refund
  // - 3-6 days: 25% refund
  // - 0-2 days: No refund

  if (daysUntilCheckIn >= 14) {
    return totalAmount;
  } else if (daysUntilCheckIn >= 7) {
    return totalAmount * 0.5;
  } else if (daysUntilCheckIn >= 3) {
    return totalAmount * 0.25;
  } else {
    return 0;
  }
}
