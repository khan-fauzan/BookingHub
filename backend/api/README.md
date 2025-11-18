# Hotel Booking Platform - API Gateway Backend

REST API implementation using Amazon API Gateway and AWS Lambda for the Hotel Booking Platform.

## 📁 Directory Structure

```
backend/api/
├── cloudformation-api-gateway.yaml    # CloudFormation template for API Gateway
├── deploy-api.sh                      # Automated deployment script
├── parameters-dev.json                # Development environment parameters
├── parameters-staging.json            # Staging environment parameters
├── parameters-prod.json               # Production environment parameters
├── API_SPECIFICATIONS.md              # Complete API specifications
├── API_DEPLOYMENT_GUIDE.md            # Deployment guide
├── README.md                          # This file
└── functions/                         # Lambda function implementations
    ├── package.json                   # Shared dependencies
    ├── shared/
    │   └── utils.js                   # Shared utilities and helpers
    ├── search-properties/
    │   └── index.js                   # Property search handler
    ├── get-property/
    │   └── index.js                   # Get property details handler
    ├── get-featured-properties/
    │   └── index.js                   # Featured properties handler
    ├── check-availability/
    │   └── index.js                   # Availability check handler
    ├── calculate-pricing/
    │   └── index.js                   # Pricing calculation handler
    ├── create-booking/
    │   └── index.js                   # Create booking handler
    ├── get-user-bookings/
    │   └── index.js                   # User bookings handler
    ├── cancel-booking/
    │   └── index.js                   # Cancel booking handler
    ├── get-user-profile/
    │   └── index.js                   # Get user profile handler
    ├── update-user-profile/
    │   └── index.js                   # Update user profile handler
    ├── get-property-reviews/
    │   └── index.js                   # Get reviews handler
    └── create-review/
        └── index.js                   # Create review handler
```

## 🚀 Quick Start

### Prerequisites

1. **DynamoDB Backend**: Must be deployed first
   ```bash
   cd ../dynamodb
   ./deploy.sh dev
   ```

2. **AWS CLI**: Configured with appropriate credentials
   ```bash
   aws configure
   ```

3. **Node.js 20.x**: For Lambda functions
   ```bash
   node --version  # v20.x.x
   ```

### Deploy API Gateway

```bash
# Deploy to development
./deploy-api.sh dev

# Deploy to staging
./deploy-api.sh staging us-west-2

# Deploy to production
./deploy-api.sh prod us-east-1
```

### Install Lambda Dependencies

```bash
cd functions
npm install
```

## 📊 Architecture

### API Gateway + Lambda

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │
│   (REST API)        │
│                     │
│   - CORS Enabled    │
│   - Rate Limiting   │
│   - Auth (Cognito)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Lambda Functions   │
│                     │
│  12 Functions:      │
│  - Properties (3)   │
│  - Availability (2) │
│  - Bookings (3)     │
│  - Users (2)        │
│  - Reviews (2)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  DynamoDB Tables    │
│                     │
│  - Properties       │
│  - Availability     │
│  - Bookings         │
│  - Users            │
│  - Reviews          │
│  - Metadata         │
└─────────────────────┘
```

## 📝 API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties/search` | Search properties |
| GET | `/properties/{id}` | Get property details |
| GET | `/properties/featured` | Get featured properties |
| POST | `/availability/check` | Check room availability |
| POST | `/pricing/calculate` | Calculate booking price |
| GET | `/properties/{id}/reviews` | Get property reviews |

### Protected Endpoints (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create new booking |
| GET | `/users/me/bookings` | Get user's bookings |
| DELETE | `/bookings/{id}` | Cancel booking |
| GET | `/users/me` | Get user profile |
| PATCH | `/users/me` | Update user profile |
| POST | `/reviews` | Create review |

## 🔧 Lambda Functions

### 1. Search Properties
**File**: `functions/search-properties/index.js`
**Endpoint**: `GET /properties/search`
**Features**:
- City, country, lat/lng search
- Date-based availability filtering
- Price, star rating, property type filters
- Amenities filtering
- Multiple sort options (recommended, price, rating)
- Pagination support

### 2. Get Property
**File**: `functions/get-property/index.js`
**Endpoint**: `GET /properties/{propertyId}`
**Features**:
- Complete property details
- All room types with pricing
- Image gallery by category
- Policies and amenities
- Owner information

### 3. Check Availability
**File**: `functions/check-availability/index.js`
**Endpoint**: `POST /availability/check`
**Features**:
- Real-time availability checking
- Daily availability breakdown
- Dynamic pricing by date
- Multi-room support

### 4. Create Booking
**File**: `functions/create-booking/index.js`
**Endpoint**: `POST /bookings`
**Features**:
- DynamoDB transactions for atomicity
- Availability decrement
- Payment processing integration
- Booking reference generation
- Email confirmation (integration point)

### 5. Cancel Booking
**File**: `functions/cancel-booking/index.js`
**Endpoint**: `DELETE /bookings/{bookingId}`
**Features**:
- Cancellation policy enforcement
- Refund calculation
- Availability restoration
- Transaction-based updates

### Additional Functions

- **Get Featured Properties**: Curated property listings
- **Calculate Pricing**: Detailed price breakdown with taxes/fees
- **Get User Bookings**: User's booking history with filters
- **Get/Update User Profile**: User account management
- **Get/Create Reviews**: Review management system

## 🛠️ Shared Utilities

**File**: `functions/shared/utils.js`

### DynamoDB Operations
- `queryDynamoDB()` - Query with error handling
- `getItem()` - Get single item
- `putItem()` - Put single item
- `updateItem()` - Update item
- `transactWrite()` - Transaction support

### Response Helpers
- `successResponse()` - Standardized success response
- `errorResponse()` - Standardized error response

### Validation Helpers
- `validateRequired()` - Required field validation
- `validateDateRange()` - Date range validation
- `parseQueryParams()` - Parse query string
- `parseBody()` - Parse request body
- `getUserId()` - Extract user ID from context

### Utility Functions
- `getDatesBetween()` - Generate date array
- `calculateDistance()` - Haversine distance calculation

### Custom Error Classes
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `DatabaseError` (500)

### Error Handler
- `handleErrors()` - Wrapper for Lambda error handling

## 📦 Dependencies

```json
{
  "@aws-sdk/client-dynamodb": "^3.700.0",
  "@aws-sdk/lib-dynamodb": "^3.700.0",
  "@aws-sdk/util-dynamodb": "^3.700.0",
  "uuid": "^11.0.3"
}
```

## 🔐 Security Features

### API Gateway Level
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Request throttling per usage plan
  - Anonymous: 100 req/sec, 10K per day
  - Authenticated: 500 req/sec, 50K per day
- **Authorization**: Cognito User Pool integration
- **Request Validation**: Schema-based validation

### Lambda Level
- **Input Validation**: Zod-like validation with custom classes
- **SQL Injection Prevention**: Parameterized DynamoDB queries
- **Authentication Checks**: User context verification
- **Authorization**: Resource ownership validation

### DynamoDB Level
- **Encryption at Rest**: KMS encryption (from DynamoDB stack)
- **Conditional Writes**: Prevent race conditions
- **Transactions**: ACID compliance for bookings

## 🧪 Testing

### Local Testing

```bash
# Test a Lambda function locally
cd functions/search-properties
node -e "
const { handler } = require('./index');
handler({
  queryStringParameters: {
    city: 'New York',
    checkIn: '2025-02-01',
    checkOut: '2025-02-05'
  }
}, { requestId: 'test-123' }).then(console.log);
"
```

### Integration Testing

```bash
# Test via API Gateway
API_URL="https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/v1"

# Search properties
curl "${API_URL}/properties/search?city=New%20York&checkIn=2025-02-01&checkOut=2025-02-05"

# Get property
curl "${API_URL}/properties/prop_ny_001"

# Check availability
curl -X POST "${API_URL}/availability/check" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"prop_ny_001","checkIn":"2025-02-01","checkOut":"2025-02-05"}'
```

## 📊 Monitoring

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/hotel-booking-search-properties-dev --follow

# View API Gateway logs
aws logs tail /aws/apigateway/hotel-booking-dev --follow
```

### CloudWatch Metrics

Key metrics to monitor:
- **API Gateway**: 4XX/5XX errors, latency, request count
- **Lambda**: Invocations, errors, duration, throttles
- **DynamoDB**: Consumed capacity, throttled requests

### X-Ray Tracing

Enable distributed tracing for debugging:
```bash
aws lambda update-function-configuration \
  --function-name hotel-booking-search-properties-dev \
  --tracing-config Mode=Active
```

## 🔄 CI/CD

### GitHub Actions Example

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'backend/api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Deploy Stack
        run: |
          cd backend/api
          ./deploy-api.sh prod us-east-1
```

## 📚 Documentation

- **[API_SPECIFICATIONS.md](API_SPECIFICATIONS.md)**: Complete API specifications with request/response schemas
- **[API_DEPLOYMENT_GUIDE.md](API_DEPLOYMENT_GUIDE.md)**: Comprehensive deployment guide
- **[../dynamodb/DYNAMODB_SCHEMA.md](../dynamodb/DYNAMODB_SCHEMA.md)**: DynamoDB schema documentation

## 🐛 Troubleshooting

### Common Issues

1. **"DynamoDB stack not found"**
   - Deploy DynamoDB stack first: `cd ../dynamodb && ./deploy.sh dev`

2. **"Lambda timeout"**
   - Increase timeout in CloudFormation template (default: 30s)

3. **"Access denied to DynamoDB"**
   - Verify IAM role permissions in CloudFormation template

4. **"CORS error"**
   - Check `EnableCORS` parameter is set to `true`

5. **"Rate limit exceeded"**
   - Check usage plan limits in CloudFormation template

### Debug Mode

Enable verbose logging:
```bash
export LOG_LEVEL=DEBUG
```

## 🔄 Updates and Maintenance

### Update Lambda Function Code

```bash
cd functions/search-properties

# Install dependencies
npm install --production

# Create deployment package
zip -r function.zip index.js node_modules/

# Update function
aws lambda update-function-code \
  --function-name hotel-booking-search-properties-dev \
  --zip-file fileb://function.zip
```

### Update API Gateway

```bash
# Update stack
./deploy-api.sh dev
```

## 📈 Performance Optimization

### Lambda Optimization
- **Provisioned Concurrency**: Pre-warm functions for critical endpoints
- **Memory Allocation**: Tune memory (256MB - 512MB typical)
- **Lambda Layers**: Share common dependencies

### DynamoDB Optimization
- **GSI Usage**: Use appropriate Global Secondary Indexes
- **Batch Operations**: Use batch operations where possible
- **Connection Pooling**: Reuse DynamoDB client connections

### API Gateway Optimization
- **Caching**: Enable response caching for read operations
- **Compression**: Enable response compression
- **Regional Endpoints**: Use Regional for better performance

## 🛡️ Security Checklist

- [ ] Enable AWS WAF on API Gateway
- [ ] Configure Cognito User Pool for authentication
- [ ] Set up API keys for partner integrations
- [ ] Enable CloudTrail for API Gateway
- [ ] Configure VPC endpoints for Lambda (if needed)
- [ ] Implement request signing for sensitive operations
- [ ] Set up security monitoring and alerts
- [ ] Regular security audits and penetration testing

## 📞 Support

For issues or questions:
1. Check CloudWatch Logs
2. Review CloudFormation stack events
3. Consult [API_DEPLOYMENT_GUIDE.md](API_DEPLOYMENT_GUIDE.md)
4. Review error responses for detailed error codes

## 📄 License

MIT License - See LICENSE file for details
