const fs = require('fs');
const path = require('path');

class TextToSpeechService {
  constructor() {
    this.audioDir = path.join(__dirname, '..', 'uploads', 'audio');
    
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
      console.log('📁 Created audio directory:', this.audioDir);
    }
  }

  initialize() {
    console.log('⚠️ Watson TTS credentials not found, using mock data');
    return false;
  }

  async generatePodcastWithSync(text, options = {}) {
    return this.generateMockPodcastData(text, options);
  }

  generateMockPodcastData(text, options = {}) {
    const { voice = 'mock-voice', format = 'mp3' } = options;
    
    // Use existing good audio file for demo
    const filename = `1754509969554.mp3`;
    
    console.log(`📼 Using demo audio file: ${filename}`);

    return {
      audioFile: filename,
      duration: Math.min(text.length / 20, 60), // Reduced duration for demo
      syncData: this.generateMockSyncData(text),
      transcript: text,
      voice: voice,
      format: 'mp3',
      pages: Math.ceil(text.length / 1000)
    };
  }

  createMockAudioFile() {
    // Create a minimal WAV file with silence for demo purposes
    const sampleRate = 44100;
    const duration = 5; // 5 seconds
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
    buffer.writeUInt32LE(16, offset); offset += 4; // PCM format
    buffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat
    buffer.writeUInt16LE(numChannels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    
    // Generate simple tone for audio content
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1; // 440Hz tone at low volume
      buffer.writeInt16LE(Math.floor(sample * 32767), offset);
      offset += 2;
    }
    
    return buffer;
  }

  generateMockSyncData(text) {
    const words = text.split(/\s+/).slice(0, 100);
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
}

module.exports = new TextToSpeechService();
