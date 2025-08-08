#!/bin/bash
# Render.com build script for Educational PDF AI App

echo "🚀 Starting Render deployment build..."

# Set environment
export NODE_ENV=production

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build client (React app)
echo "🏗️ Building client application..."
cd client
npm install
npm run build
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Create uploads directory if it doesn't exist
mkdir -p server/uploads
mkdir -p server/uploads/audio

# Set permissions
chmod -R 755 server/uploads

echo "✅ Build completed successfully!"
echo "📁 Build artifacts:"
echo "   - Client build: client/build/"
echo "   - Server: server/"
echo "   - Uploads: server/uploads/"
