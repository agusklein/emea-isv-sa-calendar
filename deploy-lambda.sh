#!/bin/bash

# Deploy Lambda function for Quip integration
echo "Creating Lambda deployment package..."

# Create deployment directory
mkdir -p lambda-package
cp lambda-quip-integration.py lambda-package/

# Install dependencies
pip install -r requirements.txt -t lambda-package/

# Create ZIP package
cd lambda-package
zip -r ../quip-lambda.zip .
cd ..

# Deploy to AWS Lambda
aws lambda create-function \
    --function-name emea-isv-calendar-quip-integration \
    --runtime python3.9 \
    --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role \
    --handler lambda-quip-integration.lambda_handler \
    --zip-file fileb://quip-lambda.zip \
    --description "Fetch events from Quip for EMEA ISV Calendar" \
    --timeout 30 \
    --environment Variables='{QUIP_DOCUMENT_ID=UtwbAwh5fZst}'

# Create API Gateway
aws apigateway create-rest-api --name emea-isv-calendar-api

echo "Lambda function deployed successfully!"
echo "Next steps:"
echo "1. Set up Quip API token in AWS Secrets Manager"
echo "2. Configure API Gateway endpoint"
echo "3. Update website to use new endpoint"
