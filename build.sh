#!/bin/bash
# Render.com build script for Educational PDF AI App

echo "🚀 Starting Render deployment build..."

# Set environment
export NODE_ENV=production

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install and build client (React app)
echo "🏗️ Building client application..."
cd client
echo "📦 Installing client dependencies..."
npm ci --only=production
echo "🔨 Building React app..."
npm run build
cd ..

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm ci --only=production
cd ..

# Create necessary directories
echo "📁 Creating upload directories..."
mkdir -p server/uploads
mkdir -p server/uploads/audio
mkdir -p logs

# Set permissions
chmod -R 755 server/uploads
chmod -R 755 logs

# Verify build
echo "🔍 Verifying build..."
if [ -d "client/build" ]; then
    echo "✅ Client build successful - found build directory"
    echo "📊 Build size: $(du -sh client/build | cut -f1)"
else
    echo "❌ Client build failed - no build directory found"
    exit 1
fi

if [ -f "server/package.json" ]; then
    echo "✅ Server configuration found"
else
    echo "❌ Server configuration missing"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build artifacts:"
echo "   - Client build: client/build/ ($(ls -la client/build | wc -l) files)"
echo "   - Server: server/"
echo "   - Uploads: server/uploads/"
echo "🚀 Ready for deployment!"
