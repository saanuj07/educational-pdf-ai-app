# PowerShell script to kill processes and start dev server
Write-Host "Checking for processes on ports 5000 and 3002..." -ForegroundColor Yellow

# Kill processes on port 5000
$port5000 = netstat -ano | findstr :5000
if ($port5000) {
    $port5000 | ForEach-Object {
        $processId = ($_ -split '\s+')[-1]
        if ($processId -ne "0" -and $processId -match '^\d+$') {
            Write-Host "Killing process $processId on port 5000..." -ForegroundColor Red
            try { taskkill /PID $processId /F | Out-Null } catch { }
        }
    }
}

# Kill processes on port 3002
$port3002 = netstat -ano | findstr :3002
if ($port3002) {
    $port3002 | ForEach-Object {
        $processId = ($_ -split '\s+')[-1]
        if ($processId -ne "0" -and $processId -match '^\d+$') {
            Write-Host "Killing process $processId on port 3002..." -ForegroundColor Red
            try { taskkill /PID $processId /F | Out-Null } catch { }
        }
    }
}

Write-Host "Ports cleared. Starting development server..." -ForegroundColor Green
npm run dev
