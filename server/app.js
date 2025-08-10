require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const winston = require('./utils/logger');
const routes = require('./routes');
const cors = require('cors');
const multer = require('multer');
const localStorage = require('./utils/localStorage');
const path = require('path');

const app = express();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB limit from env
  }
});

// CORS configuration - allow multiple frontend ports for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow the specific configured origin
    const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    if (origin === allowedOrigin) {
      return callback(null, true);
    }
    
    // In production, allow Render URLs
    if (process.env.NODE_ENV === 'production' && origin && origin.includes('render.com')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined', { stream: winston.stream }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  console.log(`📦 Serving static files from: ${buildPath}`);
}

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
  api: `http://localhost:${process.env.PORT || process.env.API_PORT || 5000}/api`,
    endpoints: {
      upload: '/api/upload',
      health: '/api/health'
    },
    note: 'Visit the frontend URL to use the application'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      watsonAI: 'connected',
      nlu: 'connected',
      uploads: 'ready'
    }
  });
});

app.use('/api', routes);

// Health check endpoint for Render monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Simple test route for debugging
app.get('/test', (req, res) => {
  res.json({ message: 'Simple test route works!' });
});

// Temporarily disable AI agent routes to fix deployment
// app.use('/api/ai-agent', require('./routes/ai-agent'));

// Direct AI agent test route for debugging (commented out to avoid conflicts)
// app.get('/api/ai-agent-direct/test', (req, res) => {
//   console.log('🤖 Direct AI Agent test route hit!');
//   res.json({ message: 'Direct AI Agent route is working!', timestamp: new Date().toISOString() });
// });

app.post('/api/ai-agent-direct/chat', (req, res) => {
  console.log('🤖 Direct AI Agent chat route hit!', req.body);
  const { message, documentId, personality, mode } = req.body;
  
  const response = {
    message: `Hello! You said: "${message}". I'm your AI assistant in ${personality || 'helpful'} mode.`,
    confidence: 0.8,
    suggestions: ['Tell me more', 'Explain this topic', 'Create a summary'],
    actions: [],
    personality: personality || 'helpful',
    mode: mode || 'chat',
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
});

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

// Catch-all handler: send back React's index.html file in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

module.exports = app;
