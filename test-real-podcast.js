const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Simple test without requiring server modules
async function testRealPodcastGeneration() {
  try {
    console.log('🧪 Testing real podcast generation with Watson TTS...');
    
    // Test data - simulating a PDF upload scenario
    const testText = `
    Artificial Intelligence has revolutionized many industries in recent years. 
    Machine learning algorithms can now process vast amounts of data to identify 
    patterns and make predictions. Natural language processing enables computers 
    to understand and generate human language. These technologies are being used 
    in healthcare, finance, education, and many other fields. The future of AI 
    holds great promise for solving complex problems and improving human life.
    `;

    // Make request to generate podcast
    const response = await axios.post('http://localhost:5000/api/generate-podcast', {
      text: testText,
      options: {
        voice: 'en-US_AllisonV3Voice',
        format: 'mp3'
      }
    });

    console.log('✅ Podcast generation response received!');
    console.log('📊 Response data:', {
      audioFile: response.data.audioFile,
      audioUrl: response.data.audioUrl,
      duration: response.data.duration,
      voice: response.data.voice,
      realAudio: response.data.realAudio,
      fallback: response.data.fallback
    });

    // Check if audio file exists
    const audioPath = path.join(__dirname, 'server', 'uploads', 'audio', response.data.audioFile);
    const audioExists = fs.existsSync(audioPath);
    
    console.log(`🎵 Audio file exists: ${audioExists ? '✅ YES' : '❌ NO'}`);
    if (audioExists) {
      const stats = fs.statSync(audioPath);
      console.log(`📁 Audio file size: ${stats.size} bytes`);
    }

    // Test if we can access the audio URL
    try {
      const audioResponse = await axios.get(`http://localhost:5000${response.data.audioUrl}`, {
        responseType: 'arraybuffer'
      });
      console.log(`🌐 Audio URL accessible: ✅ YES (${audioResponse.data.length} bytes)`);
    } catch (error) {
      console.log(`🌐 Audio URL accessible: ❌ NO (${error.message})`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Error response:', error.response.data);
    }
    return null;
  }
}

// Run the test
testRealPodcastGeneration()
  .then(result => {
    if (result) {
      console.log('\n🎉 Test completed successfully!');
      console.log(`🔍 Real audio generated: ${result.realAudio ? 'YES' : 'NO (fallback used)'}`);
    } else {
      console.log('\n💥 Test failed');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });
