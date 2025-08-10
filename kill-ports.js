#!/usr/bin/env node

// Cross-platform port killer for development environment
const { exec } = require('child_process');
const os = require('os');

const PORTS = [3002, 5000];

function killPorts() {
    console.log('🔧 Cleaning up ports for development...');
    
    const isWindows = os.platform() === 'win32';
    const promises = PORTS.map(port => killPort(port, isWindows));
    
    return Promise.allSettled(promises);
}

function killPort(port, isWindows) {
    return new Promise((resolve) => {
        const command = isWindows 
            ? `netstat -ano | findstr :${port} && for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`
            : `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
        
        exec(command, (error, stdout, stderr) => {
            if (error && !error.message.includes('No such process')) {
                console.log(`⚠️  Port ${port}: No processes found or already free`);
            } else {
                console.log(`✅ Port ${port}: Cleaned up successfully`);
            }
            resolve();
        });
    });
}

async function startDev() {
    console.log('🚀 Starting Educational PDF AI App Development Environment');
    console.log('📝 Cleaning ports and starting servers...\n');
    
    await killPorts();
    
    console.log('\n🔄 Starting development servers...');
    
    // Start the development servers
    const { spawn } = require('child_process');
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    
    const devProcess = spawn(npx, ['concurrently', 
        '"npm run server"', 
        '"npm run client"'
    ], {
        stdio: 'inherit',
        shell: true
    });
    
    devProcess.on('close', (code) => {
        console.log(`\n📊 Development servers exited with code ${code}`);
    });
}

if (require.main === module) {
    startDev();
}

module.exports = { killPorts, startDev };
