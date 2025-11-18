/**
 * Get User Bookings Lambda Function
 *
 * Retrieves all bookings for the authenticated user
 * Implements GET /users/me/bookings from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  successResponse,
  parseQueryParams,
  getUserId,
  UnauthorizedError,
  handleErrors
} = require('../shared/utils');

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Get User Bookings Event:', JSON.stringify(event));

  const userId = getUserId(event);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const params = parseQueryParams(event);

  // Parse filters
  const status = params.status; // upcoming, past, cancelled, all
  const limit = parseInt(params.limit) || 20;
  const nextToken = params.nextToken;

  // Query user bookings using UserBookingsIndex (GSI2)
  const queryParams = {
    TableName: BOOKINGS_TABLE,
    IndexName: 'UserBookingsIndex',
    KeyConditionExpression: 'GSI2PK = :userId',
    ExpressionAttributeValues: {
      ':userId': `USER#${userId}`
    },
    Limit: limit,
    ScanIndexForward: false // Most recent first
  };

  // Add status filter if specified
  if (status && status !== 'all') {
    queryParams.FilterExpression = 'Status = :status';
    queryParams.ExpressionAttributeValues[':status'] = status;
  }

  // Handle pagination
  if (nextToken) {
    try {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    } catch (error) {
      console.error('Invalid nextToken:', error);
    }
  }

  const result = await queryDynamoDB(queryParams);
  const bookings = result.Items || [];

  // Format bookings for response
  const formattedBookings = bookings
    .filter(item => item.EntityType === 'Booking')
    .map(formatBooking);

  // Create next token for pagination
  const hasMore = !!result.LastEvaluatedKey;
  const newNextToken = hasMore
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;

  return successResponse(
    {
      bookings: formattedBookings,
      pagination: {
        limit,
        hasMore,
        nextToken: newNextToken
      }
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Format booking for response
 */
function formatBooking(booking) {
  const today = new Date().toISOString().split('T')[0];
  const checkIn = booking.CheckInDate;
  const checkOut = booking.CheckOutDate;

  // Determine trip status
  let tripStatus = 'upcoming';
  if (booking.Status === 'cancelled') {
    tripStatus = 'cancelled';
  } else if (checkOut < today) {
    tripStatus = 'past';
  } else if (checkIn <= today && checkOut >= today) {
    tripStatus = 'current';
  }

  return {
    bookingId: booking.BookingId,
    bookingReference: booking.BookingReference,
    status: booking.Status,
    tripStatus,

    property: {
      propertyId: booking.PropertyId,
      name: booking.PropertyName
    },

    dates: {
      checkIn: booking.CheckInDate,
      checkOut: booking.CheckOutDate,
      nights: booking.NumberOfNights
    },

    guests: {
      adults: booking.Adults,
      children: booking.Children,
      total: booking.TotalGuests
    },

    pricing: {
      total: booking.TotalAmount,
      currency: booking.Currency
    },

    guest: booking.Guest,

    createdAt: booking.CreatedAt,
    updatedAt: booking.UpdatedAt
  };
}
