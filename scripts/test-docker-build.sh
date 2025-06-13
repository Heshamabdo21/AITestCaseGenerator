#!/bin/bash

# Docker Build Test Script
# Tests the multi-stage Docker build process

set -e

echo "🔧 Testing Docker Build Process..."

# Clean previous builds
echo "Cleaning previous builds..."
docker-compose down --volumes --remove-orphans 2>/dev/null || true
docker system prune -f

# Test multi-stage build
echo "Building application with multi-stage Dockerfile..."
docker build --target builder -t azure-testcase-builder . || {
    echo "❌ Builder stage failed"
    exit 1
}

echo "Building production image..."
docker build --target production -t azure-testcase-production . || {
    echo "❌ Production stage failed"
    exit 1
}

# Check image sizes
echo "📊 Image sizes:"
docker images | grep azure-testcase

# Test production image startup
echo "Testing production image startup..."
docker run --rm -d --name test-app -p 5001:5000 azure-testcase-production

# Wait for startup
sleep 10

# Test health endpoint
echo "Testing health endpoint..."
curl -f http://localhost:5001/api/health || {
    echo "❌ Health check failed"
    docker stop test-app
    exit 1
}

# Cleanup
docker stop test-app

echo "✅ Docker build test completed successfully!"
echo "Ready for deployment with: docker-compose up -d"