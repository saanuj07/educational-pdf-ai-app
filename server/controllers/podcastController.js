const localStorage = require('../utils/localStorage');
const ttsService = require('../services/textToSpeechService');
const pdfParser = require('../utils/pdfParser');
const fs = require('fs');
const path = require('path');

// Generate podcast (text-to-speech) from document with synchronization data
exports.generatePodcast = async (req, res) => {
  const startTime = Date.now();
  console.log(`[PODCAST-INFO] API called: /api/generate-podcast`);
  
  try {
    const { fileId, voice = 'en-US_AllisonV3Voice', format = 'mp3' } = req.body;
    
    const fileData = localStorage.getFileMetadata(fileId);
    if (!fileData) {
      console.log(`[PODCAST-ERROR] Invalid file ID: ${fileId}`);
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    const text = fileData.text;
    
    console.log(`[PODCAST-INFO] Generating podcast with synchronization {
  "filename": "${fileData.filename}",
  "textLength": ${text.length},
  "voice": "${voice}",
  "format": "${format}"
}`);

    // Generate detailed text structure with coordinates if available
    let textStructure = null;
    if (fileData.pdfPath) {
      try {
        textStructure = await pdfParser.extractTextWithCoordinates(fileData.pdfPath);
      } catch (error) {
        console.log('[PODCAST-WARN] Could not extract text coordinates, using basic structure');
      }
    }

    // Generate podcast with synchronization data using Watson TTS
    const podcastResult = await ttsService.generatePodcastWithSync(text, { 
      voice, 
      format,
      textStructure 
    });
    
    const duration = Date.now() - startTime;
    console.log(`[PODCAST-INFO] Podcast with sync generated {
  "audioFile": "${podcastResult.audioFile}",
  "duration": "${podcastResult.duration}s",
  "syncPoints": ${podcastResult.syncData.length},
  "processingTime": "${duration}ms"
}`);

    res.json({
      success: true,
      podcast: {
        audioUrl: `/api/audio/${podcastResult.audioFile}`,
        duration: podcastResult.duration,
        syncData: podcastResult.syncData,
        transcript: podcastResult.transcript,
        voice: podcastResult.voice,
        format: podcastResult.format,
        title: `Podcast: ${fileData.filename}`,
        pages: podcastResult.pages || 1
      },
      metadata: {
        originalTextLength: text.length,
        filename: fileData.filename,
        generatedAt: new Date().toISOString(),
        fileId: fileId
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[PODCAST-ERROR] Generation failed after ${duration}ms:`, error.message);
    
    // Enhanced fallback response with mock synchronization data
    const mockSyncData = generateMockSyncData(fileData.text);
    
    res.json({ 
      success: false,
      error: 'Podcast generation not available',
      fallback: {
        audioUrl: '/audio/sample.mp3',
        duration: 120, // 2 minutes mock duration
        syncData: mockSyncData,
        transcript: fileData.text,
        voice: 'mock-voice',
        format: 'mp3',
        title: `Podcast: ${fileData.filename}`,
        pages: 1,
        message: 'Watson TTS service not configured. Using mock data for demonstration.'
      }
    });
  }
};

// Generate mock synchronization data for demonstration
function generateMockSyncData(text) {
  const words = text.split(/\s+/);
  const syncData = [];
  let currentTime = 0;
  const avgWordsPerMinute = 150; // Average speaking speed
  const secondsPerWord = 60 / avgWordsPerMinute;
  
  words.forEach((word, index) => {
    syncData.push({
      word: word.replace(/[^\w]/g, ''), // Clean word
      start: currentTime,
      end: currentTime + secondsPerWord,
      page: Math.floor(index / 100) + 1, // Assume ~100 words per page
      coordinates: {
        x: Math.random() * 500 + 50, // Mock coordinates
        y: Math.random() * 600 + 50,
        width: word.length * 8,
        height: 16
      }
    });
    currentTime += secondsPerWord;
  });
  
  return syncData;
}

// Serve audio files
exports.getAudioFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '..', 'uploads', 'audio', filename);
    
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }
    
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.wav' ? 'audio/wav' : 'audio/mpeg';
    
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
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      };
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('[PODCAST-ERROR] Error serving audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
};
