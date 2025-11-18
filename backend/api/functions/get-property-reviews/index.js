/**
 * Get Property Reviews Lambda Function
 *
 * Retrieves reviews for a specific property
 * Implements GET /properties/{propertyId}/reviews from API_SPECIFICATIONS.md
 */

const {
  queryDynamoDB,
  successResponse,
  parseQueryParams,
  NotFoundError,
  handleErrors
} = require('./shared/utils');

const REVIEWS_TABLE = process.env.REVIEWS_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Get Property Reviews Event:', JSON.stringify(event));

  const propertyId = event.pathParameters?.propertyId;
  if (!propertyId) {
    throw new NotFoundError('Property ID is required');
  }

  const params = parseQueryParams(event);

  // Parse filters and pagination
  const minRating = params.minRating ? parseFloat(params.minRating) : null;
  const sortBy = params.sortBy || 'recent'; // recent, rating_high, rating_low, helpful
  const limit = parseInt(params.limit) || 20;
  const nextToken = params.nextToken;

  // Query reviews using PropertyReviewsIndex (GSI1)
  const queryParams = {
    TableName: REVIEWS_TABLE,
    IndexName: 'PropertyReviewsIndex',
    KeyConditionExpression: 'GSI1PK = :propertyId',
    ExpressionAttributeValues: {
      ':propertyId': `PROPERTY#${propertyId}`
    },
    Limit: limit,
    ScanIndexForward: sortBy === 'rating_low' ? true : false
  };

  // Add rating filter if specified
  if (minRating) {
    queryParams.FilterExpression = 'OverallRating >= :minRating';
    queryParams.ExpressionAttributeValues[':minRating'] = minRating;
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
  let reviews = result.Items || [];

  // Filter to only include review entities
  reviews = reviews.filter(item => item.EntityType === 'Review');

  // Apply sorting
  reviews = sortReviews(reviews, sortBy);

  // Format reviews for response
  const formattedReviews = reviews.map(formatReview);

  // Create next token for pagination
  const hasMore = !!result.LastEvaluatedKey;
  const newNextToken = hasMore
    ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
    : null;

  // Calculate summary statistics
  const summary = calculateReviewSummary(reviews);

  return successResponse(
    {
      propertyId,
      reviews: formattedReviews,
      summary,
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
 * Sort reviews by specified criteria
 */
function sortReviews(reviews, sortBy) {
  const sortFunctions = {
    recent: (a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt),
    rating_high: (a, b) => b.OverallRating - a.OverallRating,
    rating_low: (a, b) => a.OverallRating - b.OverallRating,
    helpful: (a, b) => (b.HelpfulCount || 0) - (a.HelpfulCount || 0)
  };

  const sortFn = sortFunctions[sortBy] || sortFunctions.recent;
  return [...reviews].sort(sortFn);
}

/**
 * Calculate review summary statistics
 */
function calculateReviewSummary(reviews) {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.OverallRating, 0);
  const averageRating = totalRating / reviews.length;

  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    const rating = Math.floor(review.OverallRating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++;
    }
  });

  return {
    totalReviews: reviews.length,
    averageRating: Math.round(averageRating * 10) / 10,
    ratingDistribution
  };
}

/**
 * Format review for response
 */
function formatReview(review) {
  return {
    reviewId: review.ReviewId,
    bookingId: review.BookingId,

    rating: {
      overall: review.OverallRating,
      cleanliness: review.CleanlinessRating,
      communication: review.CommunicationRating,
      checkIn: review.CheckInRating,
      accuracy: review.AccuracyRating,
      location: review.LocationRating,
      value: review.ValueRating
    },

    content: {
      title: review.Title,
      review: review.ReviewText,
      pros: review.Pros,
      cons: review.Cons
    },

    reviewer: {
      userId: review.UserId,
      name: review.GuestName,
      avatar: review.GuestAvatar,
      totalReviews: review.ReviewerTotalReviews,
      memberSince: review.ReviewerMemberSince
    },

    stay: {
      roomType: review.RoomType,
      checkIn: review.CheckInDate,
      checkOut: review.CheckOutDate,
      travelType: review.TravelType // solo, couple, family, business, friends
    },

    response: review.OwnerResponse ? {
      text: review.OwnerResponse,
      respondedAt: review.OwnerRespondedAt
    } : null,

    verified: review.IsVerified || false,
    helpful: review.HelpfulCount || 0,

    status: review.Status,
    createdAt: review.CreatedAt,
    updatedAt: review.UpdatedAt
  };
}
