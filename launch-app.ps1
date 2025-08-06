# Educational PDF AI App - PowerShell Launcher
# Run this from anywhere: powershell -ExecutionPolicy Bypass -File "D:\Summer Ceritficate\my-educational-app\launch-app.ps1"

Write-Host "🚀 Educational PDF AI App Launcher" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Define the project directory
$ProjectDir = "D:\Summer Ceritficate\my-educational-app"

# Check if project directory exists
if (-not (Test-Path $ProjectDir)) {
    Write-Host "❌ Error: Project directory not found!" -ForegroundColor Red
    Write-Host "Expected: $ProjectDir" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to project directory
Set-Location $ProjectDir
Write-Host "📁 Project directory: $ProjectDir" -ForegroundColor Green

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found in project directory!" -ForegroundColor Red
    Write-Host "Current location: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green
Write-Host ""

# Check if node_modules exist, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the development server
Write-Host "🚀 Starting development servers..." -ForegroundColor Cyan
Write-Host ""

try {
    npm run dev
} catch {
    Write-Host "❌ Failed to start development server!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Write-Host ""
    Read-Host "Press Enter to exit"
}
