/**
 * Create Review Lambda Function
 *
 * Creates a new review for a completed booking
 * Implements POST /reviews from API_SPECIFICATIONS.md
 */

const { v4: uuidv4 } = require('uuid');
const {
  getItem,
  putItem,
  updateItem,
  successResponse,
  parseBody,
  validateRequired,
  getUserId,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  handleErrors
} = require('../shared/utils');

const REVIEWS_TABLE = process.env.REVIEWS_TABLE;
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Create Review Event:', JSON.stringify(event));

  const userId = getUserId(event);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const body = parseBody(event);

  // Validate required fields
  validateRequired(body, ['bookingId', 'overallRating', 'reviewText']);

  const {
    bookingId,
    overallRating,
    reviewText,
    title,
    ratings,
    pros,
    cons,
    travelType
  } = body;

  // Validate rating value
  if (overallRating < 1 || overallRating > 10) {
    throw new ValidationError('Overall rating must be between 1 and 10');
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
    throw new ValidationError(`Booking not found: ${bookingId}`);
  }

  // Verify user owns this booking
  if (booking.UserId !== userId) {
    throw new UnauthorizedError('You can only review your own bookings');
  }

  // Verify booking is completed
  if (booking.Status !== 'completed') {
    throw new ValidationError('You can only review completed bookings');
  }

  // Check if review already exists
  const existingReview = await getItem({
    TableName: REVIEWS_TABLE,
    Key: {
      PK: `REVIEW#${bookingId}`,
      SK: 'METADATA'
    }
  });

  if (existingReview) {
    throw new ConflictError('A review already exists for this booking');
  }

  // Generate review ID
  const reviewId = `rev_${uuidv4()}`;
  const timestamp = new Date().toISOString();

  // Calculate category ratings (use provided or default to overall rating)
  const cleanlinessRating = ratings?.cleanliness || overallRating;
  const communicationRating = ratings?.communication || overallRating;
  const checkInRating = ratings?.checkIn || overallRating;
  const accuracyRating = ratings?.accuracy || overallRating;
  const locationRating = ratings?.location || overallRating;
  const valueRating = ratings?.value || overallRating;

  // Validate all ratings
  const allRatings = [
    cleanlinessRating,
    communicationRating,
    checkInRating,
    accuracyRating,
    locationRating,
    valueRating
  ];

  for (const rating of allRatings) {
    if (rating < 1 || rating > 10) {
      throw new ValidationError('All ratings must be between 1 and 10');
    }
  }

  // Create review item
  const review = {
    PK: `REVIEW#${bookingId}`,
    SK: 'METADATA',
    EntityType: 'Review',
    ReviewId: reviewId,
    BookingId: bookingId,
    PropertyId: booking.PropertyId,
    UserId: userId,

    // Ratings
    OverallRating: overallRating,
    CleanlinessRating: cleanlinessRating,
    CommunicationRating: communicationRating,
    CheckInRating: checkInRating,
    AccuracyRating: accuracyRating,
    LocationRating: locationRating,
    ValueRating: valueRating,

    // Content
    Title: title,
    ReviewText: reviewText,
    Pros: pros,
    Cons: cons,

    // Stay details
    CheckInDate: booking.CheckInDate,
    CheckOutDate: booking.CheckOutDate,
    TravelType: travelType || 'other',

    // Metadata
    IsVerified: true, // Verified because it's from a real booking
    Status: 'pending', // Pending moderation
    HelpfulCount: 0,
    ReportCount: 0,

    CreatedAt: timestamp,
    UpdatedAt: timestamp,

    // GSI keys for querying
    GSI1PK: `PROPERTY#${booking.PropertyId}`,
    GSI1SK: `REVIEW#${timestamp}`,
    GSI2PK: `USER#${userId}`,
    GSI2SK: `REVIEW#${timestamp}`
  };

  // Save review
  await putItem({
    TableName: REVIEWS_TABLE,
    Item: review
  });

  // Update booking with review flag
  await updateItem({
    TableName: BOOKINGS_TABLE,
    Key: {
      PK: `BOOKING#${bookingId}`,
      SK: 'METADATA'
    },
    UpdateExpression: 'SET HasReview = :true, ReviewId = :reviewId, UpdatedAt = :timestamp',
    ExpressionAttributeValues: {
      ':true': true,
      ':reviewId': reviewId,
      ':timestamp': timestamp
    }
  });

  // Format response
  const formattedReview = {
    reviewId,
    bookingId,
    propertyId: booking.PropertyId,

    rating: {
      overall: overallRating,
      cleanliness: cleanlinessRating,
      communication: communicationRating,
      checkIn: checkInRating,
      accuracy: accuracyRating,
      location: locationRating,
      value: valueRating
    },

    content: {
      title,
      review: reviewText,
      pros,
      cons
    },

    status: 'pending',
    verified: true,
    createdAt: timestamp
  };

  return successResponse(
    { review: formattedReview },
    201,
    { requestId: context.requestId }
  );
});
