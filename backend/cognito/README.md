# Backend Infrastructure - Cognito User Pool

This directory contains the AWS CloudFormation template for setting up the authentication infrastructure using Amazon Cognito.

## What's Included

The CloudFormation stack (`cognito-stack.yaml`) creates:

1. **Cognito User Pool** with:
   - Email-based authentication
   - Password policy (8+ chars, uppercase, lowercase, numbers, symbols)
   - Optional MFA support
   - Email verification
   - Advanced security features in audit mode
   - Deletion protection enabled

2. **Cognito User Pool Web Client** with:
   - OAuth 2.0 flows enabled (authorization code and implicit)
   - Refresh token validity: 30 days
   - Access token validity: 60 minutes
   - ID token validity: 60 minutes
   - Support for user password authentication

3. **User Pool Domain** for hosted UI

4. **Initial Admin User** with:
   - Email: `admin@hotelbooking.com`
   - Auto-generated secure password (printed as output)
   - User will be required to change password on first login

5. **Lambda Function** to set the initial user password securely

## Prerequisites

- AWS CLI installed and configured
- AWS account with appropriate permissions
- AWS credentials configured locally

## Deployment

### Option 1: Using AWS CLI

```bash
# Navigate to the backend directory
cd backend

# Deploy the stack
aws cloudformation create-stack \
  --stack-name hotel-booking-cognito \
  --template-body file://cognito-stack.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=AppName,ParameterValue=HotelBookingPlatform

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name hotel-booking-cognito

# Get the outputs (including the initial password)
aws cloudformation describe-stacks \
  --stack-name hotel-booking-cognito \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Option 2: Using AWS Console

1. Go to AWS CloudFormation Console
2. Click "Create Stack" → "With new resources"
3. Upload the `cognito-stack.yaml` file
4. Enter stack name: `hotel-booking-cognito`
5. Review parameters (or use defaults)
6. Check "I acknowledge that AWS CloudFormation might create IAM resources"
7. Click "Create Stack"
8. Wait for creation to complete
9. Check the "Outputs" tab for:
   - User Pool ID
   - Web Client ID
   - Domain URL
   - **Initial User Password**

## Stack Outputs

After successful deployment, you'll get these outputs:

| Output | Description | Usage |
|--------|-------------|-------|
| `UserPoolId` | Cognito User Pool ID | Use in your application config |
| `UserPoolWebClientId` | Web Client ID | Use in your frontend auth config |
| `UserPoolDomain` | Hosted UI domain URL | For testing authentication flows |
| `InitialUsername` | Admin user email | Login: `admin@hotelbooking.com` |
| `InitialUserPassword` | Generated password | **SAVE THIS - Change on first login** |
| `CognitoHostedUIUrl` | Direct link to hosted UI | For quick testing |
| `Region` | AWS Region | Where resources are deployed |

## Important Security Notes

⚠️ **IMPORTANT**:
- The initial password is displayed in CloudFormation outputs
- Save the password immediately after stack creation
- Change the password on first login
- For production, consider using AWS Secrets Manager to store credentials
- Update the callback URLs in the template before production deployment

## Updating the Stack

```bash
aws cloudformation update-stack \
  --stack-name hotel-booking-cognito \
  --template-body file://cognito-stack.yaml \
  --capabilities CAPABILITY_IAM
```

## Deleting the Stack

```bash
# Note: This will delete all users and authentication data
aws cloudformation delete-stack \
  --stack-name hotel-booking-cognito
```

## Integration with Frontend

After deployment, add these values to your frontend `.env.local`:

```bash
# Get these from CloudFormation outputs
NEXT_PUBLIC_AWS_REGION=us-east-1  # Your AWS region
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=https://hotelbookingplatform-123456789.auth.us-east-1.amazoncognito.com
```

## Testing Authentication

### Using Hosted UI

1. Get the `CognitoHostedUIUrl` from stack outputs
2. Open the URL in your browser
3. Sign in with:
   - Username: `admin@hotelbooking.com`
   - Password: (from stack outputs)
4. You'll be prompted to change the password

### Using AWS CLI

```bash
# Test user authentication
aws cognito-idp admin-initiate-auth \
  --user-pool-id <UserPoolId> \
  --client-id <UserPoolWebClientId> \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@hotelbooking.com,PASSWORD=<initial-password>
```

## Customization

To customize the stack, modify these sections in `cognito-stack.yaml`:

- **Password Policy**: Update `Policies.PasswordPolicy`
- **MFA Settings**: Change `MfaConfiguration` (OFF, OPTIONAL, ON)
- **Callback URLs**: Update `CallbackURLs` for your domain
- **Token Validity**: Adjust `RefreshTokenValidity`, `AccessTokenValidity`, `IdTokenValidity`
- **User Attributes**: Modify `Schema` section

## Troubleshooting

### Stack Creation Failed

- Check IAM permissions (need Lambda and Cognito permissions)
- Verify the domain name is unique (uses account ID for uniqueness)
- Check CloudWatch Logs for Lambda function errors

### Password Not in Outputs

- The password is generated by the Lambda function during stack creation
- Check the `SetInitialPassword` custom resource in CloudFormation events
- Check Lambda function logs in CloudWatch

### User Pool Domain Already Exists

- User pool domains must be globally unique
- The template uses `${AppName}-${AWS::AccountId}` for uniqueness
- Change the `AppName` parameter if needed

## Cost Considerations

- Cognito User Pool: Free tier includes 50,000 MAU (Monthly Active Users)
- Lambda: Minimal cost for one-time password generation
- CloudWatch Logs: Minimal cost for Lambda logs

## Next Steps

1. Save the initial password from CloudFormation outputs
2. Test authentication using the hosted UI
3. Integrate Cognito with your Next.js frontend using AWS Amplify or similar library
4. Set up additional users through the AWS Console or API
5. Configure social identity providers (Google, Facebook) if needed

## Support

For AWS Cognito documentation:
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [CloudFormation Cognito Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html)
