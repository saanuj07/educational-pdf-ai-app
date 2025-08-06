require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const winston = require('./utils/logger');
const routes = require('./routes');
const cors = require('cors');
const multer = require('multer');
const localStorage = require('./utils/localStorage');

const app = express();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB limit from env
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined', { stream: winston.stream }));

// File upload endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  const startTime = Date.now();
  console.log(`[PDF-UPLOAD-INFO] API called: /api/upload`);
  
  try {
    if (!req.file) {
      console.log(`[PDF-UPLOAD-ERROR] No file uploaded`);
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log(`[PDF-UPLOAD-INFO] File received {
  "filename": "${req.file.originalname}",
  "size": ${req.file.size}
}`);
    
    const { parsePdf } = require('./utils/pdfParser');
    const pdfData = await parsePdf(req.file.buffer);
    
    console.log(`[PDF-UPLOAD-INFO] PDF parsed {
  "pages": ${pdfData.numPages},
  "textLength": ${pdfData.text.length}
}`);
    
    // Store the PDF data using local storage
    const fileId = Date.now().toString();
    const metadata = {
      filename: req.file.originalname,
      numPages: pdfData.numPages,
      textLength: pdfData.text.length,
      text: pdfData.text,
      info: pdfData.info
    };
    
    const stored = localStorage.storeFile(fileId, req.file.buffer, metadata);
    
    if (!stored) {
      throw new Error('Failed to store file locally');
    }
    
    const duration = Date.now() - startTime;
    console.log(`[PDF-UPLOAD-INFO] Upload complete in ${duration}ms`);
    
    res.json({ 
      fileId,
      filename: req.file.originalname,
      numPages: pdfData.numPages,
      textLength: pdfData.text.length
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[PDF-UPLOAD-ERROR] Processing failed after ${duration}ms:`, error.message);
    winston.error('PDF upload error:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.status(200).json({
    message: '🎓 Educational PDF AI Backend API',
    status: 'Server is running',
    frontend: 'http://localhost:3000',
    api: `http://localhost:${process.env.PORT || 5000}/api`,
    endpoints: {
      upload: '/api/upload',
      health: '/api/health'
    },
    note: 'Visit the frontend URL to use the application'
  });
});

app.use('/api', routes);

// Serve audio files
app.get('/api/audio/:filename', (req, res) => {
  const ttsService = require('./services/textToSpeechService');
  const filename = req.params.filename;
  const filePath = ttsService.getAudioFile(filename);
  
  if (!filePath) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  res.sendFile(filePath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  winston.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
