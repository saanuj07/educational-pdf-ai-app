const localStorage = require('../utils/localStorage');
const nluService = require('../services/nluService');
const watsonxService = require('../services/watsonxService');

exports.generateFlashcards = async (req, res) => {
  const startTime = Date.now();
  console.log(`[FLASHCARDS-INFO] API called: /api/generate-flashcards`);
  
  try {
    const { fileId, count = 5, useWatsonAI = true } = req.body;
    
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
  "useWatsonAI": ${useWatsonAI}
}`);

    let flashcards = [];

    // Try Watson AI first for high-quality flashcards
    if (useWatsonAI && watsonxService.initialized) {
      try {
        console.log(`[FLASHCARDS-INFO] Using Watson AI for flashcard generation...`);
        
        const prompt = `Based on the following content, create exactly ${count} educational flashcards. Each flashcard should have a clear question and a comprehensive answer that tests understanding of key concepts.

Content: ${text.substring(0, 2000)}

Format your response as a JSON array with this structure:
[
  {
    "question": "Clear, specific question about a key concept",
    "answer": "Detailed answer that explains the concept thoroughly",
    "concept": "Main concept being tested",
    "difficulty": "easy|medium|hard"
  }
]

Make sure the flashcards cover different important topics from the content and vary in difficulty level.`;

        const aiResponse = await watsonxService.generateText(prompt);
        
        if (aiResponse && typeof aiResponse === 'string') {
          const cleanedResponse = aiResponse.replace(/```json|```/g, '').trim();
          const parsedFlashcards = JSON.parse(cleanedResponse);
          
          if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
            flashcards = parsedFlashcards.map((card, index) => ({
              id: index + 1,
              question: card.question || 'Sample question',
              answer: card.answer || 'Sample answer',
              concept: card.concept || 'General',
              difficulty: card.difficulty || 'medium',
              type: 'watson-ai-generated',
              source: 'Watson AI'
            }));
            
            console.log(`[FLASHCARDS-INFO] Generated ${flashcards.length} Watson AI flashcards`);
          }
        }
      } catch (error) {
        console.log(`[FLASHCARDS-WARNING] Watson AI generation failed, falling back: ${error.message}`);
      }
    }

    // Fall back to NLU-based flashcards if Watson AI didn't work
    if (flashcards.length === 0 && nluService.initialized) {
      try {
        console.log(`[FLASHCARDS-INFO] Using NLU for keyword extraction...`);
        const keywords = await nluService.extractKeywords(text, count * 2);
        
        flashcards = keywords.slice(0, count).map((keyword, index) => ({
          id: index + 1,
          question: `What is the significance of "${keyword.text}" in this document?`,
          answer: findContextForKeyword(text, keyword.text),
          concept: keyword.text,
          difficulty: 'medium',
          type: 'nlu-keyword-based',
          source: 'Watson NLU',
          relevance: keyword.relevance
        }));
        
        console.log(`[FLASHCARDS-INFO] Generated ${flashcards.length} NLU-based flashcards`);
      } catch (error) {
        console.log(`[FLASHCARDS-WARNING] NLU generation failed, using content-based method: ${error.message}`);
      }
    }

    // Fallback to content-specific sentence-based flashcards
    if (!useNLU || !nluService.initialized || flashcards.length === 0) {
      console.log(`[FLASHCARDS-INFO] Using content-specific generation from PDF text...`);
      
      // Extract meaningful content from the PDF
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const keyPhrases = extractKeyPhrasesFromText(text);
      const importantTerms = extractImportantTerms(text);
      
      // Generate flashcards from key phrases
      const phraseCards = keyPhrases.slice(0, Math.ceil(count/2)).map((phrase, index) => ({
        id: index + 1,
        question: `What does the document say about: "${phrase.split(' ').slice(0, 4).join(' ')}..."?`,
        answer: findContextForPhrase(text, phrase),
        type: 'key-phrase-based',
        source: 'content-analysis'
      }));
      
      // Generate flashcards from important terms  
      const termCards = importantTerms.slice(0, count - phraseCards.length).map((term, index) => ({
        id: phraseCards.length + index + 1,
        question: `Define or explain "${term}" as mentioned in the document.`,
        answer: findContextForKeyword(text, term),
        type: 'term-based',
        source: 'content-analysis'
      }));
      
      flashcards = [...phraseCards, ...termCards];
      
      // If still not enough, fill with sentence-based cards
      if (flashcards.length < count) {
        const remainingCount = count - flashcards.length;
        const sentenceCards = sentences.slice(0, remainingCount).map((sentence, index) => ({
          id: flashcards.length + index + 1,
          question: `What is the main point of: "${sentence.trim().substring(0, 50)}..."?`,
          answer: sentence.trim(),
          type: 'sentence-based',
          source: 'content-analysis'
        }));
        flashcards = [...flashcards, ...sentenceCards];
      }
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

// Extract key phrases from text (lines with bullets, colons, or special formatting)
function extractKeyPhrasesFromText(text) {
  const phrases = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    // Look for bullet points, numbered lists, or lines with colons
    if (trimmed.match(/^[•\-\*\d+\.].+/) || trimmed.includes(':') && trimmed.length < 100) {
      phrases.push(trimmed.replace(/^[•\-\*\d+\.]\s*/, ''));
    }
  });
  
  return phrases.slice(0, 10); // Return top 10 key phrases
}

// Extract important terms (words that appear frequently and are longer)
function extractImportantTerms(text) {
  const words = text.toLowerCase().split(/\W+/);
  const wordCount = {};
  
  // Count word frequencies for words longer than 4 characters
  words.forEach(word => {
    if (word.length > 4 && !isCommonWord(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top terms
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// Check if a word is a common word that shouldn't be considered important
function isCommonWord(word) {
  const commonWords = ['that', 'this', 'with', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'many', 'very', 'when', 'much', 'before', 'right', 'through', 'just', 'where', 'most', 'should', 'being'];
  return commonWords.includes(word);
}

// Find context for a phrase (look for the sentence or paragraph containing it)
function findContextForPhrase(text, phrase) {
  const sentences = text.split(/[.!?]+/);
  const phraseLower = phrase.toLowerCase();
  
  // Find sentence containing part of the phrase
  const contextSentence = sentences.find(sentence => {
    const sentenceLower = sentence.toLowerCase();
    const phraseWords = phraseLower.split(' ').slice(0, 3); // First 3 words
    return phraseWords.some(word => sentenceLower.includes(word));
  });
  
  if (contextSentence) {
    return contextSentence.trim();
  }
  
  return phrase; // Return the phrase itself if no context found
}

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
