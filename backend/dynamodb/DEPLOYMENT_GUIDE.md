# DynamoDB CloudFormation Deployment Guide
## Hotel Booking Platform

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Deployment Options](#deployment-options)
4. [Configuration Parameters](#configuration-parameters)
5. [Deployment Commands](#deployment-commands)
6. [Verification](#verification)
7. [Cost Estimation](#cost-estimation)
8. [Troubleshooting](#troubleshooting)
9. [Cleanup](#cleanup)

---

## 1. Prerequisites

### Required Tools
- **AWS CLI v2+**: [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS Account**: With appropriate IAM permissions
- **AWS Credentials**: Configured locally

### Required IAM Permissions
Your AWS user/role needs the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:UpdateTable",
        "dynamodb:DeleteTable",
        "dynamodb:ListTables",
        "dynamodb:TagResource",
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:GetTemplate",
        "kms:CreateKey",
        "kms:DescribeKey",
        "kms:ListKeys"
      ],
      "Resource": "*"
    }
  ]
}
```

### Verify AWS CLI Configuration
```bash
# Check AWS CLI version
aws --version

# Verify AWS credentials
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

---

## 2. Quick Start

### Deploy with Default Settings (Development)
```bash
# Navigate to the dynamodb directory
cd backend/dynamodb

# Deploy the stack with default parameters
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --region us-east-1 \
  --tags Key=Environment,Value=dev Key=Application,Value=HotelBooking

# Monitor deployment progress
aws cloudformation wait stack-create-complete \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1

# Check stack status
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

---

## 3. Deployment Options

### Option 1: AWS Console Deployment

1. **Login to AWS Console**
   - Navigate to: https://console.aws.amazon.com/cloudformation

2. **Create Stack**
   - Click "Create stack" → "With new resources (standard)"
   - Choose "Upload a template file"
   - Upload `cloudformation-dynamodb.yaml`
   - Click "Next"

3. **Configure Stack**
   - **Stack name**: `hotel-booking-dynamodb-dev`
   - **Environment**: Select `dev`, `staging`, or `prod`
   - **BillingMode**: Select `PAY_PER_REQUEST` (recommended) or `PROVISIONED`
   - Configure other parameters as needed
   - Click "Next"

4. **Stack Options**
   - Add tags (recommended):
     - Key: `Environment`, Value: `dev`
     - Key: `Application`, Value: `HotelBooking`
   - Click "Next"

5. **Review and Create**
   - Review all settings
   - Click "Create stack"
   - Monitor progress in "Events" tab

### Option 2: AWS CLI Deployment (Recommended)

See deployment commands in Section 5.

### Option 3: AWS CDK/SDK Integration

If you're using AWS CDK, you can import this template:
```typescript
import * as cfn from 'aws-cdk-lib/aws-cloudformation';

const cfnInclude = new cfn.CfnInclude(this, 'DynamoDBTables', {
  templateFile: './backend/dynamodb/cloudformation-dynamodb.yaml',
});
```

---

## 4. Configuration Parameters

### Environment
- **Type**: String
- **Default**: `dev`
- **Allowed Values**: `dev`, `staging`, `prod`
- **Description**: Environment name appended to all table names
- **Example**: `dev` creates tables like `hotel-booking-properties-dev`

### BillingMode
- **Type**: String
- **Default**: `PAY_PER_REQUEST` (On-Demand)
- **Allowed Values**: `PAY_PER_REQUEST`, `PROVISIONED`
- **Description**: DynamoDB billing mode
- **Recommendations**:
  - **Development**: Use `PAY_PER_REQUEST` for cost efficiency
  - **Production with predictable traffic**: Use `PROVISIONED` with auto-scaling
  - **Production with unpredictable traffic**: Use `PAY_PER_REQUEST`

### ProvisionedReadCapacity
- **Type**: Number
- **Default**: `5`
- **Range**: 1 - 40000
- **Description**: Read capacity units (only used if `BillingMode=PROVISIONED`)
- **Note**: Each GSI also gets this capacity

### ProvisionedWriteCapacity
- **Type**: Number
- **Default**: `5`
- **Range**: 1 - 40000
- **Description**: Write capacity units (only used if `BillingMode=PROVISIONED`)
- **Note**: Each GSI also gets this capacity

### EnablePointInTimeRecovery
- **Type**: String
- **Default**: `true`
- **Allowed Values**: `true`, `false`
- **Description**: Enable PITR for all tables (35-day retention)
- **Recommendation**: Always `true` for production

### EnableStreams
- **Type**: String
- **Default**: `true`
- **Allowed Values**: `true`, `false`
- **Description**: Enable DynamoDB Streams on Bookings and Reviews tables
- **Use Cases**:
  - Trigger Lambda functions for notifications
  - Sync data to Elasticsearch
  - Audit logging
  - Update aggregate data (e.g., property ratings)

---

## 5. Deployment Commands

### Development Environment
```bash
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=false \
    ParameterKey=EnableStreams,ParameterValue=false \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=dev \
    Key=Application,Value=HotelBooking \
    Key=ManagedBy,Value=CloudFormation
```

### Staging Environment
```bash
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-staging \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=true \
    ParameterKey=EnableStreams,ParameterValue=true \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=staging \
    Key=Application,Value=HotelBooking \
    Key=ManagedBy,Value=CloudFormation
```

### Production Environment (On-Demand Billing)
```bash
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-prod \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=true \
    ParameterKey=EnableStreams,ParameterValue=true \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=prod \
    Key=Application,Value=HotelBooking \
    Key=ManagedBy,Value=CloudFormation \
    Key=CostCenter,Value=Engineering
```

### Production Environment (Provisioned Capacity)
```bash
aws cloudformation create-stack \
  --stack-name hotel-booking-dynamodb-prod \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=BillingMode,ParameterValue=PROVISIONED \
    ParameterKey=ProvisionedReadCapacity,ParameterValue=10 \
    ParameterKey=ProvisionedWriteCapacity,ParameterValue=10 \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=true \
    ParameterKey=EnableStreams,ParameterValue=true \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=prod \
    Key=Application,Value=HotelBooking \
    Key=ManagedBy,Value=CloudFormation
```

### Update Existing Stack
```bash
aws cloudformation update-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
  --region us-east-1
```

### Deploy to Multiple Regions
```bash
# Define regions
REGIONS=("us-east-1" "us-west-2" "eu-west-1")

# Deploy to each region
for REGION in "${REGIONS[@]}"; do
  echo "Deploying to $REGION..."
  aws cloudformation create-stack \
    --stack-name hotel-booking-dynamodb-prod \
    --template-body file://cloudformation-dynamodb.yaml \
    --parameters ParameterKey=Environment,ParameterValue=prod \
    --region $REGION \
    --tags Key=Environment,Value=prod Key=Region,Value=$REGION
done
```

---

## 6. Verification

### Check Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --query 'Stacks[0].{Status:StackStatus,CreatedTime:CreationTime}'
```

### List Created Tables
```bash
aws dynamodb list-tables \
  --region us-east-1 \
  --query 'TableNames[?contains(@, `hotel-booking`)]'
```

### Get Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Describe a Table
```bash
aws dynamodb describe-table \
  --table-name hotel-booking-properties-dev \
  --region us-east-1 \
  --query 'Table.{Name:TableName,Status:TableStatus,ItemCount:ItemCount,GSIs:GlobalSecondaryIndexes[*].IndexName}'
```

### Verify Global Secondary Indexes
```bash
aws dynamodb describe-table \
  --table-name hotel-booking-properties-dev \
  --region us-east-1 \
  --query 'Table.GlobalSecondaryIndexes[*].{IndexName:IndexName,Status:IndexStatus,KeySchema:KeySchema}'
```

### Check Point-in-Time Recovery Status
```bash
aws dynamodb describe-continuous-backups \
  --table-name hotel-booking-properties-dev \
  --region us-east-1 \
  --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription'
```

### Verify DynamoDB Streams (if enabled)
```bash
aws dynamodb describe-table \
  --table-name hotel-booking-bookings-dev \
  --region us-east-1 \
  --query 'Table.{StreamArn:LatestStreamArn,StreamEnabled:StreamSpecification.StreamEnabled}'
```

### Monitor Stack Events
```bash
aws cloudformation describe-stack-events \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --max-items 20 \
  --query 'StackEvents[*].{Time:Timestamp,Status:ResourceStatus,Reason:ResourceStatusReason,Resource:LogicalResourceId}'
```

---

## 7. Cost Estimation

### On-Demand Billing (PAY_PER_REQUEST)
- **Write Requests**: $1.25 per million write request units
- **Read Requests**: $0.25 per million read request units
- **Storage**: $0.25 per GB-month
- **PITR Backups**: $0.20 per GB-month
- **No minimum fees**

**Example Monthly Cost (Low Traffic)**:
- 1 million reads: $0.25
- 100K writes: $0.125
- 10 GB storage: $2.50
- PITR (10 GB): $2.00
- **Total**: ~$5/month

**Example Monthly Cost (Medium Traffic)**:
- 100 million reads: $25
- 10 million writes: $12.50
- 50 GB storage: $12.50
- PITR (50 GB): $10
- **Total**: ~$60/month

### Provisioned Capacity
- **Read Capacity Units**: $0.00013 per RCU-hour
- **Write Capacity Units**: $0.00065 per WCU-hour
- **Storage**: $0.25 per GB-month

**Example (10 RCU / 10 WCU per table)**:
- 6 tables × 10 RCU × $0.00013 × 730 hours = $5.69
- 6 tables × 10 WCU × $0.00065 × 730 hours = $28.47
- GSI costs (18 GSIs × similar capacity): ~$102
- **Total**: ~$136/month (before storage)

**Recommendation**: Start with On-Demand billing for development and staging. Switch to Provisioned with auto-scaling for production if traffic is predictable.

### Cost Optimization Tips
1. **Use Sparse GSIs**: Only index items that need to be queried
2. **Set TTL**: Automatically delete old availability records
3. **Use KEYS_ONLY projection**: For GSIs that only need lookup (SlugIndex, ReferenceIndex)
4. **Monitor unused GSIs**: Remove if not used
5. **Use DynamoDB Standard-IA**: For tables with infrequent access

---

## 8. Troubleshooting

### Common Issues

#### Issue: Stack creation fails with "LimitExceededException"
**Error**: `ResourceLimitExceeded: Cannot create more than 256 tables in the account`

**Solution**:
```bash
# Check current table count
aws dynamodb list-tables --region us-east-1 --query 'length(TableNames)'

# Request limit increase: https://console.aws.amazon.com/servicequotas/
# Or delete unused tables
```

#### Issue: "GSI creation throttled"
**Error**: `Too many operations in progress on the table`

**Solution**: CloudFormation can only create/delete one GSI at a time. Wait for current operation to complete.

#### Issue: "Insufficient IAM permissions"
**Error**: `User: arn:aws:iam::123456789012:user/username is not authorized to perform: dynamodb:CreateTable`

**Solution**:
```bash
# Verify current permissions
aws iam get-user-policy --user-name your-username --policy-name YourPolicyName

# Attach necessary policies or ask administrator
```

#### Issue: Stack stuck in "CREATE_IN_PROGRESS"
**Solution**:
```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# If truly stuck, cancel and retry
aws cloudformation cancel-update-stack --stack-name hotel-booking-dynamodb-dev
```

#### Issue: High costs on provisioned capacity
**Solution**: Switch to on-demand billing:
```bash
aws cloudformation update-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --template-body file://cloudformation-dynamodb.yaml \
  --parameters ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
  --region us-east-1
```

### Get Stack Help
```bash
# View CloudFormation template validation
aws cloudformation validate-template \
  --template-body file://cloudformation-dynamodb.yaml

# Describe failed resources
aws cloudformation describe-stack-resources \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1 \
  --query 'StackResources[?ResourceStatus==`CREATE_FAILED`]'
```

---

## 9. Cleanup

### Delete Stack (Use with Caution!)
```bash
# This will DELETE all tables and data permanently!
aws cloudformation delete-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1
```

### Safe Deletion with Backup
```bash
# 1. Create on-demand backups before deletion
aws dynamodb create-backup \
  --table-name hotel-booking-properties-dev \
  --backup-name properties-backup-$(date +%Y%m%d) \
  --region us-east-1

# 2. Export to S3 (requires S3 bucket)
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:123456789012:table/hotel-booking-properties-dev \
  --s3-bucket my-backup-bucket \
  --s3-prefix dynamodb-backups/ \
  --export-format DYNAMODB_JSON

# 3. Then delete the stack
aws cloudformation delete-stack \
  --stack-name hotel-booking-dynamodb-dev \
  --region us-east-1
```

### Preserve Tables (Remove from CloudFormation)
If you want to keep tables but remove from CloudFormation management:
```bash
# Update stack with DeletionPolicy: Retain (requires template modification)
# Then delete the stack - tables will remain
```

---

## 10. Next Steps

After successful deployment:

1. **Populate Sample Data**
   - Use the data seeding scripts (see `SEED_DATA.md`)
   - Import initial data for testing

2. **Set Up IAM Policies**
   - Create application-specific IAM roles
   - Grant least-privilege access to tables

3. **Configure Auto-Scaling** (if using provisioned capacity)
   - Set target utilization: 70%
   - Min capacity: 5, Max capacity: 500

4. **Set Up Monitoring**
   - Enable CloudWatch alarms for throttling
   - Monitor consumed capacity
   - Track error rates

5. **Configure Application**
   - Update environment variables with table names
   - Use stack outputs for table ARNs

6. **Test Access Patterns**
   - Verify all GSI queries work correctly
   - Load test critical paths

---

## 11. Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CloudFormation DynamoDB Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html)
- [DynamoDB Pricing Calculator](https://aws.amazon.com/dynamodb/pricing/)
- [Schema Design Documentation](./DYNAMODB_SCHEMA.md)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review CloudFormation stack events
3. Contact your DevOps team or AWS Support

---

**Last Updated**: 2025-11-18
