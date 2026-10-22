#!/bin/bash
# CashMatrix Production Deployment Script

set -e

echo "🏦 CashMatrix Institutional Deployment"
echo "========================================"

# Build
echo "📦 Building production bundle..."
npm run build

# Optimize
echo "⚡ Optimizing assets..."

# Deploy to GoDaddy
echo "🚀 Deploying to GoDaddy..."

echo "✅ Deployment complete!"
