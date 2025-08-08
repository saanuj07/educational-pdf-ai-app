const localStorage = require('../utils/localStorage');
const watsonxService = require('../services/watsonxService');
const winston = require('../utils/logger');

exports.chat = async (req, res) => {
  try {
    const { fileId, question } = req.body;
    
    const fileData = localStorage.getFileMetadata(fileId);
    if (!fileData) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const text = fileData.text;
    
    // Check if this is an AI Agent prefixed question
    const isAIAgentQuery = question.startsWith('[AI Agent]:');
    const cleanQuestion = isAIAgentQuery ? question.replace('[AI Agent]:', '').trim() : question;
    
    // Build context for Watson AI
    const documentContext = {
      filename: fileData.filename || 'Document',
      text: text,
      textLength: text.length,
      uploadDate: fileData.uploadDate || new Date().toISOString()
    };
    
    // Create system prompt for Watson AI
    const systemPrompt = `You are an AI Learning Assistant helping with document analysis. 
Document: ${documentContext.filename}
Context: ${text.substring(0, 2000)}...

Answer the user's question based on the document content. Be helpful, accurate, and educational.`;
    
    try {
      // Try Watson AI first
      console.log(`[CHAT] 🤖 Processing ${isAIAgentQuery ? 'AI Agent' : 'regular'} question with Watson AI`);
      
      const fullPrompt = `${systemPrompt}\n\nQuestion: ${cleanQuestion}\n\nAnswer:`;
      
      const watsonResponse = await watsonxService.generateText(fullPrompt, {
        max_new_tokens: 300,
        temperature: 0.7,
        top_p: 0.9
      });
      
      console.log('[CHAT] 📝 Watson response received:', watsonResponse ? 'Success' : 'Empty');
      
      if (watsonResponse && watsonResponse.trim()) {
        console.log('[CHAT] ✅ Watson AI response generated successfully');
        return res.json({ 
          question: cleanQuestion,
          answer: watsonResponse.trim(),
          source: 'watson',
          confidence: 0.9
        });
      }
      console.log('[CHAT] ⚠️ Watson response was empty, falling back');
    } catch (error) {
      console.log(`[CHAT] ❌ Watson AI failed, using fallback: ${error.message}`);
    }
    
    // Fallback to keyword search
    const keywords = cleanQuestion.toLowerCase().split(' ');
    const sentences = text.split(/[.!?]+/);
    
    // Find relevant sentences containing keywords
    const relevantSentences = sentences.filter(sentence => 
      keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    const answer = relevantSentences.length > 0 
      ? relevantSentences[0].trim() + '.'
      : 'I couldn\'t find relevant information in the document to answer your question. Try asking about specific topics or concepts from the document.';
    
    res.json({ 
      question: cleanQuestion,
      answer,
      source: 'fallback',
      relevantSentences: relevantSentences.length
    });
  } catch (error) {
    winston.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};
