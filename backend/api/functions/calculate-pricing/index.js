/**
 * Calculate Pricing Lambda Function
 *
 * Calculates total pricing for a booking including taxes, fees, and discounts
 * Implements POST /pricing/calculate from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  getItem,
  successResponse,
  parseBody,
  validateRequired,
  validateDateRange,
  getDatesBetween,
  handleErrors
} = require('./shared/utils');

const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE;
const METADATA_TABLE = process.env.METADATA_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Calculate Pricing Event:', JSON.stringify(event));

  const body = parseBody(event);

  // Validate required fields
  validateRequired(body, ['roomTypeId', 'checkIn', 'checkOut']);

  const { roomTypeId, checkIn, checkOut, promoCode } = body;
  const rooms = parseInt(body.rooms) || 1;

  // Validate dates
  const { nights } = validateDateRange(checkIn, checkOut);
  const dates = getDatesBetween(checkIn, checkOut);

  // Get pricing for each night
  const dailyPricing = [];
  let roomSubtotal = 0;
  let currency = 'USD';

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
      const nightlyRate = item.Price || 0;
      currency = item.Currency || currency;

      dailyPricing.push({
        date,
        baseRate: nightlyRate,
        multiplier: item.PriceMultiplier || 1.0,
        finalRate: nightlyRate
      });

      roomSubtotal += nightlyRate;
    } else {
      // No availability data for this date
      dailyPricing.push({
        date,
        baseRate: 0,
        multiplier: 1.0,
        finalRate: 0
      });
    }
  }

  // Multiply by number of rooms
  const totalRoomCost = roomSubtotal * rooms;

  // Calculate taxes (12%)
  const taxRate = 0.12;
  const taxes = Math.round(totalRoomCost * taxRate * 100) / 100;

  // Calculate service fee (5%)
  const serviceFeeRate = 0.05;
  const serviceFee = Math.round(totalRoomCost * serviceFeeRate * 100) / 100;

  // Calculate discount from promo code
  let discount = 0;
  let promoCodeDetails = null;

  if (promoCode) {
    const promo = await getPromoCode(promoCode);
    if (promo && promo.IsActive) {
      if (promo.DiscountType === 'percentage') {
        discount = Math.round(totalRoomCost * (promo.DiscountValue / 100) * 100) / 100;
      } else if (promo.DiscountType === 'fixed') {
        discount = promo.DiscountValue;
      }

      promoCodeDetails = {
        code: promo.Code,
        description: promo.Description,
        discountType: promo.DiscountType,
        discountValue: promo.DiscountValue
      };
    }
  }

  // Calculate total
  const subtotal = totalRoomCost;
  const total = subtotal + taxes + serviceFee - discount;

  // Calculate average nightly rate
  const averageNightlyRate = nights > 0 ? subtotal / nights : 0;

  return successResponse(
    {
      pricing: {
        roomSubtotal: Math.round(roomSubtotal * 100) / 100,
        numberOfRooms: rooms,
        numberOfNights: nights,
        subtotal: Math.round(subtotal * 100) / 100,
        taxes: taxes,
        serviceFee: serviceFee,
        discount: discount,
        total: Math.round(total * 100) / 100,
        currency,
        averageNightlyRate: Math.round(averageNightlyRate * 100) / 100
      },
      breakdown: {
        dailyPricing,
        fees: [
          {
            name: 'Taxes',
            rate: `${taxRate * 100}%`,
            amount: taxes
          },
          {
            name: 'Service Fee',
            rate: `${serviceFeeRate * 100}%`,
            amount: serviceFee
          }
        ]
      },
      promoCode: promoCodeDetails
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Get promo code details
 */
async function getPromoCode(code) {
  try {
    return await getItem({
      TableName: METADATA_TABLE,
      Key: {
        PK: 'CATALOG#promo_codes',
        SK: `ITEM#${code.toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Error fetching promo code:', error);
    return null;
  }
}
