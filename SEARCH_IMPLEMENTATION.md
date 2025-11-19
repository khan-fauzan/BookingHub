# Property Search Implementation

This document describes the property search feature implementation for the Hotel Booking Platform frontend.

## Overview

The search feature connects the Next.js frontend to the backend API Gateway endpoints, enabling users to search for properties with advanced filtering, sorting, and pagination capabilities.

## Architecture

```
┌─────────────────┐
│   User Input    │
│  (SearchBar)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Search Page    │
│  /app/search    │
└────────┬────────┘
         │
         ├─────► SearchFilters
         ├─────► SearchSort
         ├─────► PropertyCard
         └─────► SearchPagination
         │
         ▼
┌─────────────────┐
│   API Client    │
│ /lib/api/...    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  API Gateway    │
│  + Lambda       │
│  + DynamoDB     │
└─────────────────┘
```

## Components

### 1. SearchBar (`components/search/search-bar.tsx`)
- **Location**: Homepage hero section and search page header
- **Functionality**:
  - Input fields for destination, check-in/check-out dates, and guests
  - Validates user input before submitting
  - Navigates to `/search` with query parameters
  - Supports pre-filling from URL parameters

**Usage**:
```tsx
import { SearchBar } from "@/components/search";

<SearchBar />
```

### 2. SearchFilters (`components/search/search-filters.tsx`)
- **Location**: Left sidebar on search page
- **Features**:
  - Price range filter (min/max)
  - Star rating selection (1-5 stars)
  - Property type checkboxes (hotel, apartment, resort, etc.)
  - Amenities selection (WiFi, pool, gym, etc.)
  - Guest rating filter (6+, 7+, 8+, 9+)
  - Free cancellation toggle
  - Mobile responsive with collapsible panel
  - Active filter count badge
  - Clear all filters button

**Filter State**:
```typescript
interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  starRating?: number[];
  propertyType?: string[];
  amenities?: string[];
  minGuestRating?: number;
  freeCancellation?: boolean;
}
```

### 3. PropertyCard (`components/search/property-card.tsx`)
- **Location**: Search results list
- **Features**:
  - Property image with fallback gradient
  - Favorite/wishlist button
  - Featured and custom badges
  - Star rating display
  - Location with distance from center
  - Amenities list (first 4 shown)
  - Guest rating with label (Exceptional, Excellent, etc.)
  - Pricing per night and total
  - Availability status
  - Responsive grid layout

**Rating Labels**:
- 9.0+ → Exceptional
- 8.0-8.9 → Excellent
- 7.0-7.9 → Very Good
- 6.0-6.9 → Good

### 4. SearchSort (`components/search/search-sort.tsx`)
- **Location**: Top right of search results
- **Sort Options**:
  - Recommended (default)
  - Price: Low to High
  - Price: High to Low
  - Guest Rating
  - Distance from Center

**Usage**:
```tsx
<SearchSort
  currentSort={sortBy}
  onSortChange={(newSort) => setSortBy(newSort)}
/>
```

### 5. SearchPagination (`components/search/search-pagination.tsx`)
- **Location**: Bottom of search results
- **Features**:
  - Shows "X to Y of Z results"
  - Previous/Next buttons
  - Page numbers with ellipsis for large page counts
  - Highlights current page
  - Responsive design
  - Smooth scroll to top on page change

## API Integration

### API Client (`lib/api/properties.ts`)

#### 1. `searchProperties(params: PropertySearchParams)`
Searches for properties with filters.

**Parameters**:
```typescript
interface PropertySearchParams {
  // Location (required)
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;

  // Dates & Guests (required)
  checkIn: string; // ISO date: "2025-01-15"
  checkOut: string; // ISO date: "2025-01-18"
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
```

**Response**:
```typescript
interface PropertySearchResponse {
  success: boolean;
  data: {
    properties: PropertySearchResult[];
    filters: {
      applied: { ... };
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
}
```

#### 2. `getPropertyDetails(propertyId: string)`
Fetches detailed information for a specific property.

#### 3. `getPropertyBySlug(slug: string)`
Fetches property by URL-friendly slug.

#### 4. `getFeaturedProperties(limit?: number)`
Fetches featured/trending properties.

## Search Page (`app/search/page.tsx`)

### URL Parameters

The search page uses URL query parameters:

```
/search?city=New+York&country=USA&checkIn=2025-02-01&checkOut=2025-02-05&adults=2
```

**Parameters**:
- `city` - City name
- `country` - Country name
- `destination` - Alternative to city/country
- `checkIn` - Check-in date (YYYY-MM-DD)
- `checkOut` - Check-out date (YYYY-MM-DD)
- `adults` - Number of adults
- `children` - Number of children (optional)
- `rooms` - Number of rooms (optional)

### States

The search page manages:
- `properties` - Array of search results
- `loading` - Loading state
- `error` - Error message
- `totalResults` - Total number of properties found
- `currentPage` - Current page number
- `filters` - Active filter state
- `sortBy` - Current sort option
- `availableFilters` - Available filter options from API

### Loading States

1. **Initial Load**: Shows loading spinner
2. **Error State**: Shows error message with icon
3. **No Results**: Shows empty state with suggestion
4. **Results**: Shows property cards with pagination

## TypeScript Types (`types/index.ts`)

All types are defined in the central types file:

- `PropertySearchParams` - API request parameters
- `PropertySearchResult` - Individual property in search results
- `PropertySearchResponse` - Complete API response
- `PropertyDetailsResponse` - Detailed property information
- `FilterState` - Filter component state
- `SortOption` - Sort option type

## Environment Configuration

### Required Environment Variables

Add to `.env.local`:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=https://YOUR-API-ID.execute-api.REGION.amazonaws.com/v1
```

### Getting the API URL

```bash
# Get from CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name hotel-booking-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

Current development API:
```
https://cj0hqqrrah.execute-api.us-east-1.amazonaws.com/v1
```

## Usage Examples

### Basic Search

```tsx
// Navigate from SearchBar
<SearchBar /> // User fills in: "Paris", "2025-02-01", "2025-02-05", "2"
// Navigates to: /search?city=Paris&checkIn=2025-02-01&checkOut=2025-02-05&adults=2
```

### Search with Filters

```tsx
// User applies filters on search page
const filters = {
  minPrice: 100,
  maxPrice: 300,
  starRating: [4, 5],
  amenities: ["wifi", "pool"],
  freeCancellation: true
};

// API call includes all filters
searchProperties({
  city: "Paris",
  checkIn: "2025-02-01",
  checkOut: "2025-02-05",
  adults: 2,
  ...filters,
  sortBy: "price_asc",
  limit: 20,
  offset: 0
});
```

### Programmatic Search

```typescript
import { searchProperties } from "@/lib/api";

const results = await searchProperties({
  city: "New York",
  country: "USA",
  checkIn: "2025-03-15",
  checkOut: "2025-03-18",
  adults: 2,
  children: 1,
  minPrice: 150,
  starRating: [4, 5],
  amenities: ["wifi", "gym"],
  sortBy: "recommended",
  limit: 20
});

console.log(results.data.properties);
```

## Responsive Design

### Breakpoints

- **Mobile** (< 768px):
  - Stacked layout
  - Collapsible filters
  - Single column property cards

- **Tablet** (768px - 1024px):
  - Collapsible filters
  - Grid property cards

- **Desktop** (> 1024px):
  - Sticky sidebar filters
  - Optimized property cards

### Mobile Optimization

- Filters toggle button with active count badge
- Collapsible filter sections
- Touch-friendly button sizes
- Optimized image loading with Next.js Image

## Performance Optimization

### API Caching

```typescript
fetch(url, {
  next: {
    revalidate: 60, // Revalidate every 60 seconds
  },
});
```

### Image Optimization

All images use Next.js `Image` component:
- Automatic responsive sizes
- WebP format support
- Lazy loading
- Blur placeholder

### Code Splitting

Components are loaded on-demand:
```typescript
const PropertyCard = dynamic(() => import("./property-card"), {
  loading: () => <PropertyCardSkeleton />,
});
```

## Error Handling

### Validation Errors

- Missing destination: Alert before navigation
- Missing dates: Alert before navigation
- Invalid date range: Handled by backend

### API Errors

```typescript
try {
  const response = await searchProperties(params);
  if (!response.success) {
    throw new Error("Failed to fetch properties");
  }
} catch (error) {
  setError(error.message);
  // Display error state to user
}
```

### Network Errors

- Automatic retry with exponential backoff (future)
- User-friendly error messages
- Option to retry search

## Testing

### Manual Testing Checklist

- [ ] Search with city only
- [ ] Search with city and country
- [ ] Search with different date ranges
- [ ] Apply price filters
- [ ] Apply star rating filters
- [ ] Apply property type filters
- [ ] Apply amenity filters
- [ ] Toggle free cancellation
- [ ] Change sort options
- [ ] Navigate between pages
- [ ] Responsive design on mobile
- [ ] Error handling with invalid dates
- [ ] Error handling with API errors

### Test Data

The backend has seed data for testing in these cities:
- New York, USA
- Los Angeles, USA
- San Francisco, USA
- Miami, USA
- Las Vegas, USA

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic search functionality
- ✅ Filters and sorting
- ✅ Pagination
- ✅ Responsive design

### Phase 2 (Planned)
- [ ] Map view integration
- [ ] Saved searches
- [ ] Recent searches
- [ ] Advanced filters (beds, bathrooms)
- [ ] Distance from landmarks

### Phase 3 (Future)
- [ ] Real-time availability
- [ ] Price alerts
- [ ] Comparison feature
- [ ] Virtual tours
- [ ] Instant booking

## Troubleshooting

### Issue: "Please enter a destination"
**Solution**: Enter a city name in the search bar

### Issue: "Please select check-in and check-out dates"
**Solution**: Both dates are required for availability checking

### Issue: No properties found
**Causes**:
- No properties in selected location
- Date range too restrictive
- Too many filters applied

**Solution**: Try broader search criteria

### Issue: API connection failed
**Causes**:
- Backend API not deployed
- Incorrect API URL in environment variables
- Network issues

**Solution**:
1. Verify API URL in `.env.local`
2. Check backend deployment status
3. Test API endpoint directly

### Issue: Images not loading
**Causes**:
- CORS configuration
- Invalid image URLs
- Network issues

**Solution**: Fallback gradient displays automatically

## Support

For issues or questions:
1. Check CloudWatch Logs for API errors
2. Review browser console for frontend errors
3. Verify environment variables
4. Test backend API directly using curl or Postman

## API Documentation

Complete API specifications: `backend/api/API_SPECIFICATIONS.md`

Backend deployment guide: `backend/api/API_DEPLOYMENT_GUIDE.md`

Database schema: `backend/dynamodb/DYNAMODB_SCHEMA.md`
