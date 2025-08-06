const localStorage = require('../utils/localStorage');
const nluService = require('../services/nluService');

exports.generateFlashcards = async (req, res) => {
  const startTime = Date.now();
  console.log(`[FLASHCARDS-INFO] API called: /api/generate-flashcards`);
  
  try {
    const { fileId, count = 5, useNLU = true } = req.body;
    
    const fileData = localStorage.getFileMetadata(fileId);
    if (!fileData) {
      console.log(`[FLASHCARDS-ERROR] Invalid file ID: ${fileId}`);
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    const text = fileData.text;
    
    console.log(`[FLASHCARDS-INFO] Generating flashcards {
  "filename": "${fileData.filename}",
  "textLength": ${text.length},
  "count": ${count},
  "useNLU": ${useNLU}
}`);

    let flashcards = [];

    // Use NLU for better keyword-based flashcards if available
    if (useNLU && nluService.initialized) {
      try {
        console.log(`[FLASHCARDS-INFO] Using NLU for keyword extraction...`);
        const keywords = await nluService.extractKeywords(text, count * 2);
        
        flashcards = keywords.slice(0, count).map((keyword, index) => ({
          id: index + 1,
          question: `What is the significance of "${keyword.text}" in this document?`,
          answer: findContextForKeyword(text, keyword.text),
          keyword: keyword.text,
          relevance: keyword.relevance,
          type: 'keyword-based'
        }));
        
        console.log(`[FLASHCARDS-INFO] Generated ${flashcards.length} NLU-based flashcards`);
      } catch (error) {
        console.log(`[FLASHCARDS-WARNING] NLU generation failed, falling back to simple method: ${error.message}`);
        useNLU = false;
      }
    }

    // Fallback to simple sentence-based flashcards
    if (!useNLU || !nluService.initialized || flashcards.length === 0) {
      console.log(`[FLASHCARDS-INFO] Using simple sentence-based generation...`);
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      flashcards = sentences.slice(0, count).map((sentence, index) => ({
        id: index + 1,
        question: `What is the main idea of: "${sentence.trim().substring(0, 50)}..."?`,
        answer: sentence.trim(),
        type: 'sentence-based'
      }));
    }

    const duration = Date.now() - startTime;
    console.log(`[FLASHCARDS-INFO] Flashcards generated {
  "count": ${flashcards.length},
  "method": "${flashcards[0]?.type || 'unknown'}",
  "processingTime": "${duration}ms"
}`);

    res.json({ 
      flashcards,
      metadata: {
        filename: fileData.filename,
        method: flashcards[0]?.type || 'simple',
        generatedAt: new Date().toISOString(),
        processingTime: duration
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[FLASHCARDS-ERROR] Generation failed after ${duration}ms:`, error.message);
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
};

// Helper function to find context for a keyword
function findContextForKeyword(text, keyword) {
  const sentences = text.split(/[.!?]+/);
  const keywordLower = keyword.toLowerCase();
  
  // Find sentence containing the keyword
  const contextSentence = sentences.find(sentence => 
    sentence.toLowerCase().includes(keywordLower)
  );
  
  if (contextSentence) {
    return contextSentence.trim();
  }
  
  // If not found in sentences, return first paragraph containing keyword
  const paragraphs = text.split('\n\n');
  const contextParagraph = paragraphs.find(paragraph => 
    paragraph.toLowerCase().includes(keywordLower)
  );
  
  if (contextParagraph) {
    // Return first sentence of the paragraph
    const firstSentence = contextParagraph.split(/[.!?]+/)[0];
    return firstSentence.trim();
  }
  
  return `This keyword appears in the context of the document content.`;
}
