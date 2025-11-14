# Hotel Booking Platform - Frontend

A modern, full-featured hotel booking platform built with Next.js 15, TypeScript, and Tailwind CSS. This is the frontend implementation based on the comprehensive Product Requirements Document (PRD).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Your Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
/app                          # Next.js App Router pages and layouts
  /(auth)                     # Authentication pages (login, register, etc.)
    /login                    # Login page
    /register                 # Registration page
    /forgot-password          # Forgot password page
    /reset-password           # Reset password page
  /(dashboard)                # Protected user dashboard (future)
  /(owner)                    # Property owner dashboard (future)
  /(admin)                    # Admin panel (future)
  /properties/[id]            # Property detail pages (future)
  /search                     # Search results page (future)

/components                   # React components
  /ui                         # Base UI components
    - button.tsx              # Button component with variants
    - input.tsx               # Input component with validation
    - card.tsx                # Card components
    - checkbox.tsx            # Checkbox component
    - badge.tsx               # Badge component
    - label.tsx               # Label component
  /forms                      # Form components
    - login-form.tsx          # Login form with validation
    - register-form.tsx       # Registration form with validation
    - forgot-password-form.tsx # Forgot password form
    - reset-password-form.tsx  # Reset password form
  /layout                     # Layout components
    - header.tsx              # Site header with navigation
    - footer.tsx              # Site footer
  /search                     # Search components
    - search-bar.tsx          # Main search bar component

/lib                          # Utility functions and shared logic
  /utils                      # Helper functions
    - cn.ts                   # Class name utility
    - index.ts                # General utilities
  /validations                # Zod validation schemas
    - auth.ts                 # Authentication form schemas

/types                        # TypeScript type definitions
  - index.ts                  # Common types and interfaces

/public                       # Static assets
```

## ✨ Features Implemented

### Core Features

- ✅ **Next.js 15 App Router** - Latest Next.js with server components
- ✅ **TypeScript** - Full type safety throughout the application
- ✅ **Tailwind CSS** - Modern utility-first CSS framework
- ✅ **Design System** - Comprehensive design tokens and color palette

### UI Components

- ✅ **Button** - Multiple variants (primary, secondary, outline, ghost, danger, success)
- ✅ **Input** - With labels, errors, helper text, and icons
- ✅ **Card** - Flexible card components with header, content, footer
- ✅ **Checkbox** - With labels and error states
- ✅ **Badge** - Multiple variants for status indicators
- ✅ **Label** - Form labels with required indicators

### Layout Components

- ✅ **Header** - Responsive navigation with mobile menu
- ✅ **Footer** - Comprehensive footer with links and social media
- ✅ **Auth Layout** - Beautiful split-screen authentication layout

### Authentication

- ✅ **Login Page** - Email/password login with social auth buttons
- ✅ **Register Page** - Complete registration form with validation
- ✅ **Forgot Password** - Password reset request flow
- ✅ **Reset Password** - New password creation flow
- ✅ **Form Validation** - Zod schemas with React Hook Form integration

### Homepage

- ✅ **Hero Section** - Gradient hero with search bar
- ✅ **Search Bar** - Destination, dates, and guest inputs
- ✅ **Popular Destinations** - Showcase popular locations
- ✅ **Features Section** - Platform benefits and USPs
- ✅ **Stats Section** - Platform statistics
- ✅ **CTA Section** - Call-to-action for sign-up

## 🎨 Design System

### Colors

- **Primary**: Blue shades (50-950) for main brand color
- **Accent**: Red shades for secondary highlights
- **Neutral**: Gray scale for text and backgrounds
- **Semantic**: Success, Warning, Error colors

### Typography

- **Font**: Inter (sans-serif)
- **Sizes**: xs, sm, base, lg, xl, 2xl-6xl with proper line heights

### Components

All components follow consistent patterns:
- Accessible (WCAG 2.1 compliant)
- Keyboard navigable
- Screen reader friendly
- Mobile responsive
- Hover and focus states

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 📝 Form Validation

All forms use Zod for schema validation:

- **Login**: Email and password validation
- **Register**: Name, email, phone, password with confirmation
- **Forgot Password**: Email validation
- **Reset Password**: Password strength and confirmation

## 🎯 Current Status

This is a **frontend-only implementation**. The following features are included:

✅ **Completed**:
- Project setup and configuration
- Design system and Tailwind CSS
- Base UI component library
- Layout components (Header, Footer)
- Authentication pages and forms
- Homepage with hero and search
- Form validation with Zod
- Responsive design

🚧 **Not Implemented** (Frontend only - no backend):
- Actual authentication (forms submit but don't connect to backend)
- API integration
- Database connections
- Payment processing
- Real search functionality
- Property listings
- Booking flow
- User dashboard

## 🔐 Important Notes

### Frontend Only

This implementation includes:
- Complete UI/UX for authentication flows
- Form validation and error handling
- Client-side state management
- Responsive layouts and components

This implementation does NOT include:
- Backend API endpoints
- Database integration
- Authentication system (NextAuth.js setup exists but not configured)
- Payment processing (Stripe integration pending)
- Email services
- File storage

### Next Steps

To continue development, you'll need to:

1. Set up backend API routes in `/app/api`
2. Configure database (PostgreSQL with Prisma)
3. Implement authentication (NextAuth.js or Clerk)
4. Add payment processing (Stripe)
5. Set up file storage (AWS S3 or Cloudinary)
6. Configure email service (SendGrid or Resend)

## 🔗 Links

- [PRD Documentation](./PRD.md) - Complete product requirements
- [Claude Code Instructions](./CLAUDE.md) - Development guidelines
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: 320px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px - 1920px
- **Wide**: 1921px+

## 🎨 Inspiration

Design and UX inspired by:
- [Booking.com](https://booking.com)
- [Hotels.com](https://hotels.com)

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

This is a learning project. Feel free to explore and extend it!

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
