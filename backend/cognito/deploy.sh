#!/bin/bash

# Deploy script for Hotel Booking Cognito Stack
# Usage: ./deploy.sh [stack-name] [app-name]

set -e

# Configuration
STACK_NAME="${1:-hotel-booking-cognito}"
APP_NAME="${2:-hotel-booking-platform}"
TEMPLATE_FILE="cognito-stack.yaml"

echo "=========================================="
echo "Hotel Booking Platform - Cognito Deployment"
echo "=========================================="
echo ""
echo "Stack Name: $STACK_NAME"
echo "App Name: $APP_NAME"
echo "Template: $TEMPLATE_FILE"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if user is authenticated
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured"
    echo "Please run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "✓ AWS Account: $AWS_ACCOUNT_ID"
echo "✓ AWS Region: $AWS_REGION"
echo ""

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "Stack '$STACK_NAME' already exists."
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Updating stack..."
        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body file://"$TEMPLATE_FILE" \
            --parameters ParameterKey=AppName,ParameterValue="$APP_NAME" \
            --capabilities CAPABILITY_IAM

        echo "Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
        echo "✓ Stack updated successfully"
    else
        echo "Update cancelled"
        exit 0
    fi
else
    echo "Creating new stack..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://"$TEMPLATE_FILE" \
        --parameters ParameterKey=AppName,ParameterValue="$APP_NAME" \
        --capabilities CAPABILITY_IAM

    echo "Waiting for stack creation to complete (this may take a few minutes)..."
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
    echo "✓ Stack created successfully"
fi

echo ""
echo "=========================================="
echo "Stack Outputs"
echo "=========================================="
echo ""

# Get and display outputs in a nice format
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output text | while IFS=$'\t' read -r key value; do
    if [[ "$key" == "InitialUserPassword" ]]; then
        echo "🔑 $key: $value"
        echo "   ⚠️  SAVE THIS PASSWORD - You'll need to change it on first login"
    else
        echo "📋 $key: $value"
    fi
done

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Save the InitialUserPassword shown above"
echo "2. Add the following to your .env.local file:"
echo ""
echo "   NEXT_PUBLIC_AWS_REGION=$AWS_REGION"
echo "   NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId from above>"
echo "   NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolWebClientId from above>"
echo ""
echo "3. Test login at: <CognitoHostedUIUrl from above>"
echo "   Username: admin@hotelbooking.com"
echo "   Password: <InitialUserPassword from above>"
echo ""
echo "4. Change the password on first login"
echo ""
echo "✓ Deployment complete!"
