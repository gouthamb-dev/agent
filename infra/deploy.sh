#!/bin/bash
# Full deployment script for SYS_CLI // AGENT
# Run from project root: ./infra/deploy.sh

set -e

ACCOUNT_ID="651697298459"
REGION="us-east-1"
STACK_NAME="sys-cli-agent-infra"
FRONTEND_BUCKET="sys-cli-agent-frontend"

echo "═══════════════════════════════════════════════════"
echo " SYS_CLI // AGENT — Production Deployment"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Deploy AgentCore Runtime (backend)
echo "▶ Step 1: Deploying AgentCore Runtime..."
cd backend/SysCLIAgent
agentcore deploy -y
AGENT_ARN=$(agentcore status --json | python -c "import sys,json; print(json.load(sys.stdin)['runtimes'][0]['arn'])")
echo "  ✓ Agent ARN: $AGENT_ARN"
cd ../..

# Step 2: Deploy Lambda proxy + API Gateway + S3/CloudFront
echo ""
echo "▶ Step 2: Deploying infrastructure (Lambda proxy + frontend hosting)..."
cd infra
npx cdk deploy --require-approval never \
  --context agentRuntimeArn="$AGENT_ARN" \
  --context frontendBucket="$FRONTEND_BUCKET"
cd ..

# Step 3: Get API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text --region "$REGION")
echo "  ✓ API URL: $API_URL"

# Step 4: Build frontend with production endpoint
echo ""
echo "▶ Step 3: Building frontend..."
sed -i "s|http://localhost:8080|$API_URL|g" index.html
npm run build

# Step 5: Deploy frontend to S3
echo ""
echo "▶ Step 4: Uploading frontend to S3..."
aws s3 sync dist/ "s3://$FRONTEND_BUCKET/" --delete --region "$REGION"

# Step 6: Get CloudFront URL
CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text --region "$REGION")

echo ""
echo "═══════════════════════════════════════════════════"
echo " ✅ Deployment complete!"
echo ""
echo " Frontend: $CF_URL"
echo " API:      $API_URL"
echo " Agent:    $AGENT_ARN"
echo "═══════════════════════════════════════════════════"
