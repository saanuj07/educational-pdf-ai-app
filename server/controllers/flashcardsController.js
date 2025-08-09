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
    
    let text = fileData.text || '';
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Document has insufficient extractable text for flashcards' });
    }
    const originalLength = text.length;
    const MAX_PROMPT_CHARS = 12000; // keep prompt size manageable for model limits
    if (text.length > MAX_PROMPT_CHARS) {
      console.log(`[FLASHCARDS-INFO] Truncating document text from ${text.length} to ${MAX_PROMPT_CHARS} chars for prompt`);
      text = text.substring(0, MAX_PROMPT_CHARS);
    }
    
    console.log(`[FLASHCARDS-INFO] Generating flashcards using Watson AI analysis {
  "filename": "${fileData.filename}",
  "textLength": ${text.length},
  "count": ${count},
  "pdfContentPreview": "${text.substring(0, 200)}..."
}`);

    let flashcards = [];

    // Try Watson AI first for high-quality content analysis
    if (false && useWatsonAI && watsonxService.initialized) { // Temporarily disabled to test NLU only
      try {
        console.log(`[FLASHCARDS-INFO] Using Watson AI to analyze PDF content and generate flashcards...`);
        
  const prompt = `You are an educational content expert. Analyze the following PDF document content (length: ${originalLength} chars, using ${text.length} chars snippet) and create exactly ${count} high-quality educational flashcards that test understanding of the key concepts, facts, and important information.

DOCUMENT CONTENT TO ANALYZE:
${text}

INSTRUCTIONS:
1. Read and understand the entire document content above
2. Identify the most important concepts, facts, definitions, processes, and key information
3. Create ${count} flashcards that test different aspects of this content
4. Make questions specific to the actual content, not generic
5. Ensure answers are accurate and based on the document
6. Vary the difficulty levels and question types

FORMAT: Return a valid JSON array with this exact structure:
[
  {
    "question": "Specific question about content from the document",
    "answer": "Accurate answer based on the document content",
    "concept": "Main concept being tested",
    "difficulty": "easy|medium|hard"
  }
]

Generate ${count} flashcards now:`;

        const aiResponse = await watsonxService.generateText(prompt, {
          max_new_tokens: 800,
          temperature: 0.3  // Lower temperature for more consistent, factual responses
        });
        
        if (aiResponse && typeof aiResponse === 'string') {
          const cleanedResponse = aiResponse.replace(/```json|```/g, '').trim();
          
          try {
            const parsedFlashcards = JSON.parse(cleanedResponse);
            
            if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
              flashcards = parsedFlashcards.map((card, index) => ({
                id: index + 1,
                question: card.question || 'Watson AI generated question',
                answer: card.answer || 'Watson AI generated answer',
                concept: card.concept || 'Document concept',
                difficulty: card.difficulty || 'medium',
                type: 'watson-ai-analyzed',
                source: 'Watson AI PDF Analysis'
              }));
              
              console.log(`[FLASHCARDS-SUCCESS] Generated ${flashcards.length} Watson AI flashcards from PDF analysis`);
            }
          } catch (parseError) {
            console.log(`[FLASHCARDS-WARNING] Failed to parse Watson AI JSON response: ${parseError.message}`);
            console.log(`[FLASHCARDS-DEBUG] Raw AI response (first 500 chars): ${cleanedResponse.substring(0, 500)}...`);
          }
        }
      } catch (error) {
        console.log(`[FLASHCARDS-WARNING] Watson AI analysis failed: ${error.message}`);
      }
    } else {
      console.log(`[FLASHCARDS-WARNING] Watson AI not available or disabled`);
    }

    // Fall back to NLU-based analysis if Watson AI didn't work
    if (flashcards.length === 0 && nluService.initialized) {
      try {
        console.log(`[FLASHCARDS-INFO] Using Watson NLU for content analysis as fallback...`);
        const keywords = await nluService.extractKeywords(text, count * 2);
        
        flashcards = keywords.slice(0, count).map((keyword, index) => ({
          id: index + 1,
          question: `Based on the PDF content, what is the significance of "${keyword.text}"?`,
          answer: findContextForKeyword(text, keyword.text),
          concept: keyword.text,
          difficulty: 'medium',
          type: 'nlu-keyword-analysis',
          source: 'Watson NLU Analysis',
          relevance: keyword.relevance
        }));
        
        console.log(`[FLASHCARDS-SUCCESS] Generated ${flashcards.length} NLU-based flashcards from PDF analysis`);
      } catch (error) {
        console.log(`[FLASHCARDS-ERROR] NLU analysis also failed: ${error.message}`);
      }
    }

    // If both AI methods failed, return error instead of hardcoded content
    if (flashcards.length === 0) {
      console.log(`[FLASHCARDS-ERROR] All AI analysis methods failed - cannot generate flashcards without AI`);
      return res.status(503).json({ 
        error: 'AI services unavailable for content analysis',
        message: 'Cannot generate quality flashcards without Watson AI or NLU analysis',
        suggestion: 'Please ensure Watson services are properly configured'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[FLASHCARDS-SUCCESS] Flashcards generated using AI analysis {
  "count": ${flashcards.length},
  "method": "${flashcards[0]?.type || 'unknown'}",
  "processingTime": "${duration}ms",
  "filename": "${fileData.filename}"
}`);

    res.json({ 
      flashcards,
      metadata: {
        filename: fileData.filename,
        method: flashcards[0]?.type || 'ai-analysis',
        generatedAt: new Date().toISOString(),
        processingTime: duration,
        contentAnalyzed: true
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[FLASHCARDS-ERROR] Generation failed after ${duration}ms:`, error.message);
    res.status(500).json({ 
      error: 'Failed to generate flashcards',
      message: error.message
    });
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
