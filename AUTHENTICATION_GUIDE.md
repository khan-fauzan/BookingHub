# Authentication Guide - AWS Cognito Integration

## ✅ Implementation Complete

The Next.js frontend has been successfully integrated with AWS Cognito authentication!

---

## 📋 What Was Implemented

### 1. AWS Amplify Configuration
- **File**: `lib/amplify-config.ts`
- Configured Amplify to work with Cognito User Pool
- Supports OAuth flows and email/password authentication
- SSR-compatible configuration

### 2. Authentication Context
- **File**: `lib/auth/auth-context.tsx`
- React Context for managing authentication state
- Provides hooks for all auth operations:
  - `signIn()` - Email/password login with password challenge detection
  - `signUp()` - User registration
  - `signOut()` - Logout
  - `confirmSignUp()` - Email verification
  - `completeNewPassword()` - Handle required password changes on first login
  - `updateUserPassword()` - Password updates for existing users
  - `forgotPassword()` - Initiate password reset
  - `confirmForgotPassword()` - Complete password reset
  - `refreshUser()` - Refresh user data

### 3. Protected Routes
- **File**: `components/auth/protected-route.tsx`
- HOC to protect authenticated routes
- Automatic redirect to login for unauthenticated users
- Loading states during auth check

### 4. Updated Components
- **Root Layout** (`app/layout.tsx`)
  - Wrapped with `AmplifyConfigProvider`
  - Wrapped with `AuthProvider`

- **Login Form** (`components/forms/login-form.tsx`)
  - Real Cognito authentication
  - Password change detection and handling
  - Automatic password change form on first login
  - Password validation (matches Cognito requirements)
  - Error handling
  - Automatic redirect after successful login

- **Header** (`components/layout/header.tsx`)
  - Shows authentication status
  - Displays logout icon button when authenticated
  - Sign out functionality with redirect

---

## 🔐 Testing Authentication

### Test Credentials
- **Username**: `admin@hotelbooking.com`
- **Initial Password**: `VHhHLQ1&nmYZ`
- ⚠️ **Important**: You MUST change the password on first login

### Test Steps

#### 1. Access the Login Page
```
http://localhost:3000/login
```

#### 2. Login with Test Credentials
- Enter the username and password above
- Click "Log in"
- The system will detect that a password change is required

#### 3. Change Password (First Login Only)
When logging in for the first time, you'll see a password change form:
- Enter a new password (must meet Cognito requirements)
- Confirm the new password
- Click "Change Password"

**Password Requirements:**
- At least 8 characters long
- Contains uppercase and lowercase letters
- Contains numbers
- Contains special characters

#### 4. Verify Authentication
After successful password change and login, you should see:
- ✅ Redirect to homepage
- ✅ Logout icon button in the header (instead of "Log in")
- ✅ Access to protected routes

#### 5. Test Sign Out
- Click the logout icon button in the header
- Verify you're logged out and redirected to homepage

#### 6. Test Subsequent Logins
- After changing your password, you can log in normally with your new password
- The password change form will only appear on first login

---

## 🌐 Using AWS Cognito Hosted UI

For testing OAuth flows and social login (future), you can use the Hosted UI:

```
https://hotelbooking-616855574610.auth.us-east-1.amazoncognito.com/login?client_id=24c80n5k39ent67vbkiuf203fn&response_type=code&redirect_uri=http://localhost:3000/auth/callback
```

---

## 📁 Project Structure

```
/lib
  /auth
    auth-context.tsx           # Authentication context & hooks
  amplify-config.ts            # AWS Amplify configuration

/components
  /auth
    protected-route.tsx        # Protected route HOC
  /providers
    amplify-config-provider.tsx # Client-side Amplify initializer
  /forms
    login-form.tsx            # Login form with Cognito integration
  /layout
    header.tsx                # Header with auth status

/app
  layout.tsx                   # Root layout with providers
  /(auth)
    /login                     # Login page
    /register                  # Registration page (to be implemented)
    /forgot-password           # Password reset (to be implemented)
```

---

## 🔧 Environment Variables

Current configuration in `.env.local`:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_dmUS8yV9X
NEXT_PUBLIC_COGNITO_CLIENT_ID=24c80n5k39ent67vbkiuf203fn
NEXT_PUBLIC_COGNITO_DOMAIN=https://hotelbooking-616855574610.auth.us-east-1.amazoncognito.com
```

---

## 🎯 Using Authentication in Components

### Check if User is Logged In

```tsx
'use client';

import { useAuth } from '@/lib/auth/auth-context';

export function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>Please log in</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

### Protect a Route

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>This is a protected page</div>
    </ProtectedRoute>
  );
}
```

### Sign Out Programmatically

```tsx
'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

---

## 🚀 Next Steps

### Immediate Tasks
1. ✅ Test login with provided credentials
2. ✅ Verify authentication state persists on page refresh
3. ✅ Test sign out functionality

### Future Enhancements
1. **Registration Flow**
   - Update `/register` page with Cognito sign up
   - Email verification flow

2. **Password Reset**
   - Implement forgot password flow
   - Email-based password reset

3. **User Profile**
   - Display user attributes
   - Update profile information
   - Change password functionality

4. **Protected Routes**
   - Dashboard page (customer)
   - Owner dashboard
   - Admin panel

5. **Social Login**
   - Google OAuth
   - Facebook OAuth
   - Apple Sign In

6. **Multi-Factor Authentication (MFA)**
   - Enable MFA for users
   - TOTP-based authentication

---

## 🐛 Troubleshooting

### "User does not exist" Error
- Check if the credentials are correct
- Verify the User Pool ID in `.env.local`
- Check Cognito console for user status

### "Invalid user pool configuration" Error
- Verify all environment variables are set correctly
- Check that the User Pool and Client IDs match your AWS deployment
- Restart the dev server after changing `.env.local`

### Authentication State Not Persisting
- Check browser console for errors
- Verify cookies are not being blocked
- Check that Amplify is configured correctly

### Redirect Loop
- Check that protected routes are not redirecting to themselves
- Verify the login page is not wrapped in `ProtectedRoute`

---

## 📚 References

- [AWS Amplify Documentation](https://docs.amplify.aws/javascript/)
- [AWS Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

---

## ✅ Current Status

- ✅ AWS Cognito User Pool deployed
- ✅ Next.js configured with Amplify
- ✅ Authentication context implemented
- ✅ Login functionality working
- ✅ Password change flow on first login
- ✅ Protected routes component created
- ✅ Header showing auth status with logout icon
- ✅ Sign out functionality working
- 🚀 Server running on http://localhost:3000

---

**Last Updated**: 2025-11-16
**Status**: ✅ Ready for testing - Password change on first login is now working!
