@echo off
echo 🚀 Educational PDF AI App - One-Click Setup
echo ================================================

echo 📦 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js from https://nodejs.org/
    echo    Download the LTS version and restart Command Prompt after installation
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

echo 📦 Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found! npm should come with Node.js installation
    pause
    exit /b 1
) else (
    echo ✅ npm found
)

echo 📁 Creating required directories...
if not exist "server\uploads" mkdir "server\uploads"
if not exist "server\uploads\audio" mkdir "server\uploads\audio"
if not exist "logs" mkdir "logs"
echo ✅ Directories created

echo 📦 Installing root dependencies...
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install root dependencies
        pause
        exit /b 1
    ) else (
        echo ✅ Root dependencies installed
    )
)

echo 📦 Installing server dependencies...
cd server
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install server dependencies
        cd ..
        pause
        exit /b 1
    ) else (
        echo ✅ Server dependencies installed
    )
)
cd ..

echo 📦 Installing client dependencies...
cd client
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install client dependencies
        cd ..
        pause
        exit /b 1
    ) else (
        echo ✅ Client dependencies installed
    )
)
cd ..

echo ⚙️ Setting up environment files...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ Created root .env file
    )
)

if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env"
        echo ✅ Created server .env file
    )
)

if not exist "client\.env" (
    if exist "client\.env.example" (
        copy "client\.env.example" "client\.env"
        echo ✅ Created client .env file
    )
)

echo 📋 Setting up metadata storage...
if not exist "server\uploads\metadata.json" (
    echo {} > "server\uploads\metadata.json"
    echo ✅ Created metadata.json
)

echo 📝 Setting up logging...
if not exist "logs\app.log" (
    echo. > "logs\app.log"
    echo ✅ Created app.log
)

echo.
echo 🎉 Setup completed successfully!
echo ================================================
echo.
echo 📋 NEXT STEPS:
echo 1. Configure your IBM Watson API keys in the .env files
echo    - Edit server\.env with your Watson API credentials
echo.
echo 2. Start the application:
echo    npm start
echo.
echo    OR use individual commands:
echo    npm run server    # Start backend server
echo    npm run client    # Start frontend client
echo.
echo 3. Open your browser to:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo 🔧 Need help? Check the README.md for detailed instructions!
echo.
pause
