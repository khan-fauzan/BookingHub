# Sample Data Generation & Seeding Guide
## Hotel Booking Platform

This guide explains how to generate and seed sample data into your DynamoDB tables.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Data Structure](#data-structure)
5. [Step-by-Step Guide](#step-by-step-guide)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)

---

## 1. Overview

The sample data generation system creates realistic data for:
- **50 properties** across 10 popular cities
- **150 room types** (3 per property)
- **13,500 availability records** (90 days × 150 room types)
- **100 users** with loyalty programs
- **100-150 bookings** with payment records
- **65-100 reviews** with ratings
- **22 amenities** catalog
- **10 promo codes**

### Cities Included
1. New York, USA
2. Paris, France
3. London, UK
4. Tokyo, Japan
5. Dubai, UAE
6. Barcelona, Spain
7. Los Angeles, USA
8. Miami, USA
9. Singapore, Singapore
10. Rome, Italy

---

## 2. Prerequisites

### Required Software
- Node.js 18+ and npm
- AWS CLI configured with credentials
- DynamoDB tables already created (see DEPLOYMENT_GUIDE.md)

### Required Permissions
Your AWS credentials need:
- `dynamodb:PutItem`
- `dynamodb:BatchWriteItem`
- `dynamodb:DescribeTable`

### Install Dependencies
```bash
cd backend/dynamodb
npm install
```

This installs:
- `@aws-sdk/client-dynamodb` - AWS DynamoDB SDK
- `@aws-sdk/lib-dynamodb` - Document client for easier data handling
- `uuid` - UUID generation for IDs

---

## 3. Quick Start

```bash
# Step 1: Generate sample data
npm run generate

# Step 2: Seed development environment
npm run seed:dev

# That's it! Your DynamoDB tables now have sample data
```

---

## 4. Data Structure

### Sample Data File Format
After generation, `sample-data-full.json` contains:

```json
{
  "metadata": {
    "generated": "2025-11-18T12:00:00Z",
    "description": "Sample data for 10 popular cities",
    "cities": ["New York, USA", "Paris, France", ...],
    "stats": {
      "properties": 50,
      "roomTypes": 150,
      "availability": 13500,
      "users": 100,
      "bookings": 150,
      "reviews": 100,
      "promoCodes": 10
    }
  },
  "amenities": [...],
  "properties": [...],
  "roomTypes": [...],
  "availability": [...],
  "users": [...],
  "bookings": [...],
  "reviews": [...],
  "promoCodes": [...]
}
```

### Property Example
```json
{
  "propertyId": "prop_abc123",
  "name": "Grand New York Hotel",
  "slug": "grand-new-york-hotel",
  "propertyType": "hotel",
  "starRating": 5,
  "cityName": "New York",
  "countryName": "USA",
  "address": {
    "line1": "123 Fifth Avenue",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "geohash": "dr5regw",
  "averageRating": 9.2,
  "reviewCount": 1234,
  "amenityList": ["wifi", "pool", "gym", "spa", "restaurant"],
  "priceRange": { "min": 250, "max": 800, "currency": "USD" },
  "isFeatured": true
}
```

---

## 5. Step-by-Step Guide

### Step 1: Generate Sample Data

```bash
npm run generate
```

**What it does:**
- Creates 50 properties (5 per city)
- Generates realistic names, descriptions, and addresses
- Creates 3 room types per property
- Generates 90 days of availability data
- Creates 100 users with loyalty points
- Generates bookings and reviews
- Saves everything to `sample-data-full.json`

**Output:**
```
🎲 Generating sample data...

📍 Generating properties...
✅ Generated 50 properties
✅ Generated 150 room types

📅 Generating availability data...
✅ Generated 13500 availability records

👥 Generating users...
✅ Generated 100 users

📖 Generating bookings...
✅ Generated 125 bookings

⭐ Generating reviews...
✅ Generated 85 reviews

✨ Data generation complete!
💾 Saved to: sample-data-full.json
📦 Total file size: 4.25 MB
```

### Step 2: Deploy DynamoDB Tables

If you haven't already, deploy the tables first:

```bash
# Using the deployment script
./deploy.sh dev

# Or using CloudFormation directly
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters file://parameters-dev.json \
  --region us-east-1
```

Wait for tables to be created (~5-10 minutes).

### Step 3: Seed the Database

```bash
# Development environment
npm run seed:dev

# Staging environment
npm run seed:staging

# Production environment (use with caution!)
npm run seed:prod
```

**What it does:**
1. Loads `sample-data-full.json`
2. Transforms data into DynamoDB format
3. Batch writes to all 6 tables
4. Shows progress and summary

**Output:**
```
╔═══════════════════════════════════════════════╗
║   DynamoDB Database Seeder                    ║
╚═══════════════════════════════════════════════╝

Environment: dev
Region: us-east-1

📂 Loading sample data...
✅ Loaded data file: sample-data-full.json

1️⃣  Seeding Metadata Table...
   Writing 32 metadata items in 2 batches...
   Progress: 32/32 (100%)
   ✅ Successfully wrote 32 metadata items

2️⃣  Seeding Properties Table...
   Writing 200 property items in 8 batches...
   Progress: 200/200 (100%)
   ✅ Successfully wrote 200 property items

3️⃣  Seeding Availability Table...
   Writing 13500 availability records in 540 batches...
   Progress: 13500/13500 (100%)
   ✅ Successfully wrote 13500 availability records

4️⃣  Seeding Users Table...
   Writing 200 user items in 8 batches...
   Progress: 200/200 (100%)
   ✅ Successfully wrote 200 user items

5️⃣  Seeding Bookings Table...
   Writing 375 booking items in 15 batches...
   Progress: 375/375 (100%)
   ✅ Successfully wrote 375 booking items

6️⃣  Seeding Reviews Table...
   Writing 85 reviews in 4 batches...
   Progress: 85/85 (100%)
   ✅ Successfully wrote 85 reviews

✨ Database seeding completed successfully!

📊 Final Summary:
   Properties: 50
   Room Types: 150
   Availability Records: 13500
   Users: 100
   Bookings: 125
   Reviews: 85
   Amenities: 22
   Promo Codes: 10
```

### Step 4: Verify Data

```bash
# Check table item counts
aws dynamodb scan \
  --table-name hotel-booking-properties-dev \
  --select COUNT \
  --region us-east-1

# Query a specific property
aws dynamodb query \
  --table-name hotel-booking-properties-dev \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"PROPERTY#prop_abc123"}}' \
  --region us-east-1

# Query properties in New York
aws dynamodb query \
  --table-name hotel-booking-properties-dev \
  --index-name LocationIndex \
  --key-condition-expression "GSI1PK = :city" \
  --expression-attribute-values '{":city":{"S":"CITY#New York#USA"}}' \
  --region us-east-1
```

---

## 6. Customization

### Modify Number of Properties

Edit `generate-sample-data.js`:

```javascript
// Line ~600
// Change from 5 to 10 properties per city
for (let i = 0; i < 10; i++) {
  const property = generateProperty(city, i);
  data.properties.push(property);
}
```

### Modify Number of Users

```javascript
// Line ~620
// Change from 100 to 200 users
for (let i = 0; i < 200; i++) {
  data.users.push(generateUser());
}
```

### Modify Availability Date Range

```javascript
// Line ~615
// Change from 90 to 180 days
for (let day = 0; day < 180; day++) {
  const date = addDays(today, day);
  const availability = generateAvailability(roomType, date);
  data.availability.push(availability);
}
```

### Add More Cities

```javascript
// Line ~25
const CITIES = [
  // ... existing cities
  { name: "Sydney", state: "NSW", country: "Australia", lat: -33.8688, lng: 151.2093, geohash: "r3gx2f", currency: "AUD" },
  { name: "Toronto", state: "ON", country: "Canada", lat: 43.6532, lng: -79.3832, geohash: "dpz83z", currency: "CAD" }
];
```

### Customize Property Names

```javascript
// Line ~35
const PROPERTY_NAME_TEMPLATES = {
  hotel: ["Grand", "Royal", "Imperial", "Luxury", "Boutique", "Your Custom Name"],
  // ...
};
```

---

## 7. Troubleshooting

### Issue: "Data file not found"

**Error:**
```
❌ Data file not found: sample-data-full.json
💡 Run "npm run generate" first to create sample data
```

**Solution:**
```bash
npm run generate
```

### Issue: "Table does not exist"

**Error:**
```
ResourceNotFoundException: Requested resource not found: Table: hotel-booking-properties-dev not found
```

**Solution:**
Deploy the CloudFormation stack first:
```bash
./deploy.sh dev
```

Wait for stack creation to complete, then retry seeding.

### Issue: "Throttling errors"

**Error:**
```
ProvisionedThroughputExceededException: The level of configured provisioned throughput for the table was exceeded
```

**Solution:**
1. **If using On-Demand billing**: Add delays between batches
   ```javascript
   const DELAY_MS = 500; // Increase from 100 to 500
   ```

2. **If using Provisioned capacity**: Increase write capacity
   ```bash
   aws dynamodb update-table \
     --table-name hotel-booking-properties-dev \
     --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=20
   ```

3. **Reduce batch size**:
   ```javascript
   const BATCH_SIZE = 10; // Reduce from 25 to 10
   ```

### Issue: "Invalid credentials"

**Error:**
```
CredentialsError: Missing credentials in config
```

**Solution:**
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-1"
```

### Issue: "Seeding takes too long"

**Optimization tips:**
1. Reduce availability date range (90 days → 30 days)
2. Reduce number of properties (50 → 20)
3. Increase BATCH_SIZE if not throttling (25 → 100)
4. Use parallel writes for different tables

### Issue: "Want to reset and start over"

**Clean existing data:**
```bash
# Delete and recreate stack
aws cloudformation delete-stack --stack-name hotel-booking-dynamodb-dev
aws cloudformation wait stack-delete-complete --stack-name hotel-booking-dynamodb-dev

# Redeploy
./deploy.sh dev

# Reseed
npm run generate
npm run seed:dev
```

---

## 8. Advanced Usage

### Seed Specific Table Only

Modify `seed-dynamodb.js` to comment out tables you don't want to seed:

```javascript
// Only seed properties
await batchWrite(TABLES.properties, propertyItems, 'property items');

// Skip other tables
// await batchWrite(TABLES.availability, data.availability, 'availability records');
// await batchWrite(TABLES.users, userItems, 'user items');
// ...
```

### Custom Data Generation Script

Create your own generator:

```javascript
const fs = require('fs');

const customData = {
  properties: [
    {
      propertyId: 'prop_custom_001',
      name: 'My Custom Hotel',
      // ... your data
    }
  ]
};

fs.writeFileSync('my-custom-data.json', JSON.stringify(customData, null, 2));
```

Then modify `seed-dynamodb.js` to load your file:
```javascript
const data = JSON.parse(fs.readFileSync('my-custom-data.json', 'utf8'));
```

### Export Existing Data

```bash
# Export table to JSON
aws dynamodb scan \
  --table-name hotel-booking-properties-dev \
  --output json > existing-properties.json
```

---

## 9. Data Validation

### Verify Property Count
```bash
aws dynamodb scan \
  --table-name hotel-booking-properties-dev \
  --select COUNT \
  --filter-expression "SK = :metadata" \
  --expression-attribute-values '{":metadata":{"S":"METADATA"}}' \
  --region us-east-1
```

### Verify Users by Email
```bash
aws dynamodb query \
  --table-name hotel-booking-users-dev \
  --index-name EmailIndex \
  --key-condition-expression "GSI1PK = :email" \
  --expression-attribute-values '{":email":{"S":"EMAIL#john.smith123@example.com"}}' \
  --region us-east-1
```

### Verify Bookings for User
```bash
aws dynamodb query \
  --table-name hotel-booking-bookings-dev \
  --index-name UserBookingsIndex \
  --key-condition-expression "GSI1PK = :user" \
  --expression-attribute-values '{":user":{"S":"USER#user_abc123"}}' \
  --region us-east-1
```

---

## 10. Next Steps

After seeding the database:

1. **Test the API endpoints** - Verify queries return expected data
2. **Integrate with Frontend** - Connect Next.js app to DynamoDB
3. **Set up monitoring** - CloudWatch alarms for table metrics
4. **Optimize queries** - Profile slow queries and add indexes if needed
5. **Add more data** - Generate additional properties/bookings as needed

---

## 11. Cost Considerations

### On-Demand Billing
- Initial data load: ~$0.01 - $0.05
- Storage (14K items, ~5 MB): ~$1.25/month

### Provisioned Billing
- Write units for seeding: ~500 WCU-minutes
- Estimated cost: ~$0.25 per seeding operation

### Cost Optimization
- Seed once and keep data
- Use on-demand billing for dev/staging
- Delete availability records > 90 days old (TTL handles this automatically)

---

## 12. Frequently Asked Questions

**Q: Can I seed production data?**
A: Yes, but be careful. Review the generated data first and consider using realistic prod-like data instead of random generated data.

**Q: How do I update existing data?**
A: Either delete and reseed, or write update scripts that modify specific items.

**Q: Can I import my own CSV/JSON data?**
A: Yes! Modify the seed script to read your format and transform to DynamoDB format.

**Q: How long does seeding take?**
A: Approximately 3-5 minutes for full dataset (13K+ items with throttling delays).

**Q: Does seeding overwrite existing data?**
A: Yes, if items have the same primary key. Be careful when seeding tables that already have data.

**Q: Can I seed multiple environments in parallel?**
A: Yes, run seeding scripts in separate terminals with different `--env` flags.

---

## 13. Support

For issues or questions:
1. Check [Troubleshooting](#7-troubleshooting) section
2. Review AWS CloudWatch logs
3. Check DynamoDB console for throttling/errors
4. Contact DevOps team

---

**Last Updated**: 2025-11-18
