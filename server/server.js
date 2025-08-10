const express = require('express');
const path = require('path');
const fs = require('fs');
const app = require('./app');

// In production (Render) the platform injects PORT.
// In local dev we ignore a globally set PORT (React dev server may set/auto-shift it)
// and instead use API_PORT from server/.env to avoid collisions.
const isProd = process.env.NODE_ENV === 'production';
const desiredPort = isProd ? (process.env.PORT || 5000) : (process.env.API_PORT || 5000);
if (!isProd && process.env.PORT && process.env.PORT !== process.env.API_PORT) {
  console.log(`⚠️  Ignoring global PORT=${process.env.PORT} in dev; using API_PORT=${desiredPort}`);
}

// ---- Port availability helper ----
const net = require('net');
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(false); else resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

async function start() {
  const startTime = Date.now();
  const available = await checkPortAvailable(desiredPort);
  if (!available) {
    // Give actionable diagnostics instead of raw stack trace.
    console.error(`❌ Port ${desiredPort} is already in use.`);
    if (!isProd) {
      console.error('🔍 Diagnostic tips (Windows PowerShell):');
      console.error(`  netstat -ano | findstr :${desiredPort}`);
      console.error('  tasklist | findstr node');
      console.error('  taskkill /PID <pid> /F   # Kill the stray process');
      console.error(`Or set a different API_PORT in server/.env (e.g. API_PORT=${desiredPort + 1})`);
    }
    process.exit(1);
  }

  // --- Serve React build in production ---
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));

    // For any unknown route, send React's index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

  // --- Initialize Watson services ---
  const watsonxService = require('./services/watsonxService');
  const nluService = require('./services/nluService');
  const ttsService = require('./services/textToSpeechService');
  const sttService = require('./services/speechToTextService');

  console.log('🔧 Initializing Watson services (Multi-Region: EU-DE/AU-SYD)...');
  watsonxService.initialize();
  nluService.initialize();
  ttsService.initialize();
  sttService.initialize();

  const server = app.listen(desiredPort, () => {
    console.log(`✓ Server running on port ${desiredPort} (startup ${Date.now() - startTime}ms)`);
    console.log(`  - Local:   http://localhost:${desiredPort}`);
    console.log(`  - API:     http://localhost:${desiredPort}/api`);
  });

  // --- Graceful shutdown ---
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✓ Server closed');
      process.exit(0);
    });
  });
}

start();
