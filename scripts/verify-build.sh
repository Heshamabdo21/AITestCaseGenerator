#!/bin/bash

echo "Verifying build configuration for Docker deployment..."

# Run the build process
echo "Building application..."
npm run build

# Check if build outputs exist
echo "Checking build outputs..."

if [ -f "dist/index.js" ]; then
    echo "✓ Backend build found: dist/index.js"
else
    echo "✗ Backend build missing: dist/index.js"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✓ Frontend build directory found: dist/public"
    if [ -f "dist/public/index.html" ]; then
        echo "✓ Frontend index.html found"
    else
        echo "✗ Frontend index.html missing"
        exit 1
    fi
else
    echo "✗ Frontend build directory missing: dist/public"
    exit 1
fi

echo "✓ Build verification complete - Docker configuration should work correctly"