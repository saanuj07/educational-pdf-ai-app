const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
require('dotenv').config();

// Test TTS credentials
async function testTTS() {
  try {
    console.log('🧪 Testing Watson TTS credentials...');
    console.log('API Key:', process.env.WATSON_TTS_API_KEY ? '✓ Found' : '❌ Missing');
    console.log('URL:', process.env.WATSON_TTS_URL || 'Missing');
    
    if (!process.env.WATSON_TTS_API_KEY || !process.env.WATSON_TTS_URL) {
      console.log('❌ Missing TTS credentials');
      return;
    }

    const tts = new TextToSpeechV1({
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_TTS_API_KEY,
      }),
      serviceUrl: process.env.WATSON_TTS_URL,
    });

    // Test with simple text
    const testText = "Hello, this is a test of Watson Text to Speech service.";
    
    console.log('🎙️ Testing TTS with simple text...');
    const synthesizeParams = {
      text: testText,
      voice: 'en-US_AllisonV3Voice',
      accept: 'audio/mp3',
    };

    const response = await tts.synthesize(synthesizeParams);
    console.log('✅ TTS test successful!');
    console.log('Response type:', typeof response.result);
    
    // Handle different response types
    if (response.result && typeof response.result.pipe === 'function') {
      console.log('Response is a stream');
      const chunks = [];
      response.result.on('data', (chunk) => chunks.push(chunk));
      await new Promise((resolve, reject) => {
        response.result.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          console.log('Audio data length:', audioBuffer.length, 'bytes');
          resolve();
        });
        response.result.on('error', reject);
      });
    } else if (Buffer.isBuffer(response.result)) {
      console.log('Response is a buffer');
      console.log('Audio data length:', response.result.length, 'bytes');
    } else {
      console.log('Response format:', response.result.constructor.name);
      console.log('Audio data length: Unknown format');
    }
    
  } catch (error) {
    console.error('❌ TTS test failed:', error.message);
    if (error.code === 400) {
      console.log('🔍 This might be a text format issue or API limit');
    } else if (error.code === 401) {
      console.log('🔍 This is an authentication issue - check your API key');
    } else if (error.code === 403) {
      console.log('🔍 This is an authorization issue - check your service instance');
    }
  }
}

testTTS();
