# 🚀 Quick Setup Instructions

## For Your Friends Who Want to Run This Project

### Step 1: Download the Project
1. Go to the GitHub repository
2. Click the green "Code" button
3. Select "Download ZIP" or clone with `git clone [repository-url]`
4. Extract the ZIP file if downloaded

### Step 2: One-Command Setup

**Windows Users (PowerShell):**
```powershell
.\setup.ps1
```

**Windows Users (Command Prompt):**
```cmd
setup.bat
```

**Mac/Linux Users:**
```bash
chmod +x setup.sh && ./setup.sh
```

### Step 3: Configure API Keys
1. Edit `server/.env` file
2. Add your IBM Watson API credentials
3. Save the file

### Step 4: Start the App
```bash
npm start
```

**That's it! The app will open in your browser.**

## What You Need:
- Node.js installed (https://nodejs.org/)
- IBM Watson API keys (free tier available)

## Troubleshooting:
- If Node.js is missing, install it and restart terminal
- If you get permission errors on Windows, run PowerShell as Administrator
- If setup fails, check your internet connection for npm installs

## Need Help?
- Check the main README.md for detailed instructions
- Look at the error messages - they usually tell you what's wrong
- Make sure your Watson API keys are correct in the .env files
