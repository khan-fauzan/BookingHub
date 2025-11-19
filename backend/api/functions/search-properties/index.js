/**
 * Search Properties Lambda Function
 *
 * Searches for properties based on location, dates, and filters
 * Implements the property search API from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  scanDynamoDB,
  getDatesBetween,
  successResponse,
  errorResponse,
  parseQueryParams,
  validateDateRange,
  ValidationError,
  ErrorCodes,
  handleErrors
} = require('./shared/utils');

const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE;
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Search Properties Event:', JSON.stringify(event));

  const params = parseQueryParams(event);

  // Validate required parameters
  // Note: DynamoDB Scan with nested Address attributes (city-only or country-only) doesn't work reliably
  // We require both city AND country to use the LocationIndex Query which works perfectly
  // Alternative: provide lat/lng for geospatial search
  if (!(params.city && params.country) && !(params.lat && params.lng)) {
    throw new ValidationError('Please provide both city and country, or lat/lng coordinates for search');
  }

  // Validate dates if provided
  let dateValidation = null;
  if (params.checkIn && params.checkOut) {
    dateValidation = validateDateRange(params.checkIn, params.checkOut);
  }

  // Parse numeric parameters
  const limit = parseInt(params.limit) || 20;
  const offset = parseInt(params.offset) || 0;
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : null;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : null;
  const adults = parseInt(params.adults) || 2;
  const children = parseInt(params.children) || 0;
  const rooms = parseInt(params.rooms) || 1;

  // Parse array parameters
  const starRatings = params.starRating ? (Array.isArray(params.starRating) ? params.starRating : [params.starRating]) : [];
  const propertyTypes = params.propertyType ? (Array.isArray(params.propertyType) ? params.propertyType : [params.propertyType]) : [];
  const amenities = params.amenities ? (Array.isArray(params.amenities) ? params.amenities : [params.amenities]) : [];

  // Search properties
  let properties = await searchProperties({
    city: params.city,
    country: params.country,
    state: params.state,
    lat: params.lat ? parseFloat(params.lat) : null,
    lng: params.lng ? parseFloat(params.lng) : null,
    radius: params.radius ? parseFloat(params.radius) : 50 // Default 50km radius
  });

  // Filter by availability if dates provided
  if (dateValidation) {
    properties = await filterByAvailability(
      properties,
      params.checkIn,
      params.checkOut,
      rooms
    );
  }

  // Apply filters
  properties = applyFilters(properties, {
    minPrice,
    maxPrice,
    starRatings,
    propertyTypes,
    amenities,
    adults,
    children,
    rooms
  });

  // Sort results
  properties = sortProperties(properties, params.sortBy || 'recommended');

  // Calculate pagination
  const total = properties.length;
  const paginatedProperties = properties.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  // Format response
  const formattedProperties = paginatedProperties.map(formatPropertyForSearch);

  return successResponse(
    {
      properties: formattedProperties,
      pagination: {
        limit,
        offset,
        total,
        hasMore,
        nextToken: hasMore ? (offset + limit).toString() : null
      },
      filters: {
        city: params.city,
        country: params.country,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults,
        children,
        rooms
      }
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Search properties by location
 */
async function searchProperties(location) {
  const { city, country, state, lat, lng, radius } = location;

  let queryParams;

  if (city && country) {
    // Search by city using LocationIndex - use Query with KeyConditionExpression
    // GSI1PK format: CITY#{city}#{country} (without state)
    const locationKey = `CITY#${city}#${country}`;

    queryParams = {
      TableName: PROPERTIES_TABLE,
      IndexName: 'LocationIndex',
      KeyConditionExpression: 'GSI1PK = :location',
      FilterExpression: 'EntityType = :type',
      ExpressionAttributeValues: {
        ':location': locationKey,
        ':type': 'Property'
      }
    };

    const result = await queryDynamoDB(queryParams);
    return result.Items || [];
  } else if (lat && lng) {
    // For geospatial search, we'd need to:
    // 1. Calculate geohash prefix for the area
    // 2. Query GeoIndex with that prefix
    // 3. Filter by distance in-memory
    // For now, scan all properties and filter by distance
    const scanParams = {
      TableName: PROPERTIES_TABLE,
      FilterExpression: 'EntityType = :type',
      ExpressionAttributeValues: {
        ':type': 'Property'
      }
    };

    const result = await scanDynamoDB(scanParams);
    return result.Items || [];
  }

  // This should never be reached due to validation, but just in case
  throw new ValidationError('Invalid search parameters');
}

/**
 * Filter properties by availability
 */
async function filterByAvailability(properties, checkIn, checkOut, roomsRequired) {
  const dates = getDatesBetween(checkIn, checkOut);
  const availableProperties = [];

  for (const property of properties) {
    const propertyId = property.PropertyId;

    // Get room types for this property
    const roomTypes = await queryDynamoDB({
      TableName: PROPERTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PROPERTY#${propertyId}`,
        ':sk': 'ROOM#'
      }
    });

    // Check availability for each room type
    let hasAvailability = false;
    for (const roomType of roomTypes.Items || []) {
      const roomTypeId = roomType.RoomTypeId;

      // Check if this room type has availability for all dates
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

      // Check if all dates have sufficient availability
      const allDatesAvailable = availabilityChecks.every(result => {
        const item = result.Items?.[0];
        return item && item.AvailableRooms >= roomsRequired;
      });

      if (allDatesAvailable) {
        hasAvailability = true;
        break;
      }
    }

    if (hasAvailability) {
      availableProperties.push(property);
    }
  }

  return availableProperties;
}

/**
 * Apply filters to properties
 */
function applyFilters(properties, filters) {
  const {
    minPrice,
    maxPrice,
    starRatings,
    propertyTypes,
    amenities,
    adults,
    children,
    rooms
  } = filters;

  return properties.filter(property => {
    // Price filter
    if (minPrice && property.StartingPrice < minPrice) return false;
    if (maxPrice && property.StartingPrice > maxPrice) return false;

    // Star rating filter
    if (starRatings.length > 0 && !starRatings.includes(property.StarRating?.toString())) {
      return false;
    }

    // Property type filter
    if (propertyTypes.length > 0 && !propertyTypes.includes(property.PropertyType)) {
      return false;
    }

    // Amenities filter
    if (amenities.length > 0) {
      const propertyAmenities = property.Amenities || [];
      const hasAllAmenities = amenities.every(amenity =>
        propertyAmenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Occupancy filter (simplified - would need to check actual room types)
    const totalGuests = adults + children;
    if (property.MaxOccupancy && totalGuests > property.MaxOccupancy) {
      return false;
    }

    return true;
  });
}

/**
 * Sort properties by specified criteria
 */
function sortProperties(properties, sortBy) {
  const sortFunctions = {
    recommended: (a, b) => {
      // Sort by rating first, then by review count
      if (b.AverageRating !== a.AverageRating) {
        return b.AverageRating - a.AverageRating;
      }
      return b.TotalReviews - a.TotalReviews;
    },
    price_low: (a, b) => a.StartingPrice - b.StartingPrice,
    price_high: (a, b) => b.StartingPrice - a.StartingPrice,
    rating: (a, b) => {
      if (b.AverageRating !== a.AverageRating) {
        return b.AverageRating - a.AverageRating;
      }
      return b.TotalReviews - a.TotalReviews;
    },
    distance: (a, b) => (a.Distance || 0) - (b.Distance || 0)
  };

  const sortFn = sortFunctions[sortBy] || sortFunctions.recommended;
  return [...properties].sort(sortFn);
}

/**
 * Format property for search results
 */
function formatPropertyForSearch(property) {
  return {
    propertyId: property.PropertyId,
    name: property.Name,
    slug: property.Slug,
    propertyType: property.PropertyType,
    starRating: property.StarRating,
    address: {
      street: property.Address?.Street,
      city: property.City,
      state: property.State,
      country: property.Country,
      postalCode: property.Address?.PostalCode
    },
    location: {
      lat: property.Latitude,
      lng: property.Longitude
    },
    pricing: {
      startingPrice: property.StartingPrice,
      currency: property.Currency
    },
    rating: {
      average: property.AverageRating,
      total: property.TotalReviews
    },
    images: {
      thumbnail: property.ThumbnailImage,
      gallery: property.Images?.slice(0, 5) || []
    },
    amenities: property.Amenities || [],
    features: {
      isFeatured: property.IsFeatured || false,
      instantBook: property.InstantBook || false,
      freeWifi: property.Amenities?.includes('wifi'),
      freeParking: property.Amenities?.includes('parking'),
      pool: property.Amenities?.includes('pool')
    }
  };
}
