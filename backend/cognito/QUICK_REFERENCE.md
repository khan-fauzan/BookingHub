# Quick Reference Guide - AWS Cognito Operations

## Deployment Commands

### Deploy the Stack
```bash
# Basic deployment
./deploy.sh

# Custom stack name and app name
./deploy.sh my-stack-name MyAppName

# Or manually with AWS CLI
aws cloudformation create-stack \
  --stack-name hotel-booking-cognito \
  --template-body file://cognito-stack.yaml \
  --capabilities CAPABILITY_IAM
```

### Get Stack Outputs
```bash
# Using the helper script
./get-outputs.sh

# Or manually
aws cloudformation describe-stacks \
  --stack-name hotel-booking-cognito \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Delete the Stack
```bash
aws cloudformation delete-stack --stack-name hotel-booking-cognito
```

## User Management

### Create a New User
```bash
USER_POOL_ID="your-user-pool-id"

aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS
```

### Set User Password
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --password "NewPassword123!" \
  --permanent
```

### List All Users
```bash
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --output table
```

### Delete a User
```bash
aws cognito-idp admin-delete-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

### Get User Details
```bash
aws cognito-idp admin-get-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

### Enable/Disable User
```bash
# Disable
aws cognito-idp admin-disable-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com

# Enable
aws cognito-idp admin-enable-user \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

## Authentication Testing

### Test User Authentication
```bash
USER_POOL_ID="your-user-pool-id"
CLIENT_ID="your-client-id"

# Initiate auth
aws cognito-idp admin-initiate-auth \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@hotelbooking.com,PASSWORD=YourPassword123!
```

### Verify Token
```bash
ACCESS_TOKEN="your-access-token"

aws cognito-idp get-user \
  --access-token $ACCESS_TOKEN
```

### Refresh Token
```bash
REFRESH_TOKEN="your-refresh-token"

aws cognito-idp initiate-auth \
  --client-id $CLIENT_ID \
  --auth-flow REFRESH_TOKEN_AUTH \
  --auth-parameters REFRESH_TOKEN=$REFRESH_TOKEN
```

## Password Management

### Reset User Password (Admin)
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --password "NewPassword123!" \
  --permanent
```

### Force Password Change
```bash
aws cognito-idp admin-reset-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

### Update User Attributes
```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --user-attributes \
    Name=given_name,Value=John \
    Name=family_name,Value=Doe \
    Name=phone_number,Value=+1234567890
```

## User Pool Configuration

### Get User Pool Details
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID
```

### Get User Pool Client Details
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID
```

### List User Pool Clients
```bash
aws cognito-idp list-user-pool-clients \
  --user-pool-id $USER_POOL_ID
```

## Group Management

### Create User Group
```bash
aws cognito-idp create-group \
  --group-name Admins \
  --user-pool-id $USER_POOL_ID \
  --description "Administrator users"
```

### Add User to Group
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --group-name Admins
```

### Remove User from Group
```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com \
  --group-name Admins
```

### List Groups
```bash
aws cognito-idp list-groups \
  --user-pool-id $USER_POOL_ID
```

### List Users in Group
```bash
aws cognito-idp list-users-in-group \
  --user-pool-id $USER_POOL_ID \
  --group-name Admins
```

## Monitoring and Logs

### View CloudFormation Events
```bash
aws cloudformation describe-stack-events \
  --stack-name hotel-booking-cognito \
  --max-items 20
```

### Check Lambda Logs
```bash
# Get log group name
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/HotelBookingPlatform

# View recent logs
aws logs tail /aws/lambda/HotelBookingPlatform-SetPassword --follow
```

### Get Cognito Metrics
```bash
# This requires CloudWatch Logs enabled
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name UserAuthentication \
  --dimensions Name=UserPool,Value=$USER_POOL_ID \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting

### Check Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-cognito \
  --query 'Stacks[0].StackStatus' \
  --output text
```

### View Stack Failure Reason
```bash
aws cloudformation describe-stack-events \
  --stack-name hotel-booking-cognito \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`]' \
  --output table
```

### Validate CloudFormation Template
```bash
aws cloudformation validate-template \
  --template-body file://cognito-stack.yaml
```

### Test Cognito Hosted UI
```bash
# Get the hosted UI URL from stack outputs
HOSTED_UI_URL=$(aws cloudformation describe-stacks \
  --stack-name hotel-booking-cognito \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoHostedUIUrl`].OutputValue' \
  --output text)

echo "Open this URL in your browser:"
echo $HOSTED_UI_URL
```

## Common Issues and Solutions

### Issue: "User does not exist"
**Solution**: Check if the user was created successfully
```bash
aws cognito-idp list-users --user-pool-id $USER_POOL_ID
```

### Issue: "Password does not conform to policy"
**Solution**: Check password policy requirements
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --query 'UserPool.Policies.PasswordPolicy'
```

### Issue: "Access token has expired"
**Solution**: Use refresh token to get new tokens
```bash
aws cognito-idp initiate-auth \
  --client-id $CLIENT_ID \
  --auth-flow REFRESH_TOKEN_AUTH \
  --auth-parameters REFRESH_TOKEN=$REFRESH_TOKEN
```

### Issue: "User is not confirmed"
**Solution**: Confirm user manually
```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

## Environment Setup Helper

Save stack outputs to environment variables:

```bash
# Run this after deployment
eval $(./get-outputs.sh | grep "NEXT_PUBLIC" | sed 's/^/export /')

# Verify
echo "User Pool ID: $NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "Client ID: $NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo "Region: $NEXT_PUBLIC_AWS_REGION"
```

## Backup and Export

### Export User Pool Users (for migration)
```bash
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --output json > users-backup.json
```

### Export User Pool Configuration
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --output json > user-pool-config.json
```

## Cost Optimization

### Monitor User Pool Usage
```bash
# Get user count
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --query 'length(Users)'

# Check MAU (Monthly Active Users) in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Cognito \
  --metric-name MonthlyActiveUsers \
  --dimensions Name=UserPool,Value=$USER_POOL_ID \
  --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum
```

## Security Best Practices

1. **Rotate Credentials Regularly**
```bash
# Force all users to change password
aws cognito-idp admin-reset-user-password \
  --user-pool-id $USER_POOL_ID \
  --username user@example.com
```

2. **Enable MFA for Admin Users**
```bash
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id $USER_POOL_ID \
  --username admin@hotelbooking.com \
  --software-token-mfa-settings Enabled=true,PreferredMfa=true
```

3. **Monitor Failed Login Attempts**
```bash
# Check CloudWatch Logs for failed authentications
aws logs filter-log-events \
  --log-group-name /aws/cognito/userpools/$USER_POOL_ID \
  --filter-pattern "failed"
```

## Useful Links

- [AWS Cognito User Pool CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/)
- [CloudFormation Cognito Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html)
- [Cognito Authentication Flow](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html)
- [Cognito JWT Token Verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html)
