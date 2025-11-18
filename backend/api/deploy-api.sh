#!/bin/bash

# Hotel Booking Platform - API Gateway Deployment Script
# This script deploys the API Gateway and Lambda functions to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Print colored message
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Print section header
print_header() {
  echo ""
  print_message "$BLUE" "=========================================="
  print_message "$BLUE" "$1"
  print_message "$BLUE" "=========================================="
  echo ""
}

# Check if AWS CLI is installed
check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    print_message "$RED" "ERROR: AWS CLI is not installed."
    print_message "$YELLOW" "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
  fi
  print_message "$GREEN" "✓ AWS CLI is installed"
}

# Check if AWS credentials are configured
check_aws_credentials() {
  if ! aws sts get-caller-identity &> /dev/null; then
    print_message "$RED" "ERROR: AWS credentials are not configured."
    print_message "$YELLOW" "Please run: aws configure"
    exit 1
  fi
  local account_id=$(aws sts get-caller-identity --query Account --output text)
  local user_arn=$(aws sts get-caller-identity --query Arn --output text)
  print_message "$GREEN" "✓ AWS credentials are configured"
  print_message "$YELLOW" "  Account ID: $account_id"
  print_message "$YELLOW" "  User/Role: $user_arn"
}

# Validate CloudFormation template
validate_template() {
  print_message "$YELLOW" "Validating CloudFormation template..."
  if aws cloudformation validate-template \
    --template-body file://${SCRIPT_DIR}/cloudformation-api-gateway.yaml \
    --region "$1" > /dev/null 2>&1; then
    print_message "$GREEN" "✓ Template is valid"
  else
    print_message "$RED" "ERROR: Template validation failed"
    exit 1
  fi
}

# Check if DynamoDB stack exists
check_dynamodb_stack() {
  local env=$1
  local region=$2
  local dynamodb_stack_name="hotel-booking-dynamodb-${env}"

  print_message "$YELLOW" "Checking if DynamoDB stack exists..."
  if aws cloudformation describe-stacks \
    --stack-name "$dynamodb_stack_name" \
    --region "$region" &> /dev/null; then
    print_message "$GREEN" "✓ DynamoDB stack exists: $dynamodb_stack_name"
  else
    print_message "$RED" "ERROR: DynamoDB stack not found: $dynamodb_stack_name"
    print_message "$YELLOW" "Please deploy the DynamoDB stack first:"
    print_message "$YELLOW" "  cd ../dynamodb && ./deploy.sh $env"
    exit 1
  fi
}

# Deploy CloudFormation stack
deploy_stack() {
  local env=$1
  local region=$2
  local stack_name="hotel-booking-api-${env}"
  local params_file="${SCRIPT_DIR}/parameters-${env}.json"

  if [ ! -f "$params_file" ]; then
    print_message "$RED" "ERROR: Parameters file not found: $params_file"
    exit 1
  fi

  # Check if stack exists
  if aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --region "$region" &> /dev/null; then

    print_message "$YELLOW" "Stack exists. Updating stack: $stack_name"

    # Update stack
    if aws cloudformation update-stack \
      --stack-name "$stack_name" \
      --template-body file://${SCRIPT_DIR}/cloudformation-api-gateway.yaml \
      --parameters file://$params_file \
      --capabilities CAPABILITY_NAMED_IAM \
      --region "$region" 2>&1 | tee /tmp/update-output.txt; then

      if grep -q "No updates are to be performed" /tmp/update-output.txt; then
        print_message "$YELLOW" "No updates needed for stack: $stack_name"
        return 0
      fi

      print_message "$YELLOW" "Waiting for stack update to complete..."
      aws cloudformation wait stack-update-complete \
        --stack-name "$stack_name" \
        --region "$region"
      print_message "$GREEN" "✓ Stack updated successfully: $stack_name"
    else
      if grep -q "No updates are to be performed" /tmp/update-output.txt; then
        print_message "$YELLOW" "No updates needed for stack: $stack_name"
        return 0
      fi
      print_message "$RED" "ERROR: Stack update failed"
      exit 1
    fi
  else
    print_message "$YELLOW" "Creating new stack: $stack_name"

    # Create stack
    aws cloudformation create-stack \
      --stack-name "$stack_name" \
      --template-body file://${SCRIPT_DIR}/cloudformation-api-gateway.yaml \
      --parameters file://$params_file \
      --capabilities CAPABILITY_NAMED_IAM \
      --region "$region"

    print_message "$YELLOW" "Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
      --stack-name "$stack_name" \
      --region "$region"
    print_message "$GREEN" "✓ Stack created successfully: $stack_name"
  fi
}

# Get stack outputs
get_stack_outputs() {
  local env=$1
  local region=$2
  local stack_name="hotel-booking-api-${env}"

  print_message "$YELLOW" "Retrieving stack outputs..."

  local api_endpoint=$(aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --region "$region" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text)

  local api_id=$(aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --region "$region" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiId`].OutputValue' \
    --output text)

  echo ""
  print_message "$GREEN" "=========================================="
  print_message "$GREEN" "API Gateway Deployed Successfully!"
  print_message "$GREEN" "=========================================="
  echo ""
  print_message "$YELLOW" "Environment: $env"
  print_message "$YELLOW" "Region: $region"
  print_message "$YELLOW" "API ID: $api_id"
  print_message "$GREEN" "API Endpoint: $api_endpoint"
  echo ""
  print_message "$BLUE" "Example API Calls:"
  echo ""
  print_message "$YELLOW" "# Search properties"
  echo "curl \"${api_endpoint}/properties/search?city=New%20York&checkIn=2025-02-01&checkOut=2025-02-05\""
  echo ""
  print_message "$YELLOW" "# Get featured properties"
  echo "curl \"${api_endpoint}/properties/featured\""
  echo ""
  print_message "$YELLOW" "# Check availability"
  echo "curl -X POST \"${api_endpoint}/availability/check\" \\"
  echo "  -H \"Content-Type: application/json\" \\"
  echo "  -d '{\"propertyId\":\"prop_ny_001\",\"checkIn\":\"2025-02-01\",\"checkOut\":\"2025-02-05\"}'"
  echo ""
}

# Main deployment function
main() {
  print_header "Hotel Booking API Gateway Deployment"

  # Parse command line arguments
  local environment="${1:-dev}"
  local region="${2:-us-east-1}"

  # Validate environment
  if [[ ! "$environment" =~ ^(dev|staging|prod)$ ]]; then
    print_message "$RED" "ERROR: Invalid environment: $environment"
    print_message "$YELLOW" "Valid environments: dev, staging, prod"
    exit 1
  fi

  print_message "$YELLOW" "Environment: $environment"
  print_message "$YELLOW" "Region: $region"
  echo ""

  # Confirmation for production
  if [ "$environment" == "prod" ]; then
    print_message "$RED" "WARNING: You are about to deploy to PRODUCTION!"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      print_message "$YELLOW" "Deployment cancelled"
      exit 0
    fi
  fi

  # Pre-deployment checks
  print_header "Pre-Deployment Checks"
  check_aws_cli
  check_aws_credentials
  check_dynamodb_stack "$environment" "$region"
  validate_template "$region"

  # Deploy stack
  print_header "Deploying API Gateway Stack"
  deploy_stack "$environment" "$region"

  # Get outputs
  print_header "Deployment Complete"
  get_stack_outputs "$environment" "$region"

  print_message "$GREEN" "✓ Deployment completed successfully!"
  echo ""
  print_message "$BLUE" "Next Steps:"
  print_message "$YELLOW" "1. Test the API endpoints using the curl commands above"
  print_message "$YELLOW" "2. Implement Lambda function code in the 'functions/' directory"
  print_message "$YELLOW" "3. Update Lambda functions: ./update-functions.sh $environment"
  print_message "$YELLOW" "4. Monitor CloudWatch Logs for API Gateway and Lambda functions"
  print_message "$YELLOW" "5. View API documentation in API_SPECIFICATIONS.md"
  echo ""
}

# Show usage
usage() {
  echo "Usage: $0 [environment] [region]"
  echo ""
  echo "Arguments:"
  echo "  environment  Target environment (dev|staging|prod) [default: dev]"
  echo "  region       AWS region [default: us-east-1]"
  echo ""
  echo "Examples:"
  echo "  $0                    # Deploy to dev in us-east-1"
  echo "  $0 dev                # Deploy to dev in us-east-1"
  echo "  $0 staging us-west-2  # Deploy to staging in us-west-2"
  echo "  $0 prod us-east-1     # Deploy to production in us-east-1"
  echo ""
}

# Handle help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

# Run main function
main "$@"
