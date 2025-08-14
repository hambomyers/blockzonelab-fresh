#!/bin/bash

echo "🚀 Deploying BlockZone Lab Leaderboard Worker..."

# Deploy the worker
echo "📦 Deploying worker..."
wrangler deploy

# Check deployment status
echo "🔍 Checking deployment status..."
wrangler deployments list

# Test the API endpoint
echo "🧪 Testing API endpoint..."
curl -X GET "https://api.blockzonelab.com/api/leaderboard" \
  -H "Origin: https://blockzonelab-vs3.pages.dev" \
  -H "Content-Type: application/json" \
  -v

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Check Cloudflare dashboard for custom domain setup"
echo "2. Verify DNS records point to your Worker"
echo "3. Test CORS from your frontend" 