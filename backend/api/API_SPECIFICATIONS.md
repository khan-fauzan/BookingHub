# API Specifications
## Hotel Booking Platform - DynamoDB Backend

---

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-11-18
- **Backend**: Amazon DynamoDB
- **API Style**: RESTful
- **Authentication**: AWS Cognito / JWT (to be implemented)

---

## Table of Contents
1. [Overview](#overview)
2. [API Design Principles](#api-design-principles)
3. [Authentication & Authorization](#authentication--authorization)
4. [Property Search APIs](#property-search-apis)
5. [Availability & Pricing APIs](#availability--pricing-apis)
6. [Booking Management APIs](#booking-management-apis)
7. [User Management APIs](#user-management-apis)
8. [Review Management APIs](#review-management-apis)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Response Formats](#response-formats)

---

## 1. Overview

This document defines the REST API specifications for the Hotel Booking Platform backend powered by Amazon DynamoDB. All APIs are designed to map directly to the optimized DynamoDB access patterns defined in the database schema.

### Base URL
```
Development: https://api-dev.hotelbooking.com/v1
Staging: https://api-staging.hotelbooking.com/v1
Production: https://api.hotelbooking.com/v1
```

### API Versioning
- Version is included in URL path (`/v1/`)
- Breaking changes require new version
- Deprecated versions supported for 6 months minimum

---

## 2. API Design Principles

### REST Conventions
- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources
- **PUT**: Update entire resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

### Response Codes
- `200 OK`: Successful GET/PUT/PATCH request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Pagination
All list endpoints support pagination:
```json
{
  "items": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true,
    "nextToken": "eyJQSyI6IlBST1BFUlRZI3Byb3BfMTIzIn0="
  }
}
```

---

## 3. Authentication & Authorization

### Authentication Methods
1. **JWT Tokens** (AWS Cognito)
2. **API Keys** (for partner integrations)

### Protected Endpoints
Require `Authorization: Bearer <token>` header:
- All `/bookings/*` endpoints
- All `/users/*` endpoints
- POST `/reviews`
- All `/owner/*` endpoints
- All `/admin/*` endpoints

### Public Endpoints
No authentication required:
- GET `/properties/*`
- GET `/availability/*`
- GET `/reviews/*`
- GET `/amenities`

---

## 4. Property Search APIs

### 4.1 Search Properties

**Endpoint**: `GET /properties/search`

**Description**: Search properties with filters, sorting, and pagination

**DynamoDB Access Pattern**: LocationIndex, GeoIndex, TypeRatingIndex

**Query Parameters**:
```typescript
{
  // Location (required - one of the following)
  city?: string;           // e.g., "New York"
  country?: string;        // e.g., "USA"
  latitude?: number;       // For proximity search
  longitude?: number;      // For proximity search
  radius?: number;         // In kilometers (default: 10)

  // Dates & Guests
  checkIn: string;         // ISO date: "2025-01-15"
  checkOut: string;        // ISO date: "2025-01-18"
  adults: number;          // Default: 2
  children?: number;       // Default: 0
  rooms?: number;          // Default: 1

  // Filters
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];   // e.g., [4, 5]
  propertyType?: string[]; // e.g., ["hotel", "resort"]
  amenities?: string[];    // e.g., ["wifi", "pool", "gym"]
  minGuestRating?: number; // e.g., 8.0
  freeCancellation?: boolean;

  // Sorting
  sortBy?: "recommended" | "price_asc" | "price_desc" | "rating" | "distance";

  // Pagination
  limit?: number;          // Default: 20, Max: 100
  offset?: number;         // Default: 0
  nextToken?: string;      // For cursor-based pagination
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "propertyId": "prop_ny_001",
        "name": "The Manhattan Grand Hotel",
        "slug": "manhattan-grand-hotel-new-york",
        "propertyType": "hotel",
        "starRating": 5,
        "location": {
          "city": "New York",
          "state": "NY",
          "country": "USA",
          "address": "768 Fifth Avenue",
          "latitude": 40.7614,
          "longitude": -73.9776,
          "distanceFromCenter": 1.2
        },
        "rating": {
          "average": 9.4,
          "reviewCount": 2847
        },
        "images": {
          "primary": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
          "count": 32
        },
        "pricing": {
          "pricePerNight": 350,
          "totalPrice": 1050,
          "currency": "USD",
          "taxesIncluded": false
        },
        "availability": {
          "available": true,
          "roomsAvailable": 5
        },
        "amenities": ["wifi", "pool", "gym", "spa", "restaurant"],
        "badges": ["Featured", "Free Cancellation"],
        "isFeatured": true
      }
    ],
    "filters": {
      "applied": {
        "city": "New York",
        "checkIn": "2025-01-15",
        "checkOut": "2025-01-18",
        "adults": 2
      },
      "available": {
        "priceRange": {"min": 150, "max": 1200},
        "starRatings": [3, 4, 5],
        "propertyTypes": ["hotel", "apartment", "resort"],
        "amenities": ["wifi", "pool", "gym", "spa"]
      }
    },
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45,
      "hasMore": true,
      "nextToken": "eyJQSyI6IlBST1BFUlRZI3Byb3BfMDIwIn0="
    }
  },
  "meta": {
    "timestamp": "2025-11-18T14:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**DynamoDB Query**:
```javascript
// City search
const params = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'LocationIndex',
  KeyConditionExpression: 'GSI1PK = :city',
  FilterExpression: 'StarRating >= :stars AND AverageRating >= :rating',
  ExpressionAttributeValues: {
    ':city': `CITY#${city}#${country}`,
    ':stars': minStarRating,
    ':rating': minGuestRating
  },
  Limit: limit
};

// Proximity search (geohash)
const params = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'GeoIndex',
  KeyConditionExpression: 'GSI2PK = :geo',
  ExpressionAttributeValues: {
    ':geo': `GEO#${geohash6}`
  }
};
```

---

### 4.2 Get Property Details

**Endpoint**: `GET /properties/:propertyId`

**Description**: Get full details of a specific property

**DynamoDB Access Pattern**: Primary Key Query

**Path Parameters**:
- `propertyId`: Unique property identifier

**Query Parameters**:
```typescript
{
  checkIn?: string;     // To show availability
  checkOut?: string;    // To show availability
  adults?: number;
  children?: number;
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "property": {
      "propertyId": "prop_ny_001",
      "name": "The Manhattan Grand Hotel",
      "slug": "manhattan-grand-hotel-new-york",
      "description": "Luxury 5-star hotel in the heart of Manhattan...",
      "propertyType": "hotel",
      "starRating": 5,
      "location": {
        "address": {
          "line1": "768 Fifth Avenue",
          "line2": null,
          "city": "New York",
          "state": "NY",
          "country": "USA",
          "postalCode": "10019"
        },
        "coordinates": {
          "latitude": 40.7614,
          "longitude": -73.9776
        },
        "distanceFromCenter": 1.2,
        "nearbyLandmarks": [
          {"name": "Central Park", "distance": 0.3},
          {"name": "Times Square", "distance": 0.8}
        ]
      },
      "contact": {
        "phone": "+1-212-555-0100",
        "email": "info@manhattangrand.com",
        "website": "https://manhattangrand.com"
      },
      "rating": {
        "overall": 9.4,
        "breakdown": {
          "cleanliness": 9.5,
          "comfort": 9.4,
          "location": 9.8,
          "facilities": 9.2,
          "staff": 9.6,
          "value": 8.9
        },
        "reviewCount": 2847
      },
      "images": [
        {
          "url": "https://cdn.example.com/prop_123/main.jpg",
          "category": "exterior",
          "altText": "Hotel exterior view",
          "isPrimary": true
        }
      ],
      "amenities": [
        {"id": "wifi", "name": "Free WiFi", "category": "basic"},
        {"id": "pool", "name": "Swimming Pool", "category": "recreation"}
      ],
      "roomTypes": [
        {
          "roomTypeId": "room_001",
          "name": "Deluxe King Room",
          "description": "Spacious room with king bed...",
          "maxOccupancy": 2,
          "bedConfiguration": [{"type": "king", "count": 1}],
          "roomSize": 32,
          "amenities": ["wifi", "tv", "minibar", "safe"],
          "images": ["https://cdn.example.com/room_001/1.jpg"],
          "pricing": {
            "basePrice": 350,
            "totalPrice": 1050,
            "currency": "USD"
          },
          "availability": {
            "available": true,
            "roomsAvailable": 5
          },
          "cancellationPolicy": "free_cancellation_48h"
        }
      ],
      "policies": {
        "checkIn": "15:00",
        "checkOut": "11:00",
        "cancellation": "Free cancellation up to 48 hours before check-in",
        "pets": "Pets not allowed",
        "children": "Children of all ages welcome"
      },
      "highlights": [
        "Central Park views",
        "Rooftop pool and bar",
        "Michelin-starred restaurant",
        "24/7 concierge service"
      ]
    }
  }
}
```

**DynamoDB Query**:
```javascript
// Get property metadata
const propertyParams = {
  TableName: 'hotel-booking-properties-dev',
  KeyConditionExpression: 'PK = :pk AND SK = :sk',
  ExpressionAttributeValues: {
    ':pk': `PROPERTY#${propertyId}`,
    ':sk': 'METADATA'
  }
};

// Get all room types for property
const roomsParams = {
  TableName: 'hotel-booking-properties-dev',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: {
    ':pk': `PROPERTY#${propertyId}`,
    ':sk': 'ROOM#'
  }
};
```

---

### 4.3 Get Property by Slug

**Endpoint**: `GET /properties/slug/:slug`

**Description**: Get property by URL-friendly slug

**DynamoDB Access Pattern**: SlugIndex (GSI6)

**Response**: Same as Get Property Details

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'SlugIndex',
  KeyConditionExpression: 'Slug = :slug AND SK = :sk',
  ExpressionAttributeValues: {
    ':slug': slug,
    ':sk': 'METADATA'
  }
};
```

---

### 4.4 Get Featured Properties

**Endpoint**: `GET /properties/featured`

**Description**: Get featured/trending properties

**DynamoDB Access Pattern**: FeaturedIndex (GSI5)

**Query Parameters**:
```typescript
{
  limit?: number;    // Default: 10
  category?: string; // e.g., "luxury", "budget", "family"
}
```

**Response**: Array of property objects (same format as search)

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'FeaturedIndex',
  KeyConditionExpression: 'GSI5PK = :featured',
  ExpressionAttributeValues: {
    ':featured': 'FEATURED'
  },
  ScanIndexForward: false,  // Descending by score
  Limit: limit
};
```

---

## 5. Availability & Pricing APIs

### 5.1 Check Room Availability

**Endpoint**: `POST /availability/check`

**Description**: Check availability for specific rooms and dates

**DynamoDB Access Pattern**: Availability Table Primary Key Query

**Request Body**:
```json
{
  "propertyId": "prop_ny_001",
  "roomTypeId": "room_001",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-18",
  "adults": 2,
  "children": 1,
  "rooms": 1
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "roomsAvailable": 5,
    "dates": [
      {
        "date": "2025-01-15",
        "available": true,
        "roomsAvailable": 5,
        "pricePerNight": 350,
        "currency": "USD"
      },
      {
        "date": "2025-01-16",
        "available": true,
        "roomsAvailable": 5,
        "pricePerNight": 380,
        "currency": "USD"
      },
      {
        "date": "2025-01-17",
        "available": true,
        "roomsAvailable": 5,
        "pricePerNight": 380,
        "currency": "USD"
      }
    ],
    "pricing": {
      "breakdown": [
        {"description": "3 nights × $370 avg", "amount": 1110},
        {"description": "Taxes and fees", "amount": 133.20}
      ],
      "subtotal": 1110,
      "taxes": 133.20,
      "total": 1243.20,
      "currency": "USD"
    }
  }
}
```

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-availability-dev',
  KeyConditionExpression: 'PK = :room AND SK BETWEEN :start AND :end',
  FilterExpression: 'AvailableRooms >= :required',
  ExpressionAttributeValues: {
    ':room': `ROOM#${roomTypeId}`,
    ':start': `DATE#${checkIn}`,
    ':end': `DATE#${checkOut}`,
    ':required': roomsRequested
  }
};
```

---

### 5.2 Get Property Availability Calendar

**Endpoint**: `GET /properties/:propertyId/availability`

**Description**: Get availability calendar for all room types

**DynamoDB Access Pattern**: PropertyDateIndex (GSI1)

**Query Parameters**:
```typescript
{
  startDate: string;  // "2025-01-01"
  endDate: string;    // "2025-01-31"
  roomTypeId?: string; // Optional: specific room type
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "propertyId": "prop_ny_001",
    "calendar": [
      {
        "date": "2025-01-15",
        "rooms": [
          {
            "roomTypeId": "room_001",
            "roomType": "Deluxe King Room",
            "available": true,
            "roomsAvailable": 5,
            "totalRooms": 20,
            "pricePerNight": 350,
            "currency": "USD"
          }
        ]
      }
    ]
  }
}
```

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-availability-dev',
  IndexName: 'PropertyDateIndex',
  KeyConditionExpression: 'GSI1PK = :property AND GSI1SK BETWEEN :start AND :end',
  ExpressionAttributeValues: {
    ':property': `PROPERTY#${propertyId}`,
    ':start': `DATE#${startDate}`,
    ':end': `DATE#${endDate}`
  }
};
```

---

### 5.3 Calculate Booking Price

**Endpoint**: `POST /pricing/calculate`

**Description**: Calculate total price with breakdown

**Request Body**:
```json
{
  "propertyId": "prop_ny_001",
  "roomTypeId": "room_001",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-18",
  "rooms": 1,
  "adults": 2,
  "children": 1,
  "promoCode": "SUMMER2024"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pricing": {
      "breakdown": [
        {"description": "Room (3 nights × $370)", "amount": 1110.00},
        {"description": "Taxes (12%)", "amount": 133.20},
        {"description": "Service fee", "amount": 50.00},
        {"description": "Promo code (SUMMER2024)", "amount": -111.00}
      ],
      "subtotal": 1110.00,
      "taxes": 133.20,
      "fees": 50.00,
      "discount": -111.00,
      "total": 1182.20,
      "currency": "USD"
    },
    "cancellationPolicy": {
      "type": "free_cancellation_48h",
      "description": "Free cancellation until 48 hours before check-in",
      "refundable": true,
      "cutoffDate": "2025-01-13T15:00:00Z"
    }
  }
}
```

---

## 6. Booking Management APIs

### 6.1 Create Booking

**Endpoint**: `POST /bookings`

**Description**: Create a new booking

**Authentication**: Required

**DynamoDB Access Pattern**: Put Item + Update Availability

**Request Body**:
```json
{
  "propertyId": "prop_ny_001",
  "roomTypeId": "room_001",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-18",
  "rooms": 1,
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "country": "USA"
  },
  "adults": 2,
  "children": 1,
  "specialRequests": "Non-smoking room, high floor",
  "payment": {
    "method": "credit_card",
    "token": "tok_stripe_xyz123"
  },
  "promoCode": "SUMMER2024"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingId": "bkg_12345",
      "bookingReference": "BKG-2024-XYZ123",
      "status": "confirmed",
      "propertyId": "prop_ny_001",
      "propertyName": "The Manhattan Grand Hotel",
      "roomType": "Deluxe King Room",
      "checkIn": "2025-01-15",
      "checkOut": "2025-01-18",
      "numberOfNights": 3,
      "guest": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      },
      "pricing": {
        "total": 1182.20,
        "currency": "USD"
      },
      "payment": {
        "status": "paid",
        "transactionId": "pay_67890"
      },
      "cancellationPolicy": "free_cancellation_48h",
      "createdAt": "2025-11-18T14:30:00Z",
      "confirmedAt": "2025-11-18T14:30:05Z"
    }
  }
}
```

**DynamoDB Operations**:
```javascript
// 1. Create booking metadata
const bookingMetadata = {
  PK: `BOOKING#${bookingId}`,
  SK: 'METADATA',
  // ... all booking fields
  GSI1PK: `USER#${userId}`,
  GSI1SK: `CHECKIN#${checkIn}#BOOKING#${bookingId}`,
  GSI2PK: `PROPERTY#${propertyId}`,
  GSI2SK: `CHECKIN#${checkIn}#BOOKING#${bookingId}`,
  GSI3PK: `STATUS#confirmed`,
  GSI3SK: `CREATED#${timestamp}`,
  GSI4PK: `REFERENCE#${bookingReference}`,
  GSI4SK: 'BOOKING'
};

// 2. Create booking room record
const bookingRoom = {
  PK: `BOOKING#${bookingId}`,
  SK: `ROOM#${roomTypeId}`,
  // ... room details
};

// 3. Create payment record
const payment = {
  PK: `BOOKING#${bookingId}`,
  SK: 'PAYMENT',
  // ... payment details
};

// 4. Update availability (decrement available rooms)
// Use UpdateItem with atomic counter
const updateAvailability = {
  TableName: 'hotel-booking-availability-dev',
  Key: { PK: `ROOM#${roomTypeId}`, SK: `DATE#${date}` },
  UpdateExpression: 'SET AvailableRooms = AvailableRooms - :decrement',
  ConditionExpression: 'AvailableRooms >= :required',
  ExpressionAttributeValues: {
    ':decrement': roomsBooked,
    ':required': roomsBooked
  }
};

// Use DynamoDB Transaction for atomicity
const transactItems = {
  TransactItems: [
    { Put: { TableName: 'Bookings', Item: bookingMetadata } },
    { Put: { TableName: 'Bookings', Item: bookingRoom } },
    { Put: { TableName: 'Bookings', Item: payment } },
    { Update: updateAvailability }
  ]
};
```

---

### 6.2 Get User's Bookings

**Endpoint**: `GET /users/me/bookings`

**Description**: Get all bookings for authenticated user

**Authentication**: Required

**DynamoDB Access Pattern**: UserBookingsIndex (GSI1)

**Query Parameters**:
```typescript
{
  status?: "upcoming" | "past" | "cancelled" | "all";
  limit?: number;
  nextToken?: string;
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "bookingId": "bkg_12345",
        "bookingReference": "BKG-2024-XYZ123",
        "status": "confirmed",
        "property": {
          "propertyId": "prop_ny_001",
          "name": "The Manhattan Grand Hotel",
          "image": "https://cdn.example.com/prop_123/main.jpg",
          "city": "New York",
          "starRating": 5
        },
        "room": {
          "roomTypeId": "room_001",
          "name": "Deluxe King Room"
        },
        "checkIn": "2025-01-15",
        "checkOut": "2025-01-18",
        "numberOfNights": 3,
        "totalAmount": 1182.20,
        "currency": "USD",
        "canCancel": true,
        "canReview": false,
        "createdAt": "2025-11-18T14:30:00Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "hasMore": false,
      "nextToken": null
    }
  }
}
```

**DynamoDB Query**:
```javascript
// Upcoming bookings
const params = {
  TableName: 'hotel-booking-bookings-dev',
  IndexName: 'UserBookingsIndex',
  KeyConditionExpression: 'GSI1PK = :user AND GSI1SK > :today',
  FilterExpression: '#status IN (:confirmed, :pending)',
  ExpressionAttributeNames: { '#status': 'Status' },
  ExpressionAttributeValues: {
    ':user': `USER#${userId}`,
    ':today': `CHECKIN#${today}`,
    ':confirmed': 'confirmed',
    ':pending': 'pending'
  }
};

// Past bookings
const params = {
  TableName: 'hotel-booking-bookings-dev',
  IndexName: 'UserBookingsIndex',
  KeyConditionExpression: 'GSI1PK = :user AND GSI1SK < :today',
  FilterExpression: '#status = :completed',
  ExpressionAttributeNames: { '#status': 'Status' },
  ExpressionAttributeValues: {
    ':user': `USER#${userId}`,
    ':today': `CHECKIN#${today}`,
    ':completed': 'completed'
  }
};
```

---

### 6.3 Get Booking by Reference

**Endpoint**: `GET /bookings/:reference`

**Description**: Get booking details by reference number

**Authentication**: Optional (returns limited info if not authenticated or not owner)

**DynamoDB Access Pattern**: ReferenceIndex (GSI4)

**Response**: Same as booking details from Create Booking

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-bookings-dev',
  IndexName: 'ReferenceIndex',
  KeyConditionExpression: 'GSI4PK = :ref AND GSI4SK = :type',
  ExpressionAttributeValues: {
    ':ref': `REFERENCE#${reference}`,
    ':type': 'BOOKING'
  }
};
```

---

### 6.4 Cancel Booking

**Endpoint**: `DELETE /bookings/:bookingId`

**Description**: Cancel an existing booking

**Authentication**: Required

**Request Body**:
```json
{
  "reason": "Change of plans"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "bookingId": "bkg_12345",
    "status": "cancelled",
    "refund": {
      "eligible": true,
      "amount": 1182.20,
      "currency": "USD",
      "method": "original_payment_method",
      "estimatedDays": "5-7 business days"
    },
    "cancelledAt": "2025-11-18T15:00:00Z"
  }
}
```

**DynamoDB Operations**:
```javascript
// 1. Update booking status
const updateBooking = {
  TableName: 'hotel-booking-bookings-dev',
  Key: { PK: `BOOKING#${bookingId}`, SK: 'METADATA' },
  UpdateExpression: 'SET #status = :cancelled, CancelledAt = :now, CancellationReason = :reason, GSI3PK = :newStatus',
  ExpressionAttributeNames: { '#status': 'Status' },
  ExpressionAttributeValues: {
    ':cancelled': 'cancelled',
    ':now': new Date().toISOString(),
    ':reason': reason,
    ':newStatus': 'STATUS#cancelled'
  },
  ConditionExpression: '#status IN (:confirmed, :pending)',
  ExpressionAttributeValues: {
    ':confirmed': 'confirmed',
    ':pending': 'pending'
  }
};

// 2. Update availability (increment available rooms)
const updateAvailability = {
  TableName: 'hotel-booking-availability-dev',
  Key: { PK: `ROOM#${roomTypeId}`, SK: `DATE#${date}` },
  UpdateExpression: 'SET AvailableRooms = AvailableRooms + :increment',
  ExpressionAttributeValues: {
    ':increment': roomsBooked
  }
};

// 3. Process refund (if applicable)
```

---

## 7. User Management APIs

### 7.1 Get User Profile

**Endpoint**: `GET /users/me`

**Description**: Get authenticated user's profile

**Authentication**: Required

**DynamoDB Access Pattern**: Primary Key Query

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user_456",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1-555-123-4567",
      "profilePhoto": "https://cdn.example.com/users/user_456.jpg",
      "country": "USA",
      "preferredCurrency": "USD",
      "preferredLanguage": "en",
      "emailVerified": true,
      "phoneVerified": false,
      "loyalty": {
        "points": 2500,
        "tier": "gold",
        "tierSince": "2024-06-01",
        "benefits": [
          "10% discount on all bookings",
          "Free room upgrades (subject to availability)",
          "Late checkout"
        ]
      },
      "createdAt": "2024-01-10T08:00:00Z"
    }
  }
}
```

**DynamoDB Query**:
```javascript
// Get user profile
const profileParams = {
  TableName: 'hotel-booking-users-dev',
  Key: {
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }
};

// Get loyalty points
const loyaltyParams = {
  TableName: 'hotel-booking-users-dev',
  Key: {
    PK: `USER#${userId}`,
    SK: 'LOYALTY'
  }
};
```

---

### 7.2 Update User Profile

**Endpoint**: `PATCH /users/me`

**Description**: Update user profile

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1-555-123-4567",
  "preferredCurrency": "USD",
  "preferredLanguage": "en"
}
```

**Response**: Updated user profile (same format as Get User Profile)

---

## 8. Review Management APIs

### 8.1 Get Property Reviews

**Endpoint**: `GET /properties/:propertyId/reviews`

**Description**: Get all reviews for a property

**DynamoDB Access Pattern**: PropertyReviewsIndex (GSI1)

**Query Parameters**:
```typescript
{
  sortBy?: "recent" | "highest" | "lowest";
  minRating?: number;
  tripType?: "solo" | "couple" | "family" | "business";
  limit?: number;
  nextToken?: string;
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": "rev_999",
        "bookingId": "bkg_12345",
        "rating": {
          "overall": 9.0,
          "cleanliness": 9.5,
          "comfort": 9.0,
          "location": 10.0,
          "facilities": 8.5,
          "staff": 9.5,
          "value": 8.5
        },
        "title": "Wonderful stay!",
        "text": "Had an amazing experience at this hotel...",
        "pros": "Great location, friendly staff",
        "cons": "Breakfast could be improved",
        "tripType": "couple",
        "stayDate": "2025-01-15",
        "guest": {
          "name": "John D.",
          "country": "USA"
        },
        "helpfulCount": 12,
        "isVerified": true,
        "propertyResponse": {
          "text": "Thank you for your feedback...",
          "respondedAt": "2025-01-21T14:00:00Z"
        },
        "createdAt": "2025-01-20T10:00:00Z"
      }
    ],
    "summary": {
      "totalReviews": 2847,
      "averageRating": 9.4,
      "breakdown": {
        "cleanliness": 9.5,
        "comfort": 9.4,
        "location": 9.8,
        "facilities": 9.2,
        "staff": 9.6,
        "value": 8.9
      },
      "distribution": {
        "5": 2100,
        "4": 600,
        "3": 100,
        "2": 30,
        "1": 17
      }
    },
    "pagination": {
      "limit": 20,
      "hasMore": true,
      "nextToken": "eyJQSyI6IlJFVklFVyNyZXZfMDIwIn0="
    }
  }
}
```

**DynamoDB Query**:
```javascript
const params = {
  TableName: 'hotel-booking-reviews-dev',
  IndexName: 'PropertyReviewsIndex',
  KeyConditionExpression: 'GSI1PK = :property',
  FilterExpression: 'OverallRating >= :minRating AND TripType = :tripType',
  ExpressionAttributeValues: {
    ':property': `PROPERTY#${propertyId}`,
    ':minRating': minRating,
    ':tripType': tripType
  },
  ScanIndexForward: false,  // Most recent first
  Limit: limit
};
```

---

### 8.2 Create Review

**Endpoint**: `POST /reviews`

**Description**: Submit a review for a completed booking

**Authentication**: Required

**Request Body**:
```json
{
  "bookingId": "bkg_12345",
  "rating": {
    "overall": 9.0,
    "cleanliness": 9.5,
    "comfort": 9.0,
    "location": 10.0,
    "facilities": 8.5,
    "staff": 9.5,
    "value": 8.5
  },
  "title": "Wonderful stay!",
  "text": "Had an amazing experience at this hotel...",
  "pros": "Great location, friendly staff",
  "cons": "Breakfast could be improved",
  "tripType": "couple"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "review": {
      "reviewId": "rev_999",
      "status": "pending",
      "message": "Thank you for your review! It will be published after moderation.",
      "createdAt": "2025-01-20T10:00:00Z"
    }
  }
}
```

**DynamoDB Operations**:
```javascript
const review = {
  PK: `REVIEW#${reviewId}`,
  SK: 'METADATA',
  // ... all review fields
  GSI1PK: `PROPERTY#${propertyId}`,
  GSI1SK: `CREATED#${timestamp}`,
  GSI2PK: `USER#${userId}`,
  GSI2SK: `CREATED#${timestamp}`,
  GSI3PK: `STATUS#pending`,
  GSI3SK: `CREATED#${timestamp}`,
  GSI4PK: `BOOKING#${bookingId}`,
  GSI4SK: 'REVIEW',
  Status: 'pending'
};
```

---

## 9. Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Check-in date must be in the future",
    "details": {
      "field": "checkIn",
      "value": "2024-01-01",
      "constraint": "must_be_future_date"
    },
    "requestId": "req_abc123",
    "timestamp": "2025-11-18T14:30:00Z"
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_PARAMETERS` | 400 | Invalid request parameters |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Property/booking not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `NO_AVAILABILITY` | 409 | No rooms available |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | DynamoDB error |
| `PAYMENT_FAILED` | 502 | Payment processing failed |

---

## 10. Rate Limiting

### Limits
- **Anonymous**: 100 requests/minute
- **Authenticated**: 500 requests/minute
- **Premium**: 2000 requests/minute

### Headers
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 450
X-RateLimit-Reset: 1637251200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## 11. Response Formats

### Success Response Structure
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-11-18T14:30:00Z",
    "requestId": "req_abc123",
    "version": "1.0"
  }
}
```

### Pagination Response
```json
{
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "hasMore": true,
    "nextToken": "eyJQSyI6IlBST1BFUlRZI3Byb3BfMDIwIn0="
  }
}
```

---

## Appendix: Complete DynamoDB Query Reference

### Property Search Queries

```javascript
// 1. Search by City
const citySearch = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'LocationIndex',
  KeyConditionExpression: 'GSI1PK = :city',
  ExpressionAttributeValues: {
    ':city': 'CITY#New York#USA'
  }
};

// 2. Proximity Search
const proximitySearch = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'GeoIndex',
  KeyConditionExpression: 'GSI2PK = :geo',
  ExpressionAttributeValues: {
    ':geo': 'GEO#dr5reg'
  }
};

// 3. Get by Property Type
const typeSearch = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'TypeRatingIndex',
  KeyConditionExpression: 'GSI4PK = :type',
  ExpressionAttributeValues: {
    ':type': 'TYPE#hotel'
  }
};

// 4. Get Featured Properties
const featuredSearch = {
  TableName: 'hotel-booking-properties-dev',
  IndexName: 'FeaturedIndex',
  KeyConditionExpression: 'GSI5PK = :featured',
  ExpressionAttributeValues: {
    ':featured': 'FEATURED'
  },
  ScanIndexForward: false
};
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Maintained By**: Backend Team
