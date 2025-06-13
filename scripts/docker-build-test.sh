#!/bin/bash

# Test script to verify Docker build structure
echo "Testing Docker build configuration..."

# Create a minimal build test
mkdir -p test-build/dist/public
echo "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Build Test</h1></body></html>" > test-build/dist/public/index.html
echo "console.log('Server test');" > test-build/dist/index.js

echo "Build structure test created:"
ls -la test-build/dist/
ls -la test-build/dist/public/

# Clean up
rm -rf test-build

echo "Docker build structure test complete"