# Hotel Booking Platform - API Deployment Guide

This guide provides step-by-step instructions for deploying the API Gateway and Lambda functions for the Hotel Booking Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Steps](#deployment-steps)
4. [Lambda Function Deployment](#lambda-function-deployment)
5. [Testing the API](#testing-the-api)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Troubleshooting](#troubleshooting)
8. [API Endpoints](#api-endpoints)

---

## Prerequisites

### Required Tools

- **AWS CLI** (v2.0+)
  ```bash
  aws --version
  # aws-cli/2.x.x or higher
  ```

- **Node.js** (v20.x)
  ```bash
  node --version
  # v20.x.x
  ```

- **npm** (v10.x)
  ```bash
  npm --version
  # 10.x.x
  ```

### AWS Permissions

Your IAM user/role must have permissions for:
- API Gateway (create, update, delete APIs)
- Lambda (create, update functions)
- IAM (create roles and policies)
- CloudFormation (create, update stacks)
- CloudWatch Logs (create log groups)
- DynamoDB (read/write access)

### Required Infrastructure

The DynamoDB backend must be deployed first:

```bash
# Verify DynamoDB stack exists
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1
```

If not deployed, follow the DynamoDB deployment guide first:
```bash
cd backend/dynamodb
./deploy.sh dev
```

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (REST API)                   │
│                                                              │
│  /properties/search                 /bookings                │
│  /properties/{id}                   /bookings/{id}           │
│  /properties/featured               /users/me                │
│  /availability/check                /reviews                 │
│  /pricing/calculate                 ...                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lambda Functions                          │
│                                                              │
│  • search-properties        • create-booking                 │
│  • get-property             • get-user-bookings              │
│  • get-featured-properties  • cancel-booking                 │
│  • check-availability       • get-user-profile               │
│  • calculate-pricing        • update-user-profile            │
│  • get-property-reviews     • create-review                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB Tables                         │
│                                                              │
│  • Properties         • Bookings                             │
│  • Availability       • Users                                │
│  • Reviews            • Metadata                             │
└─────────────────────────────────────────────────────────────┘
```

### Lambda Functions

| Function | HTTP Method | Endpoint | Auth Required |
|----------|-------------|----------|---------------|
| search-properties | GET | /properties/search | No |
| get-property | GET | /properties/{propertyId} | No |
| get-featured-properties | GET | /properties/featured | No |
| check-availability | POST | /availability/check | No |
| calculate-pricing | POST | /pricing/calculate | No |
| create-booking | POST | /bookings | Yes* |
| get-user-bookings | GET | /users/me/bookings | Yes |
| cancel-booking | DELETE | /bookings/{bookingId} | Yes |
| get-user-profile | GET | /users/me | Yes |
| update-user-profile | PATCH | /users/me | Yes |
| get-property-reviews | GET | /properties/{propertyId}/reviews | No |
| create-review | POST | /reviews | Yes |

*Auth optional for create-booking - can be used by guest users

---

## Deployment Steps

### Step 1: Configure Parameters

The deployment uses environment-specific parameter files. Review and update if needed:

**Development (`parameters-dev.json`):**
```json
{
  "Environment": "dev",
  "ApiStageName": "v1",
  "DynamoDBStackName": "hotel-booking-dynamodb-dev",
  "CognitoUserPoolArn": "",
  "EnableCORS": "true",
  "LogRetentionDays": "7"
}
```

**Staging (`parameters-staging.json`):**
```json
{
  "Environment": "staging",
  "ApiStageName": "v1",
  "DynamoDBStackName": "hotel-booking-dynamodb-staging",
  "CognitoUserPoolArn": "",
  "EnableCORS": "true",
  "LogRetentionDays": "30"
}
```

**Production (`parameters-prod.json`):**
```json
{
  "Environment": "prod",
  "ApiStageName": "v1",
  "DynamoDBStackName": "hotel-booking-dynamodb-prod",
  "CognitoUserPoolArn": "arn:aws:cognito-idp:REGION:ACCOUNT:userpool/POOL_ID",
  "EnableCORS": "true",
  "LogRetentionDays": "90"
}
```

### Step 2: Validate CloudFormation Template

Before deploying, validate the template:

```bash
cd backend/api

aws cloudformation validate-template \
  --template-body file://cloudformation-api-gateway.yaml \
  --region us-east-1
```

### Step 3: Deploy API Gateway Stack

Deploy using the automated script:

```bash
# Deploy to development
./deploy-api.sh dev

# Deploy to staging
./deploy-api.sh staging us-west-2

# Deploy to production (requires confirmation)
./deploy-api.sh prod us-east-1
```

Or deploy manually using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name hotel-booking-api-dev \
  --template-body file://cloudformation-api-gateway.yaml \
  --parameters file://parameters-dev.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name hotel-booking-api-dev \
  --region us-east-1
```

### Step 4: Get API Endpoint

After deployment, retrieve the API endpoint:

```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-api-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

Example output:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/v1
```

---

## Lambda Function Deployment

The CloudFormation template creates Lambda functions with placeholder code. To deploy your actual implementation:

### Option 1: Update Functions Manually

For each function, create a deployment package and update:

```bash
cd functions/search-properties

# Install dependencies
npm install

# Create deployment package
zip -r function.zip index.js node_modules/

# Update Lambda function
aws lambda update-function-code \
  --function-name hotel-booking-search-properties-dev \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Option 2: Automated Deployment Script

Create a script to update all functions:

```bash
#!/bin/bash
# update-functions.sh

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

FUNCTIONS=(
  "search-properties"
  "get-property"
  "get-featured-properties"
  "check-availability"
  "calculate-pricing"
  "create-booking"
  "get-user-bookings"
  "cancel-booking"
  "get-user-profile"
  "update-user-profile"
  "get-property-reviews"
  "create-review"
)

for func in "${FUNCTIONS[@]}"; do
  echo "Updating $func..."

  cd functions/$func

  # Install dependencies
  npm install --production

  # Copy shared utilities
  cp -r ../shared .

  # Create deployment package
  zip -r function.zip index.js shared/ node_modules/

  # Update Lambda
  aws lambda update-function-code \
    --function-name hotel-booking-${func}-${ENVIRONMENT} \
    --zip-file fileb://function.zip \
    --region ${REGION}

  # Clean up
  rm function.zip
  rm -rf shared node_modules

  cd ../..
done

echo "All functions updated!"
```

Make it executable and run:

```bash
chmod +x update-functions.sh
./update-functions.sh dev us-east-1
```

### Option 3: Lambda Layers (Recommended)

Create a Lambda Layer for shared dependencies:

```bash
cd functions

# Create layer structure
mkdir -p layer/nodejs/node_modules

# Install dependencies
npm install --prefix layer/nodejs

# Copy shared utilities
cp -r shared layer/nodejs/

# Create layer package
cd layer
zip -r ../shared-layer.zip .
cd ..

# Publish layer
aws lambda publish-layer-version \
  --layer-name hotel-booking-shared-layer \
  --zip-file fileb://shared-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region us-east-1
```

Then update each Lambda function to use the layer:

```bash
aws lambda update-function-configuration \
  --function-name hotel-booking-search-properties-dev \
  --layers arn:aws:lambda:us-east-1:ACCOUNT_ID:layer:hotel-booking-shared-layer:1 \
  --region us-east-1
```

---

## Testing the API

### Using cURL

#### Search Properties

```bash
curl "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1/properties/search?city=New%20York&checkIn=2025-02-01&checkOut=2025-02-05&adults=2"
```

#### Get Property Details

```bash
curl "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1/properties/prop_ny_001"
```

#### Check Availability

```bash
curl -X POST "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1/availability/check" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "prop_ny_001",
    "roomTypeId": "room_001",
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "rooms": 1
  }'
```

#### Create Booking

```bash
curl -X POST "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyId": "prop_ny_001",
    "roomTypeId": "room_001",
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "adults": 2,
    "children": 0,
    "rooms": 1,
    "guest": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "payment": {
      "method": "credit_card",
      "token": "tok_test_123"
    }
  }'
```

### Using Postman

Import the API into Postman:

1. Open Postman
2. Import > Link
3. Enter: `https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1`
4. Create requests for each endpoint

### Automated Testing

Create a test suite using Jest:

```bash
cd functions
npm install --save-dev jest @types/jest
```

Example test file (`__tests__/search-properties.test.js`):

```javascript
const { handler } = require('../search-properties/index');

describe('Search Properties', () => {
  it('should search properties by city', async () => {
    const event = {
      queryStringParameters: {
        city: 'New York',
        checkIn: '2025-02-01',
        checkOut: '2025-02-05'
      }
    };

    const result = await handler(event, {});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.properties).toBeDefined();
  });
});
```

---

## Monitoring and Logging

### CloudWatch Logs

Each Lambda function logs to CloudWatch:

```bash
# View logs for search-properties function
aws logs tail /aws/lambda/hotel-booking-search-properties-dev --follow
```

### API Gateway Logs

View API Gateway access logs:

```bash
aws logs tail /aws/apigateway/hotel-booking-dev --follow
```

### CloudWatch Metrics

Monitor key metrics:

- **API Gateway**: Request count, latency, 4xx/5xx errors
- **Lambda**: Invocations, duration, errors, throttles
- **DynamoDB**: Consumed read/write capacity, throttled requests

Create CloudWatch Dashboard:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name hotel-booking-api-dev \
  --dashboard-body file://dashboard-config.json
```

### X-Ray Tracing

Enable X-Ray for distributed tracing:

```bash
aws lambda update-function-configuration \
  --function-name hotel-booking-search-properties-dev \
  --tracing-config Mode=Active \
  --region us-east-1
```

---

## Troubleshooting

### Common Issues

#### 1. Stack Creation Fails

**Error**: "DynamoDB stack not found"

**Solution**: Deploy DynamoDB stack first
```bash
cd backend/dynamodb
./deploy.sh dev
```

#### 2. Lambda Function Timeout

**Error**: "Task timed out after 30.00 seconds"

**Solution**: Increase timeout in CloudFormation template
```yaml
Timeout: 60  # Increase from 30 to 60 seconds
```

#### 3. DynamoDB Access Denied

**Error**: "User is not authorized to perform: dynamodb:Query"

**Solution**: Verify IAM role has correct permissions in CloudFormation template

#### 4. CORS Issues

**Error**: "No 'Access-Control-Allow-Origin' header"

**Solution**: Ensure EnableCORS parameter is set to 'true'

#### 5. API Rate Limiting

**Error**: "Rate exceeded"

**Solution**: Check usage plan limits in CloudFormation template

### Debug Mode

Enable debug logging:

```bash
# Update Lambda environment variable
aws lambda update-function-configuration \
  --function-name hotel-booking-search-properties-dev \
  --environment Variables={LOG_LEVEL=DEBUG} \
  --region us-east-1
```

### Stack Rollback

If deployment fails, rollback:

```bash
aws cloudformation delete-stack \
  --stack-name hotel-booking-api-dev \
  --region us-east-1
```

---

## API Endpoints

### Complete Endpoint Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/properties/search` | GET | No | Search properties with filters |
| `/properties/{propertyId}` | GET | No | Get property details |
| `/properties/featured` | GET | No | Get featured properties |
| `/availability/check` | POST | No | Check room availability |
| `/pricing/calculate` | POST | No | Calculate booking price |
| `/bookings` | POST | Optional | Create new booking |
| `/bookings/{bookingId}` | DELETE | Yes | Cancel booking |
| `/users/me` | GET | Yes | Get user profile |
| `/users/me` | PATCH | Yes | Update user profile |
| `/users/me/bookings` | GET | Yes | Get user bookings |
| `/properties/{propertyId}/reviews` | GET | No | Get property reviews |
| `/reviews` | POST | Yes | Create review |

For detailed request/response schemas, see [API_SPECIFICATIONS.md](API_SPECIFICATIONS.md).

---

## Next Steps

1. **Deploy Lambda Function Code**: Update all Lambda functions with actual implementation
2. **Set up Cognito**: Configure user authentication
3. **Configure Custom Domain**: Set up custom domain for API Gateway
4. **Set up CI/CD**: Automate deployment with GitHub Actions or AWS CodePipeline
5. **Performance Testing**: Load test the API with realistic traffic
6. **Security Hardening**: Enable WAF, implement API keys, set up rate limiting
7. **Documentation**: Generate API documentation with Swagger/OpenAPI

---

## Support

For issues or questions:
- Review CloudWatch Logs
- Check CloudFormation stack events
- Refer to [API_SPECIFICATIONS.md](API_SPECIFICATIONS.md)
- Review [DYNAMODB_SCHEMA.md](../dynamodb/DYNAMODB_SCHEMA.md)
