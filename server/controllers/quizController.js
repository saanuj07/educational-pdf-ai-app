const localStorage = require('../utils/localStorage');
const watsonxService = require('../services/watsonxService');

// Error codes for better debugging
const ERROR_CODES = {
  QUIZ_001: 'Missing or invalid fileId parameter',
  QUIZ_002: 'File not found in metadata',
  QUIZ_003: 'Insufficient content for quiz generation',
  QUIZ_004: 'Watson AI service unavailable',
  QUIZ_005: 'AI response parsing failed',
  QUIZ_006: 'Invalid quiz structure from AI',
  QUIZ_007: 'Question validation failed',
  QUIZ_008: 'Unexpected server error'
};

// Generate quiz using Watsonx.ai
exports.generateQuiz = async (req, res) => {
  const controllerPath = 'server/controllers/quizController.js';
  
  try {
    const { fileId } = req.body;
    
    // Enhanced validation with detailed error
    if (!fileId) {
      return res.status(400).json({ 
        error: ERROR_CODES.QUIZ_001,
        code: 'QUIZ_001',
        location: `${controllerPath}:line 20`,
        details: 'Request body must include a valid fileId parameter',
        resolution: 'Ensure the frontend sends: { "fileId": "your-file-id" }',
        timestamp: new Date().toISOString()
      });
    }
    
    const fileData = localStorage.getFileMetadata(fileId);
    if (!fileData) {
      return res.status(400).json({ 
        error: ERROR_CODES.QUIZ_002,
        code: 'QUIZ_002',
        location: `${controllerPath}:line 31`,
        details: `File with ID '${fileId}' not found in metadata storage`,
        resolution: 'Verify the fileId exists by checking server/uploads/metadata.json or upload the file first',
        fileId: fileId,
        timestamp: new Date().toISOString()
      });
    }

    const pdfText = fileData.text;
    if (!pdfText || pdfText.length < 100) {
      return res.status(400).json({ 
        error: ERROR_CODES.QUIZ_003,
        code: 'QUIZ_003',
        location: `${controllerPath}:line 42`,
        details: `Document content too short for quiz generation. Content length: ${pdfText ? pdfText.length : 0} characters`,
        resolution: 'Upload a document with at least 100 characters of readable text content',
        contentLength: pdfText ? pdfText.length : 0,
        minRequired: 100,
        timestamp: new Date().toISOString()
      });
    }

    // Create a prompt for quiz generation
    const prompt = `Based on the following content, create exactly 5 multiple-choice questions. Each question should have exactly 4 options (A, B, C, D) with only one correct answer. Also provide a detailed explanation for each correct answer.

Content: ${pdfText.substring(0, 2000)}

Format your response as a JSON array with this structure:
[
  {
    "question": "Your question here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct"
  }
]

Make sure the questions are relevant, educational, and test understanding of the key concepts in the content.`;

    // Generate quiz using Watsonx.ai
    let aiResponse;
    try {
      aiResponse = await watsonxService.generateText(prompt);
    } catch (aiError) {
      console.error('[QUIZ_004] Watson AI service error:', aiError);
      return res.status(503).json({
        error: ERROR_CODES.QUIZ_004,
        code: 'QUIZ_004',
        location: `${controllerPath}:line 69`,
        details: `Watson AI service failed: ${aiError.message}`,
        resolution: 'Check Watson AI service configuration in server/services/watsonxService.js and verify API credentials',
        servicePath: 'server/services/watsonxService.js',
        timestamp: new Date().toISOString()
      });
    }
    
    // Try to parse the AI response as JSON
    let quiz;
    try {
      // Extract text from the response object
      const responseText = aiResponse.text || aiResponse;
      
      if (!responseText) {
        throw new Error('Empty response from Watson AI service');
      }
      
      // Clean the response and try to extract JSON
      const cleanResponse = responseText.replace(/```json|```/g, '').trim();
      quiz = JSON.parse(cleanResponse);
      
      // Validate the quiz structure
      if (!Array.isArray(quiz) || quiz.length !== 5) {
        throw new Error(`Invalid quiz format: Expected array of 5 questions, got ${Array.isArray(quiz) ? quiz.length : typeof quiz}`);
      }
      
      // Validate each question
      quiz.forEach((q, index) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
            typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 ||
            !q.explanation) {
          throw new Error(`Question ${index + 1} validation failed: Missing or invalid properties (question, options[4], correctIndex, explanation)`);
        }
      });
      
    } catch (parseError) {
      console.error('[QUIZ_005] Failed to parse AI response:', parseError);
      
      // Determine specific error type
      let errorCode, errorDetails, resolution;
      
      if (parseError instanceof SyntaxError) {
        errorCode = 'QUIZ_005';
        errorDetails = `JSON parsing failed: ${parseError.message}`;
        resolution = 'Check Watson AI response format in server/services/watsonxService.js - ensure it returns valid JSON';
      } else if (parseError.message.includes('Invalid quiz format')) {
        errorCode = 'QUIZ_006';
        errorDetails = parseError.message;
        resolution = 'Verify Watson AI prompt generates exactly 5 questions in correct format';
      } else if (parseError.message.includes('validation failed')) {
        errorCode = 'QUIZ_007';
        errorDetails = parseError.message;
        resolution = 'Check each question has: question, options[4], correctIndex(0-3), explanation';
      } else {
        errorCode = 'QUIZ_005';
        errorDetails = parseError.message;
        resolution = 'Review AI response structure and parsing logic';
      }
      
      console.warn(`[${errorCode}] Using fallback quiz due to: ${errorDetails}`);
      
      // Fallback to sample quiz if AI parsing fails
      quiz = [
        {
          question: "What are the main topics covered in this document?",
          options: [
            "Design and functionality principles",
            "Historical development timeline", 
            "Technical specifications only",
            "Marketing strategies"
          ],
          correctIndex: 0,
          explanation: "Based on the content analysis, the document primarily covers design principles and functionality aspects of the subject matter."
        },
        {
          question: "What key benefits are emphasized in the content?",
          options: [
            "Cost reduction",
            "Portability and user convenience",
            "Complex technical features",
            "Market dominance"
          ],
          correctIndex: 1,
          explanation: "The content emphasizes portability and user convenience as primary benefits, focusing on practical user experience."
        },
        {
          question: "How does the design philosophy approach the user experience?",
          options: [
            "Through complex interfaces",
            "By maximizing features",
            "With minimalist and clean design",
            "Using traditional methods"
          ],
          correctIndex: 2,
          explanation: "The design philosophy emphasizes minimalist and clean design approaches to enhance user experience and accessibility."
        },
        {
          question: "What materials or construction methods are highlighted?",
          options: [
            "Basic plastic construction",
            "Premium materials and advanced engineering",
            "Traditional manufacturing",
            "Low-cost alternatives"
          ],
          correctIndex: 1,
          explanation: "The content highlights the use of premium materials and advanced engineering techniques in construction."
        },
        {
          question: "What is the overall focus of the document's message?",
          options: [
            "Technical complexity",
            "Price competitiveness", 
            "Quality and user-centric design",
            "Market statistics"
          ],
          correctIndex: 2,
          explanation: "The document's overall message focuses on quality and user-centric design principles rather than technical complexity or pricing."
        }
      ];
    }

    // Add unique IDs to questions
    quiz = quiz.map((q, index) => ({
      ...q,
      id: index + 1
    }));

    res.json({ 
      quiz,
      message: 'Quiz generated successfully',
      source: aiResponse ? (aiResponse.fallback ? 'fallback' : 'ai') : 'fallback',
      metadata: {
        fileId: fileId,
        questionsCount: quiz.length,
        contentLength: pdfText.length,
        generatedAt: new Date().toISOString(),
        controller: controllerPath
      }
    });

  } catch (error) {
    console.error('[QUIZ_008] Quiz generation error:', error);
    
    res.status(500).json({ 
      error: ERROR_CODES.QUIZ_008,
      code: 'QUIZ_008',
      location: `${controllerPath}:catch block`,
      details: `Unexpected server error: ${error.message}`,
      resolution: 'Check server logs and ensure all dependencies are properly installed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
};
