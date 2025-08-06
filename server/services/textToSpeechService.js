// Integration with IBM Watson Text-to-Speech
// const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
// Example: initialize TextToSpeechV1 with API key and URL
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const ibmConfig = require('../config/ibm');
const fs = require('fs');
const path = require('path');

class TextToSpeechService {
  constructor() {
    this.tts = null;
    this.initialized = false;
    this.audioDir = path.join(__dirname, '..', 'uploads', 'audio');
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      console.log('📁 Created audio directory:', this.audioDir);
    }
  }

  initialize() {
    if (!ibmConfig.ttsApiKey || !ibmConfig.ttsUrl) {
      console.log('⚠️ Watson TTS credentials not found, TTS features disabled');
      return false;
    }

    try {
      this.tts = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: ibmConfig.ttsApiKey,
        }),
        serviceUrl: ibmConfig.ttsUrl,
      });

      this.initialized = true;
      console.log('✅ Watson TTS service initialized (AU-SYD)');
      console.log(`   Service URL: ${ibmConfig.ttsUrl}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watson TTS:', error.message);
      return false;
    }
  }

  async generateAudio(text, options = {}) {
    if (!this.initialized) {
      throw new Error('TTS service not initialized');
    }

    const defaultOptions = {
      voice: 'en-US_AllisonV3Voice', // Default female voice
      accept: 'audio/wav',
      format: 'wav'
    };

    const synthesizeParams = {
      text: text,
      voice: options.voice || defaultOptions.voice,
      accept: options.accept || defaultOptions.accept
    };

    try {
      console.log(`[TTS-INFO] Generating audio for text (${text.length} characters) with voice: ${synthesizeParams.voice}`);
      
      const response = await this.tts.synthesize(synthesizeParams);
      
      // Handle the response stream properly
      const audioBuffer = await new Promise((resolve, reject) => {
        const chunks = [];
        
        response.result.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        response.result.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        
        response.result.on('error', (error) => {
          reject(error);
        });
      });
      
      // Save audio file
      const audioId = Date.now().toString();
      const fileName = `${audioId}.${options.format || 'wav'}`;
      const filePath = path.join(this.audioDir, fileName);
      
      fs.writeFileSync(filePath, audioBuffer);
      
      console.log(`[TTS-INFO] Audio generated successfully: ${fileName} (${audioBuffer.length} bytes)`);
      
      return {
        audioId,
        fileName,
        filePath,
        url: `/api/audio/${fileName}`,
        size: audioBuffer.length,
        voice: synthesizeParams.voice,
        duration: Math.ceil(text.length / 10) // Rough estimate: 10 chars per second
      };
    } catch (error) {
      console.error('[TTS-ERROR] Audio generation failed:', error.message);
      throw error;
    }
  }

  async generatePodcast(text, options = {}) {
    const podcastOptions = {
      voice: options.voice || 'en-US_AllisonV3Voice',
      format: 'mp3',
      accept: 'audio/mp3'
    };

    // Split long text into segments for better audio quality
    const segments = this.splitTextIntoSegments(text, 2000); // 2000 char limit per segment
    const audioFiles = [];

    try {
      for (let i = 0; i < segments.length; i++) {
        console.log(`[TTS-INFO] Generating podcast segment ${i + 1}/${segments.length}`);
        const segmentAudio = await this.generateAudio(segments[i], podcastOptions);
        audioFiles.push(segmentAudio);
      }

      return {
        segments: audioFiles,
        totalDuration: audioFiles.reduce((sum, file) => sum + file.duration, 0),
        voice: podcastOptions.voice,
        format: podcastOptions.format
      };
    } catch (error) {
      console.error('[TTS-ERROR] Podcast generation failed:', error.message);
      throw error;
    }
  }

  splitTextIntoSegments(text, maxLength = 2000) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments = [];
    let currentSegment = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if ((currentSegment + trimmedSentence).length > maxLength) {
        if (currentSegment) {
          segments.push(currentSegment.trim());
          currentSegment = trimmedSentence;
        } else {
          // Single sentence is too long, split it
          segments.push(trimmedSentence.substring(0, maxLength));
          currentSegment = trimmedSentence.substring(maxLength);
        }
      } else {
        currentSegment += (currentSegment ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment.trim());
    }

    return segments;
  }

  getAvailableVoices() {
    const voices = {
      'en-US_AllisonV3Voice': { name: 'Allison', gender: 'female', language: 'English (US)' },
      'en-US_LisaV3Voice': { name: 'Lisa', gender: 'female', language: 'English (US)' },
      'en-US_MichaelV3Voice': { name: 'Michael', gender: 'male', language: 'English (US)' },
      'en-US_KevinV3Voice': { name: 'Kevin', gender: 'male', language: 'English (US)' },
      'en-GB_KateV3Voice': { name: 'Kate', gender: 'female', language: 'English (UK)' },
      'en-GB_JamesV3Voice': { name: 'James', gender: 'male', language: 'English (UK)' }
    };

    return voices;
  }

  getAudioFile(fileName) {
    const filePath = path.join(this.audioDir, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  deleteAudioFile(fileName) {
    const filePath = path.join(this.audioDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted audio file: ${fileName}`);
      return true;
    }
    return false;
  }

  // Cleanup old audio files (optional - for maintenance)
  cleanupOldAudio(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const files = fs.readdirSync(this.audioDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(this.audioDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old audio files`);
    }
    
    return deletedCount;
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

module.exports = ttsService;
