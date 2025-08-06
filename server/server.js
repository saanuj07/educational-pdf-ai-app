const app = require('./app');
const PORT = process.env.PORT || 5000;

// Initialize Watson services
const watsonxService = require('./services/watsonxService');
const nluService = require('./services/nluService');
const ttsService = require('./services/textToSpeechService');
const sttService = require('./services/speechToTextService');

console.log('🔧 Initializing Watson services (Multi-Region: EU-DE/AU-SYD)...');
watsonxService.initialize();
nluService.initialize();
ttsService.initialize();
sttService.initialize();

const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - API:     http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
