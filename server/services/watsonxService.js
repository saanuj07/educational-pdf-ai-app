// Integration with IBM Watsonx.ai - EU-DE Region
const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');
const config = require('../config/ibm');

// This file has been updated to use the centralized config file
// ensuring consistent environment variable access across the application.

class WatsonxService {
  constructor() {
    this.watsonx = null;
    this.initialized = false;
    // Use centralized config instead of direct env access
    this.watsonxApiKey = config.watsonxApiKey;
    this.watsonxUrl = config.watsonxUrl;
    this.modelId = config.watsonModelId;
    this.spaceId = config.spaceId;

    this.initialize();
  }

  initialize() {
    if (!this.watsonxApiKey || !this.watsonxUrl) {
      console.log('⚠️ Watsonx.ai credentials not found, using intelligent fallback');
      console.log('   Missing credentials:', {
        apiKey: this.watsonxApiKey ? 'Found' : 'Missing',
        url: this.watsonxUrl ? 'Found' : 'Missing',
        spaceId: this.spaceId ? 'Found' : 'Missing'
      });
      this.initialized = false;
      return false;
    }

    try {
      // Initialize Watson AI SDK with proper authenticator
      this.watsonx = new WatsonXAI({
        authenticator: new IamAuthenticator({
          apikey: this.watsonxApiKey,
        }),
        serviceUrl: this.watsonxUrl,
        version: '2024-05-31'
      });

      this.initialized = true;
      console.log(`✅ Watsonx.ai service fully initialized (EU-DE)`);
      console.log(`   Model: ${this.modelId}`);
      console.log(`   Space ID: ${this.spaceId}`);
      console.log(`   SDK: @ibm-cloud/watsonx-ai connected`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watsonx.ai:', error.message);
      this.initialized = false;
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    if (!this.initialized) {
      console.log('[WATSONX-ERROR] Service not initialized, cannot generate content without Watson AI');
      throw new Error('Watson AI service required for content generation but not available');
    }

    const params = {
      modelId: this.modelId,
      input: prompt,
      parameters: {
        max_new_tokens: options.max_new_tokens || 500,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.85,
        stop_sequences: options.stopSequences || []
      },
      spaceId: this.spaceId
    };

    try {
      console.log(`[WATSONX-INFO] Generating text with Watson AI model: ${this.modelId}`);
      
      // Use actual Watson AI SDK
      const response = await this.watsonx.generateText(params);
      
      if (response && response.results && response.results[0] && response.results[0].generated_text) {
        const generatedText = response.results[0].generated_text.trim();
        console.log('[WATSONX-SUCCESS] Watson AI response generated successfully');
        return generatedText;
      }
      
      console.log('[WATSONX-ERROR] Watson AI returned empty response');
      throw new Error('Watson AI returned empty response');
      
    } catch (error) {
      console.error(`[WATSONX-ERROR] Watson AI failed: ${error.message}`);
      throw new Error(`Watson AI generation failed: ${error.message}`);
    }
  }

  generateSmartFallback(prompt) {
    console.log('[WATSONX-FALLBACK] Watson AI service not available - cannot generate content without AI analysis');
    
    // Return null to force the system to use Watson NLU or fail gracefully
    // This prevents hardcoded responses and ensures real content analysis
    if (prompt.toLowerCase().includes('flashcard') || prompt.toLowerCase().includes('quiz')) {
      console.log('[WATSONX-FALLBACK] Flashcard/Quiz generation requires Watson AI - no fallback available');
      return null;
    }
    
    // For other requests, return null to force proper error handling
    console.log('[WATSONX-FALLBACK] No hardcoded fallback - requiring actual AI analysis');
    return null;
  }
}

// Create singleton instance
const watsonxService = new WatsonxService();

module.exports = watsonxService;
