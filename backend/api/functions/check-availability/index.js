/**
 * Check Availability Lambda Function
 *
 * Checks real-time availability for a property/room type
 * Implements POST /availability/check from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  getItem,
  successResponse,
  parseBody,
  validateRequired,
  validateDateRange,
  getDatesBetween,
  NotFoundError,
  handleErrors
} = require('../shared/utils');

const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE;
const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Check Availability Event:', JSON.stringify(event));

  const body = parseBody(event);

  // Validate required fields
  validateRequired(body, ['propertyId', 'checkIn', 'checkOut']);

  const { propertyId, roomTypeId, checkIn, checkOut } = body;
  const roomsRequired = parseInt(body.rooms) || 1;

  // Validate dates
  const { nights } = validateDateRange(checkIn, checkOut);

  // Get all dates in the range (excluding check-out date)
  const dates = getDatesBetween(checkIn, checkOut);

  // If specific room type requested, check only that one
  if (roomTypeId) {
    const availability = await checkRoomTypeAvailability(
      roomTypeId,
      dates,
      roomsRequired
    );

    return successResponse(
      {
        propertyId,
        roomTypeId,
        checkIn,
        checkOut,
        nights,
        roomsRequested: roomsRequired,
        available: availability.available,
        roomsAvailable: availability.minAvailable,
        dailyAvailability: availability.dailyAvailability,
        pricing: availability.pricing
      },
      200,
      { requestId: context.requestId }
    );
  }

  // Otherwise, check all room types for this property
  const roomTypes = await getRoomTypesForProperty(propertyId);

  if (roomTypes.length === 0) {
    throw new NotFoundError(`No room types found for property: ${propertyId}`);
  }

  // Check availability for each room type
  const roomAvailability = await Promise.all(
    roomTypes.map(async roomType => {
      const availability = await checkRoomTypeAvailability(
        roomType.RoomTypeId,
        dates,
        roomsRequired
      );

      return {
        roomTypeId: roomType.RoomTypeId,
        roomTypeName: roomType.Name,
        basePrice: roomType.BasePrice,
        available: availability.available,
        roomsAvailable: availability.minAvailable,
        totalPrice: availability.pricing.total,
        currency: availability.pricing.currency
      };
    })
  );

  // Check if any room type is available
  const hasAvailability = roomAvailability.some(room => room.available);

  return successResponse(
    {
      propertyId,
      checkIn,
      checkOut,
      nights,
      roomsRequested: roomsRequired,
      available: hasAvailability,
      roomTypes: roomAvailability
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Get room types for a property
 */
async function getRoomTypesForProperty(propertyId) {
  const result = await queryDynamoDB({
    TableName: PROPERTIES_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `PROPERTY#${propertyId}`,
      ':sk': 'ROOM#'
    }
  });

  return result.Items || [];
}

/**
 * Check availability for a specific room type across date range
 */
async function checkRoomTypeAvailability(roomTypeId, dates, roomsRequired) {
  // Query availability for all dates
  const availabilityChecks = await Promise.all(
    dates.map(date =>
      queryDynamoDB({
        TableName: AVAILABILITY_TABLE,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `ROOM#${roomTypeId}`,
          ':sk': `DATE#${date}`
        }
      })
    )
  );

  // Process availability results
  const dailyAvailability = [];
  let minAvailable = Infinity;
  let totalPrice = 0;
  let currency = 'USD';

  for (let i = 0; i < dates.length; i++) {
    const result = availabilityChecks[i];
    const item = result.Items?.[0];

    if (!item) {
      // No availability record for this date - assume no availability
      dailyAvailability.push({
        date: dates[i],
        available: 0,
        price: 0,
        currency
      });
      minAvailable = 0;
    } else {
      const available = item.AvailableRooms || 0;
      const price = item.Price || 0;
      currency = item.Currency || currency;

      dailyAvailability.push({
        date: dates[i],
        available,
        price,
        currency
      });

      minAvailable = Math.min(minAvailable, available);
      totalPrice += price;
    }
  }

  // Check if all dates have sufficient availability
  const isAvailable = minAvailable >= roomsRequired;

  // Calculate total pricing
  const roomTotal = totalPrice * roomsRequired;
  const taxes = roomTotal * 0.12; // 12% tax rate
  const serviceFee = roomTotal * 0.05; // 5% service fee

  return {
    available: isAvailable,
    minAvailable: minAvailable === Infinity ? 0 : minAvailable,
    dailyAvailability,
    pricing: {
      roomTotal,
      taxes,
      serviceFee,
      total: roomTotal + taxes + serviceFee,
      currency,
      breakdown: {
        averageNightlyRate: dailyAvailability.length > 0 ? totalPrice / dailyAvailability.length : 0,
        numberOfNights: dailyAvailability.length,
        numberOfRooms: roomsRequired
      }
    }
  };
}
