/**
 * Get User Profile Lambda Function
 *
 * Retrieves user profile information
 * Implements GET /users/me from API_SPECIFICATIONS.md
 */

const {
  getItem,
  successResponse,
  getUserId,
  UnauthorizedError,
  NotFoundError,
  handleErrors
} = require('./shared/utils');

const USERS_TABLE = process.env.USERS_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Get User Profile Event:', JSON.stringify(event));

  const userId = getUserId(event);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Get user profile
  const user = await getItem({
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  });

  if (!user) {
    throw new NotFoundError(`User not found: ${userId}`);
  }

  // Format user profile (exclude sensitive data)
  const profile = {
    userId: user.UserId,
    email: user.Email,
    firstName: user.FirstName,
    lastName: user.LastName,
    phoneNumber: user.PhoneNumber,
    dateOfBirth: user.DateOfBirth,

    address: user.Address ? {
      street: user.Address.Street,
      city: user.Address.City,
      state: user.Address.State,
      country: user.Address.Country,
      postalCode: user.Address.PostalCode
    } : null,

    preferences: {
      language: user.Language || 'en',
      currency: user.PreferredCurrency || 'USD',
      newsletter: user.NewsletterSubscribed || false,
      notifications: user.NotificationPreferences || {
        email: true,
        sms: false,
        push: true
      }
    },

    loyaltyProgram: user.LoyaltyTier ? {
      tier: user.LoyaltyTier,
      points: user.LoyaltyPoints || 0
    } : null,

    stats: {
      totalBookings: user.TotalBookings || 0,
      completedStays: user.CompletedStays || 0,
      totalSpent: user.TotalSpent || 0,
      memberSince: user.CreatedAt
    },

    verifications: {
      emailVerified: user.EmailVerified || false,
      phoneVerified: user.PhoneVerified || false,
      identityVerified: user.IdentityVerified || false
    },

    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt
  };

  return successResponse(
    { user: profile },
    200,
    { requestId: context.requestId }
  );
});
