// Integration with IBM Watsonx.ai - EU-DE Region
const ibmConfig = require('../config/ibm');

class WatsonxService {
  constructor() {
    this.watsonx = null;
    this.initialized = false;
    this.modelId = ibmConfig.watsonModelId || 'ibm/granite-13b-instruct-v2';
    this.spaceId = ibmConfig.spaceId;
  }

  initialize() {
    if (!ibmConfig.watsonxApiKey || !ibmConfig.watsonxUrl) {
      console.log('⚠️ Watsonx.ai credentials not found, advanced AI features disabled');
      return false;
    }

    try {
      // Note: Install @ibm-cloud/watsonx-ai package when ready to use
      // this.watsonx = new WatsonxAI({
      //   apikey: ibmConfig.watsonxApiKey,
      //   serviceUrl: ibmConfig.watsonxUrl,
      //   projectId: ibmConfig.watsonxProjectId,
      //   spaceId: ibmConfig.spaceId
      // });

      this.initialized = true;
      console.log(`✅ Watsonx.ai service initialized (EU-DE)`);
      console.log(`   Model: ${this.modelId}`);
      console.log(`   Space ID: ${this.spaceId}`);
      console.log(`   Using Space ID (no Project ID required)`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watsonx.ai:', error.message);
      return false;
    }
  }

  async generateText(prompt, options = {}) {
    if (!this.initialized) {
      // Fallback: return simple response
      return {
        text: 'Watsonx.ai service not available. Please configure your API credentials.',
        fallback: true
      };
    }

    const params = {
      model_id: this.modelId,
      input: prompt,
      parameters: {
        max_new_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.85,
        stop_sequences: options.stopSequences || []
      },
      space_id: this.spaceId // Using space ID instead of project ID
    };

    try {
      console.log(`[WATSONX-INFO] Generating text with model: ${this.modelId} (Space: ${this.spaceId})`);
      
      // TODO: Uncomment when @ibm-cloud/watsonx-ai is installed
      // const response = await this.watsonx.generateText(params);
      // return {
      //   text: response.results[0].generated_text,
      //   tokenCount: response.results[0].generated_token_count,
      //   stopReason: response.results[0].stop_reason
      // };

      // Fallback response for now
      return {
        text: `Generated response would appear here using Watsonx.ai model ${this.modelId} with Space ID ${this.spaceId}`,
        fallback: true,
        prompt: prompt.substring(0, 100) + '...'
      };
    } catch (error) {
      console.error('[WATSONX-ERROR] Text generation failed:', error.message);
      throw error;
    }
  }

  async generateSummary(text, options = {}) {
    const prompt = `Please provide a concise summary of the following text:

${text}

Summary:`;

    return await this.generateText(prompt, {
      maxTokens: options.maxTokens || 300,
      temperature: 0.3,
      ...options
    });
  }

  async generateQuiz(text, questionCount = 5) {
    const prompt = `Based on the following text, create ${questionCount} multiple-choice questions with 4 options each. Format as JSON.

Text: ${text}

Questions:`;

    return await this.generateText(prompt, {
      maxTokens: 800,
      temperature: 0.5
    });
  }

  getConfiguration() {
    return {
      modelId: this.modelId,
      spaceId: this.spaceId,
      region: 'EU-DE',
      initialized: this.initialized,
      serviceUrl: ibmConfig.watsonxUrl
    };
  }
}

// Create singleton instance
const watsonxService = new WatsonxService();

module.exports = watsonxService;
