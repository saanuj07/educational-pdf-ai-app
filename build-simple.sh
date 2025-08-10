#!/bin/bash
# Simple production build script for Render deployment

echo "🚀 Building Educational PDF AI App for production..."

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install

# Build React app
echo "🔨 Building React frontend..."
npm run build
cd ..

# Install server dependencies  
echo "📦 Installing server dependencies..."
cd server && npm install
cd ..

echo "✅ Build completed successfully!"
