const localStorage = require('../utils/localStorage');

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
    
    // Simple Q&A logic (replace with Watsonx.ai later)
    const keywords = question.toLowerCase().split(' ');
    const sentences = text.split(/[.!?]+/);
    
    // Find relevant sentences containing keywords
    const relevantSentences = sentences.filter(sentence => 
      keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    const answer = relevantSentences.length > 0 
      ? relevantSentences[0].trim() + '.'
      : 'I couldn\'t find relevant information in the document to answer your question.';
    
    res.json({ 
      question,
      answer,
      relevantSentences: relevantSentences.length
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};
