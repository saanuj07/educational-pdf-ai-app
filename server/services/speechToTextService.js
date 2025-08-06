const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const ibmConfig = require('../config/ibm');
const fs = require('fs');
const path = require('path');

class SpeechToTextService {
  constructor() {
    this.stt = null;
    this.initialized = false;
  }

  initialize() {
    if (!ibmConfig.sttApiKey || !ibmConfig.sttUrl) {
      console.log('⚠️ Watson STT credentials not found, STT features disabled');
      return false;
    }

    try {
      this.stt = new SpeechToTextV1({
        authenticator: new IamAuthenticator({
          apikey: ibmConfig.sttApiKey,
        }),
        serviceUrl: ibmConfig.sttUrl,
      });

      this.initialized = true;
      console.log('✅ Watson STT service initialized (AU-SYD)');
      console.log(`   Service URL: ${ibmConfig.sttUrl}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watson STT:', error.message);
      return false;
    }
  }

  async transcribeAudio(audioPath, options = {}) {
    if (!this.initialized) {
      throw new Error('STT service not initialized');
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio file not found');
    }

    const defaultOptions = {
      model: 'en-US_BroadbandModel',
      smartFormatting: true,
      speakerLabels: false,
      timestamps: true,
      wordConfidence: true
    };

    const recognizeParams = {
      audio: fs.createReadStream(audioPath),
      contentType: this.getAudioContentType(audioPath),
      model: options.model || defaultOptions.model,
      smartFormatting: options.smartFormatting !== undefined ? options.smartFormatting : defaultOptions.smartFormatting,
      speakerLabels: options.speakerLabels !== undefined ? options.speakerLabels : defaultOptions.speakerLabels,
      timestamps: options.timestamps !== undefined ? options.timestamps : defaultOptions.timestamps,
      wordConfidence: options.wordConfidence !== undefined ? options.wordConfidence : defaultOptions.wordConfidence
    };

    try {
      console.log(`[STT-INFO] Transcribing audio file: ${path.basename(audioPath)}`);
      
      const response = await this.stt.recognize(recognizeParams);
      const results = response.result.results;
      
      if (!results || results.length === 0) {
        console.log('[STT-WARNING] No speech detected in audio');
        return {
          transcript: '',
          confidence: 0,
          words: [],
          timestamps: []
        };
      }

      // Combine all results into final transcript
      let fullTranscript = '';
      let allWords = [];
      let allTimestamps = [];
      let totalConfidence = 0;

      results.forEach(result => {
        if (result.alternatives && result.alternatives.length > 0) {
          const alternative = result.alternatives[0];
          fullTranscript += alternative.transcript + ' ';
          totalConfidence += alternative.confidence || 0;

          if (alternative.timestamps) {
            allTimestamps.push(...alternative.timestamps);
          }

          if (alternative.word_confidence) {
            allWords.push(...alternative.word_confidence);
          }
        }
      });

      const averageConfidence = totalConfidence / results.length;
      
      console.log(`[STT-INFO] Transcription complete - ${fullTranscript.trim().length} characters, confidence: ${(averageConfidence * 100).toFixed(1)}%`);
      
      return {
        transcript: fullTranscript.trim(),
        confidence: averageConfidence,
        words: allWords,
        timestamps: allTimestamps,
        resultsCount: results.length
      };
    } catch (error) {
      console.error('[STT-ERROR] Transcription failed:', error.message);
      throw error;
    }
  }

  async transcribeAudioBuffer(audioBuffer, contentType, options = {}) {
    if (!this.initialized) {
      throw new Error('STT service not initialized');
    }

    const defaultOptions = {
      model: 'en-US_BroadbandModel',
      smartFormatting: true,
      speakerLabels: false,
      timestamps: true,
      wordConfidence: true
    };

    const recognizeParams = {
      audio: audioBuffer,
      contentType: contentType,
      model: options.model || defaultOptions.model,
      smartFormatting: options.smartFormatting !== undefined ? options.smartFormatting : defaultOptions.smartFormatting,
      speakerLabels: options.speakerLabels !== undefined ? options.speakerLabels : defaultOptions.speakerLabels,
      timestamps: options.timestamps !== undefined ? options.timestamps : defaultOptions.timestamps,
      wordConfidence: options.wordConfidence !== undefined ? options.wordConfidence : defaultOptions.wordConfidence
    };

    try {
      console.log(`[STT-INFO] Transcribing audio buffer (${audioBuffer.length} bytes)`);
      
      const response = await this.stt.recognize(recognizeParams);
      const results = response.result.results;
      
      if (!results || results.length === 0) {
        console.log('[STT-WARNING] No speech detected in audio');
        return {
          transcript: '',
          confidence: 0,
          words: [],
          timestamps: []
        };
      }

      // Process results same as transcribeAudio
      let fullTranscript = '';
      let allWords = [];
      let allTimestamps = [];
      let totalConfidence = 0;

      results.forEach(result => {
        if (result.alternatives && result.alternatives.length > 0) {
          const alternative = result.alternatives[0];
          fullTranscript += alternative.transcript + ' ';
          totalConfidence += alternative.confidence || 0;

          if (alternative.timestamps) {
            allTimestamps.push(...alternative.timestamps);
          }

          if (alternative.word_confidence) {
            allWords.push(...alternative.word_confidence);
          }
        }
      });

      const averageConfidence = totalConfidence / results.length;
      
      console.log(`[STT-INFO] Transcription complete - ${fullTranscript.trim().length} characters, confidence: ${(averageConfidence * 100).toFixed(1)}%`);
      
      return {
        transcript: fullTranscript.trim(),
        confidence: averageConfidence,
        words: allWords,
        timestamps: allTimestamps,
        resultsCount: results.length
      };
    } catch (error) {
      console.error('[STT-ERROR] Transcription failed:', error.message);
      throw error;
    }
  }

  getAudioContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mp3',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.opus': 'audio/ogg;codecs=opus',
      '.webm': 'audio/webm'
    };

    return contentTypes[ext] || 'audio/wav';
  }

  getSupportedModels() {
    return {
      'en-US_BroadbandModel': 'English (US) - Broadband',
      'en-US_NarrowbandModel': 'English (US) - Narrowband',
      'en-GB_BroadbandModel': 'English (UK) - Broadband',
      'en-GB_NarrowbandModel': 'English (UK) - Narrowband',
      'es-ES_BroadbandModel': 'Spanish (Spain) - Broadband',
      'es-ES_NarrowbandModel': 'Spanish (Spain) - Narrowband',
      'fr-FR_BroadbandModel': 'French - Broadband',
      'de-DE_BroadbandModel': 'German - Broadband',
      'ja-JP_BroadbandModel': 'Japanese - Broadband',
      'zh-CN_BroadbandModel': 'Chinese (Mandarin) - Broadband'
    };
  }

  getSupportedFormats() {
    return [
      'audio/wav',
      'audio/mp3',
      'audio/flac',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/webm'
    ];
  }
}

// Create singleton instance
const sttService = new SpeechToTextService();

module.exports = sttService;
