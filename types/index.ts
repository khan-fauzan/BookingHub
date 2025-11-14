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
