/**
 * Update User Profile Lambda Function
 *
 * Updates user profile information
 * Implements PATCH /users/me from API_SPECIFICATIONS.md
 */

const {
  getItem,
  updateItem,
  successResponse,
  parseBody,
  getUserId,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  handleErrors
} = require('./shared/utils');

const USERS_TABLE = process.env.USERS_TABLE;

/**
 * Main handler
 */
exports.handler = handleErrors(async (event, context) => {
  console.log('Update User Profile Event:', JSON.stringify(event));

  const userId = getUserId(event);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const body = parseBody(event);

  // Check if user exists
  const existingUser = await getItem({
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    }
  });

  if (!existingUser) {
    throw new NotFoundError(`User not found: ${userId}`);
  }

  // Build update expression dynamically based on provided fields
  const allowedFields = [
    'firstName',
    'lastName',
    'phoneNumber',
    'dateOfBirth',
    'address',
    'language',
    'preferredCurrency',
    'newsletterSubscribed',
    'notificationPreferences'
  ];

  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  // Map request body to DynamoDB attributes
  const fieldMapping = {
    firstName: 'FirstName',
    lastName: 'LastName',
    phoneNumber: 'PhoneNumber',
    dateOfBirth: 'DateOfBirth',
    address: 'Address',
    language: 'Language',
    preferredCurrency: 'PreferredCurrency',
    newsletterSubscribed: 'NewsletterSubscribed',
    notificationPreferences: 'NotificationPreferences'
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const dbField = fieldMapping[field];
      const placeholder = `:${field}`;

      updateExpressions.push(`#${field} = ${placeholder}`);
      expressionAttributeNames[`#${field}`] = dbField;
      expressionAttributeValues[placeholder] = body[field];
    }
  }

  if (updateExpressions.length === 0) {
    throw new ValidationError('No valid fields provided for update');
  }

  // Add UpdatedAt timestamp
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  // Update user profile
  const result = await updateItem({
    TableName: USERS_TABLE,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE'
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  });

  const updatedUser = result.Attributes;

  // Format response
  const profile = {
    userId: updatedUser.UserId,
    email: updatedUser.Email,
    firstName: updatedUser.FirstName,
    lastName: updatedUser.LastName,
    phoneNumber: updatedUser.PhoneNumber,
    dateOfBirth: updatedUser.DateOfBirth,

    address: updatedUser.Address,

    preferences: {
      language: updatedUser.Language || 'en',
      currency: updatedUser.PreferredCurrency || 'USD',
      newsletter: updatedUser.NewsletterSubscribed || false,
      notifications: updatedUser.NotificationPreferences || {
        email: true,
        sms: false,
        push: true
      }
    },

    updatedAt: updatedUser.UpdatedAt
  };

  return successResponse(
    { user: profile },
    200,
    { requestId: context.requestId }
  );
});
