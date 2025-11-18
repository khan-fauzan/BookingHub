/**
 * Get Property Lambda Function
 *
 * Retrieves detailed information about a specific property
 * Implements GET /properties/{propertyId} from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  getItem,
  successResponse,
  NotFoundError,
  handleErrors
} = require('./shared/utils');

const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Get Property Event:', JSON.stringify(event));

  const propertyId = event.pathParameters?.propertyId;

  if (!propertyId) {
    throw new NotFoundError('Property ID is required');
  }

  // Get property metadata
  const property = await getItem({
    TableName: PROPERTIES_TABLE,
    Key: {
      PK: `PROPERTY#${propertyId}`,
      SK: 'METADATA'
    }
  });

  if (!property) {
    throw new NotFoundError(`Property not found: ${propertyId}`);
  }

  // Get all related data for this property
  const [roomTypes, images] = await Promise.all([
    getRoomTypes(propertyId),
    getImages(propertyId)
  ]);

  // Format response
  const formattedProperty = formatPropertyDetails(property, roomTypes, images);

  return successResponse(
    { property: formattedProperty },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Get room types for a property
 */
async function getRoomTypes(propertyId) {
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
 * Get images for a property
 */
async function getImages(propertyId) {
  const result = await queryDynamoDB({
    TableName: PROPERTIES_TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `PROPERTY#${propertyId}`,
      ':sk': 'IMAGE#'
    }
  });

  return result.Items || [];
}

/**
 * Format property details for response
 */
function formatPropertyDetails(property, roomTypes, images) {
  // Group images by category
  const imagesByCategory = images.reduce((acc, img) => {
    const category = img.Category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      url: img.URL,
      caption: img.Caption,
      isPrimary: img.IsPrimary || false
    });
    return acc;
  }, {});

  // Format room types
  const formattedRoomTypes = roomTypes.map(room => ({
    roomTypeId: room.RoomTypeId,
    name: room.Name,
    description: room.Description,
    basePrice: room.BasePrice,
    currency: room.Currency,
    maxOccupancy: room.MaxOccupancy,
    size: room.Size,
    bedConfiguration: room.BedConfiguration,
    amenities: room.Amenities || [],
    images: room.Images || [],
    features: {
      view: room.View,
      floor: room.Floor,
      smokingAllowed: room.SmokingAllowed || false,
      petsAllowed: room.PetsAllowed || false
    }
  }));

  return {
    propertyId: property.PropertyId,
    name: property.Name,
    slug: property.Slug,
    description: property.Description,
    propertyType: property.PropertyType,
    starRating: property.StarRating,

    // Address & Location
    address: {
      street: property.Address?.Street,
      city: property.City,
      state: property.State,
      country: property.Country,
      postalCode: property.Address?.PostalCode,
      directions: property.Address?.Directions
    },
    location: {
      lat: property.Latitude,
      lng: property.Longitude,
      geohash: property.Geohash,
      timezone: property.Timezone
    },

    // Contact Information
    contact: {
      phone: property.Phone,
      email: property.Email,
      website: property.Website
    },

    // Pricing
    pricing: {
      startingPrice: property.StartingPrice,
      currency: property.Currency,
      taxRate: property.TaxRate,
      serviceFee: property.ServiceFee
    },

    // Ratings & Reviews
    rating: {
      average: property.AverageRating,
      total: property.TotalReviews,
      breakdown: property.RatingBreakdown || {}
    },

    // Policies
    policies: {
      checkInTime: property.CheckInTime,
      checkOutTime: property.CheckOutTime,
      cancellationPolicy: property.CancellationPolicy,
      childPolicy: property.ChildPolicy,
      petPolicy: property.PetPolicy,
      paymentMethods: property.PaymentMethods || []
    },

    // Features & Amenities
    amenities: property.Amenities || [],
    features: {
      isFeatured: property.IsFeatured || false,
      instantBook: property.InstantBook || false,
      totalRooms: property.TotalRooms,
      totalFloors: property.TotalFloors,
      yearBuilt: property.YearBuilt,
      lastRenovated: property.LastRenovated
    },

    // Images
    images: imagesByCategory,

    // Room Types
    roomTypes: formattedRoomTypes,

    // Ownership
    owner: {
      ownerId: property.OwnerId,
      ownerType: property.OwnerType
    },

    // Status
    status: property.Status,
    isActive: property.IsActive,
    createdAt: property.CreatedAt,
    updatedAt: property.UpdatedAt
  };
}
