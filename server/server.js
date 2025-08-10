const express = require('express');
const path = require('path');
const fs = require('fs');
const app = require('./app');

const PORT = process.env.PORT || 5000;

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

// --- Start server ---
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - API:     http://localhost:${PORT}/api`);
});

// --- Graceful shutdown ---
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
