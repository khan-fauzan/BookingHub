import { Amplify } from 'aws-amplify';

export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace('https://', '') || '',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          ],
          redirectSignOut: [
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          ],
          responseType: 'code',
        },
        email: true,
      },
    },
  },
};

// Configure Amplify
if (typeof window !== 'undefined') {
  Amplify.configure(amplifyConfig, { ssr: true });
}

export default amplifyConfig;
