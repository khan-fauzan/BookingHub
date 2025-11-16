# Deployment Notes - Cognito Stack

## ✅ Stack Successfully Deployed

**Date**: 2024-11-16
**Stack Name**: hotel-booking-cognito
**Status**: CREATE_COMPLETE

---

## 🔧 Issues Fixed

### Issue 1: Domain Name Invalid
**Problem**: Cognito User Pool domain names must be lowercase and contain only lowercase letters, numbers, and hyphens.

**Original Code**:
```yaml
Domain: !Sub '${AppName}-${AWS::AccountId}'
# With AppName default: HotelBookingPlatform (uppercase)
```

**Fixed Code**:
```yaml
Domain: !Sub 'hotelbooking-${AWS::AccountId}'
# Always lowercase, guaranteed unique per AWS account
```

**Changes Made**:
1. Changed `AppName` parameter default from `HotelBookingPlatform` to `hotel-booking-platform`
2. Simplified domain to `hotelbooking-${AWS::AccountId}`
3. Updated `deploy.sh` to use lowercase default

### Issue 2: Deletion Protection
**Problem**: Stack couldn't be deleted because User Pool had deletion protection enabled.

**Solution**:
1. Manually disabled deletion protection on failed User Pool
2. Changed template default to `INACTIVE` for development
3. Added comment to change to `ACTIVE` for production

**Updated Code**:
```yaml
# Deletion Protection (set to INACTIVE for development, ACTIVE for production)
DeletionProtection: INACTIVE
```

---

## 📋 Deployment Outputs

### AWS Resources Created

| Resource | Value |
|----------|-------|
| **User Pool ID** | `us-east-1_dmUS8yV9X` |
| **Web Client ID** | `24c80n5k39ent67vbkiuf203fn` |
| **User Pool Domain** | `hotelbooking-616855574610.auth.us-east-1.amazoncognito.com` |
| **Region** | `us-east-1` |

### Initial User Credentials

| Field | Value |
|-------|-------|
| **Username** | `admin@hotelbooking.com` |
| **Password** | `VHhHLQ1&nmYZ` |

⚠️ **IMPORTANT**: Change this password on first login!

---

## 🔗 Quick Links

### Hosted UI Login
```
https://hotelbooking-616855574610.auth.us-east-1.amazoncognito.com/login?client_id=24c80n5k39ent67vbkiuf203fn&response_type=code&redirect_uri=http://localhost:3000/auth/callback
```

### AWS Console Links
- **User Pool**: https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_dmUS8yV9X/users
- **CloudFormation Stack**: https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/stackinfo?stackId=hotel-booking-cognito

---

## 🔐 Environment Variables

Add these to your `.env.local` file in the project root:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_dmUS8yV9X
NEXT_PUBLIC_COGNITO_CLIENT_ID=24c80n5k39ent67vbkiuf203fn
NEXT_PUBLIC_COGNITO_DOMAIN=https://hotelbooking-616855574610.auth.us-east-1.amazoncognito.com

# Initial Admin Credentials (for development only)
# Username: admin@hotelbooking.com
# Password: VHhHLQ1&nmYZ
# ⚠️  CHANGE PASSWORD ON FIRST LOGIN!
```

---

## ✅ Testing Steps

1. **Test Hosted UI Login**
   ```bash
   # Open this URL in your browser:
   https://hotelbooking-616855574610.auth.us-east-1.amazoncognito.com/login?client_id=24c80n5k39ent67vbkiuf203fn&response_type=code&redirect_uri=http://localhost:3000/auth/callback
   ```

2. **Login with Initial Credentials**
   - Username: `admin@hotelbooking.com`
   - Password: `VHhHLQ1&nmYZ`

3. **Change Password**
   - You'll be prompted to change the password on first login

4. **Test User Management**
   ```bash
   # List users
   aws cognito-idp list-users \
     --user-pool-id us-east-1_dmUS8yV9X

   # Get user details
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_dmUS8yV9X \
     --username admin@hotelbooking.com
   ```

---

## 🚀 Next Steps

1. ✅ Save the credentials securely
2. ✅ Add environment variables to `.env.local`
3. 🔲 Test login via Hosted UI
4. 🔲 Change initial password
5. 🔲 Integrate Cognito with Next.js frontend
6. 🔲 Create additional test users
7. 🔲 Configure social identity providers (optional)

---

## 📚 References

- [Cognito User Pool Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Quick Reference Guide](./QUICK_REFERENCE.md)
- [Main README](./README.md)

---

## 🔄 Update Stack

To update the stack with changes:

```bash
./deploy.sh hotel-booking-cognito hotel-booking-platform
```

---

## 🗑️ Delete Stack

To delete the stack:

```bash
aws cloudformation delete-stack --stack-name hotel-booking-cognito
```

**Note**: If deletion protection is enabled, you'll need to disable it first:
```bash
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_dmUS8yV9X \
  --deletion-protection INACTIVE
```

---

## 📝 Lessons Learned

1. **Domain Naming**: Always use lowercase for Cognito domains
2. **Deletion Protection**: Set to INACTIVE during development for easier testing
3. **Stack Cleanup**: Failed stacks in ROLLBACK_FAILED state need manual resource cleanup
4. **Testing**: Always validate CloudFormation templates before deployment

---

**Deployed By**: Claude Code Assistant
**Stack ARN**: `arn:aws:cloudformation:us-east-1:616855574610:stack/hotel-booking-cognito/7c462f60-c2bc-11f0-ba24-0affde17201b`
