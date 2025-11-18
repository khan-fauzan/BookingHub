/**
 * Seed DynamoDB Tables with Sample Data
 * Hotel Booking Platform
 */

const fs = require('fs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const ENV = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : 'dev';
const REGION = process.env.AWS_REGION || 'us-east-1';
const BATCH_SIZE = 25; // DynamoDB limit
const DELAY_MS = 100; // Delay between batches to avoid throttling

// Table names
const TABLES = {
  properties: `hotel-booking-properties-${ENV}`,
  availability: `hotel-booking-availability-${ENV}`,
  bookings: `hotel-booking-bookings-${ENV}`,
  users: `hotel-booking-users-${ENV}`,
  reviews: `hotel-booking-reviews-${ENV}`,
  metadata: `hotel-booking-metadata-${ENV}`
};

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
});

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Transform functions to DynamoDB format
function transformProperty(property) {
  return {
    PK: `PROPERTY#${property.propertyId}`,
    SK: 'METADATA',
    EntityType: 'Property',
    PropertyId: property.propertyId,
    Name: property.name,
    Slug: property.slug,
    PropertyType: property.propertyType,
    StarRating: property.starRating,
    Description: property.description,
    OwnerId: property.ownerId,
    Status: property.status,
    Address: property.address,
    Geohash: property.geohash,
    GeohashPrecision6: property.geohashPrecision6,
    GeohashPrecision5: property.geohashPrecision5,
    ContactInfo: property.contactInfo,
    CheckInTime: property.checkInTime,
    CheckOutTime: property.checkOutTime,
    PrimaryImageUrl: property.primaryImageUrl,
    ImageCount: property.imageCount,
    AverageRating: property.averageRating,
    ReviewCount: property.reviewCount,
    AmenityList: property.amenityList,
    PriceRange: property.priceRange,
    IsFeatured: property.isFeatured,
    FeaturedScore: property.featuredScore,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    // GSI attributes
    GSI1PK: `CITY#${property.cityName}#${property.countryName}`,
    GSI1SK: `RATING#${property.averageRating.toFixed(1)}#PROPERTY#${property.propertyId}`,
    GSI2PK: `GEO#${property.geohashPrecision6}`,
    GSI2SK: `PRICE#${property.priceRange.min}`,
    GSI3PK: `OWNER#${property.ownerId}`,
    GSI3SK: `PROPERTY#${property.propertyId}`,
    GSI4PK: `TYPE#${property.propertyType}`,
    GSI4SK: `RATING#${property.averageRating.toFixed(1)}`,
    ...(property.isFeatured && {
      GSI5PK: 'FEATURED',
      GSI5SK: `SCORE#${property.featuredScore}#PROPERTY#${property.propertyId}`
    }),
    Slug: property.slug
  };
}

function transformRoomType(roomType) {
  return {
    PK: `PROPERTY#${roomType.propertyId}`,
    SK: `ROOM#${roomType.roomTypeId}`,
    EntityType: 'RoomType',
    RoomTypeId: roomType.roomTypeId,
    PropertyId: roomType.propertyId,
    Name: roomType.name,
    Description: roomType.description,
    MaxOccupancy: roomType.maxOccupancy,
    MaxAdults: roomType.maxAdults,
    MaxChildren: roomType.maxChildren,
    RoomSizeSqm: roomType.roomSizeSqm,
    BedConfiguration: roomType.bedConfiguration,
    BasePricePerNight: roomType.basePricePerNight,
    Currency: roomType.currency,
    RoomAmenities: roomType.roomAmenities,
    Images: roomType.images,
    TotalRooms: roomType.totalRooms,
    CreatedAt: new Date().toISOString()
  };
}

function transformUser(user) {
  const items = [];

  // User Profile
  items.push({
    PK: `USER#${user.userId}`,
    SK: 'PROFILE',
    EntityType: 'User',
    UserId: user.userId,
    Email: user.email,
    FirstName: user.firstName,
    LastName: user.lastName,
    PhoneNumber: user.phoneNumber,
    ProfilePhotoUrl: user.profilePhotoUrl,
    Role: user.role,
    EmailVerified: user.emailVerified,
    PhoneVerified: user.phoneVerified,
    Country: user.country,
    PreferredCurrency: user.preferredCurrency,
    PreferredLanguage: user.preferredLanguage,
    CreatedAt: user.createdAt,
    UpdatedAt: new Date().toISOString(),
    LastLoginAt: new Date().toISOString(),
    GSI1PK: `EMAIL#${user.email}`,
    GSI1SK: 'USER'
  });

  // Loyalty Points
  items.push({
    PK: `USER#${user.userId}`,
    SK: 'LOYALTY',
    EntityType: 'LoyaltyPoints',
    UserId: user.userId,
    Points: user.loyaltyPoints,
    Tier: user.loyaltyTier,
    TierSince: user.createdAt,
    LifetimePoints: user.loyaltyPoints,
    UpdatedAt: new Date().toISOString()
  });

  return items;
}

function transformBooking(booking) {
  const items = [];

  // Booking Metadata
  items.push({
    PK: `BOOKING#${booking.bookingId}`,
    SK: 'METADATA',
    EntityType: 'Booking',
    BookingId: booking.bookingId,
    BookingReference: booking.bookingReference,
    UserId: booking.userId,
    PropertyId: booking.propertyId,
    Status: booking.status,
    CheckInDate: booking.checkInDate,
    CheckOutDate: booking.checkOutDate,
    NumberOfNights: booking.numberOfNights,
    NumberOfAdults: booking.numberOfAdults,
    NumberOfChildren: booking.numberOfChildren,
    GuestInfo: booking.guestInfo,
    TotalAmount: booking.totalAmount,
    Currency: booking.currency,
    PaymentStatus: booking.paymentStatus,
    PriceBreakdown: booking.priceBreakdown,
    SpecialRequests: booking.specialRequests,
    CancellationPolicy: booking.cancellationPolicy,
    CreatedAt: booking.createdAt,
    UpdatedAt: new Date().toISOString(),
    ConfirmedAt: booking.confirmedAt,
    CancelledAt: null,
    CancellationReason: null,
    // GSI attributes
    GSI1PK: `USER#${booking.userId}`,
    GSI1SK: `CHECKIN#${booking.checkInDate}#BOOKING#${booking.bookingId}`,
    GSI2PK: `PROPERTY#${booking.propertyId}`,
    GSI2SK: `CHECKIN#${booking.checkInDate}#BOOKING#${booking.bookingId}`,
    GSI3PK: `STATUS#${booking.status}`,
    GSI3SK: `CREATED#${booking.createdAt}`,
    GSI4PK: `REFERENCE#${booking.bookingReference}`,
    GSI4SK: 'BOOKING'
  });

  // Booking Room
  items.push({
    PK: `BOOKING#${booking.bookingId}`,
    SK: `ROOM#${booking.roomTypeId}`,
    EntityType: 'BookingRoom',
    BookingId: booking.bookingId,
    RoomTypeId: booking.roomTypeId,
    RoomId: null,
    Quantity: 1,
    PricePerNight: booking.totalAmount / booking.numberOfNights,
    Subtotal: booking.priceBreakdown.roomTotal
  });

  // Payment
  items.push({
    PK: `BOOKING#${booking.bookingId}`,
    SK: 'PAYMENT',
    EntityType: 'Payment',
    PaymentId: `pay_${booking.bookingId.split('_')[1]}`,
    BookingId: booking.bookingId,
    Amount: booking.totalAmount,
    Currency: booking.currency,
    PaymentMethod: 'credit_card',
    PaymentProvider: 'stripe',
    ProviderTransactionId: `ch_${Math.random().toString(36).substring(7)}`,
    Status: booking.paymentStatus === 'paid' ? 'succeeded' : 'pending',
    PaidAt: booking.paymentStatus === 'paid' ? booking.confirmedAt : null,
    RefundedAt: null,
    RefundAmount: null,
    CardLast4: '4242',
    CardBrand: 'visa',
    CreatedAt: booking.createdAt
  });

  return items;
}

function transformReview(review) {
  return {
    PK: `REVIEW#${review.reviewId}`,
    SK: 'METADATA',
    EntityType: 'Review',
    ReviewId: review.reviewId,
    BookingId: review.bookingId,
    UserId: review.userId,
    PropertyId: review.propertyId,
    OverallRating: review.overallRating,
    CleanlinessRating: review.cleanlinessRating,
    ComfortRating: review.comfortRating,
    LocationRating: review.locationRating,
    FacilitiesRating: review.facilitiesRating,
    StaffRating: review.staffRating,
    ValueRating: review.valueRating,
    Title: review.title,
    ReviewText: review.reviewText,
    Pros: review.pros,
    Cons: review.cons,
    TripType: review.tripType,
    StayDate: review.stayDate,
    IsVerified: review.isVerified,
    HelpfulCount: review.helpfulCount,
    Status: review.status,
    GuestName: review.guestName,
    GuestCountry: review.guestCountry,
    CreatedAt: review.createdAt,
    UpdatedAt: new Date().toISOString(),
    // GSI attributes
    GSI1PK: `PROPERTY#${review.propertyId}`,
    GSI1SK: `CREATED#${review.createdAt}`,
    GSI2PK: `USER#${review.userId}`,
    GSI2SK: `CREATED#${review.createdAt}`,
    GSI3PK: `STATUS#${review.status}`,
    GSI3SK: `CREATED#${review.createdAt}`,
    GSI4PK: `BOOKING#${review.bookingId}`,
    GSI4SK: 'REVIEW'
  };
}

function transformAmenity(amenity, index) {
  return {
    PK: 'CATALOG#amenities',
    SK: `ITEM#${amenity.id}`,
    EntityType: 'Amenity',
    AmenityId: amenity.id,
    Name: amenity.name,
    Category: amenity.category,
    Icon: amenity.id,
    DisplayOrder: index + 1
  };
}

function transformPromoCode(promo) {
  return {
    PK: `PROMO#${promo.code}`,
    SK: 'METADATA',
    EntityType: 'PromoCode',
    Code: promo.code,
    Description: promo.description,
    DiscountType: promo.discountType,
    DiscountValue: promo.discountValue,
    MinBookingAmount: promo.minBookingAmount,
    MaxDiscountAmount: promo.maxDiscountAmount,
    ValidFrom: promo.validFrom,
    ValidUntil: promo.validUntil,
    UsageLimit: promo.usageLimit,
    UsageCount: promo.usageCount,
    IsActive: promo.isActive,
    CreatedAt: new Date().toISOString()
  };
}

// Batch write function
async function batchWrite(tableName, items, label = 'items') {
  const chunks = chunkArray(items, BATCH_SIZE);
  let totalWritten = 0;

  console.log(`   Writing ${items.length} ${label} in ${chunks.length} batches...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const requestItems = {
      [tableName]: chunk.map(item => ({
        PutRequest: { Item: item }
      }))
    };

    try {
      await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
      totalWritten += chunk.length;

      process.stdout.write(`\r   Progress: ${totalWritten}/${items.length} (${Math.round(totalWritten / items.length * 100)}%)`);

      if (i < chunks.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (error) {
      console.error(`\n   ❌ Error writing batch ${i + 1}:`, error.message);
      throw error;
    }
  }

  console.log(`\n   ✅ Successfully wrote ${totalWritten} ${label}`);
}

// Main seeding function
async function seedDatabase() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║   DynamoDB Database Seeder                    ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  console.log(`Environment: ${ENV}`);
  console.log(`Region: ${REGION}\n`);

  // Load data
  console.log("📂 Loading sample data...");
  const dataFile = 'sample-data-full.json';

  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Data file not found: ${dataFile}`);
    console.log('💡 Run "npm run generate" first to create sample data\n');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log(`✅ Loaded data file: ${dataFile}\n`);

  try {
    // 1. Seed Metadata Table (Amenities & Promo Codes)
    console.log("1️⃣  Seeding Metadata Table...");
    const metadataItems = [
      ...data.amenities.map((amenity, index) => transformAmenity(amenity, index)),
      ...data.promoCodes.map(transformPromoCode)
    ];
    await batchWrite(TABLES.metadata, metadataItems, 'metadata items');

    // 2. Seed Properties Table (Properties + Room Types)
    console.log("\n2️⃣  Seeding Properties Table...");
    const propertyItems = [
      ...data.properties.map(transformProperty),
      ...data.roomTypes.map(transformRoomType)
    ];
    await batchWrite(TABLES.properties, propertyItems, 'property items');

    // 3. Seed Availability Table
    console.log("\n3️⃣  Seeding Availability Table...");
    await batchWrite(TABLES.availability, data.availability, 'availability records');

    // 4. Seed Users Table
    console.log("\n4️⃣  Seeding Users Table...");
    const userItems = data.users.flatMap(transformUser);
    await batchWrite(TABLES.users, userItems, 'user items');

    // 5. Seed Bookings Table
    console.log("\n5️⃣  Seeding Bookings Table...");
    const bookingItems = data.bookings.flatMap(transformBooking);
    await batchWrite(TABLES.bookings, bookingItems, 'booking items');

    // 6. Seed Reviews Table
    console.log("\n6️⃣  Seeding Reviews Table...");
    const reviewItems = data.reviews.map(transformReview);
    await batchWrite(TABLES.reviews, reviewItems, 'reviews');

    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Final Summary:");
    console.log(`   Properties: ${data.properties.length}`);
    console.log(`   Room Types: ${data.roomTypes.length}`);
    console.log(`   Availability Records: ${data.availability.length}`);
    console.log(`   Users: ${data.users.length}`);
    console.log(`   Bookings: ${data.bookings.length}`);
    console.log(`   Reviews: ${data.reviews.length}`);
    console.log(`   Amenities: ${data.amenities.length}`);
    console.log(`   Promo Codes: ${data.promoCodes.length}\n`);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
