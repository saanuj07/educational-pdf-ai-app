const express = require('express');
const router = express.Router();
const summary = require('./summary');
const flashcards = require('./flashcards');
const quiz = require('./quiz');
const podcast = require('./podcast');
const chat = require('./chat');
const localStorage = require('../utils/localStorage');

// Route to get document data by ID
router.get('/document/:id', (req, res) => {
  const fileId = req.params.id;
  
  // Check if file exists in local storage
  const fileData = localStorage.getFileMetadata(fileId);
  if (!fileData) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  res.json({
    fileId: fileId,
    filename: fileData.filename,
    numPages: fileData.numPages,
    text: fileData.text,
    uploadDate: fileData.uploadDate
  });
});

// Route to list all documents
router.get('/documents', (req, res) => {
  const allFiles = localStorage.getAllFiles();
  
  const documents = Object.entries(allFiles).map(([fileId, fileData]) => ({
    fileId,
    filename: fileData.filename,
    numPages: fileData.numPages,
    textLength: fileData.textLength,
    uploadDate: fileData.uploadDate
  }));
  
  res.json({ documents, count: documents.length });
});

// Route to get available TTS voices
router.get('/voices', (req, res) => {
  const ttsService = require('../services/textToSpeechService');
  const voices = ttsService.getAvailableVoices();
  res.json({ voices });
});

// Route to get supported STT models
router.get('/stt-models', (req, res) => {
  const sttService = require('../services/speechToTextService');
  const models = sttService.getSupportedModels();
  const formats = sttService.getSupportedFormats();
  res.json({ models, formats });
});

// Route to get Watson service configuration
router.get('/watson-config', (req, res) => {
  const watsonxService = require('../services/watsonxService');
  const ttsService = require('../services/textToSpeechService');
  const sttService = require('../services/speechToTextService');
  const nluService = require('../services/nluService');
  
  res.json({
    watsonx: watsonxService.getConfiguration(),
    services: {
      tts: { initialized: ttsService.initialized, region: 'EU-DE' },
      stt: { initialized: sttService.initialized, region: 'EU-DE' },
      nlu: { initialized: nluService.initialized }
    },
    region: 'EU-DE',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.use('/generate-summary', summary);
router.use('/generate-flashcards', flashcards);
router.use('/quiz', quiz);
router.use('/generate-podcast', podcast);
router.use('/chat', chat);

console.log('📁 All routes loaded:', {
  summary: '/api/generate-summary',
  flashcards: '/api/generate-flashcards', 
  quiz: '/api/quiz',
  podcast: '/api/generate-podcast',
  chat: '/api/chat'
});

module.exports = router;
