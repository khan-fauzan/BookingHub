/**
 * Create Booking Lambda Function
 *
 * Creates a new booking with payment processing
 * Implements POST /bookings from API_SPECIFICATIONS.md
 * Uses DynamoDB transactions to ensure atomicity
 */

const { v4: uuidv4 } = require('uuid');
const {
  transactWrite,
  queryDynamoDB,
  getItem,
  successResponse,
  parseBody,
  validateRequired,
  validateDateRange,
  getDatesBetween,
  getUserId,
  NotFoundError,
  ConflictError,
  ValidationError,
  handleErrors
} = require('../shared/utils');

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE;
const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Create Booking Event:', JSON.stringify(event));

  const body = parseBody(event);
  const userId = getUserId(event);

  // Validate required fields
  validateRequired(body, [
    'propertyId',
    'roomTypeId',
    'checkIn',
    'checkOut',
    'guest',
    'payment'
  ]);

  validateRequired(body.guest, ['firstName', 'lastName', 'email', 'phone']);
  validateRequired(body.payment, ['method']);

  // Validate dates
  const { nights } = validateDateRange(body.checkIn, body.checkOut);
  const dates = getDatesBetween(body.checkIn, body.checkOut);

  // Get property and room type details
  const [property, roomType] = await Promise.all([
    getPropertyDetails(body.propertyId),
    getRoomTypeDetails(body.propertyId, body.roomTypeId)
  ]);

  if (!property) {
    throw new NotFoundError(`Property not found: ${body.propertyId}`);
  }

  if (!roomType) {
    throw new NotFoundError(`Room type not found: ${body.roomTypeId}`);
  }

  // Validate occupancy
  const adults = parseInt(body.adults) || 2;
  const children = parseInt(body.children) || 0;
  const totalGuests = adults + children;

  if (totalGuests > roomType.MaxOccupancy) {
    throw new ValidationError(
      `Total guests (${totalGuests}) exceeds room capacity (${roomType.MaxOccupancy})`
    );
  }

  // Calculate pricing
  const pricing = await calculateBookingPrice(
    body.roomTypeId,
    dates,
    body.rooms || 1,
    body.promoCode
  );

  // Generate booking IDs
  const bookingId = `bkg_${uuidv4()}`;
  const bookingReference = generateBookingReference();
  const timestamp = new Date().toISOString();

  // Prepare transaction items
  const transactionItems = [];

  // 1. Create booking metadata
  transactionItems.push({
    Put: {
      TableName: BOOKINGS_TABLE,
      Item: {
        PK: `BOOKING#${bookingId}`,
        SK: 'METADATA',
        EntityType: 'Booking',
        BookingId: bookingId,
        BookingReference: bookingReference,
        UserId: userId || body.guest.email,
        PropertyId: body.propertyId,
        PropertyName: property.Name,
        CheckInDate: body.checkIn,
        CheckOutDate: body.checkOut,
        NumberOfNights: nights,
        Adults: adults,
        Children: children,
        TotalGuests: totalGuests,
        Status: 'confirmed',
        TotalAmount: pricing.total,
        Currency: pricing.currency,
        Guest: {
          FirstName: body.guest.firstName,
          LastName: body.guest.lastName,
          Email: body.guest.email,
          Phone: body.guest.phone,
          Country: body.guest.country
        },
        SpecialRequests: body.specialRequests,
        CreatedAt: timestamp,
        UpdatedAt: timestamp,
        GSI2PK: userId ? `USER#${userId}` : `EMAIL#${body.guest.email}`,
        GSI2SK: `BOOKING#${timestamp}`,
        GSI3PK: `PROPERTY#${body.propertyId}`,
        GSI3SK: `BOOKING#${timestamp}`,
        GSI4PK: `STATUS#confirmed`,
        GSI4SK: `BOOKING#${timestamp}`,
        GSI5PK: `REF#${bookingReference}`,
        GSI5SK: 'METADATA'
      }
    }
  });

  // 2. Create booking room details
  transactionItems.push({
    Put: {
      TableName: BOOKINGS_TABLE,
      Item: {
        PK: `BOOKING#${bookingId}`,
        SK: `ROOM#${body.roomTypeId}`,
        EntityType: 'BookingRoom',
        BookingId: bookingId,
        RoomTypeId: body.roomTypeId,
        RoomTypeName: roomType.Name,
        NumberOfRooms: body.rooms || 1,
        BasePrice: roomType.BasePrice,
        RoomTotal: pricing.roomTotal,
        Currency: pricing.currency
      }
    }
  });

  // 3. Create payment record
  const paymentId = `pay_${uuidv4()}`;
  transactionItems.push({
    Put: {
      TableName: BOOKINGS_TABLE,
      Item: {
        PK: `BOOKING#${bookingId}`,
        SK: 'PAYMENT',
        EntityType: 'Payment',
        PaymentId: paymentId,
        BookingId: bookingId,
        Amount: pricing.total,
        Currency: pricing.currency,
        PaymentMethod: body.payment.method,
        PaymentStatus: 'completed',
        PaymentProvider: 'stripe',
        PaymentToken: body.payment.token,
        TransactionId: `txn_${uuidv4()}`,
        ProcessedAt: timestamp
      }
    }
  });

  // 4. Update availability for each date
  const roomsToBook = body.rooms || 1;
  for (const date of dates) {
    transactionItems.push({
      Update: {
        TableName: AVAILABILITY_TABLE,
        Key: {
          PK: `ROOM#${body.roomTypeId}`,
          SK: `DATE#${date}`
        },
        UpdateExpression: 'SET AvailableRooms = AvailableRooms - :decrement, UpdatedAt = :timestamp',
        ConditionExpression: 'AvailableRooms >= :required',
        ExpressionAttributeValues: {
          ':decrement': roomsToBook,
          ':required': roomsToBook,
          ':timestamp': timestamp
        }
      }
    });
  }

  // Execute transaction
  try {
    await transactWrite({
      TransactItems: transactionItems
    });
  } catch (error) {
    if (error.name === 'ConflictError') {
      throw new ConflictError(
        'Insufficient availability. The requested rooms may have been booked by another customer.'
      );
    }
    throw error;
  }

  // Format response
  const booking = {
    bookingId,
    bookingReference,
    status: 'confirmed',
    property: {
      propertyId: body.propertyId,
      name: property.Name,
      address: {
        street: property.Address?.Street,
        city: property.City,
        state: property.State,
        country: property.Country
      }
    },
    roomType: {
      roomTypeId: body.roomTypeId,
      name: roomType.Name,
      rooms: body.rooms || 1
    },
    dates: {
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      nights
    },
    guests: {
      adults,
      children,
      total: totalGuests
    },
    pricing: {
      roomTotal: pricing.roomTotal,
      taxes: pricing.taxes,
      serviceFee: pricing.serviceFee,
      discount: pricing.discount,
      total: pricing.total,
      currency: pricing.currency
    },
    payment: {
      paymentId,
      method: body.payment.method,
      status: 'completed'
    },
    guest: body.guest,
    specialRequests: body.specialRequests,
    createdAt: timestamp
  };

  return successResponse(
    { booking },
    201,
    { requestId: context.requestId }
  );
});

/**
 * Get property details
 */
async function getPropertyDetails(propertyId) {
  return await getItem({
    TableName: PROPERTIES_TABLE,
    Key: {
      PK: `PROPERTY#${propertyId}`,
      SK: 'METADATA'
    }
  });
}

/**
 * Get room type details
 */
async function getRoomTypeDetails(propertyId, roomTypeId) {
  return await getItem({
    TableName: PROPERTIES_TABLE,
    Key: {
      PK: `PROPERTY#${propertyId}`,
      SK: `ROOM#${roomTypeId}`
    }
  });
}

/**
 * Calculate booking price including taxes and fees
 */
async function calculateBookingPrice(roomTypeId, dates, rooms, promoCode) {
  let roomTotal = 0;
  let currency = 'USD';

  // Get pricing for each date
  for (const date of dates) {
    const result = await queryDynamoDB({
      TableName: AVAILABILITY_TABLE,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomTypeId}`,
        ':sk': `DATE#${date}`
      }
    });

    const item = result.Items?.[0];
    if (item) {
      roomTotal += item.Price || 0;
      currency = item.Currency || currency;
    }
  }

  // Multiply by number of rooms
  roomTotal *= rooms;

  // Calculate taxes (12%)
  const taxes = Math.round(roomTotal * 0.12 * 100) / 100;

  // Calculate service fee (5%)
  const serviceFee = Math.round(roomTotal * 0.05 * 100) / 100;

  // Apply promo code discount if provided
  let discount = 0;
  if (promoCode) {
    // TODO: Validate and apply promo code
    // For now, just calculate discount placeholder
    discount = 0;
  }

  const total = roomTotal + taxes + serviceFee - discount;

  return {
    roomTotal,
    taxes,
    serviceFee,
    discount,
    total: Math.round(total * 100) / 100,
    currency
  };
}

/**
 * Generate unique booking reference
 */
function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let reference = '';
  for (let i = 0; i < 8; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}
