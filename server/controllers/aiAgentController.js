const winston = require('../utils/logger');
const localStorage = require('../utils/localStorage');
const watsonxService = require('../services/watsonxService');

const ERROR_CODES = {
  AI_AGENT_001: 'Missing required parameters for AI agent',
  AI_AGENT_002: 'Document not found',
  AI_AGENT_003: 'AI service unavailable',
  AI_AGENT_004: 'Invalid conversation mode',
  AI_AGENT_005: 'Message processing failed'
};

// AI Agent personalities and their characteristics
const PERSONALITIES = {
  helpful: {
    tone: "friendly and supportive",
    style: "Clear explanations with encouraging language",
    greeting: "I'm here to help you learn!"
  },
  academic: {
    tone: "formal and scholarly",
    style: "Precise academic language with detailed explanations",
    greeting: "I shall assist you with your academic inquiries."
  },
  casual: {
    tone: "relaxed and conversational", 
    style: "Easy-going explanations with simple language",
    greeting: "Hey there! Ready to dive into your document?"
  },
  encouraging: {
    tone: "motivating and positive",
    style: "Uplifting language that builds confidence",
    greeting: "You're doing great! Let's explore this together!"
  }
};

// Conversation modes and their focus
const CONVERSATION_MODES = {
  chat: "general conversation and questions",
  tutor: "step-by-step teaching and explanation",
  quiz: "testing knowledge and asking questions",
  study: "study strategies and learning techniques"
};

class AIAgentController {
  
  async chatWithAgent(req, res) {
    const controllerPath = 'server/controllers/aiAgentController.js';
    winston.info(`[AI-AGENT] Chat request received`);
    
    try {
      const { documentId, message, conversationHistory, personality, mode, pdfData } = req.body;
      
      // Validate required parameters
      if (!message || !message.trim()) {
        return res.status(400).json({
          error: ERROR_CODES.AI_AGENT_001,
          code: 'AI_AGENT_001',
          location: `${controllerPath}:line 45`,
          details: 'Message is required for AI agent interaction',
          resolution: 'Provide a valid message in the request body'
        });
      }
      
      // Get document data if documentId is provided
      let documentContext = null;
      if (documentId) {
        documentContext = localStorage.getFileMetadata(documentId);
        if (!documentContext) {
          winston.warn(`[AI-AGENT] Document ${documentId} not found`);
          // Don't fail - agent can still help without document context
        }
      }
      
      // Build context for AI
      const agentPersonality = PERSONALITIES[personality] || PERSONALITIES.helpful;
      const conversationMode = CONVERSATION_MODES[mode] || CONVERSATION_MODES.chat;
      
      const systemPrompt = this.buildSystemPrompt(agentPersonality, conversationMode, documentContext, pdfData);
      const conversationContext = this.buildConversationContext(conversationHistory);
      
      winston.info(`[AI-AGENT] Processing message with personality: ${personality}, mode: ${mode}`);
      
      // Generate AI response using Watson
      const aiResponse = await this.generateAIResponse(systemPrompt, conversationContext, message);
      
      // Analyze response for suggestions and actions
      const suggestions = this.generateSuggestions(message, documentContext);
      const actions = this.generateActions(message, documentContext);
      
      const response = {
        message: aiResponse.text,
        confidence: aiResponse.confidence || 0.9,
        suggestions: suggestions,
        actions: actions,
        personality: personality,
        mode: mode,
        timestamp: new Date().toISOString(),
        metadata: {
          controller: 'aiAgentController',
          documentId: documentId,
          hasDocument: !!documentContext
        }
      };
      
      winston.info(`[AI-AGENT] Response generated successfully`);
      res.json(response);
      
    } catch (error) {
      winston.error(`[AI-AGENT] Error in chatWithAgent:`, error);
      res.status(500).json({
        error: ERROR_CODES.AI_AGENT_005,
        code: 'AI_AGENT_005',
        location: `${controllerPath}:line 85`,
        details: 'Failed to process AI agent message',
        resolution: 'Check server logs and try again',
        originalError: error.message
      });
    }
  }
  
  buildSystemPrompt(personality, mode, documentContext, pdfData) {
    let prompt = `You are an AI Learning Assistant with a ${personality.tone} personality. `;
    prompt += `Your communication style: ${personality.style}. `;
    prompt += `You are currently in ${mode} mode. `;
    
    if (documentContext) {
      prompt += `\n\nDocument Context:\n`;
      prompt += `- Filename: ${documentContext.filename}\n`;
      prompt += `- Pages: ${documentContext.numPages}\n`;
      prompt += `- Text Length: ${documentContext.textLength} characters\n`;
      prompt += `- Upload Date: ${documentContext.uploadDate}\n`;
      
      // Include some document text for context (first 1000 characters)
      if (documentContext.text) {
        const textPreview = documentContext.text.substring(0, 1000);
        prompt += `\nDocument Preview: ${textPreview}...\n`;
      }
    }
    
    prompt += `\n\nYour capabilities include:
- Analyzing PDF documents and answering questions about their content
- Creating study materials (summaries, flashcards, quizzes)
- Explaining complex concepts in simple terms
- Providing learning strategies and study tips
- Helping with homework and assignments
- Generating interactive content like podcasts

Always be helpful, accurate, and educational. If you're not sure about something, say so. Keep responses concise but informative.`;
    
    return prompt;
  }
  
  buildConversationContext(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return "";
    }
    
    let context = "\n\nRecent Conversation:\n";
    conversationHistory.forEach(msg => {
      const role = msg.type === 'user' ? 'Human' : 'Assistant';
      context += `${role}: ${msg.content}\n`;
    });
    
    return context;
  }
  
  async generateAIResponse(systemPrompt, conversationContext, userMessage) {
    try {
      // Try Watson AI first
      const fullPrompt = `${systemPrompt}${conversationContext}\n\nHuman: ${userMessage}\n\nAssistant:`;
      
      const watsonResponse = await watsonxService.generateText(fullPrompt, {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      });
      
      if (watsonResponse && watsonResponse.trim()) {
        return {
          text: watsonResponse.trim(),
          confidence: 0.9,
          source: 'watson'
        };
      }
    } catch (error) {
      winston.warn(`[AI-AGENT] Watson AI failed, using fallback: ${error.message}`);
    }
    
    // Fallback to rule-based responses
    return this.generateFallbackResponse(userMessage);
  }
  
  generateFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return {
        text: "Hello! I'm your AI Learning Assistant. I can help you analyze documents, create study materials, and answer questions. What would you like to explore today?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    // Summary requests
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return {
        text: "I can help you create a comprehensive summary! Click the 'Generate Summary' action below, or I can analyze specific sections if you tell me what you're most interested in.",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    // Quiz requests
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('questions')) {
      return {
        text: "Great idea! I can create interactive quizzes to test your understanding. Use the 'Generate Quiz' action, or tell me what topics you'd like to focus on.",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    // Study help
    if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('understand')) {
      return {
        text: "I'm here to help you study effectively! I can create flashcards, explain concepts, generate practice questions, or help you develop study strategies. What specific area would you like to work on?",
        confidence: 0.8,
        source: 'fallback'
      };
    }
    
    // General help
    return {
      text: "I understand you're asking about: \"" + message + "\". While I'm having trouble connecting to my advanced AI services right now, I can still help you with document analysis, creating study materials, and answering questions. Could you be more specific about what you'd like to know?",
      confidence: 0.6,
      source: 'fallback'
    };
  }
  
  generateSuggestions(message, documentContext) {
    const suggestions = [];
    const lowerMessage = message.toLowerCase();
    
    if (documentContext) {
      suggestions.push("Explain the main concepts");
      suggestions.push("Create study questions about this");
      suggestions.push("What are the key takeaways?");
      suggestions.push("Generate a summary");
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
      suggestions.push("Can you give me an example?");
      suggestions.push("How does this relate to other concepts?");
      suggestions.push("Why is this important?");
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('study')) {
      suggestions.push("Create flashcards for this topic");
      suggestions.push("Make a quiz to test my knowledge");
      suggestions.push("Suggest study strategies");
    }
    
    // Always include some general suggestions
    if (suggestions.length < 3) {
      suggestions.push("How can I better understand this?");
      suggestions.push("What should I focus on?");
      suggestions.push("Give me practice questions");
    }
    
    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }
  
  generateActions(message, documentContext) {
    const actions = [];
    const lowerMessage = message.toLowerCase();
    
    if (documentContext) {
      if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
        actions.push({
          type: 'generate_summary',
          label: '📄 Generate Summary',
          description: 'Create a comprehensive summary of the document'
        });
      }
      
      if (lowerMessage.includes('flashcard') || lowerMessage.includes('cards')) {
        actions.push({
          type: 'create_flashcards',
          label: '🃏 Create Flashcards',
          description: 'Generate interactive flashcards for studying'
        });
      }
      
      if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('question')) {
        actions.push({
          type: 'generate_quiz',
          label: '❓ Generate Quiz',
          description: 'Create a quiz to test your knowledge'
        });
      }
      
      if (lowerMessage.includes('podcast') || lowerMessage.includes('audio') || lowerMessage.includes('listen')) {
        actions.push({
          type: 'create_podcast',
          label: '🎧 Create Podcast',
          description: 'Generate an interactive audio version'
        });
      }
    }
    
    return actions.slice(0, 3); // Limit to 3 actions
  }
}

module.exports = new AIAgentController();
