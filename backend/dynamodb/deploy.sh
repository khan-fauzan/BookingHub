#!/bin/bash

# DynamoDB CloudFormation Deployment Script
# Hotel Booking Platform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_message "$RED" "ERROR: AWS CLI is not installed. Please install it first."
        print_message "$YELLOW" "Installation guide: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_message "$RED" "ERROR: AWS credentials are not configured or invalid."
        print_message "$YELLOW" "Please run: aws configure"
        exit 1
    fi
}

# Function to validate template
validate_template() {
    print_message "$YELLOW" "Validating CloudFormation template..."
    if aws cloudformation validate-template --template-body file://cloudformation-dynamodb.yaml > /dev/null; then
        print_message "$GREEN" "✓ Template validation successful"
    else
        print_message "$RED" "✗ Template validation failed"
        exit 1
    fi
}

# Function to deploy stack
deploy_stack() {
    local env=$1
    local region=$2
    local stack_name="hotel-booking-dynamodb-${env}"
    local params_file="parameters-${env}.json"

    print_message "$YELLOW" "\n=========================================="
    print_message "$YELLOW" "Deploying DynamoDB Stack"
    print_message "$YELLOW" "=========================================="
    print_message "$YELLOW" "Environment: ${env}"
    print_message "$YELLOW" "Region: ${region}"
    print_message "$YELLOW" "Stack Name: ${stack_name}"
    print_message "$YELLOW" "==========================================\n"

    # Check if parameters file exists
    if [ ! -f "$params_file" ]; then
        print_message "$RED" "ERROR: Parameters file not found: $params_file"
        exit 1
    fi

    # Check if stack already exists
    if aws cloudformation describe-stacks --stack-name "$stack_name" --region "$region" &> /dev/null; then
        print_message "$YELLOW" "Stack already exists. Updating..."

        aws cloudformation update-stack \
            --stack-name "$stack_name" \
            --template-body file://cloudformation-dynamodb.yaml \
            --parameters file://"$params_file" \
            --region "$region" \
            --tags \
                Key=Environment,Value="$env" \
                Key=Application,Value=HotelBooking \
                Key=ManagedBy,Value=CloudFormation

        print_message "$YELLOW" "Waiting for stack update to complete..."
        aws cloudformation wait stack-update-complete \
            --stack-name "$stack_name" \
            --region "$region"

        print_message "$GREEN" "✓ Stack update completed successfully!"
    else
        print_message "$YELLOW" "Creating new stack..."

        aws cloudformation create-stack \
            --stack-name "$stack_name" \
            --template-body file://cloudformation-dynamodb.yaml \
            --parameters file://"$params_file" \
            --region "$region" \
            --tags \
                Key=Environment,Value="$env" \
                Key=Application,Value=HotelBooking \
                Key=ManagedBy,Value=CloudFormation

        print_message "$YELLOW" "Waiting for stack creation to complete..."
        aws cloudformation wait stack-create-complete \
            --stack-name "$stack_name" \
            --region "$region"

        print_message "$GREEN" "✓ Stack creation completed successfully!"
    fi

    # Display stack outputs
    print_message "$YELLOW" "\n=========================================="
    print_message "$YELLOW" "Stack Outputs"
    print_message "$YELLOW" "==========================================\n"

    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$region" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table

    # List created tables
    print_message "$YELLOW" "\n=========================================="
    print_message "$YELLOW" "Created DynamoDB Tables"
    print_message "$YELLOW" "==========================================\n"

    aws dynamodb list-tables \
        --region "$region" \
        --query 'TableNames[?contains(@, `hotel-booking`) && contains(@, `'$env'`)]' \
        --output table

    print_message "$GREEN" "\n✓ Deployment completed successfully!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [region]"
    echo ""
    echo "Arguments:"
    echo "  environment    Environment to deploy (dev, staging, prod)"
    echo "  region         AWS region (default: us-east-1)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging us-west-2"
    echo "  $0 prod us-east-1"
    echo ""
}

# Main script
main() {
    # Check arguments
    if [ $# -lt 1 ]; then
        print_message "$RED" "ERROR: Missing required arguments"
        show_usage
        exit 1
    fi

    local env=$1
    local region=${2:-us-east-1}

    # Validate environment
    if [[ ! "$env" =~ ^(dev|staging|prod)$ ]]; then
        print_message "$RED" "ERROR: Invalid environment. Must be one of: dev, staging, prod"
        exit 1
    fi

    # Pre-flight checks
    check_aws_cli
    check_aws_credentials
    validate_template

    # Confirm deployment
    print_message "$YELLOW" "\nYou are about to deploy DynamoDB tables to:"
    print_message "$YELLOW" "  Environment: ${env}"
    print_message "$YELLOW" "  Region: ${region}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "$YELLOW" "Deployment cancelled."
        exit 0
    fi

    # Deploy
    deploy_stack "$env" "$region"
}

# Run main function
main "$@"
