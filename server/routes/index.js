const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const summary = require('./summary');
const flashcards = require('./flashcards');
const quiz = require('./quiz');
const podcast = require('./podcast');
const chat = require('./chat');
const localStorage = require('../utils/localStorage');

// Route to download PDF file
router.get('/download/:id', (req, res) => {
  const fileId = req.params.id;
  
  // Check if file exists in local storage
  const fileData = localStorage.getFileMetadata(fileId);
  if (!fileData) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  const filePath = fileData.filePath;
  
  // Check if file exists on disk
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error downloading file' });
    }
  });
});

// Route to view PDF file in browser (for iframe embedding)
router.get('/view/:id', (req, res) => {
  const fileId = req.params.id;
  
  // Check if file exists in local storage
  const fileData = localStorage.getFileMetadata(fileId);
  if (!fileData) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const filePath = fileData.filePath;
  
  // Check if file exists on disk
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }
  
  // Set headers for inline viewing (not download)
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
  res.setHeader('Cache-Control', 'no-cache');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('Error streaming file:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error viewing file' });
    }
  });
});

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

// Audio file serving route
router.get('/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Support for audio streaming with range requests
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(audioPath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('[AUDIO-ERROR] Error serving audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

console.log('📁 All routes loaded:', {
  summary: '/api/generate-summary',
  flashcards: '/api/generate-flashcards', 
  quiz: '/api/quiz',
  podcast: '/api/generate-podcast',
  chat: '/api/chat'
});

module.exports = router;
