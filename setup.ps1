# 🚀 Educational PDF AI App - One-Click Setup Script
# This script automatically installs all dependencies and sets up the project

Write-Host "🚀 Starting Educational PDF AI App Setup..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Write-Host "   Download the LTS version and restart PowerShell after installation" -ForegroundColor Yellow
    exit 1
}

# Check if npm is installed
Write-Host "📦 Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found! npm should come with Node.js installation" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
$directories = @(
    "server/uploads",
    "server/uploads/audio",
    "logs"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory exists: $dir" -ForegroundColor Green
    }
}

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Root dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
        exit 1
    }
}

# Install server dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
Set-Location "server"
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Server dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
}
Set-Location ".."

# Install client dependencies
Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
Set-Location "client"
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Client dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install client dependencies" -ForegroundColor Red
        Set-Location ".."
        exit 1
    }
}
Set-Location ".."

# Copy environment files
Write-Host "⚙️ Setting up environment files..." -ForegroundColor Yellow

# Root .env file
if (!(Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created root .env file from .env.example" -ForegroundColor Green
} else {
    Write-Host "⚠️ Root .env file already exists or .env.example not found" -ForegroundColor Yellow
}

# Server .env file
if (!(Test-Path "server/.env") -and (Test-Path "server/.env.example")) {
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "✅ Created server .env file from .env.example" -ForegroundColor Green
} else {
    Write-Host "⚠️ Server .env file already exists or .env.example not found" -ForegroundColor Yellow
}

# Client .env file
if (!(Test-Path "client/.env") -and (Test-Path "client/.env.example")) {
    Copy-Item "client/.env.example" "client/.env"
    Write-Host "✅ Created client .env file from .env.example" -ForegroundColor Green
} else {
    Write-Host "⚠️ Client .env file already exists or .env.example not found" -ForegroundColor Yellow
}

# Create metadata.json if it doesn't exist
Write-Host "📋 Setting up metadata storage..." -ForegroundColor Yellow
$metadataPath = "server/uploads/metadata.json"
if (!(Test-Path $metadataPath)) {
    '{}' | Out-File -FilePath $metadataPath -Encoding UTF8
    Write-Host "✅ Created metadata.json file" -ForegroundColor Green
} else {
    Write-Host "✅ metadata.json already exists" -ForegroundColor Green
}

# Create app.log if it doesn't exist
Write-Host "📝 Setting up logging..." -ForegroundColor Yellow
$logPath = "logs/app.log"
if (!(Test-Path $logPath)) {
    '' | Out-File -FilePath $logPath -Encoding UTF8
    Write-Host "✅ Created app.log file" -ForegroundColor Green
} else {
    Write-Host "✅ app.log already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Configure your IBM Watson API keys in the .env files:" -ForegroundColor White
Write-Host "   - Edit server/.env with your Watson API credentials" -ForegroundColor White
Write-Host "   - Edit client/.env if needed" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the application:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "   OR use individual commands:" -ForegroundColor White
Write-Host "   npm run server    # Start backend server" -ForegroundColor Cyan
Write-Host "   npm run client    # Start frontend client" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Open your browser to:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Need help? Check the README.md for detailed instructions!" -ForegroundColor Yellow
Write-Host ""
