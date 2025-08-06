#!/bin/bash

# 🚀 Educational PDF AI App - One-Click Setup Script
# This script automatically installs all dependencies and sets up the project

echo "🚀 Starting Educational PDF AI App Setup..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}📦 Checking Node.js installation...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found! Please install Node.js from https://nodejs.org/${NC}"
    echo -e "${YELLOW}   Download the LTS version and restart terminal after installation${NC}"
    exit 1
fi

# Check if npm is installed
echo -e "${YELLOW}📦 Checking npm installation...${NC}"
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found! npm should come with Node.js installation${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating required directories...${NC}"
DIRECTORIES=("server/uploads" "server/uploads/audio" "logs")

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created directory: $dir${NC}"
    else
        echo -e "${GREEN}✅ Directory exists: $dir${NC}"
    fi
done

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
if [ -f "package.json" ]; then
    if npm install; then
        echo -e "${GREEN}✅ Root dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install root dependencies${NC}"
        exit 1
    fi
fi

# Install server dependencies
echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
cd server
if [ -f "package.json" ]; then
    if npm install; then
        echo -e "${GREEN}✅ Server dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install server dependencies${NC}"
        cd ..
        exit 1
    fi
fi
cd ..

# Install client dependencies
echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
cd client
if [ -f "package.json" ]; then
    if npm install; then
        echo -e "${GREEN}✅ Client dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install client dependencies${NC}"
        cd ..
        exit 1
    fi
fi
cd ..

# Copy environment files
echo -e "${YELLOW}⚙️ Setting up environment files...${NC}"

# Root .env file
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
    echo -e "${GREEN}✅ Created root .env file from .env.example${NC}"
else
    echo -e "${YELLOW}⚠️ Root .env file already exists or .env.example not found${NC}"
fi

# Server .env file
if [ ! -f "server/.env" ] && [ -f "server/.env.example" ]; then
    cp "server/.env.example" "server/.env"
    echo -e "${GREEN}✅ Created server .env file from .env.example${NC}"
else
    echo -e "${YELLOW}⚠️ Server .env file already exists or .env.example not found${NC}"
fi

# Client .env file
if [ ! -f "client/.env" ] && [ -f "client/.env.example" ]; then
    cp "client/.env.example" "client/.env"
    echo -e "${GREEN}✅ Created client .env file from .env.example${NC}"
else
    echo -e "${YELLOW}⚠️ Client .env file already exists or .env.example not found${NC}"
fi

# Create metadata.json if it doesn't exist
echo -e "${YELLOW}📋 Setting up metadata storage...${NC}"
METADATA_PATH="server/uploads/metadata.json"
if [ ! -f "$METADATA_PATH" ]; then
    echo '{}' > "$METADATA_PATH"
    echo -e "${GREEN}✅ Created metadata.json file${NC}"
else
    echo -e "${GREEN}✅ metadata.json already exists${NC}"
fi

# Create app.log if it doesn't exist
echo -e "${YELLOW}📝 Setting up logging...${NC}"
LOG_PATH="logs/app.log"
if [ ! -f "$LOG_PATH" ]; then
    touch "$LOG_PATH"
    echo -e "${GREEN}✅ Created app.log file${NC}"
else
    echo -e "${GREEN}✅ app.log already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo -e "1. Configure your IBM Watson API keys in the .env files:"
echo -e "   - Edit server/.env with your Watson API credentials"
echo -e "   - Edit client/.env if needed"
echo ""
echo -e "2. Start the application:"
echo -e "${CYAN}   npm start${NC}"
echo ""
echo -e "   OR use individual commands:"
echo -e "${CYAN}   npm run server    # Start backend server${NC}"
echo -e "${CYAN}   npm run client    # Start frontend client${NC}"
echo ""
echo -e "3. Open your browser to:"
echo -e "${CYAN}   Frontend: http://localhost:3000${NC}"
echo -e "${CYAN}   Backend:  http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}🔧 Need help? Check the README.md for detailed instructions!${NC}"
echo ""
