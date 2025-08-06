const localStorage = require('../utils/localStorage');
const ttsService = require('../services/textToSpeechService');

// Generate podcast (text-to-speech) from document
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
    
    console.log(`[PODCAST-INFO] Generating podcast {
  "filename": "${fileData.filename}",
  "textLength": ${text.length},
  "voice": "${voice}",
  "format": "${format}"
}`);

    // Generate podcast using Watson TTS
    const podcastResult = await ttsService.generatePodcast(text, { voice, format });
    
    const duration = Date.now() - startTime;
    console.log(`[PODCAST-INFO] Podcast generated {
  "segments": ${podcastResult.segments.length},
  "totalDuration": "${podcastResult.totalDuration}s",
  "processingTime": "${duration}ms"
}`);

    res.json({
      success: true,
      podcast: {
        segments: podcastResult.segments.map(segment => ({
          url: segment.url,
          duration: segment.duration
        })),
        totalDuration: podcastResult.totalDuration,
        voice: podcastResult.voice,
        format: podcastResult.format,
        segmentCount: podcastResult.segments.length
      },
      metadata: {
        originalTextLength: text.length,
        filename: fileData.filename,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[PODCAST-ERROR] Generation failed after ${duration}ms:`, error.message);
    
    // Fallback response
    res.json({ 
      success: false,
      error: 'Podcast generation not available',
      fallback: {
        audioUrl: '/audio/sample.mp3',
        message: 'Watson TTS service not configured. Please add your TTS credentials to enable podcast generation.'
      }
    });
  }
};
