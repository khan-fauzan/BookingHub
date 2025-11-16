'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  confirmSignIn,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  updatePassword,
  resetPassword,
  confirmResetPassword,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  givenName?: string;
  familyName?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, givenName?: string, familyName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  updateUserPassword: (oldPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async (throwOnError = false) => {
    try {
      console.log('Checking user session...');
      const currentUser = await getCurrentUser();
      console.log('Got current user:', currentUser);

      const attributes = await fetchUserAttributes();
      console.log('Got user attributes:', attributes);

      setUser({
        id: currentUser.userId,
        email: attributes.email || '',
        emailVerified: attributes.email_verified === 'true',
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        phoneNumber: attributes.phone_number,
      });
    } catch (error: any) {
      console.error('Check user error:', error);
      setUser(null);
      if (throwOnError) {
        throw error; // Re-throw so we can handle it in completeNewPassword
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const signInInput: SignInInput = {
        username: email,
        password,
      };

      const result = await amplifySignIn(signInInput);
      console.log('Sign in result:', result);

      // Check if password change is required
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        throw new Error('PASSWORD_CHANGE_REQUIRED');
      }

      // Give Cognito a moment to establish the session
      await new Promise(resolve => setTimeout(resolve, 500));

      // Explicitly fetch the auth session to ensure it's established
      console.log('Fetching auth session...');
      const session = await fetchAuthSession({ forceRefresh: true });
      console.log('Auth session:', session);

      // Wait a bit more for session propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Retry checkUser a few times if it fails
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          await checkUser(true); // Throw errors so we can retry
          return; // Success!
        } catch (error: any) {
          lastError = error;
          console.log(`Sign in - Attempt ${4 - retries} failed, retrying...`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If all retries failed, throw the last error
      throw lastError;
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message === 'PASSWORD_CHANGE_REQUIRED') {
        throw error;
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    givenName?: string,
    familyName?: string
  ) => {
    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...(givenName && { given_name: givenName }),
            ...(familyName && { family_name: familyName }),
          },
        },
      };

      await amplifySignUp(signUpInput);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const confirmSignUp = async (email: string, code: string) => {
    try {
      await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      throw new Error(error.message || 'Failed to confirm sign up');
    }
  };

  const completeNewPassword = async (newPassword: string) => {
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      console.log('Password change result:', result);

      // Give Cognito a moment to establish the session
      await new Promise(resolve => setTimeout(resolve, 500));

      // Explicitly fetch the auth session to ensure it's established
      console.log('Fetching auth session...');
      const session = await fetchAuthSession({ forceRefresh: true });
      console.log('Auth session:', session);

      // Wait a bit more for session propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Retry checkUser a few times if it fails
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          await checkUser(true); // Throw errors so we can retry
          return; // Success!
        } catch (error: any) {
          lastError = error;
          console.log(`Attempt ${4 - retries} failed, retrying...`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If all retries failed, throw the last error
      throw lastError;
    } catch (error: any) {
      console.error('Complete new password error:', error);
      throw new Error(error.message || 'Failed to set new password');
    }
  };

  const updateUserPassword = async (oldPassword: string, newPassword: string) => {
    try {
      await updatePassword({ oldPassword, newPassword });
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await resetPassword({ username: email });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw new Error(error.message || 'Failed to initiate password reset');
    }
  };

  const confirmForgotPassword = async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    } catch (error: any) {
      console.error('Confirm forgot password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const refreshUser = async () => {
    await checkUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        confirmSignUp,
        completeNewPassword,
        updateUserPassword,
        forgotPassword,
        confirmForgotPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
