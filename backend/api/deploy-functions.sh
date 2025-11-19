#!/bin/bash
# update-functions.sh

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

FUNCTIONS=(
  "search-properties"
  "get-property"
  "get-featured-properties"
  "check-availability"
  "calculate-pricing"
  "create-booking"
  "get-user-bookings"
  "cancel-booking"
  "get-user-profile"
  "update-user-profile"
  "get-property-reviews"
  "create-review"
)

for func in "${FUNCTIONS[@]}"; do
  echo "Updating $func..."
  echo "hotel-booking-${func}-${ENVIRONMENT}"

  cd functions/$func

  # Install dependencies
  npm install --production

  # Copy shared utilities
  cp -r ../shared .

  # Create deployment package
  zip -r function.zip index.js shared/ node_modules/

  # Update Lambda
  aws lambda update-function-code \
    --function-name hotel-booking-${func}-${ENVIRONMENT} \
    --zip-file fileb://function.zip \
    --region ${REGION}
  # Clean up
  rm function.zip
  rm -rf shared node_modules

  cd ../..
done
