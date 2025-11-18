/**
 * Generate Sample Data for Hotel Booking Platform
 * Creates realistic data for 10 popular cities
 */

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate UUID
const generateId = (prefix) => `${prefix}_${uuidv4().split('-')[0]}`;

// Helper function to generate random number in range
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to pick random item from array
const randomChoice = (arr) => arr[random(0, arr.length - 1)];

// Helper function to pick multiple random items
const randomChoices = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to generate date range
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date) => date.toISOString().split('T')[0];

// ===========================================
// STATIC DATA
// ===========================================

const CITIES = [
  { name: "New York", state: "NY", country: "USA", lat: 40.7128, lng: -73.9851, geohash: "dr5reg", currency: "USD" },
  { name: "Paris", state: "Île-de-France", country: "France", lat: 48.8566, lng: 2.3522, geohash: "u09tun", currency: "EUR" },
  { name: "London", state: "England", country: "UK", lat: 51.5074, lng: -0.1278, geohash: "gcpvj0", currency: "GBP" },
  { name: "Tokyo", state: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, geohash: "xn774c", currency: "JPY" },
  { name: "Dubai", state: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, geohash: "thrwgr", currency: "AED" },
  { name: "Barcelona", state: "Catalonia", country: "Spain", lat: 41.3851, lng: 2.1734, geohash: "sp3e9b", currency: "EUR" },
  { name: "Los Angeles", state: "CA", country: "USA", lat: 34.0522, lng: -118.2437, geohash: "9q5ct", currency: "USD" },
  { name: "Miami", state: "FL", country: "USA", lat: 25.7617, lng: -80.1918, geohash: "dhwmh2", currency: "USD" },
  { name: "Singapore", state: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, geohash: "w21z6h", currency: "SGD" },
  { name: "Rome", state: "Lazio", country: "Italy", lat: 41.9028, lng: 12.4964, geohash: "sr2ykk", currency: "EUR" }
];

const PROPERTY_TYPES = ["hotel", "apartment", "resort", "villa", "hostel"];

const PROPERTY_NAME_TEMPLATES = {
  hotel: ["Grand", "Royal", "Imperial", "Luxury", "Plaza", "Palace", "Boutique", "Heritage"],
  apartment: ["Urban", "Modern", "Cozy", "Stylish", "Contemporary", "Chic"],
  resort: ["Paradise", "Oasis", "Beachfront", "Tropical", "Sunset"],
  villa: ["Exclusive", "Private", "Elegant", "Mediterranean"],
  hostel: ["Backpackers", "Travellers", "Budget", "Friendly"]
};

const AMENITIES = [
  { id: "wifi", name: "Free WiFi", category: "basic" },
  { id: "pool", name: "Swimming Pool", category: "recreation" },
  { id: "gym", name: "Fitness Center", category: "recreation" },
  { id: "parking", name: "Free Parking", category: "services" },
  { id: "spa", name: "Spa & Wellness", category: "services" },
  { id: "restaurant", name: "Restaurant", category: "dining" },
  { id: "bar", name: "Bar", category: "dining" },
  { id: "room_service", name: "24h Room Service", category: "services" },
  { id: "concierge", name: "Concierge", category: "services" },
  { id: "airport_shuttle", name: "Airport Shuttle", category: "transportation" },
  { id: "pet_friendly", name: "Pet Friendly", category: "policies" },
  { id: "business_center", name: "Business Center", category: "business" },
  { id: "conference_room", name: "Meeting Rooms", category: "business" },
  { id: "laundry", name: "Laundry Service", category: "services" },
  { id: "air_conditioning", name: "Air Conditioning", category: "room" },
  { id: "tv", name: "Flat-screen TV", category: "room" },
  { id: "minibar", name: "Minibar", category: "room" },
  { id: "safe", name: "In-room Safe", category: "room" },
  { id: "balcony", name: "Balcony", category: "room" },
  { id: "kitchen", name: "Kitchenette", category: "room" },
  { id: "washer", name: "Washer/Dryer", category: "room" },
  { id: "coffee_maker", name: "Coffee Maker", category: "room" }
];

const ROOM_TYPES = [
  { name: "Standard Room", basePrice: 1.0, maxOccupancy: 2, beds: [{ type: "queen", count: 1 }], size: 25 },
  { name: "Deluxe Room", basePrice: 1.3, maxOccupancy: 2, beds: [{ type: "king", count: 1 }], size: 32 },
  { name: "Superior Room", basePrice: 1.5, maxOccupancy: 3, beds: [{ type: "king", count: 1 }], size: 35 },
  { name: "Junior Suite", basePrice: 1.8, maxOccupancy: 3, beds: [{ type: "king", count: 1 }], size: 45 },
  { name: "Executive Suite", basePrice: 2.2, maxOccupancy: 4, beds: [{ type: "king", count: 1 }, { type: "single", count: 1 }], size: 55 },
  { name: "Family Room", basePrice: 2.0, maxOccupancy: 4, beds: [{ type: "queen", count: 2 }], size: 50 },
  { name: "Presidential Suite", basePrice: 3.5, maxOccupancy: 6, beds: [{ type: "king", count: 2 }], size: 120 }
];

const FIRST_NAMES = ["John", "Emma", "Michael", "Sophia", "William", "Olivia", "James", "Ava", "Robert", "Isabella", "David", "Mia", "Richard", "Charlotte", "Joseph", "Amelia", "Thomas", "Harper", "Charles", "Evelyn"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee"];
const COUNTRIES = ["USA", "UK", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Japan", "Brazil"];

const REVIEW_TITLES = {
  positive: ["Amazing stay!", "Fantastic experience", "Highly recommended", "Perfect location", "Excellent service", "Will definitely return", "Best hotel ever", "Outstanding"],
  neutral: ["Good overall", "Nice place", "Decent stay", "As expected", "Good value"],
  negative: ["Disappointing", "Could be better", "Not worth the price", "Needs improvement"]
};

const REVIEW_TEMPLATES = {
  positive: [
    "Had an absolutely wonderful time. The staff was incredibly friendly and the rooms were spotless.",
    "Location was perfect, right in the heart of everything. Would definitely stay here again!",
    "The amenities were top-notch. Especially loved the spa and the rooftop pool.",
    "Excellent service from check-in to check-out. Very accommodating and professional.",
    "Beautiful property with stunning views. Breakfast was amazing!"
  ],
  neutral: [
    "Overall a good experience. The room was clean but a bit small for the price.",
    "Nice hotel in a good location. Service was friendly but nothing exceptional.",
    "Decent stay. The amenities were good though the room could use some updating.",
    "Good value for money. Location was convenient and staff was helpful."
  ],
  negative: [
    "Room was not as pictured. Quite disappointed with the cleanliness.",
    "Service was slow and unresponsive. Had issues with the AC that weren't resolved.",
    "Overpriced for what you get. Expected much more for a hotel in this price range.",
    "Location was good but the noise level was unbearable. Very thin walls."
  ]
};

// ===========================================
// GENERATORS
// ===========================================

function generateProperty(city, index) {
  const propertyType = randomChoice(PROPERTY_TYPES);
  const starRating = random(3, 5);
  const nameTemplate = randomChoice(PROPERTY_NAME_TEMPLATES[propertyType] || PROPERTY_NAME_TEMPLATES.hotel);

  const propertyId = generateId('prop');
  const name = `${nameTemplate} ${city.name} ${propertyType === 'hotel' ? 'Hotel' : propertyType === 'apartment' ? 'Apartments' : propertyType}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Price varies by city and star rating
  const basePriceMultiplier = { "USD": 1, "EUR": 0.9, "GBP": 0.8, "JPY": 110, "AED": 3.7, "SGD": 1.35 }[city.currency] || 1;
  const cityPriceMultiplier = ["New York", "Paris", "London", "Tokyo", "Dubai"].includes(city.name) ? 1.5 : 1.0;
  const basePrice = Math.round(100 * starRating * basePriceMultiplier * cityPriceMultiplier);

  const priceMin = basePrice;
  const priceMax = Math.round(basePrice * (2 + starRating * 0.3));

  // Generate amenities based on property type and star rating
  let amenityList = ["wifi", "air_conditioning", "tv"];
  if (propertyType === 'apartment') {
    amenityList.push("kitchen", "washer");
  }
  if (starRating >= 4) {
    amenityList.push("gym", "restaurant", "bar", "concierge", "laundry");
  }
  if (starRating === 5) {
    amenityList.push("pool", "spa", "room_service", "business_center", "airport_shuttle", "parking");
  }
  if (propertyType === 'resort') {
    amenityList.push("pool", "spa", "restaurant", "bar");
  }

  const isFeatured = starRating === 5 && Math.random() > 0.5;
  const featuredScore = isFeatured ? random(90, 100) : random(70, 89);

  const averageRating = (starRating * 1.5 + random(5, 20) / 10).toFixed(1);
  const reviewCount = random(100, 5000);

  return {
    propertyId,
    name,
    slug,
    propertyType,
    starRating,
    description: `${starRating}-star ${propertyType} in ${city.name} offering excellent service and amenities.`,
    ownerId: generateId('owner'),
    status: "approved",
    address: {
      line1: `${random(100, 999)} ${randomChoice(['Main', 'Park', 'Central', 'High', 'Ocean'])} ${randomChoice(['Street', 'Avenue', 'Boulevard', 'Road'])}`,
      line2: null,
      city: city.name,
      state: city.state,
      country: city.country,
      postalCode: random(10000, 99999).toString(),
      latitude: city.lat + (Math.random() - 0.5) * 0.1,
      longitude: city.lng + (Math.random() - 0.5) * 0.1
    },
    geohash: city.geohash + random(0, 9),
    geohashPrecision6: city.geohash,
    geohashPrecision5: city.geohash.substring(0, 5),
    contactInfo: {
      phone: `+${random(1, 999)}-${random(100, 999)}-${random(1000000, 9999999)}`,
      email: `info@${slug}.com`,
      website: `https://${slug}.com`
    },
    checkInTime: randomChoice(["14:00", "15:00", "16:00"]),
    checkOutTime: randomChoice(["10:00", "11:00", "12:00"]),
    primaryImageUrl: `https://images.unsplash.com/photo-${random(1500000000000, 1700000000000)}`,
    imageCount: random(15, 50),
    averageRating: parseFloat(averageRating),
    reviewCount,
    amenityList,
    priceRange: { min: priceMin, max: priceMax, currency: city.currency },
    isFeatured,
    featuredScore,
    cityName: city.name,
    countryName: city.country
  };
}

function generateRoomType(property, roomTemplate) {
  const roomTypeId = generateId('room');
  const basePrice = property.priceRange.min;
  const pricePerNight = Math.round(basePrice * roomTemplate.basePrice);

  return {
    roomTypeId,
    propertyId: property.propertyId,
    name: roomTemplate.name,
    description: `Comfortable ${roomTemplate.name.toLowerCase()} with modern amenities`,
    maxOccupancy: roomTemplate.maxOccupancy,
    maxAdults: roomTemplate.maxOccupancy,
    maxChildren: Math.floor(roomTemplate.maxOccupancy / 2),
    roomSizeSqm: roomTemplate.size,
    bedConfiguration: roomTemplate.beds,
    basePricePerNight: pricePerNight,
    currency: property.priceRange.currency,
    roomAmenities: ["air_conditioning", "tv", "minibar", "safe", "coffee_maker"],
    totalRooms: random(5, 30),
    images: [
      `https://images.unsplash.com/photo-${random(1500000000000, 1700000000000)}`,
      `https://images.unsplash.com/photo-${random(1500000000000, 1700000000000)}`
    ]
  };
}

function generateAvailability(roomType, date) {
  const dateStr = formatDate(date);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const priceMultiplier = isWeekend ? 1.3 : 1.0;
  const seasonMultiplier = [11, 12, 1, 2, 6, 7, 8].includes(date.getMonth() + 1) ? 1.2 : 1.0;

  const availableRooms = random(0, roomType.totalRooms);
  const pricePerNight = Math.round(roomType.basePricePerNight * priceMultiplier * seasonMultiplier);

  // TTL: 2 years from now (in seconds)
  const ttl = Math.floor(Date.now() / 1000) + (730 * 24 * 60 * 60);

  return {
    PK: `ROOM#${roomType.roomTypeId}`,
    SK: `DATE#${dateStr}`,
    EntityType: "Availability",
    RoomTypeId: roomType.roomTypeId,
    PropertyId: roomType.propertyId,
    Date: dateStr,
    AvailableRooms: availableRooms,
    TotalRooms: roomType.totalRooms,
    PricePerNight: pricePerNight,
    Currency: roomType.currency,
    MinStay: 1,
    MaxStay: 30,
    IsBlocked: false,
    BlockReason: null,
    LastUpdated: new Date().toISOString(),
    TTL: ttl,
    GSI1PK: `PROPERTY#${roomType.propertyId}`,
    GSI1SK: `DATE#${dateStr}#ROOM#${roomType.roomTypeId}`
  };
}

function generateUser() {
  const userId = generateId('user');
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random(1, 999)}@example.com`;

  return {
    userId,
    email,
    firstName,
    lastName,
    phoneNumber: `+${random(1, 999)}-${random(100, 999)}-${random(1000000, 9999999)}`,
    profilePhotoUrl: `https://i.pravatar.cc/150?u=${userId}`,
    role: "customer",
    emailVerified: true,
    phoneVerified: Math.random() > 0.5,
    country: randomChoice(COUNTRIES),
    preferredCurrency: randomChoice(["USD", "EUR", "GBP"]),
    preferredLanguage: "en",
    createdAt: new Date(Date.now() - random(1, 730) * 24 * 60 * 60 * 1000).toISOString(),
    loyaltyPoints: random(0, 5000),
    loyaltyTier: randomChoice(["basic", "silver", "gold", "platinum"])
  };
}

function generateBooking(user, property, roomType, index) {
  const bookingId = generateId('bkg');
  const bookingReference = `BKG-2024-${random(100000, 999999)}`;

  // Random date in the past or future
  const daysOffset = random(-90, 180);
  const checkInDate = addDays(new Date(), daysOffset);
  const numberOfNights = random(1, 7);
  const checkOutDate = addDays(checkInDate, numberOfNights);

  const status = daysOffset < -numberOfNights ? "completed" : daysOffset < 0 ? "confirmed" : "confirmed";
  const numberOfAdults = random(1, roomType.maxAdults);
  const numberOfChildren = random(0, roomType.maxChildren);

  const roomTotal = roomType.basePricePerNight * numberOfNights;
  const taxesAndFees = Math.round(roomTotal * 0.12);
  const totalAmount = roomTotal + taxesAndFees;

  return {
    bookingId,
    bookingReference,
    userId: user.userId,
    propertyId: property.propertyId,
    roomTypeId: roomType.roomTypeId,
    status,
    checkInDate: formatDate(checkInDate),
    checkOutDate: formatDate(checkOutDate),
    numberOfNights,
    numberOfAdults,
    numberOfChildren,
    guestInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      country: user.country
    },
    totalAmount,
    currency: property.priceRange.currency,
    paymentStatus: status === "completed" ? "paid" : status === "confirmed" ? "paid" : "pending",
    priceBreakdown: {
      roomTotal,
      taxesAndFees,
      discounts: 0
    },
    specialRequests: Math.random() > 0.7 ? randomChoice(["Late check-in", "Non-smoking room", "High floor", "Quiet room", "Extra pillows"]) : null,
    cancellationPolicy: "free_cancellation_48h",
    createdAt: new Date(checkInDate.getTime() - random(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(checkInDate.getTime() - random(1, 30) * 24 * 60 * 60 * 1000).toISOString()
  };
}

function generateReview(user, booking, property) {
  const reviewId = generateId('rev');

  // Determine review sentiment based on property rating
  let sentiment;
  if (property.averageRating >= 8.5) {
    sentiment = random(1, 10) <= 8 ? "positive" : "neutral";
  } else if (property.averageRating >= 7.0) {
    sentiment = random(1, 10) <= 6 ? "positive" : random(1, 10) <= 3 ? "neutral" : "negative";
  } else {
    sentiment = random(1, 10) <= 3 ? "positive" : random(1, 10) <= 5 ? "neutral" : "negative";
  }

  const overallRating = sentiment === "positive" ? random(8, 10) : sentiment === "neutral" ? random(6, 8) : random(4, 6);

  return {
    reviewId,
    bookingId: booking.bookingId,
    userId: user.userId,
    propertyId: property.propertyId,
    overallRating: overallRating + Math.random(),
    cleanlinessRating: overallRating + random(-1, 1) + Math.random(),
    comfortRating: overallRating + random(-1, 1) + Math.random(),
    locationRating: overallRating + random(-1, 1) + Math.random(),
    facilitiesRating: overallRating + random(-1, 1) + Math.random(),
    staffRating: overallRating + random(-1, 1) + Math.random(),
    valueRating: overallRating + random(-1, 1) + Math.random(),
    title: randomChoice(REVIEW_TITLES[sentiment]),
    reviewText: randomChoice(REVIEW_TEMPLATES[sentiment]),
    pros: sentiment === "positive" ? "Great location, friendly staff, clean rooms" : null,
    cons: sentiment === "negative" ? "Room needs updating, slow WiFi" : null,
    tripType: randomChoice(["solo", "couple", "family", "business", "friends"]),
    stayDate: booking.checkInDate,
    isVerified: true,
    helpfulCount: random(0, 50),
    status: "approved",
    guestName: `${user.firstName} ${user.lastName.charAt(0)}.`,
    guestCountry: user.country,
    createdAt: new Date(new Date(booking.checkOutDate).getTime() + random(1, 7) * 24 * 60 * 60 * 1000).toISOString()
  };
}

function generatePromoCode(index) {
  const codes = ["SUMMER2024", "WINTER25", "SPRING20", "FALL15", "WELCOME10", "LOYALTY20", "WEEKEND15"];
  const code = codes[index % codes.length] + random(10, 99);

  return {
    code,
    description: `Special discount - ${code}`,
    discountType: Math.random() > 0.5 ? "percentage" : "fixed_amount",
    discountValue: Math.random() > 0.5 ? random(5, 25) : random(10, 50),
    minBookingAmount: random(100, 300),
    maxDiscountAmount: random(50, 200),
    validFrom: new Date(Date.now() - random(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
    validUntil: new Date(Date.now() + random(30, 180) * 24 * 60 * 60 * 1000).toISOString(),
    usageLimit: random(100, 1000),
    usageCount: random(0, 500),
    isActive: true
  };
}

// ===========================================
// MAIN GENERATION FUNCTION
// ===========================================

function generateAllData() {
  console.log("🎲 Generating sample data...\n");

  const data = {
    metadata: {
      generated: new Date().toISOString(),
      description: "Sample data for Hotel Booking Platform - 10 popular cities",
      cities: CITIES.map(c => `${c.name}, ${c.country}`)
    },
    amenities: AMENITIES,
    properties: [],
    roomTypes: [],
    availability: [],
    users: [],
    bookings: [],
    reviews: [],
    promoCodes: []
  };

  // Generate Properties (5 per city = 50 total)
  console.log("📍 Generating properties...");
  CITIES.forEach((city, cityIndex) => {
    for (let i = 0; i < 5; i++) {
      const property = generateProperty(city, i);
      data.properties.push(property);

      // Generate Room Types (3 per property)
      const roomTemplates = randomChoices(ROOM_TYPES, 3);
      roomTemplates.forEach(template => {
        const roomType = generateRoomType(property, template);
        data.roomTypes.push(roomType);
      });
    }
  });
  console.log(`✅ Generated ${data.properties.length} properties`);
  console.log(`✅ Generated ${data.roomTypes.length} room types`);

  // Generate Availability (90 days for each room type)
  console.log("\n📅 Generating availability data...");
  const today = new Date();
  data.roomTypes.forEach(roomType => {
    for (let day = 0; day < 90; day++) {
      const date = addDays(today, day);
      const availability = generateAvailability(roomType, date);
      data.availability.push(availability);
    }
  });
  console.log(`✅ Generated ${data.availability.length} availability records`);

  // Generate Users (100 users)
  console.log("\n👥 Generating users...");
  for (let i = 0; i < 100; i++) {
    data.users.push(generateUser());
  }
  console.log(`✅ Generated ${data.users.length} users`);

  // Generate Bookings (2-3 per property = ~100-150 bookings)
  console.log("\n📖 Generating bookings...");
  data.properties.forEach(property => {
    const propertyRoomTypes = data.roomTypes.filter(rt => rt.propertyId === property.propertyId);
    const numBookings = random(2, 3);

    for (let i = 0; i < numBookings; i++) {
      const user = randomChoice(data.users);
      const roomType = randomChoice(propertyRoomTypes);
      const booking = generateBooking(user, property, roomType, i);
      data.bookings.push(booking);
    }
  });
  console.log(`✅ Generated ${data.bookings.length} bookings`);

  // Generate Reviews (60-70% of completed bookings)
  console.log("\n⭐ Generating reviews...");
  const completedBookings = data.bookings.filter(b => b.status === "completed");
  const reviewableBookings = randomChoices(completedBookings, Math.floor(completedBookings.length * 0.65));

  reviewableBookings.forEach(booking => {
    const user = data.users.find(u => u.userId === booking.userId);
    const property = data.properties.find(p => p.propertyId === booking.propertyId);
    const review = generateReview(user, booking, property);
    data.reviews.push(review);
  });
  console.log(`✅ Generated ${data.reviews.length} reviews`);

  // Generate Promo Codes
  console.log("\n🎟️  Generating promo codes...");
  for (let i = 0; i < 10; i++) {
    data.promoCodes.push(generatePromoCode(i));
  }
  console.log(`✅ Generated ${data.promoCodes.length} promo codes`);

  // Calculate statistics
  data.metadata.stats = {
    properties: data.properties.length,
    roomTypes: data.roomTypes.length,
    availability: data.availability.length,
    users: data.users.length,
    bookings: data.bookings.length,
    reviews: data.reviews.length,
    promoCodes: data.promoCodes.length
  };

  return data;
}

// ===========================================
// MAIN EXECUTION
// ===========================================

console.log("╔════════════════════════════════════════════╗");
console.log("║   Hotel Booking Sample Data Generator     ║");
console.log("╚════════════════════════════════════════════╝\n");

const data = generateAllData();

// Save to file
const filename = 'sample-data-full.json';
fs.writeFileSync(filename, JSON.stringify(data, null, 2));

console.log("\n✨ Data generation complete!");
console.log(`\n📊 Summary:`);
console.log(`   Properties: ${data.metadata.stats.properties}`);
console.log(`   Room Types: ${data.metadata.stats.roomTypes}`);
console.log(`   Availability Records: ${data.metadata.stats.availability}`);
console.log(`   Users: ${data.metadata.stats.users}`);
console.log(`   Bookings: ${data.metadata.stats.bookings}`);
console.log(`   Reviews: ${data.metadata.stats.reviews}`);
console.log(`   Promo Codes: ${data.metadata.stats.promoCodes}`);
console.log(`\n💾 Saved to: ${filename}`);
console.log(`\n📦 Total file size: ${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB\n`);
