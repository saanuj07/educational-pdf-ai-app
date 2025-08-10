@echo off
echo Checking for processes on ports 5000 and 3002...

REM Kill process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5000...
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Kill process on port 3002
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 3002...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo Ports cleared. Starting development server...
npm run dev
