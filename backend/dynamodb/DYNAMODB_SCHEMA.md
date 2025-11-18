# DynamoDB Database Schema Specification
## Hotel Booking Platform

---

## Document Information
- **Database**: Amazon DynamoDB
- **Version**: 1.0
- **Last Updated**: 2025-11-18
- **Document Owner**: Backend Team

---

## Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Access Patterns](#access-patterns)
4. [Table Schemas](#table-schemas)
5. [Global Secondary Indexes](#global-secondary-indexes)
6. [Search Criteria Reference](#search-criteria-reference)
7. [Data Types & Formats](#data-types--formats)
8. [Capacity Planning](#capacity-planning)

---

## 1. Overview

### 1.1 Database Architecture
This specification defines the DynamoDB schema for the Hotel Booking Platform. The design follows AWS best practices for DynamoDB, utilizing:
- Optimized partition key distribution for even data access
- Strategic use of sort keys for range queries
- Global Secondary Indexes (GSIs) for additional access patterns
- Hybrid single-table and multi-table design for optimal performance

### 1.2 Design Philosophy
- **Performance First**: Schema optimized for most common queries
- **Cost Efficient**: Minimize read/write capacity units through efficient access patterns
- **Scalable**: Design supports horizontal scaling to millions of properties and bookings
- **Flexible**: GSIs enable new query patterns without table restructuring

---

## 2. Design Principles

### 2.1 DynamoDB Best Practices Applied
1. **Even Partition Distribution**: High-cardinality partition keys prevent hot partitions
2. **Composite Sort Keys**: Enable multiple query patterns on same partition
3. **Attribute Overloading**: Reuse GSI attributes for different entity types
4. **Sparse Indexes**: GSIs only index items with specific attributes
5. **Denormalization**: Duplicate data strategically to avoid joins
6. **Time-Series Optimization**: Efficient date-range queries for availability and bookings

### 2.2 Table Strategy
We use a **hybrid approach** with separate tables for:
- **Properties Table**: Property listings, rooms, and static data
- **Bookings Table**: Reservations, payments, and transactional data
- **Users Table**: User profiles, authentication, and preferences
- **Availability Table**: Time-series data for room availability and pricing
- **Reviews Table**: Guest reviews and ratings
- **Metadata Table**: Supporting data (amenities, locations, wishlists)

---

## 3. Access Patterns

### 3.1 Property Search & Discovery
| Pattern ID | Description | Table | Key Condition |
|------------|-------------|-------|---------------|
| P1 | Search properties by city/destination | Properties | GSI: LocationIndex |
| P2 | Search properties by geohash (proximity) | Properties | GSI: GeoIndex |
| P3 | Filter properties by price range | Properties | GSI: PriceIndex |
| P4 | Filter properties by star rating | Properties | GSI: RatingIndex |
| P5 | Filter properties by property type | Properties | GSI: TypeIndex |
| P6 | Search properties by amenities | Properties | GSI: AmenitiesIndex |
| P7 | Get property by ID | Properties | PK: PROPERTY#{id} |
| P8 | Get property by slug | Properties | GSI: SlugIndex |
| P9 | Get all properties for an owner | Properties | GSI: OwnerIndex |
| P10 | Get featured/trending properties | Properties | GSI: FeaturedIndex |

### 3.2 Availability & Pricing
| Pattern ID | Description | Table | Key Condition |
|------------|-------------|-------|---------------|
| A1 | Check availability for date range | Availability | PK: ROOM#{roomTypeId}, SK: DATE#{date} |
| A2 | Get pricing for specific dates | Availability | PK: ROOM#{roomTypeId}, SK: DATE#{date} |
| A3 | Bulk check availability for multiple rooms | Availability | BatchGetItem |
| A4 | Get availability calendar for property | Availability | GSI: PropertyDateIndex |

### 3.3 Booking Management
| Pattern ID | Description | Table | Key Condition |
|------------|-------------|-------|---------------|
| B1 | Get user's bookings | Bookings | GSI: UserBookingsIndex |
| B2 | Get booking by reference | Bookings | GSI: ReferenceIndex |
| B3 | Get property's bookings | Bookings | GSI: PropertyBookingsIndex |
| B4 | Get bookings by status | Bookings | GSI: StatusIndex |
| B5 | Get bookings by check-in date | Bookings | GSI: CheckInDateIndex |
| B6 | Get payment details for booking | Bookings | PK: BOOKING#{id}, SK: PAYMENT |

### 3.4 User Management
| Pattern ID | Description | Table | Key Condition |
|------------|-------------|-------|---------------|
| U1 | Get user by email | Users | GSI: EmailIndex |
| U2 | Get user profile | Users | PK: USER#{id} |
| U3 | Get user's wishlists | Metadata | PK: USER#{id}, SK begins_with WISHLIST# |
| U4 | Get user's loyalty points | Users | PK: USER#{id}, SK: LOYALTY |

### 3.5 Reviews & Ratings
| Pattern ID | Description | Table | Key Condition |
|------------|-------------|-------|---------------|
| R1 | Get reviews for property | Reviews | GSI: PropertyReviewsIndex |
| R2 | Get user's reviews | Reviews | GSI: UserReviewsIndex |
| R3 | Get review by booking | Reviews | PK: BOOKING#{bookingId} |
| R4 | Get pending reviews for moderation | Reviews | GSI: StatusIndex |

---

## 4. Table Schemas

### 4.1 Properties Table

**Purpose**: Stores all property listings, room types, and static property data.

#### Primary Key Structure
```
PK (Partition Key): PROPERTY#{propertyId}
SK (Sort Key): METADATA | ROOM#{roomTypeId} | IMAGE#{imageId} | AMENITY#{amenityId}
```

#### Attributes

**Property Entity (SK = METADATA)**
```json
{
  "PK": "PROPERTY#prop_123",
  "SK": "METADATA",
  "EntityType": "Property",
  "PropertyId": "prop_123",
  "Name": "Grand Luxury Hotel",
  "Slug": "grand-luxury-hotel-new-york",
  "PropertyType": "hotel",
  "StarRating": 5,
  "Description": "A luxurious 5-star hotel...",
  "OwnerId": "user_456",
  "Status": "approved",

  "Address": {
    "Line1": "123 Fifth Avenue",
    "Line2": "Suite 100",
    "City": "New York",
    "State": "NY",
    "Country": "USA",
    "PostalCode": "10001",
    "Latitude": 40.7589,
    "Longitude": -73.9851
  },

  "Geohash": "dr5regw3p",
  "GeohashPrecision6": "dr5reg",
  "GeohashPrecision5": "dr5re",

  "ContactInfo": {
    "Phone": "+1-212-555-0100",
    "Email": "info@grandluxury.com",
    "Website": "https://grandluxury.com"
  },

  "CheckInTime": "15:00",
  "CheckOutTime": "11:00",

  "PrimaryImageUrl": "https://cdn.example.com/prop_123/main.jpg",
  "ImageCount": 24,

  "AverageRating": 9.2,
  "ReviewCount": 1547,
  "AmenityList": ["wifi", "pool", "gym", "parking", "spa"],

  "PriceRange": {
    "Min": 150,
    "Max": 500,
    "Currency": "USD"
  },

  "IsFeatured": true,
  "FeaturedScore": 95,

  "CreatedAt": "2024-01-15T10:30:00Z",
  "UpdatedAt": "2024-11-18T14:20:00Z",

  "GSI1PK": "CITY#New York#USA",
  "GSI1SK": "RATING#9.2#PROPERTY#prop_123",
  "GSI2PK": "GEO#dr5reg",
  "GSI2SK": "PRICE#150",
  "GSI3PK": "OWNER#user_456",
  "GSI3SK": "PROPERTY#prop_123",
  "GSI4PK": "TYPE#hotel",
  "GSI4SK": "RATING#9.2",
  "GSI5PK": "FEATURED",
  "GSI5SK": "SCORE#95#PROPERTY#prop_123"
}
```

**Room Type Entity (SK = ROOM#{roomTypeId})**
```json
{
  "PK": "PROPERTY#prop_123",
  "SK": "ROOM#room_789",
  "EntityType": "RoomType",
  "RoomTypeId": "room_789",
  "PropertyId": "prop_123",
  "Name": "Deluxe King Suite",
  "Description": "Spacious suite with king bed...",
  "MaxOccupancy": 2,
  "MaxAdults": 2,
  "MaxChildren": 1,
  "RoomSizeSqm": 45.5,
  "BedConfiguration": [
    {"type": "king", "count": 1}
  ],
  "BasePricePerNight": 250.00,
  "Currency": "USD",
  "RoomAmenities": ["wifi", "tv", "minibar", "safe", "balcony"],
  "Images": [
    "https://cdn.example.com/room_789/1.jpg",
    "https://cdn.example.com/room_789/2.jpg"
  ],
  "TotalRooms": 20,
  "CreatedAt": "2024-01-15T10:30:00Z"
}
```

**Property Image Entity (SK = IMAGE#{imageId})**
```json
{
  "PK": "PROPERTY#prop_123",
  "SK": "IMAGE#img_001",
  "EntityType": "PropertyImage",
  "ImageId": "img_001",
  "Url": "https://cdn.example.com/prop_123/exterior-1.jpg",
  "AltText": "Hotel exterior view at night",
  "Category": "exterior",
  "DisplayOrder": 1,
  "IsPrimary": true,
  "CreatedAt": "2024-01-15T10:30:00Z"
}
```

#### Global Secondary Indexes

**GSI1: LocationIndex** - Search by city/location and filter by rating
```
GSI1PK: CITY#{city}#{country}
GSI1SK: RATING#{rating}#PROPERTY#{propertyId}
ProjectionType: ALL
```

**GSI2: GeoIndex** - Proximity search by geohash
```
GSI2PK: GEO#{geohash}
GSI2SK: PRICE#{minPrice}
ProjectionType: ALL
```

**GSI3: OwnerIndex** - Get properties by owner
```
GSI3PK: OWNER#{userId}
GSI3SK: PROPERTY#{propertyId}
ProjectionType: ALL
```

**GSI4: TypeRatingIndex** - Filter by property type and rating
```
GSI4PK: TYPE#{propertyType}
GSI4SK: RATING#{rating}
ProjectionType: ALL
```

**GSI5: FeaturedIndex** - Get featured/trending properties
```
GSI5PK: FEATURED
GSI5SK: SCORE#{featuredScore}#PROPERTY#{propertyId}
ProjectionType: ALL
Sparse Index: Only items with IsFeatured=true
```

**GSI6: SlugIndex** - Get property by URL slug
```
GSI6PK: SLUG#{slug}
GSI6SK: PROPERTY
ProjectionType: KEYS_ONLY
```

---

### 4.2 Availability Table

**Purpose**: Time-series data for room availability, pricing, and inventory management.

#### Primary Key Structure
```
PK (Partition Key): ROOM#{roomTypeId}
SK (Sort Key): DATE#{YYYY-MM-DD}
```

#### Attributes

```json
{
  "PK": "ROOM#room_789",
  "SK": "DATE#2025-01-15",
  "EntityType": "Availability",
  "RoomTypeId": "room_789",
  "PropertyId": "prop_123",
  "Date": "2025-01-15",
  "AvailableRooms": 18,
  "TotalRooms": 20,
  "PricePerNight": 280.00,
  "Currency": "USD",
  "MinStay": 1,
  "MaxStay": 30,
  "IsBlocked": false,
  "BlockReason": null,
  "LastUpdated": "2024-11-18T14:20:00Z",

  "GSI1PK": "PROPERTY#prop_123",
  "GSI1SK": "DATE#2025-01-15#ROOM#room_789"
}
```

#### Global Secondary Indexes

**GSI1: PropertyDateIndex** - Get all room availability for property on date
```
GSI1PK: PROPERTY#{propertyId}
GSI1SK: DATE#{date}#ROOM#{roomTypeId}
ProjectionType: ALL
```

#### Optimization Notes
- **Date Range Queries**: Query with SK between DATE#2025-01-15 and DATE#2025-01-20
- **Partition Size**: Each roomTypeId partition stores ~365-730 dates (1-2 years)
- **TTL**: Set DynamoDB TTL on dates > 2 years old to auto-archive historical data
- **Write Pattern**: Updates happen frequently; use on-demand billing or adequate provisioned capacity

---

### 4.3 Bookings Table

**Purpose**: All booking transactions, payments, and booking-related data.

#### Primary Key Structure
```
PK (Partition Key): BOOKING#{bookingId}
SK (Sort Key): METADATA | PAYMENT | ROOM#{roomTypeId}
```

#### Attributes

**Booking Entity (SK = METADATA)**
```json
{
  "PK": "BOOKING#bkg_12345",
  "SK": "METADATA",
  "EntityType": "Booking",
  "BookingId": "bkg_12345",
  "BookingReference": "BKG-2024-XYZ123",
  "UserId": "user_456",
  "PropertyId": "prop_123",
  "Status": "confirmed",

  "CheckInDate": "2025-01-15",
  "CheckOutDate": "2025-01-18",
  "NumberOfNights": 3,
  "NumberOfAdults": 2,
  "NumberOfChildren": 1,

  "GuestInfo": {
    "FirstName": "John",
    "LastName": "Doe",
    "Email": "john.doe@example.com",
    "Phone": "+1-555-123-4567",
    "Country": "USA"
  },

  "TotalAmount": 840.00,
  "Currency": "USD",
  "PaymentStatus": "paid",

  "PriceBreakdown": {
    "RoomTotal": 750.00,
    "TaxesAndFees": 90.00,
    "Discounts": 0.00
  },

  "SpecialRequests": "Late check-in, non-smoking room",
  "CancellationPolicy": "free_cancellation_48h",

  "CreatedAt": "2024-11-10T09:15:00Z",
  "UpdatedAt": "2024-11-10T09:20:00Z",
  "ConfirmedAt": "2024-11-10T09:20:00Z",
  "CancelledAt": null,
  "CancellationReason": null,

  "GSI1PK": "USER#user_456",
  "GSI1SK": "CHECKIN#2025-01-15#BOOKING#bkg_12345",
  "GSI2PK": "PROPERTY#prop_123",
  "GSI2SK": "CHECKIN#2025-01-15#BOOKING#bkg_12345",
  "GSI3PK": "STATUS#confirmed",
  "GSI3SK": "CREATED#2024-11-10T09:15:00Z",
  "GSI4PK": "REFERENCE#BKG-2024-XYZ123",
  "GSI4SK": "BOOKING"
}
```

**Payment Entity (SK = PAYMENT)**
```json
{
  "PK": "BOOKING#bkg_12345",
  "SK": "PAYMENT",
  "EntityType": "Payment",
  "PaymentId": "pay_67890",
  "BookingId": "bkg_12345",
  "Amount": 840.00,
  "Currency": "USD",
  "PaymentMethod": "credit_card",
  "PaymentProvider": "stripe",
  "ProviderTransactionId": "ch_3Abc123DEF456",
  "Status": "succeeded",
  "PaidAt": "2024-11-10T09:20:00Z",
  "RefundedAt": null,
  "RefundAmount": null,
  "CardLast4": "4242",
  "CardBrand": "visa",
  "CreatedAt": "2024-11-10T09:18:00Z"
}
```

**Booking Room Entity (SK = ROOM#{roomTypeId})**
```json
{
  "PK": "BOOKING#bkg_12345",
  "SK": "ROOM#room_789",
  "EntityType": "BookingRoom",
  "BookingId": "bkg_12345",
  "RoomTypeId": "room_789",
  "RoomId": "room_001",
  "Quantity": 1,
  "PricePerNight": 250.00,
  "Subtotal": 750.00,
  "RoomName": "Deluxe King Suite"
}
```

#### Global Secondary Indexes

**GSI1: UserBookingsIndex** - Get all bookings for a user, sorted by check-in date
```
GSI1PK: USER#{userId}
GSI1SK: CHECKIN#{checkInDate}#BOOKING#{bookingId}
ProjectionType: ALL
```

**GSI2: PropertyBookingsIndex** - Get all bookings for a property
```
GSI2PK: PROPERTY#{propertyId}
GSI2SK: CHECKIN#{checkInDate}#BOOKING#{bookingId}
ProjectionType: ALL
```

**GSI3: StatusIndex** - Get bookings by status (for admin/reporting)
```
GSI3PK: STATUS#{status}
GSI3SK: CREATED#{createdAt}
ProjectionType: ALL
```

**GSI4: ReferenceIndex** - Get booking by reference number
```
GSI4PK: REFERENCE#{bookingReference}
GSI4SK: BOOKING
ProjectionType: KEYS_ONLY
```

---

### 4.4 Users Table

**Purpose**: User profiles, authentication data, and user preferences.

#### Primary Key Structure
```
PK (Partition Key): USER#{userId}
SK (Sort Key): PROFILE | LOYALTY | PREFERENCE
```

#### Attributes

**User Profile (SK = PROFILE)**
```json
{
  "PK": "USER#user_456",
  "SK": "PROFILE",
  "EntityType": "User",
  "UserId": "user_456",
  "Email": "john.doe@example.com",
  "FirstName": "John",
  "LastName": "Doe",
  "PhoneNumber": "+1-555-123-4567",
  "ProfilePhotoUrl": "https://cdn.example.com/users/user_456.jpg",
  "Role": "customer",
  "EmailVerified": true,
  "PhoneVerified": false,
  "Country": "USA",
  "PreferredCurrency": "USD",
  "PreferredLanguage": "en",
  "CreatedAt": "2024-01-10T08:00:00Z",
  "UpdatedAt": "2024-11-18T10:00:00Z",
  "LastLoginAt": "2024-11-18T10:00:00Z",

  "GSI1PK": "EMAIL#john.doe@example.com",
  "GSI1SK": "USER"
}
```

**Loyalty Points (SK = LOYALTY)**
```json
{
  "PK": "USER#user_456",
  "SK": "LOYALTY",
  "EntityType": "LoyaltyPoints",
  "UserId": "user_456",
  "Points": 2500,
  "Tier": "gold",
  "TierSince": "2024-06-01T00:00:00Z",
  "LifetimePoints": 5000,
  "UpdatedAt": "2024-11-18T10:00:00Z"
}
```

#### Global Secondary Indexes

**GSI1: EmailIndex** - Get user by email (for login)
```
GSI1PK: EMAIL#{email}
GSI1SK: USER
ProjectionType: ALL
```

---

### 4.5 Reviews Table

**Purpose**: Guest reviews, ratings, and property owner responses.

#### Primary Key Structure
```
PK (Partition Key): REVIEW#{reviewId}
SK (Sort Key): METADATA | RESPONSE
```

#### Attributes

**Review Entity (SK = METADATA)**
```json
{
  "PK": "REVIEW#rev_999",
  "SK": "METADATA",
  "EntityType": "Review",
  "ReviewId": "rev_999",
  "BookingId": "bkg_12345",
  "UserId": "user_456",
  "PropertyId": "prop_123",

  "OverallRating": 9.0,
  "CleanlinessRating": 9.5,
  "ComfortRating": 9.0,
  "LocationRating": 10.0,
  "FacilitiesRating": 8.5,
  "StaffRating": 9.5,
  "ValueRating": 8.5,

  "Title": "Wonderful stay!",
  "ReviewText": "Had an amazing experience...",
  "Pros": "Great location, friendly staff",
  "Cons": "Breakfast could be improved",

  "TripType": "couple",
  "StayDate": "2025-01-15",
  "IsVerified": true,
  "HelpfulCount": 12,
  "Status": "approved",

  "GuestName": "John D.",
  "GuestCountry": "USA",

  "CreatedAt": "2025-01-20T10:00:00Z",
  "UpdatedAt": "2025-01-20T10:00:00Z",

  "GSI1PK": "PROPERTY#prop_123",
  "GSI1SK": "CREATED#2025-01-20T10:00:00Z",
  "GSI2PK": "USER#user_456",
  "GSI2SK": "CREATED#2025-01-20T10:00:00Z",
  "GSI3PK": "STATUS#approved",
  "GSI3SK": "CREATED#2025-01-20T10:00:00Z",
  "GSI4PK": "BOOKING#bkg_12345",
  "GSI4SK": "REVIEW"
}
```

**Review Response (SK = RESPONSE)**
```json
{
  "PK": "REVIEW#rev_999",
  "SK": "RESPONSE",
  "EntityType": "ReviewResponse",
  "ReviewId": "rev_999",
  "ResponderId": "user_789",
  "ResponderName": "Hotel Manager",
  "ResponseText": "Thank you for your feedback...",
  "CreatedAt": "2025-01-21T14:00:00Z"
}
```

#### Global Secondary Indexes

**GSI1: PropertyReviewsIndex** - Get all reviews for a property
```
GSI1PK: PROPERTY#{propertyId}
GSI1SK: CREATED#{createdAt}
ProjectionType: ALL
```

**GSI2: UserReviewsIndex** - Get all reviews by a user
```
GSI2PK: USER#{userId}
GSI2SK: CREATED#{createdAt}
ProjectionType: ALL
```

**GSI3: StatusIndex** - Get pending reviews for moderation
```
GSI3PK: STATUS#{status}
GSI3SK: CREATED#{createdAt}
ProjectionType: ALL
```

**GSI4: BookingReviewIndex** - Get review by booking ID
```
GSI4PK: BOOKING#{bookingId}
GSI4SK: REVIEW
ProjectionType: KEYS_ONLY
```

---

### 4.6 Metadata Table

**Purpose**: Supporting data like wishlists, amenities catalog, promo codes, and configurations.

#### Primary Key Structure
```
PK (Partition Key): USER#{userId} | CATALOG#{type} | PROMO#{code}
SK (Sort Key): WISHLIST#{wishlistId} | ITEM#{itemId} | METADATA
```

#### Attributes

**Wishlist Entity**
```json
{
  "PK": "USER#user_456",
  "SK": "WISHLIST#wl_123",
  "EntityType": "Wishlist",
  "WishlistId": "wl_123",
  "UserId": "user_456",
  "Name": "Summer Vacation Ideas",
  "IsPrivate": true,
  "PropertyIds": ["prop_123", "prop_456", "prop_789"],
  "CreatedAt": "2024-10-01T10:00:00Z",
  "UpdatedAt": "2024-11-15T12:00:00Z"
}
```

**Amenity Catalog**
```json
{
  "PK": "CATALOG#amenities",
  "SK": "ITEM#wifi",
  "EntityType": "Amenity",
  "AmenityId": "wifi",
  "Name": "Free WiFi",
  "Category": "basic",
  "Icon": "wifi-icon",
  "DisplayOrder": 1
}
```

**Promo Code**
```json
{
  "PK": "PROMO#SUMMER2024",
  "SK": "METADATA",
  "EntityType": "PromoCode",
  "Code": "SUMMER2024",
  "Description": "Summer special discount",
  "DiscountType": "percentage",
  "DiscountValue": 15.0,
  "MinBookingAmount": 200.00,
  "MaxDiscountAmount": 100.00,
  "ValidFrom": "2024-06-01T00:00:00Z",
  "ValidUntil": "2024-08-31T23:59:59Z",
  "UsageLimit": 1000,
  "UsageCount": 234,
  "IsActive": true,
  "CreatedAt": "2024-05-15T10:00:00Z"
}
```

---

## 5. Global Secondary Indexes Summary

### Index Usage Guidelines
- **Projection Type ALL**: Use when most attributes are needed (adds storage cost)
- **Projection Type KEYS_ONLY**: Use for simple lookups, then fetch full item
- **Projection Type INCLUDE**: Specify frequently accessed attributes
- **Sparse Indexes**: Only include items with specific attributes (e.g., FeaturedIndex)

### Cost Considerations
- Each GSI consumes storage equal to projected attributes × number of indexed items
- GSIs have separate read/write capacity (can be on-demand or provisioned)
- Maximum 20 GSIs per table

---

## 6. Search Criteria Reference

### 6.1 Property Search Criteria

#### **Primary Search: Destination + Dates + Guests**
```
Query Flow:
1. Search by Location (GSI1: LocationIndex)
   - Query: GSI1PK = "CITY#New York#USA"

2. For each property, check availability:
   - Query Availability Table: PK = "ROOM#{roomTypeId}"
   - SK between "DATE#2025-01-15" and "DATE#2025-01-18"
   - Filter: AvailableRooms >= requested rooms
   - Filter: MaxOccupancy >= number of guests

3. Return available properties with pricing
```

#### **Proximity Search (Geohash)**
```
Query Flow:
1. Calculate geohash for user's location or map center
2. Query GSI2 (GeoIndex): GSI2PK = "GEO#{geohash6}"
3. For wider search, query multiple geohash prefixes
4. Sort by distance (calculate from lat/lng)
```

#### **Filter: Price Range**
```
Query Flow:
1. Use GSI2 (GeoIndex) or GSI1 (LocationIndex)
2. Client-side filter: PriceRange.Min >= userMinPrice AND PriceRange.Max <= userMaxPrice
   OR
3. Query with GSI2SK starting with "PRICE#{minPrice}"
```

#### **Filter: Star Rating**
```
Query Flow:
1. Query GSI1 (LocationIndex)
2. GSI1SK starts with "RATING#{minRating}"
3. Client-side filter for exact rating match
```

#### **Filter: Property Type**
```
Query Flow:
1. Query GSI4 (TypeRatingIndex)
2. GSI4PK = "TYPE#{propertyType}" (hotel, apartment, resort, etc.)
3. GSI4SK for sorting by rating
```

#### **Filter: Amenities**
```
Query Flow:
1. Query primary search results
2. Client-side filter: Check if AmenityList contains required amenities
   OR
3. Use DynamoDB FilterExpression: contains(AmenityList, 'wifi')
```

#### **Filter: Guest Rating**
```
Query Flow:
1. Query base results
2. Apply FilterExpression: AverageRating >= 7.0
```

#### **Filter: Free Cancellation**
```
Query Flow:
1. Query room types for property
2. Check CancellationPolicy attribute
```

#### **Sort Options**
```
- Recommended: Use FeaturedScore or custom ranking algorithm
- Price Low to High: Sort by PriceRange.Min
- Price High to Low: Sort by PriceRange.Max
- Guest Rating: Sort by AverageRating (descending)
- Distance: Sort by calculated distance from coordinates
```

### 6.2 User Booking Queries

#### **Get User's Upcoming Bookings**
```
Query: GSI1 (UserBookingsIndex)
GSI1PK = "USER#{userId}"
GSI1SK > "CHECKIN#{today}"
FilterExpression: Status IN ['confirmed', 'pending']
```

#### **Get User's Past Bookings**
```
Query: GSI1 (UserBookingsIndex)
GSI1PK = "USER#{userId}"
GSI1SK < "CHECKIN#{today}"
FilterExpression: Status = 'completed'
```

#### **Get Cancelled Bookings**
```
Query: GSI1 (UserBookingsIndex)
GSI1PK = "USER#{userId}"
FilterExpression: Status = 'cancelled'
```

### 6.3 Property Owner Queries

#### **Get All Properties for Owner**
```
Query: GSI3 (OwnerIndex)
GSI3PK = "OWNER#{userId}"
Returns: All properties owned by user
```

#### **Get Property Bookings**
```
Query: GSI2 (PropertyBookingsIndex)
GSI2PK = "PROPERTY#{propertyId}"
Optional: Filter by date range on GSI2SK
```

#### **Get Property Reviews**
```
Query: GSI1 (PropertyReviewsIndex) on Reviews Table
GSI1PK = "PROPERTY#{propertyId}"
Sorted by: CreatedAt (descending)
```

### 6.4 Admin Queries

#### **Get Pending Property Approvals**
```
Query: Properties Table
FilterExpression: Status = 'pending'
OR use sparse GSI on Status attribute
```

#### **Get Pending Review Moderations**
```
Query: GSI3 (StatusIndex) on Reviews Table
GSI3PK = "STATUS#pending"
Sorted by: CreatedAt
```

### 6.5 Availability Checks

#### **Check Room Availability for Date Range**
```
Query: Availability Table
PK = "ROOM#{roomTypeId}"
SK between "DATE#2025-01-15" and "DATE#2025-01-20"
FilterExpression: AvailableRooms > 0 AND IsBlocked = false
```

#### **Get All Room Availability for Property on Date**
```
Query: GSI1 (PropertyDateIndex) on Availability Table
GSI1PK = "PROPERTY#{propertyId}"
GSI1SK starts_with "DATE#2025-01-15"
```

---

## 7. Data Types & Formats

### 7.1 Standard Data Types

| Field Type | DynamoDB Type | Format/Example |
|------------|---------------|----------------|
| IDs | String (S) | `user_abc123`, `prop_xyz789` |
| Dates | String (S) | `YYYY-MM-DD` (2025-01-15) |
| Timestamps | String (S) | ISO 8601 (`2024-11-18T14:20:00Z`) |
| Prices | Number (N) | Decimal (250.00) |
| Currency | String (S) | ISO 4217 (`USD`, `EUR`) |
| Email | String (S) | Standard email format |
| Phone | String (S) | E.164 format (`+1-555-123-4567`) |
| Geohash | String (S) | Base32 (`dr5regw3p`) |
| Coordinates | Number (N) | Decimal degrees (40.7589, -73.9851) |
| Enums | String (S) | Lowercase (`pending`, `confirmed`) |

### 7.2 Composite Key Formats

```
Entity Types:
- PROPERTY#{uuid}
- USER#{uuid}
- BOOKING#{uuid}
- ROOM#{uuid}
- REVIEW#{uuid}

Sort Key Prefixes:
- METADATA (main entity data)
- DATE#{YYYY-MM-DD}
- CHECKIN#{YYYY-MM-DD}#BOOKING#{id}
- RATING#{X.X}#PROPERTY#{id}
- CREATED#{timestamp}
```

### 7.3 Geohash Precision

| Precision | Grid Size | Use Case |
|-----------|-----------|----------|
| 3 chars | ~156 km × 156 km | Country/region level |
| 4 chars | ~39 km × 19 km | City level |
| 5 chars | ~4.9 km × 4.9 km | Neighborhood |
| 6 chars | ~1.2 km × 0.61 km | Street level (default) |
| 7 chars | ~153 m × 153 m | Building level |

---

## 8. Capacity Planning

### 8.1 Read/Write Patterns

#### **Properties Table**
- **Read Heavy**: 90% reads, 10% writes
- **Peak Load**: Search queries during business hours
- **Recommendation**: On-demand billing or auto-scaling

#### **Availability Table**
- **Write Heavy**: Frequent availability updates
- **Peak Load**: Real-time inventory management
- **Recommendation**: Provisioned capacity with auto-scaling

#### **Bookings Table**
- **Balanced**: 60% reads, 40% writes
- **Peak Load**: Booking confirmations, user dashboard views
- **Recommendation**: On-demand billing

#### **Users Table**
- **Read Heavy**: 95% reads, 5% writes
- **Low Volume**: Profile lookups, authentication
- **Recommendation**: On-demand billing

#### **Reviews Table**
- **Read Heavy**: 85% reads, 15% writes
- **Moderate Volume**: Property page views
- **Recommendation**: On-demand billing

### 8.2 Estimated Item Sizes

| Table | Average Item Size | Notes |
|-------|-------------------|-------|
| Properties | 3-5 KB | With denormalized data |
| Availability | 0.5 KB | Minimal attributes |
| Bookings | 2-3 KB | With embedded payment data |
| Users | 1-2 KB | Profile and preferences |
| Reviews | 1-2 KB | Text content |

### 8.3 Scaling Considerations

#### **Hot Partitions**
- **Risk**: Popular properties/dates creating hot partitions
- **Mitigation**:
  - Use high-cardinality partition keys
  - Implement caching (CloudFront, Redis) for frequently accessed items
  - Consider read replicas for global tables

#### **Storage**
- **Properties**: ~50 GB for 100K properties
- **Availability**: ~50 GB for 100K rooms × 365 days
- **Bookings**: ~30 GB for 10M bookings
- **Total Estimated**: ~150-200 GB at scale

#### **Cost Optimization**
- Use **DynamoDB On-Demand** for unpredictable workloads
- Use **Provisioned Capacity** with auto-scaling for predictable patterns
- Enable **DynamoDB TTL** to automatically delete old availability records
- Use **Point-in-Time Recovery** (PITR) for data protection
- Consider **DynamoDB Streams** for audit logs and data sync

---

## 9. Additional Features

### 9.1 DynamoDB Streams
Enable streams for:
- **Bookings Table**: Trigger notifications, update availability
- **Reviews Table**: Update property average ratings
- **Users Table**: Sync to search indexes (Elasticsearch/OpenSearch)

### 9.2 Point-in-Time Recovery
- Enable PITR on all production tables
- Retention: 35 days
- Use for disaster recovery and compliance

### 9.3 Encryption
- Enable **Encryption at Rest** using AWS KMS
- Use AWS-managed keys or customer-managed keys
- Encryption in transit via HTTPS

### 9.4 Backup Strategy
- Automated daily backups to S3
- On-demand backups before major deployments
- Cross-region backup replication for DR

---

## 10. Implementation Checklist

### Phase 1: Core Tables
- [ ] Create Properties Table with GSIs
- [ ] Create Availability Table with GSIs
- [ ] Create Bookings Table with GSIs
- [ ] Create Users Table with GSIs
- [ ] Enable DynamoDB Streams
- [ ] Configure on-demand billing
- [ ] Enable encryption at rest

### Phase 2: Supporting Tables
- [ ] Create Reviews Table with GSIs
- [ ] Create Metadata Table
- [ ] Set up TTL for Availability table
- [ ] Configure Point-in-Time Recovery
- [ ] Set up automated backups

### Phase 3: Optimization
- [ ] Implement caching layer (CloudFront, Redis)
- [ ] Set up CloudWatch alarms for throttling
- [ ] Configure auto-scaling policies
- [ ] Optimize GSI projections
- [ ] Load test and tune capacity

### Phase 4: Monitoring
- [ ] Set up CloudWatch dashboards
- [ ] Configure alarms for latency/errors
- [ ] Enable X-Ray tracing
- [ ] Set up cost alerts
- [ ] Document runbooks for operations

---

## 11. Migration & Data Loading

### 11.1 Initial Data Load
- Use **AWS Data Pipeline** or **AWS Glue** for bulk loading
- Use **DynamoDB BatchWriteItem** (max 25 items per batch)
- Implement exponential backoff for throttling
- Consider using **parallel loading** across multiple partition keys

### 11.2 Data Validation
- Validate all items against schema before writing
- Use **DynamoDB Transactions** for multi-item writes requiring atomicity
- Implement idempotency tokens for booking creation

---

## Appendix A: Query Examples

### Example 1: Search Properties by City and Rating
```javascript
const params = {
  TableName: 'Properties',
  IndexName: 'GSI1-LocationIndex',
  KeyConditionExpression: 'GSI1PK = :city AND begins_with(GSI1SK, :rating)',
  ExpressionAttributeValues: {
    ':city': 'CITY#New York#USA',
    ':rating': 'RATING#8'
  },
  ScanIndexForward: false,  // Descending order
  Limit: 50
};
```

### Example 2: Check Availability for Date Range
```javascript
const params = {
  TableName: 'Availability',
  KeyConditionExpression: 'PK = :roomType AND SK BETWEEN :startDate AND :endDate',
  ExpressionAttributeValues: {
    ':roomType': 'ROOM#room_789',
    ':startDate': 'DATE#2025-01-15',
    ':endDate': 'DATE#2025-01-18'
  },
  FilterExpression: 'AvailableRooms > :zero AND IsBlocked = :false',
  ExpressionAttributeValues: {
    ':zero': 0,
    ':false': false
  }
};
```

### Example 3: Get User's Upcoming Bookings
```javascript
const params = {
  TableName: 'Bookings',
  IndexName: 'GSI1-UserBookingsIndex',
  KeyConditionExpression: 'GSI1PK = :userId AND GSI1SK > :today',
  ExpressionAttributeValues: {
    ':userId': 'USER#user_456',
    ':today': `CHECKIN#${new Date().toISOString().split('T')[0]}`
  },
  FilterExpression: '#status IN (:confirmed, :pending)',
  ExpressionAttributeNames: {
    '#status': 'Status'
  },
  ExpressionAttributeValues: {
    ':confirmed': 'confirmed',
    ':pending': 'pending'
  }
};
```

---

## Appendix B: References

- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB NoSQL Design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html)
- [DynamoDB Global Secondary Indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [Geohash Algorithm](https://en.wikipedia.org/wiki/Geohash)

---

**END OF DOCUMENT**
