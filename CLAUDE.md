# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hotel Booking Platform** - a modern, full-stack web application built with Next.js 15+ that enables travelers to search, compare, and book accommodations. The platform supports three user roles: customers (travelers), property owners, and admins.

**Technology Stack:**
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js/Clerk for auth
- **Database**: PostgreSQL with Prisma/Drizzle ORM
- **Payments**: Stripe
- **File Storage**: AWS S3 / Cloudinary
- **Email**: SendGrid / Resend
- **Caching**: Redis
- **Hosting**: Vercel / AWS

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

### Database
```bash
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema changes to database
npx prisma migrate dev        # Create and apply migration
npx prisma studio             # Open Prisma Studio GUI
npx prisma db seed            # Seed database with initial data
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run end-to-end tests
npm run test:unit     # Run unit tests only
```

## Architecture

### Directory Structure

```
/app                          # Next.js App Router pages and layouts
  /(auth)                     # Auth-related pages (login, register, etc.)
  /(dashboard)                # Protected user dashboard pages
  /(owner)                    # Property owner dashboard
  /(admin)                    # Admin panel
  /api                        # API route handlers
  /properties/[id]            # Property detail pages
  /search                     # Search results page
/components                   # React components
  /ui                         # Base UI components (buttons, inputs, cards)
  /forms                      # Form components with validation
  /search                     # Search-related components
  /booking                    # Booking flow components
  /property                   # Property display components
/lib                          # Utility functions and shared logic
  /db                         # Database client and queries
  /auth                       # Authentication utilities
  /validations               # Zod schemas for form validation
  /api-helpers               # API utilities and error handlers
/prisma                       # Database schema and migrations
  /schema.prisma             # Database schema definition
  /migrations                # Migration files
  /seed.ts                   # Database seeding script
/public                       # Static assets
/types                        # TypeScript type definitions
```

### Data Model Overview

**Core Entities:**
- `User`: Customers, property owners, and admins with role-based access
- `Property`: Hotel listings with owner relationships, amenities, and images
- `RoomType`: Room categories within properties with pricing and configuration
- `Room`: Individual room inventory linked to room types
- `Availability`: Date-based availability and dynamic pricing for room types
- `Booking`: Reservations linking users to properties with payment tracking
- `Payment`: Payment transactions processed through Stripe
- `Review`: Guest reviews with category ratings and owner responses
- `Wishlist`: User-created lists for saving favorite properties

**Key Relationships:**
- Property → PropertyAddress (1:1), PropertyImages (1:N), Amenities (N:M)
- Property → RoomTypes (1:N) → Rooms (1:N)
- User → Bookings (1:N) → BookingRooms (1:N) → RoomType
- Booking → Payment (1:1), Review (1:1)
- User → Wishlists (1:N) → Properties (N:M)

### Authentication & Authorization

- NextAuth.js or Clerk handles authentication
- Three user roles: `customer`, `property_owner`, `admin`
- Role-based middleware protects routes and API endpoints
- Session management with secure cookies
- OAuth support for Google, Facebook, and Apple

### API Design

All API routes follow REST conventions under `/api`:

**Public APIs:**
- `GET /api/properties/search` - Search with filters, pagination, sorting
- `GET /api/properties/:id` - Property details with rooms and reviews
- `POST /api/availability/check` - Real-time availability checking
- `POST /api/pricing/calculate` - Dynamic price calculation

**Authenticated APIs:**
- `POST /api/bookings` - Create booking with Stripe payment
- `GET /api/bookings` - User's booking history with filters
- `POST /api/reviews` - Submit review for completed bookings
- `POST /api/wishlists/:id/properties` - Manage saved properties

**Owner APIs:**
- `POST /api/owner/properties` - Create property listing
- `PUT /api/owner/rooms/:id/availability` - Update availability calendar
- `GET /api/owner/analytics/overview` - Revenue and performance metrics

**Admin APIs:**
- `GET /api/admin/properties/pending` - Property approval queue
- `PUT /api/admin/reviews/:id/approve` - Moderate reviews

### Search & Filtering Architecture

Search functionality is complex and performance-critical:

1. **Search Inputs**: Destination, check-in/check-out dates, guests, rooms
2. **Filters**: Price range, star rating, guest rating, property type, amenities, cancellation policy, distance
3. **Availability Logic**: Query `Availability` table to exclude fully booked properties for date range
4. **Sorting**: Recommended (default), price, rating, distance from center
5. **Performance**: Use database indexes on frequently queried fields (location, dates, price). Cache popular searches in Redis.

### Booking Flow

The booking process involves multiple steps with data validation:

1. **Property Selection**: User selects property and room type from search results
2. **Date/Guest Validation**: Verify availability and occupancy limits
3. **Guest Information**: Collect name, email, phone, special requests with Zod validation
4. **Price Calculation**: Calculate room price × nights + taxes/fees - discounts
5. **Payment Processing**: Create Stripe payment intent, collect card details securely
6. **Booking Creation**: Atomic transaction creating Booking, BookingRooms, and Payment records
7. **Availability Update**: Decrement available rooms in Availability table
8. **Confirmation**: Generate unique booking reference, send confirmation email

### Payment Integration

- Stripe handles all payment processing (PCI-DSS compliant)
- Use Stripe Payment Intents API for card payments
- Support saved payment methods for returning users
- Implement webhook handler at `/api/webhooks/stripe` for payment events
- Handle refunds for cancellations based on cancellation policy

### Image Handling

- Use Next.js Image component for optimization
- Store images in AWS S3 or Cloudinary
- Property images support categories (exterior, room, amenity, food, location)
- Implement image upload with validation (size, format, dimensions)
- Generate thumbnails and multiple sizes for responsive display

### Notification System

- **Booking Confirmations**: Send immediately upon successful booking
- **Booking Reminders**: Schedule email 24 hours before check-in
- **Review Requests**: Send 1-2 days after check-out
- **Promotional Emails**: Respect user preferences and unsubscribe settings
- Use email templates with SendGrid or Resend

## Development Guidelines

### Environment Variables

Required environment variables (create `.env.local`):

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SENDGRID_API_KEY="..."
FROM_EMAIL="noreply@example.com"

# Storage
AWS_S3_BUCKET="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN="..."
```

### Form Validation

All forms use React Hook Form with Zod schemas:

```typescript
// Define schema in /lib/validations/booking.ts
export const bookingSchema = z.object({
  checkIn: z.date(),
  checkOut: z.date(),
  guestEmail: z.string().email(),
  // ...
})

// Use in components
const form = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema)
})
```

### Database Queries

- Use Prisma Client for type-safe database queries
- Implement repository pattern in `/lib/db` for reusable queries
- Always use transactions for operations affecting multiple tables (bookings)
- Include proper error handling and rollback logic
- Add indexes to foreign keys and frequently queried fields

### Security Considerations

- **Input Validation**: Validate all user inputs with Zod schemas
- **SQL Injection**: Prisma parameterizes queries automatically
- **XSS Prevention**: React escapes content by default; be careful with `dangerouslySetInnerHTML`
- **CSRF Protection**: NextAuth.js includes CSRF protection
- **Rate Limiting**: Implement rate limiting on API routes (especially search, auth)
- **Authentication**: Always verify user session in protected API routes
- **Authorization**: Check user role and ownership before allowing data access
- **Secrets**: Never commit API keys; use environment variables

### Performance Optimization

- **Code Splitting**: Use dynamic imports for heavy components (maps, image galleries)
- **Image Optimization**: Always use `next/image` with proper `sizes` attribute
- **Database**: Use `select` to fetch only needed fields; avoid N+1 queries
- **Caching**: Cache search results, property details, and static data in Redis
- **Static Generation**: Use SSG for destination pages, about pages
- **Incremental Static Regeneration**: Use ISR for property detail pages (revalidate every hour)
- **API Response**: Paginate large result sets; limit to 20-50 items per page

### Accessibility

- Use semantic HTML elements (`<nav>`, `<main>`, `<article>`)
- Include ARIA labels for icon buttons and complex components
- Ensure keyboard navigation works for all interactive elements
- Maintain color contrast ratio of at least 4.5:1
- Provide alt text for all images
- Test with screen readers (VoiceOver, NVDA)

## Project Status

This project is currently in the **planning/setup phase**. The comprehensive PRD is available in `PRD.md` with a detailed 20-week implementation roadmap divided into 6 phases:

1. **Phase 1 (Weeks 1-3)**: Foundation - Project setup, authentication, design system
2. **Phase 2 (Weeks 4-8)**: Core booking features - Properties, rooms, search, booking flow
3. **Phase 3 (Weeks 9-11)**: User experience - Dashboard, reviews, wishlists
4. **Phase 4 (Weeks 12-15)**: Advanced features - Owner dashboard, loyalty, notifications, admin panel
5. **Phase 5 (Weeks 16-18)**: Optimization - Performance, security, SEO, accessibility
6. **Phase 6 (Weeks 19-20)**: Launch preparation and production deployment

Refer to PRD.md for detailed requirements, database schema, API specifications, and user stories.
