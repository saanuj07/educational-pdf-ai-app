const fs = require('fs');
const path = require('path');
const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

class TextToSpeechService {
  constructor() {
    this.audioDir = path.join(__dirname, '..', 'uploads', 'audio');
    this.initialized = false;
    this.tts = null;
    
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      console.log('📁 Created audio directory:', this.audioDir);
    }
    
    this.initialize();
  }

  initialize() {
    try {
      const apiKey = process.env.WATSON_TTS_API_KEY;
      const serviceUrl = process.env.WATSON_TTS_URL;
      
      if (!apiKey || !serviceUrl) {
        console.log('⚠️ Watson TTS credentials not found, using fallback');
        this.initialized = false;
        return false;
      }

      this.tts = new TextToSpeechV1({
        authenticator: new IamAuthenticator({
          apikey: apiKey,
        }),
        serviceUrl: serviceUrl,
      });

      console.log('✅ Watson TTS service initialized');
      console.log(`   Service URL: ${serviceUrl}`);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watson TTS:', error.message);
      this.initialized = false;
      return false;
    }
  }

  async generatePodcastWithSync(text, options = {}) {
    if (!this.initialized || !this.tts) {
      console.log('⚠️ Watson TTS not available, using fallback');
      return this.generateFallbackPodcastData(text, options);
    }

    try {
      return await this.generateRealPodcastData(text, options);
    } catch (error) {
      console.error('❌ Error generating real podcast:', error.message);
      return this.generateFallbackPodcastData(text, options);
    }
  }

  async generateRealPodcastData(text, options = {}) {
    const { voice = 'en-US_AllisonV3Voice', format = 'mp3' } = options;
    
    console.log(`🎙️ Generating real podcast with Watson TTS...`);
    
    // Truncate text if too long for TTS (Watson has limits)
    const maxLength = 5000; // Reasonable limit for TTS
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    const synthesizeParams = {
      text: truncatedText,
      voice: voice,
      accept: `audio/${format}`,
    };

    const audioResponse = await this.tts.synthesize(synthesizeParams);
    
    // Convert the stream to buffer properly
    const chunks = [];
    audioResponse.result.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    await new Promise((resolve, reject) => {
      audioResponse.result.on('end', resolve);
      audioResponse.result.on('error', reject);
    });
    
    const audioBuffer = Buffer.concat(chunks);
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `podcast_${timestamp}.${format}`;
    const audioPath = path.join(this.audioDir, filename);
    
    // Save audio file
    fs.writeFileSync(audioPath, audioBuffer);
    
    console.log(`✅ Generated real podcast audio: ${filename}`);
    
    return {
      audioFile: filename,
      audioUrl: `/api/audio/${filename}`,
      duration: this.estimateDuration(truncatedText),
      syncData: this.generateSyncData(truncatedText),
      transcript: truncatedText,
      voice: voice,
      format: format,
      pages: Math.ceil(text.length / 1000),
      realAudio: true
    };
  }

  generateFallbackPodcastData(text, options = {}) {
    const { voice = 'fallback-voice', format = 'mp3' } = options;
    
    console.log(`📼 Using fallback podcast data (no TTS available)`);

    // Create a simple mock audio file for demo
    const timestamp = Date.now();
    const filename = `fallback_${timestamp}.wav`;
    const audioPath = path.join(this.audioDir, filename);
    
    // Create a simple audio file with beeps/tones
    const audioBuffer = this.createFallbackAudioFile(text);
    fs.writeFileSync(audioPath, audioBuffer);

    return {
      audioFile: filename,
      audioUrl: `/api/audio/${filename}`,
      duration: this.estimateDuration(text),
      syncData: this.generateSyncData(text),
      transcript: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
      voice: voice,
      format: 'wav',
      pages: Math.ceil(text.length / 1000),
      realAudio: false,
      fallback: true
    };
  }

  estimateDuration(text) {
    // Estimate duration based on average speaking rate (150 words per minute)
    const words = text.split(/\s+/).length;
    const wordsPerMinute = 150;
    return Math.ceil((words / wordsPerMinute) * 60); // Duration in seconds
  }

  createFallbackAudioFile(text) {
    // Create a minimal WAV file with simple tone sequence for demo
    const sampleRate = 44100;
    const duration = Math.min(this.estimateDuration(text), 30); // Max 30 seconds for demo
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;
    
    const buffer = Buffer.alloc(44 + dataSize);
    let offset = 0;
    
    // WAV header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4;
    buffer.writeUInt16LE(1, offset); offset += 2;
    buffer.writeUInt16LE(numChannels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    
    // Generate varying tones to represent speech patterns
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      const frequency = 200 + (Math.sin(time * 0.5) * 100); // Varying frequency
      const amplitude = 0.1 * Math.sin(time * 10); // Varying amplitude
      const sample = Math.sin(2 * Math.PI * frequency * time) * amplitude;
      buffer.writeInt16LE(Math.floor(sample * 32767), offset);
      offset += 2;
    }
    
    return buffer;
  }

  generateSyncData(text) {
    const words = text.split(/\s+/).slice(0, 200); // Limit for performance
    const syncData = [];
    let currentTime = 0;
    const avgWordsPerMinute = 150;
    const secondsPerWord = 60 / avgWordsPerMinute;
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 0) {
        syncData.push({
          word: cleanWord,
          start: currentTime,
          end: currentTime + secondsPerWord,
          page: Math.floor(index / 100) + 1,
          coordinates: {
            x: Math.random() * 500 + 50,
            y: Math.random() * 600 + 50 + (Math.floor(index / 20) * 20),
            width: cleanWord.length * 8,
            height: 16
          },
          originalText: word
        });
        currentTime += secondsPerWord;
      }
    });
    
    return syncData;
  }

  getAvailableVoices() {
    if (!this.initialized) {
      return ['en-US_AllisonV3Voice', 'en-US_MichaelV3Voice', 'en-GB_KateV3Voice'];
    }
    
    // Return common Watson TTS voices
    return [
      'en-US_AllisonV3Voice',
      'en-US_MichaelV3Voice', 
      'en-US_EmilyV3Voice',
      'en-GB_KateV3Voice',
      'en-GB_JamesV3Voice',
      'es-ES_EnriqueV3Voice',
      'fr-FR_ReneeV3Voice',
      'de-DE_BirgitV3Voice'
    ];
  }
}

module.exports = new TextToSpeechService();
