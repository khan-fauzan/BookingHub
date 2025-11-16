// Test script to verify Cognito configuration
require('dotenv').config({ path: '.env.local' });

console.log('=== Cognito Configuration Test ===\n');

console.log('Environment Variables:');
console.log('NEXT_PUBLIC_AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION);
console.log('NEXT_PUBLIC_COGNITO_USER_POOL_ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log('NEXT_PUBLIC_COGNITO_CLIENT_ID:', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
console.log('NEXT_PUBLIC_COGNITO_DOMAIN:', process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
console.log('\n');

// Check if all required variables are set
const missing = [];
if (!process.env.NEXT_PUBLIC_AWS_REGION) missing.push('NEXT_PUBLIC_AWS_REGION');
if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) missing.push('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
if (!process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) missing.push('NEXT_PUBLIC_COGNITO_CLIENT_ID');
if (!process.env.NEXT_PUBLIC_COGNITO_DOMAIN) missing.push('NEXT_PUBLIC_COGNITO_DOMAIN');

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
} else {
  console.log('✅ All environment variables are set\n');
}

// Test AWS SDK
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION
});

async function testCognito() {
  try {
    console.log('Testing Cognito User Pool access...');

    const command = new AdminGetUserCommand({
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      Username: 'admin@hotelbooking.com'
    });

    const response = await client.send(command);
    console.log('✅ Successfully connected to Cognito User Pool');
    console.log('✅ User exists:', response.Username);
    console.log('✅ User status:', response.UserStatus);
    console.log('\nUser Attributes:');
    response.UserAttributes.forEach(attr => {
      console.log(`  - ${attr.Name}: ${attr.Value}`);
    });
  } catch (error) {
    console.error('❌ Error connecting to Cognito:', error.message);
    if (error.name === 'UserNotFoundException') {
      console.log('\n⚠️  User not found. This is expected if you haven\'t logged in yet.');
    }
  }
}

testCognito();
