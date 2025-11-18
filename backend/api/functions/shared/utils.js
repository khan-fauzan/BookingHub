/**
 * Shared utilities for Lambda functions
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false
  }
});

/**
 * Standard error codes
 */
const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_DATES: 'INVALID_DATES',
  INSUFFICIENT_AVAILABILITY: 'INSUFFICIENT_AVAILABILITY',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
};

/**
 * Create standardized success response
 */
function successResponse(data, statusCode = 200, meta = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    })
  };
}

/**
 * Create standardized error response
 */
function errorResponse(code, message, statusCode = 400, requestId = null) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
        requestId,
        timestamp: new Date().toISOString()
      }
    })
  };
}

/**
 * Validate required fields in request body
 */
function validateRequired(body, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (!body[field]) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Validate date range
 */
function validateDateRange(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  if (checkInDate < today) {
    throw new ValidationError('Check-in date cannot be in the past');
  }

  if (checkOutDate <= checkInDate) {
    throw new ValidationError('Check-out date must be after check-in date');
  }

  const daysDiff = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    throw new ValidationError('Maximum stay duration is 30 days');
  }

  return { checkInDate, checkOutDate, nights: daysDiff };
}

/**
 * Parse query string parameters
 */
function parseQueryParams(event) {
  return event.queryStringParameters || {};
}

/**
 * Parse request body
 */
function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Get user ID from event context
 */
function getUserId(event) {
  // Extract from Cognito authorizer
  if (event.requestContext?.authorizer?.claims?.sub) {
    return event.requestContext.authorizer.claims.sub;
  }
  // Extract from custom authorizer
  if (event.requestContext?.authorizer?.userId) {
    return event.requestContext.authorizer.userId;
  }
  return null;
}

/**
 * Query DynamoDB
 */
async function queryDynamoDB(params) {
  try {
    const command = new QueryCommand(params);
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB Query Error:', error);
    throw new DatabaseError('Failed to query database', error);
  }
}

/**
 * Get item from DynamoDB
 */
async function getItem(params) {
  try {
    const command = new GetCommand(params);
    const result = await docClient.send(command);
    return result.Item;
  } catch (error) {
    console.error('DynamoDB GetItem Error:', error);
    throw new DatabaseError('Failed to get item from database', error);
  }
}

/**
 * Put item to DynamoDB
 */
async function putItem(params) {
  try {
    const command = new PutCommand(params);
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB PutItem Error:', error);
    throw new DatabaseError('Failed to put item to database', error);
  }
}

/**
 * Update item in DynamoDB
 */
async function updateItem(params) {
  try {
    const command = new UpdateCommand(params);
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB UpdateItem Error:', error);
    throw new DatabaseError('Failed to update item in database', error);
  }
}

/**
 * Transaction write to DynamoDB
 */
async function transactWrite(params) {
  try {
    const command = new TransactWriteCommand(params);
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB TransactWrite Error:', error);
    if (error.name === 'TransactionCanceledException') {
      const reasons = error.CancellationReasons || [];
      console.error('Transaction cancellation reasons:', reasons);
      throw new ConflictError('Transaction failed due to conflicts', reasons);
    }
    throw new DatabaseError('Failed to execute transaction', error);
  }
}

/**
 * Generate date array between two dates
 */
function getDatesBetween(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate < lastDate) {
    dates.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Custom error classes
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = ErrorCodes.VALIDATION_ERROR;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = ErrorCodes.NOT_FOUND;
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.code = ErrorCodes.UNAUTHORIZED;
    this.statusCode = 401;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.code = ErrorCodes.FORBIDDEN;
    this.statusCode = 403;
  }
}

class ConflictError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ConflictError';
    this.code = ErrorCodes.CONFLICT;
    this.statusCode = 409;
    this.details = details;
  }
}

class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.code = ErrorCodes.INTERNAL_ERROR;
    this.statusCode = 500;
    this.originalError = originalError;
  }
}

/**
 * Error handler wrapper for Lambda functions
 */
function handleErrors(fn) {
  return async (event, context) => {
    try {
      return await fn(event, context);
    } catch (error) {
      console.error('Lambda Error:', error);

      // Handle custom errors
      if (error.code && error.statusCode) {
        return errorResponse(
          error.code,
          error.message,
          error.statusCode,
          context.requestId
        );
      }

      // Handle unknown errors
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'An unexpected error occurred',
        500,
        context.requestId
      );
    }
  };
}

module.exports = {
  // DynamoDB operations
  docClient,
  queryDynamoDB,
  getItem,
  putItem,
  updateItem,
  transactWrite,

  // Response helpers
  successResponse,
  errorResponse,

  // Validation helpers
  validateRequired,
  validateDateRange,
  parseQueryParams,
  parseBody,
  getUserId,

  // Utility functions
  getDatesBetween,
  calculateDistance,

  // Error classes
  ErrorCodes,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,

  // Error handler
  handleErrors
};
