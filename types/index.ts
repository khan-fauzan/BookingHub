// User types
export type UserRole = "customer" | "property_owner" | "admin";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Property types
export type PropertyType =
  | "hotel"
  | "apartment"
  | "resort"
  | "villa"
  | "hostel"
  | "guesthouse"
  | "boutique"
  | "motel";

export type PropertyStatus = "draft" | "pending" | "approved" | "suspended";

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  propertyType: PropertyType;
  starRating?: number;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  phoneNumber: string;
  email: string;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Address type
export interface PropertyAddress {
  id: string;
  propertyId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

// Amenity types
export type AmenityCategory =
  | "basic"
  | "bathroom"
  | "kitchen"
  | "entertainment"
  | "services"
  | "outdoor"
  | "accessibility";

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  icon?: string;
}

// Room types
export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  roomSizeSqm?: number;
  bedConfiguration: BedConfiguration[];
  basePricePerNight: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BedConfiguration {
  type: "single" | "double" | "queen" | "king" | "sofa_bed" | "bunk";
  count: number;
}

// Booking types
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface Booking {
  id: string;
  userId: string;
  propertyId: string;
  bookingReference: string;
  status: BookingStatus;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  numberOfAdults: number;
  numberOfChildren: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export type TripType = "solo" | "couple" | "family" | "business" | "friends";

export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  propertyId: string;
  overallRating: number;
  cleanlinessRating: number;
  comfortRating: number;
  locationRating: number;
  facilitiesRating: number;
  staffRating: number;
  valueRating: number;
  title?: string;
  reviewText: string;
  tripType: TripType;
  stayDate: Date;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Search types
export interface SearchFilters {
  destination?: string;
  checkIn?: Date;
  checkOut?: Date;
  adults?: number;
  children?: number;
  rooms?: number;
  priceMin?: number;
  priceMax?: number;
  starRating?: number[];
  guestRating?: number;
  propertyTypes?: PropertyType[];
  amenities?: string[];
  sortBy?: "recommended" | "price_low" | "price_high" | "rating" | "distance";
}

// Backend API types for property search
export interface PropertySearchParams {
  // Location (required - one of the following)
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;

  // Dates & Guests
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  adults: number;
  children?: number;
  rooms?: number;

  // Filters
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
  propertyType?: string[];
  amenities?: string[];
  minGuestRating?: number;
  freeCancellation?: boolean;

  // Sorting
  sortBy?: "recommended" | "price_asc" | "price_desc" | "rating" | "distance";

  // Pagination
  limit?: number;
  offset?: number;
  nextToken?: string;
}

export interface PropertySearchResult {
  propertyId: string;
  name: string;
  slug: string;
  propertyType: string;
  starRating: number;
  location: {
    city: string;
    state: string;
    country: string;
    address: string;
    latitude: number;
    longitude: number;
    distanceFromCenter: number;
  };
  rating: {
    average: number;
    reviewCount: number;
  };
  images: {
    primary: string;
    count: number;
  };
  pricing: {
    pricePerNight: number;
    totalPrice: number;
    currency: string;
    taxesIncluded: boolean;
  };
  availability: {
    available: boolean;
    roomsAvailable: number;
  };
  amenities: string[];
  badges: string[];
  isFeatured: boolean;
}

export interface PropertySearchResponse {
  success: boolean;
  data: {
    properties: PropertySearchResult[];
    filters: {
      applied: {
        city?: string;
        checkIn: string;
        checkOut: string;
        adults: number;
      };
      available: {
        priceRange: { min: number; max: number };
        starRatings: number[];
        propertyTypes: string[];
        amenities: string[];
      };
    };
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
      nextToken?: string;
    };
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Property details response
export interface PropertyDetailsResponse {
  success: boolean;
  data: {
    property: {
      propertyId: string;
      name: string;
      slug: string;
      description: string;
      propertyType: string;
      starRating: number;
      location: {
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          country: string;
          postalCode: string;
        };
        coordinates: {
          latitude: number;
          longitude: number;
        };
        distanceFromCenter: number;
        nearbyLandmarks: Array<{
          name: string;
          distance: number;
        }>;
      };
      contact: {
        phone: string;
        email: string;
        website?: string;
      };
      rating: {
        overall: number;
        breakdown: {
          cleanliness: number;
          comfort: number;
          location: number;
          facilities: number;
          staff: number;
          value: number;
        };
        reviewCount: number;
      };
      images: Array<{
        url: string;
        category: string;
        altText: string;
        isPrimary: boolean;
      }>;
      amenities: Array<{
        id: string;
        name: string;
        category: string;
      }>;
      roomTypes: Array<{
        roomTypeId: string;
        name: string;
        description: string;
        maxOccupancy: number;
        bedConfiguration: Array<{
          type: string;
          count: number;
        }>;
        roomSize: number;
        amenities: string[];
        images: string[];
        pricing: {
          basePrice: number;
          totalPrice: number;
          currency: string;
        };
        availability: {
          available: boolean;
          roomsAvailable: number;
        };
        cancellationPolicy: string;
      }>;
      policies: {
        checkIn: string;
        checkOut: string;
        cancellation: string;
        pets: string;
        children: string;
      };
      highlights: string[];
    };
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
