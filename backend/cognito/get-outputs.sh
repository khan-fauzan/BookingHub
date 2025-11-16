#!/bin/bash

# Script to retrieve CloudFormation stack outputs
# Usage: ./get-outputs.sh [stack-name]

STACK_NAME="${1:-hotel-booking-cognito}"

echo "Fetching outputs for stack: $STACK_NAME"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" &> /dev/null; then
    echo "❌ Error: Stack '$STACK_NAME' not found"
    echo "Available stacks:"
    aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
        --query 'StackSummaries[*].StackName' --output text
    exit 1
fi

# Get stack status
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)
echo "Stack Status: $STACK_STATUS"
echo ""

if [[ "$STACK_STATUS" != "CREATE_COMPLETE" && "$STACK_STATUS" != "UPDATE_COMPLETE" ]]; then
    echo "⚠️  Warning: Stack is not in a complete state"
    echo ""
fi

echo "=========================================="
echo "Stack Outputs"
echo "=========================================="
echo ""

# Display outputs with nice formatting
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "=========================================="
echo "Environment Variables (for .env.local)"
echo "=========================================="
echo ""

USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`UserPoolWebClientId`].OutputValue' --output text)
REGION=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`Region`].OutputValue' --output text)
PASSWORD=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs[?OutputKey==`InitialUserPassword`].OutputValue' --output text)

cat << EOF
NEXT_PUBLIC_AWS_REGION=$REGION
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$CLIENT_ID

# Initial Login Credentials
# Username: admin@hotelbooking.com
# Password: $PASSWORD
# ⚠️  Change password on first login!
EOF

echo ""
