#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

// Log with timestamp and formatting
function log(message, color = colors.cyan) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}${colors.bold}[${timestamp}]${colors.reset} ${message}`);
}

// Check if port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    
    server.on('error', () => resolve(true));
  });
}

// Find available port starting from given port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
}

async function startDevelopment() {
  console.clear();
  
  log(`${colors.green}🚀 Educational PDF AI App${colors.reset}`, colors.green);
  log(`${colors.blue}📚 Starting development environment...${colors.reset}`, colors.blue);
  
  // Check server port (5000)
  const serverPort = await findAvailablePort(5000);
  if (serverPort !== 5000) {
    log(`${colors.yellow}⚠ Port 5000 is in use, using port ${serverPort} for server${colors.reset}`, colors.yellow);
  }
  
  // Check client port (3000)
  const clientPort = await findAvailablePort(3000);
  if (clientPort !== 3000) {
    log(`${colors.yellow}⚠ Port 3000 is in use, using port ${clientPort} for client${colors.reset}`, colors.yellow);
  }
  
  // Start server
  log(`${colors.cyan}🔧 Starting backend server on port ${serverPort}...${colors.reset}`, colors.cyan);
  
  const serverProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'server'),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, PORT: serverPort }
  });
  
  let serverReady = false;
  
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server running on port')) {
      serverReady = true;
      log(`${colors.green}✓ Backend server ready on http://localhost:${serverPort}${colors.reset}`, colors.green);
      startClient();
    }
    console.log(`${colors.blue}[SERVER]${colors.reset} ${output.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log(`${colors.red}[SERVER ERROR]${colors.reset} ${data.toString().trim()}`);
  });
  
  function startClient() {
    log(`${colors.cyan}🎨 Starting React client on port ${clientPort}...${colors.reset}`, colors.cyan);
    
    const clientProcess = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'client'),
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, PORT: clientPort, BROWSER: 'none' }
    });
    
    clientProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('webpack compiled')) {
        log(`${colors.green}✓ Frontend ready on http://localhost:${clientPort}${colors.reset}`, colors.green);
        log(`${colors.green}${colors.bold}🎉 Development environment ready!${colors.reset}`, colors.green);
        log(`${colors.cyan}   - Frontend: http://localhost:${clientPort}${colors.reset}`);
        log(`${colors.cyan}   - Backend:  http://localhost:${serverPort}${colors.reset}`);
        log(`${colors.yellow}📝 Upload a PDF to test the AI features!${colors.reset}`, colors.yellow);
        
        // Automatically open browser
        const open = require('child_process').exec;
        const url = `http://localhost:${clientPort}`;
        log(`${colors.cyan}🌐 Opening browser at ${url}...${colors.reset}`, colors.cyan);
        
        // Open browser based on platform
        const command = process.platform === 'win32' ? 'start' : 
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
        open(`${command} ${url}`, (error) => {
          if (error) {
            log(`${colors.yellow}⚠ Could not auto-open browser. Please visit ${url} manually${colors.reset}`, colors.yellow);
          }
        });
      }
      console.log(`${colors.green}[CLIENT]${colors.reset} ${output.trim()}`);
    });
    
    clientProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning')) {
        console.log(`${colors.red}[CLIENT ERROR]${colors.reset} ${error.trim()}`);
      }
    });
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    log(`${colors.yellow}🛑 Shutting down development environment...${colors.reset}`, colors.yellow);
    serverProcess.kill();
    process.exit(0);
  });
}

startDevelopment().catch(error => {
  console.error(`${colors.red}❌ Failed to start development environment:${colors.reset}`, error);
  process.exit(1);
});
