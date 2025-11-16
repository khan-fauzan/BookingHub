# Backend Infrastructure

This directory contains Infrastructure as Code (IaC) templates and configurations for the Hotel Booking Platform backend services.

## Directory Structure

```
backend/
├── cognito/              # AWS Cognito authentication infrastructure
│   ├── cognito-stack.yaml       # CloudFormation template
│   ├── deploy.sh                # Deployment script
│   ├── get-outputs.sh           # Helper to retrieve outputs
│   ├── README.md                # Detailed Cognito documentation
│   ├── QUICK_REFERENCE.md       # CLI commands reference
│   └── .gitignore               # Ignore credentials and secrets
└── README.md            # This file
```

## Infrastructure Components

### 1. Cognito (Authentication)
AWS Cognito User Pool for user authentication and authorization.

**Location**: `./cognito/`

**Features**:
- Email-based authentication
- OAuth 2.0 support
- User management
- Password policies
- MFA support
- Hosted UI

**Quick Start**:
```bash
cd cognito
./deploy.sh
```

See `cognito/README.md` for detailed documentation.

---

## Planned Infrastructure Components

### 2. Database (Coming Soon)
- PostgreSQL database infrastructure
- RDS or Aurora Serverless
- Database migrations
- Backup and recovery

### 3. Storage (Coming Soon)
- S3 buckets for property images
- CloudFront CDN configuration
- Image processing pipeline

### 4. API Gateway (Coming Soon)
- API Gateway configuration
- Lambda functions
- API endpoints
- Rate limiting

### 5. Monitoring (Coming Soon)
- CloudWatch dashboards
- Alarms and alerts
- Application monitoring
- Log aggregation

### 6. Email Service (Coming Soon)
- SES configuration
- Email templates
- Transactional emails
- Email tracking

---

## Deployment Order

For a complete backend setup, deploy components in this order:

1. **Cognito** (Authentication) - ✅ Available now
2. **Database** (Data storage)
3. **Storage** (Image/file storage)
4. **API Gateway** (API endpoints)
5. **Email Service** (Notifications)
6. **Monitoring** (Observability)

---

## Prerequisites

All infrastructure deployments require:

- AWS CLI installed and configured
- Valid AWS credentials with appropriate permissions
- AWS account with billing enabled
- Understanding of AWS CloudFormation

---

## Environment Configuration

After deploying infrastructure, update your `.env.local` in the project root:

```bash
# From Cognito deployment
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Future infrastructure components will add more variables here
# DATABASE_URL=...
# AWS_S3_BUCKET=...
# etc.
```

---

## Cost Considerations

### Current (Cognito Only)
- Cognito: Free tier includes 50,000 MAU
- Lambda: Minimal cost for password generation
- CloudWatch Logs: Minimal

### Future Components
- RDS/Aurora: Variable based on instance size
- S3: Pay per GB stored and transferred
- API Gateway: Pay per million requests
- SES: Pay per email sent

**Estimated monthly cost for MVP**: $50-100 (after free tier)

---

## Security Best Practices

1. **Never commit credentials**
   - All secrets should be in environment variables
   - Use AWS Secrets Manager for sensitive data
   - The `.gitignore` files prevent credential commits

2. **Use least privilege IAM policies**
   - Each service gets only required permissions
   - Regularly audit IAM roles and policies

3. **Enable CloudTrail logging**
   - Track all API calls
   - Enable for compliance and security monitoring

4. **Use VPC for sensitive resources**
   - Keep databases in private subnets
   - Use security groups properly

5. **Regular backups**
   - Enable automated backups
   - Test recovery procedures

---

## Monitoring and Maintenance

### Health Checks
- Monitor CloudFormation stack status
- Check service health in AWS Console
- Set up CloudWatch alarms

### Updates
- Keep CloudFormation templates in version control
- Test updates in staging environment first
- Document all infrastructure changes

### Troubleshooting
Each component directory has:
- Detailed README with troubleshooting
- Quick reference guide
- Common issues and solutions

---

## Support and Documentation

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

For component-specific help, see the README in each subdirectory.

---

## Contributing

When adding new infrastructure components:

1. Create a new subdirectory
2. Include CloudFormation template(s)
3. Add deployment script
4. Write comprehensive README
5. Update this file with new component info
6. Test deployment in clean AWS account

---

## License

Private - Hotel Booking Platform
