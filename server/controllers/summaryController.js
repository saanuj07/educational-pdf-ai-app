const localStorage = require('../utils/localStorage');
const nluService = require('../services/nluService');

exports.generateSummary = async (req, res) => {
  const startTime = Date.now();
  console.log(`[SUMMARY-INFO] API called: /api/generate-summary`);
  
  try {
    const { fileId, includeAnalysis = false } = req.body;
    
    const fileData = localStorage.getFileMetadata(fileId);
    if (!fileData) {
      console.log(`[SUMMARY-ERROR] Invalid file ID: ${fileId}`);
      return res.status(400).json({ error: 'Invalid file ID' });
    }
    
    const text = fileData.text;
    
    console.log(`[SUMMARY-INFO] Processing document {
  "filename": "${fileData.filename}",
  "textLength": ${text.length},
  "includeAnalysis": ${includeAnalysis}
}`);
    
    // Simple summary logic (replace with Watsonx.ai later)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ') + '.';

    let analysis = null;
    
    // Include NLU analysis if requested and service is available
    if (includeAnalysis && nluService.initialized) {
      try {
        console.log(`[SUMMARY-INFO] Running NLU analysis...`);
        analysis = await nluService.analyzeText(text);
        console.log(`[SUMMARY-INFO] NLU analysis complete - found ${analysis.keywords.length} keywords, ${analysis.concepts.length} concepts`);
      } catch (error) {
        console.log(`[SUMMARY-WARNING] NLU analysis failed: ${error.message}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SUMMARY-INFO] Summary generated {
  "originalSentences": ${sentences.length},
  "summaryLength": ${summary.length},
  "hasAnalysis": ${analysis !== null},
  "processingTime": "${duration}ms"
}`);
    
    const response = { 
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      metadata: {
        filename: fileData.filename,
        generatedAt: new Date().toISOString(),
        processingTime: duration
      }
    };

    // Add analysis if available
    if (analysis) {
      response.analysis = {
        keywords: analysis.keywords.slice(0, 10), // Top 10 keywords
        concepts: analysis.concepts,
        categories: analysis.categories,
        sentiment: analysis.sentiment,
        emotion: analysis.emotion
      };
    }

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`[SUMMARY-ERROR] Generation failed after ${duration}ms:`, error.message);
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};
