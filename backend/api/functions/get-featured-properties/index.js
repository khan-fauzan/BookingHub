/**
 * Get Featured Properties Lambda Function
 *
 * Retrieves featured/promoted properties
 * Implements GET /properties/featured from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  successResponse,
  parseQueryParams,
  handleErrors
} = require('./shared/utils');

const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Get Featured Properties Event:', JSON.stringify(event));

  const params = parseQueryParams(event);

  // Parse parameters
  const limit = parseInt(params.limit) || 10;
  const city = params.city;
  const country = params.country;

  // Query featured properties using FeaturedIndex
  const queryParams = {
    TableName: PROPERTIES_TABLE,
    IndexName: 'FeaturedIndex',
    KeyConditionExpression: 'GSI5PK = :featured',
    ExpressionAttributeValues: {
      ':featured': 'FEATURED#true'
    },
    Limit: limit,
    ScanIndexForward: false // Get highest featured rank first
  };

  // Add location filter if provided
  if (city || country) {
    const filterExpressions = [];
    if (city) {
      queryParams.ExpressionAttributeValues[':city'] = city;
      filterExpressions.push('City = :city');
    }
    if (country) {
      queryParams.ExpressionAttributeValues[':country'] = country;
      filterExpressions.push('Country = :country');
    }
    queryParams.FilterExpression = filterExpressions.join(' AND ');
  }

  const result = await queryDynamoDB(queryParams);
  const properties = result.Items || [];

  // Format properties for response
  const formattedProperties = properties.map(formatFeaturedProperty);

  return successResponse(
    {
      properties: formattedProperties,
      count: formattedProperties.length
    },
    200,
    { requestId: context.requestId }
  );
});

/**
 * Format featured property for response
 */
function formatFeaturedProperty(property) {
  return {
    propertyId: property.PropertyId,
    name: property.Name,
    slug: property.Slug,
    propertyType: property.PropertyType,
    starRating: property.StarRating,

    address: {
      city: property.City,
      state: property.State,
      country: property.Country
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
      featured: property.FeaturedImage
    },

    features: {
      isFeatured: true,
      featuredRank: property.FeaturedRank,
      instantBook: property.InstantBook || false
    },

    amenities: property.Amenities || [],

    description: property.ShortDescription || property.Description?.substring(0, 200)
  };
}
