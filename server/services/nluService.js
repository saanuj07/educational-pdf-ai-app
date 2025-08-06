const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const ibmConfig = require('../config/ibm');

class NLUService {
  constructor() {
    this.nlu = null;
    this.initialized = false;
  }

  initialize() {
    if (!ibmConfig.nluApiKey || !ibmConfig.nluUrl) {
      console.log('⚠️ Watson NLU credentials not found, NLU features disabled');
      return false;
    }

    try {
      this.nlu = new NaturalLanguageUnderstandingV1({
        version: '2022-04-07',
        authenticator: new IamAuthenticator({
          apikey: ibmConfig.nluApiKey,
        }),
        serviceUrl: ibmConfig.nluUrl,
      });

      this.initialized = true;
      console.log('✅ Watson NLU service initialized (AU-SYD)');
      console.log(`   Service URL: ${ibmConfig.nluUrl}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Watson NLU:', error.message);
      return false;
    }
  }

  async analyzeText(text, features = {}) {
    if (!this.initialized) {
      throw new Error('NLU service not initialized');
    }

    const defaultFeatures = {
      concepts: {
        limit: 5
      },
      keywords: {
        limit: 10,
        sentiment: true,
        emotion: true
      },
      categories: {
        limit: 3
      },
      sentiment: {
        document: true
      },
      emotion: {
        document: true
      }
    };

    const analyzeParams = {
      text: text,
      features: { ...defaultFeatures, ...features }
    };

    try {
      console.log(`[NLU-INFO] Analyzing text (${text.length} characters)`);
      const response = await this.nlu.analyze(analyzeParams);
      
      console.log(`[NLU-INFO] Analysis complete - found ${response.result.keywords?.length || 0} keywords, ${response.result.concepts?.length || 0} concepts`);
      
      return {
        keywords: response.result.keywords || [],
        concepts: response.result.concepts || [],
        categories: response.result.categories || [],
        sentiment: response.result.sentiment || null,
        emotion: response.result.emotion || null
      };
    } catch (error) {
      console.error('[NLU-ERROR] Analysis failed:', error.message);
      throw error;
    }
  }

  async extractKeywords(text, limit = 10) {
    if (!this.initialized) {
      // Fallback: simple keyword extraction
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter((word, index, arr) => arr.indexOf(word) === index)
        .slice(0, limit);
      
      return words.map(word => ({ text: word, relevance: 0.5 }));
    }

    try {
      const result = await this.analyzeText(text, {
        keywords: { limit, sentiment: true }
      });
      return result.keywords;
    } catch (error) {
      console.error('Failed to extract keywords:', error.message);
      // Fallback to simple extraction
      return this.extractKeywords(text, limit);
    }
  }

  async extractConcepts(text, limit = 5) {
    if (!this.initialized) {
      // Fallback: return empty array
      return [];
    }

    try {
      const result = await this.analyzeText(text, {
        concepts: { limit }
      });
      return result.concepts;
    } catch (error) {
      console.error('Failed to extract concepts:', error.message);
      return [];
    }
  }

  async getSentiment(text) {
    if (!this.initialized) {
      // Fallback: neutral sentiment
      return { document: { score: 0, label: 'neutral' } };
    }

    try {
      const result = await this.analyzeText(text, {
        sentiment: { document: true }
      });
      return result.sentiment;
    } catch (error) {
      console.error('Failed to analyze sentiment:', error.message);
      return { document: { score: 0, label: 'neutral' } };
    }
  }
}

// Create singleton instance
const nluService = new NLUService();

module.exports = nluService;
