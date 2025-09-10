# Quip Integration Deployment Guide

## Prerequisites
1. AWS CLI configured with appropriate permissions
2. Quip API access token
3. Python 3.9+ installed locally

## Step 1: Deploy Lambda Function

```bash
# Make deployment script executable
chmod +x deploy-lambda.sh

# Run deployment
./deploy-lambda.sh
```

## Step 2: Set Up Quip API Token

1. Get your Quip API token from Quip settings
2. Store it in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
    --name "quip-api-token" \
    --description "API token for Quip integration" \
    --secret-string "YOUR_QUIP_TOKEN_HERE"
```

## Step 3: Update Lambda Function

Update the Lambda function to use Secrets Manager:

```bash
aws lambda update-function-code \
    --function-name emea-isv-calendar-quip-integration \
    --zip-file fileb://quip-lambda.zip
```

## Step 4: Create API Gateway

1. Create REST API
2. Create resource and method
3. Integrate with Lambda function
4. Deploy API
5. Enable CORS

```bash
# Get the API Gateway URL after deployment
aws apigateway get-rest-apis
```

## Step 5: Update Website Configuration

1. Replace `YOUR_API_GATEWAY_URL` in `script.js` with actual API Gateway URL
2. Set `USE_QUIP = true` to enable Quip integration
3. Commit and push changes

## Step 6: Test Integration

1. Open website
2. Check browser console for "Fetching events from Quip via Lambda..."
3. Verify events are loaded from Quip

## Rollback Plan

If issues occur, revert to Google Sheets:
1. Set `USE_QUIP = false` in `script.js`
2. Or checkout backup branch: `git checkout backup-google-sheets-version`

## Features Added

✅ **Quip Integration**: Events loaded from Quip via AWS Lambda
✅ **Outlook Export**: Download .ics file to add events to Outlook
✅ **Fallback Support**: Automatic fallback to Google Sheets if Quip fails
✅ **Security**: API token stored in AWS Secrets Manager
