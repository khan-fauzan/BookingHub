# DynamoDB Infrastructure
## Hotel Booking Platform

This directory contains the complete DynamoDB database infrastructure for the Hotel Booking Platform, including schema specifications, CloudFormation templates, and deployment scripts.

---

## 📁 Directory Contents

### Documentation
| File | Description |
|------|-------------|
| `DYNAMODB_SCHEMA.md` | Complete database schema specification with all tables, GSIs, and access patterns |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide with examples and troubleshooting |
| `SEED_DATA_GUIDE.md` | Guide for generating and seeding sample data |
| `README.md` | This file - quick reference and overview |

### Infrastructure
| File | Description |
|------|-------------|
| `cloudformation-dynamodb.yaml` | CloudFormation template to provision all DynamoDB tables |
| `deploy.sh` | Bash script for easy deployment to AWS |
| `parameters-dev.json` | CloudFormation parameters for development environment |
| `parameters-staging.json` | CloudFormation parameters for staging environment |
| `parameters-prod.json` | CloudFormation parameters for production environment |

### Sample Data
| File | Description |
|------|-------------|
| `package.json` | Node.js dependencies for data generation and seeding |
| `generate-sample-data.js` | Script to generate realistic sample data for 10 cities |
| `seed-dynamodb.js` | Script to seed generated data into DynamoDB tables |
| `sample-data-full.json` | Generated sample data file (created after running generate script) |

---

## 🚀 Quick Start

### Prerequisites
- AWS CLI v2+ installed and configured
- AWS account with appropriate IAM permissions
- Node.js 18+ and npm (for sample data generation)
- Bash shell (for using deploy.sh)

### 1. Deploy DynamoDB Tables
```bash
# Using the deployment script (easiest)
./deploy.sh dev

# Or using AWS CLI directly
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters file://parameters-dev.json \
  --region us-east-1
```

### 2. Generate and Seed Sample Data
```bash
# Install dependencies
npm install

# Generate sample data for 10 popular cities
npm run generate

# Seed the development database
npm run seed:dev
```

**Sample Data Includes:**
- 50 properties across 10 cities (New York, Paris, London, Tokyo, Dubai, Barcelona, Los Angeles, Miami, Singapore, Rome)
- 150 room types with pricing
- 13,500 availability records (90 days)
- 100 users with loyalty programs
- 100-150 bookings with payments
- 65-100 guest reviews
- 22 amenities catalog
- 10 promotional codes

---

## 📊 Database Overview

### Tables Created
1. **Properties Table** - Property listings, room types, and images (6 GSIs)
2. **Availability Table** - Room availability and pricing (1 GSI)
3. **Bookings Table** - Reservations and payments (4 GSIs)
4. **Users Table** - User profiles and loyalty (1 GSI)
5. **Reviews Table** - Guest reviews and ratings (4 GSIs)
6. **Metadata Table** - Wishlists, amenities catalog, promo codes

### Total Global Secondary Indexes: 18

### Key Features
- ✅ Optimized partition keys for even distribution
- ✅ Strategic GSIs for all access patterns
- ✅ KMS encryption at rest
- ✅ Point-in-Time Recovery (PITR)
- ✅ DynamoDB Streams for Bookings and Reviews
- ✅ TTL configuration for Availability table
- ✅ On-demand billing by default

---

## 📖 Documentation

### Schema Documentation
See [`DYNAMODB_SCHEMA.md`](./DYNAMODB_SCHEMA.md) for:
- Detailed table schemas with examples
- All Global Secondary Indexes
- 25+ documented access patterns
- Search criteria and query examples
- Capacity planning guidance
- Data types and formats

### Deployment Documentation
See [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for:
- Prerequisites and IAM permissions
- Deployment commands for all environments
- Configuration parameters
- Verification steps
- Cost estimation
- Troubleshooting guide
- Cleanup procedures

---

## 🛠️ Configuration

### Environment Parameters

| Parameter | Dev | Staging | Prod |
|-----------|-----|---------|------|
| BillingMode | PAY_PER_REQUEST | PAY_PER_REQUEST | PAY_PER_REQUEST* |
| EnablePITR | false | true | true |
| EnableStreams | false | true | true |
| Capacity | N/A | N/A | N/A* |

\* Production can use PROVISIONED billing with auto-scaling for predictable workloads

### Modify Parameters
Edit the environment-specific parameter files:
- `parameters-dev.json`
- `parameters-staging.json`
- `parameters-prod.json`

---

## 🔍 Verification

### Check Deployment Status
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --query 'Stacks[0].StackStatus'
```

### List Tables
```bash
aws dynamodb list-tables \
  --query 'TableNames[?contains(@, `hotel-booking`)]'
```

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --query 'Stacks[0].Outputs'
```

---

## 💰 Cost Estimates

### Development (On-Demand)
- **Low traffic**: ~$5/month
- **Medium traffic**: ~$20-40/month

### Production (On-Demand)
- **Low traffic**: ~$10-30/month
- **Medium traffic**: ~$50-150/month
- **High traffic**: ~$500-2000/month

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed cost breakdown.

---

## 🔄 Update Existing Stack

```bash
# Using deployment script
./deploy.sh dev

# Or using AWS CLI
aws cloudformation update-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters file://parameters-dev.json
```

---

## 🧹 Cleanup

### Delete Stack (WARNING: This deletes all data!)
```bash
aws cloudformation delete-stack \
  --stack-name hotel-booking-dynamodb-dev
```

### Safe Deletion with Backup
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#safe-deletion-with-backup) for backup procedures.

---

## 📋 Access Patterns

The schema supports 25+ access patterns including:

**Property Search**
- Search by city/destination
- Proximity search (geohash)
- Filter by price, rating, type, amenities
- Featured properties

**Availability**
- Check room availability for date ranges
- Get pricing for specific dates
- Bulk availability checks

**Bookings**
- User booking history (upcoming/past/cancelled)
- Get booking by reference number
- Property bookings by date
- Bookings by status

**Reviews**
- Property reviews with pagination
- User review history
- Pending review moderation

See [`DYNAMODB_SCHEMA.md`](./DYNAMODB_SCHEMA.md#3-access-patterns) for complete list with query examples.

---

## 🔐 Security Features

- **Encryption at Rest**: KMS encryption enabled on all tables
- **Encryption in Transit**: HTTPS-only access
- **Point-in-Time Recovery**: 35-day retention for production
- **IAM-based Access Control**: Fine-grained permissions
- **VPC Endpoints**: Optional for private access

---

## 📈 Monitoring

### CloudWatch Metrics to Monitor
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `ThrottledRequests`
- `SystemErrors`
- `UserErrors`

### Set Up Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name hotel-booking-throttled-requests \
  --alarm-description "Alert when DynamoDB requests are throttled" \
  --metric-name ThrottledRequests \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

---

## 🤝 Integration

### Export Table Names for Application
```bash
# Get stack outputs as environment variables
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --query 'Stacks[0].Outputs' \
  --output json > table-config.json
```

### Use in Application
```javascript
// Node.js example
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PROPERTIES_TABLE = process.env.PROPERTIES_TABLE_NAME || 'hotel-booking-properties-dev';
const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE_NAME || 'hotel-booking-bookings-dev';
```

---

## 🐛 Troubleshooting

Common issues and solutions are documented in [`DEPLOYMENT_GUIDE.md#troubleshooting`](./DEPLOYMENT_GUIDE.md#8-troubleshooting).

Quick fixes:
- **Stack creation fails**: Check IAM permissions
- **GSI creation throttled**: Wait for completion, one GSI at a time
- **High costs**: Switch to on-demand billing
- **Throttling errors**: Enable auto-scaling or increase capacity

---

## 📚 Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CloudFormation DynamoDB Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)

---

## 📝 Next Steps

After deploying the database infrastructure:

1. **Verify Deployment** - Use verification commands in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#6-verification)
2. **Populate Sample Data** - Create seed data scripts (coming soon)
3. **Set Up IAM Policies** - Grant application access to tables
4. **Configure Monitoring** - Set up CloudWatch alarms
5. **Test Access Patterns** - Verify all GSI queries work correctly
6. **Integrate with Application** - Update environment variables

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-18 | Initial release with all 6 tables and 18 GSIs |

---

## 📧 Support

For questions or issues:
1. Check the [Troubleshooting Guide](./DEPLOYMENT_GUIDE.md#8-troubleshooting)
2. Review CloudFormation stack events
3. Contact DevOps team

---

**Last Updated**: 2025-11-18
