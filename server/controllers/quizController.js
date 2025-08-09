const path = require('path');
const fs = require('fs');
const localStorage = require('../utils/localStorage');
const watsonxService = require('../services/watsonxService');
const nluService = require('../services/nluService');

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

// This function handles the request to generate a quiz using the Watsonx API,
// with a robust, dynamic fallback.
exports.generateQuiz = async (req, res) => {
    const startTime = Date.now();
    const controllerPath = 'server/controllers/quizController.js';
    
    console.log('🔧 [QUIZ-DEBUG] Starting quiz generation process...');
    
    try {
        const { fileId, count = 5 } = req.body;
        
        if (!fileId) {
            return res.status(400).json({ 
                error: ERROR_CODES.QUIZ_001,
                code: 'QUIZ_001',
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
                details: `File with ID '${fileId}' not found in metadata storage`,
                resolution: 'Verify the fileId exists by checking server/uploads/metadata.json or upload the file first',
                fileId: fileId,
                timestamp: new Date().toISOString()
            });
        }

        const text = fileData.text;
        
        if (!text || text.length < 100) {
            return res.status(400).json({ 
                error: ERROR_CODES.QUIZ_003,
                code: 'QUIZ_003',
                details: `Document content too short for quiz generation. Content length: ${text ? text.length : 0} characters`,
                resolution: 'Upload a document with at least 100 characters of readable text content',
                contentLength: text ? text.length : 0,
                minRequired: 100,
                timestamp: new Date().toISOString()
            });
        }

        let quiz = [];
        let method = 'watson-ai-analysis';
        
        if (!watsonxService.initialized) {
            return res.status(503).json({ 
                error: ERROR_CODES.QUIZ_004,
                code: 'QUIZ_004',
                details: 'Watson AI service required for PDF content analysis but not available',
                resolution: 'Ensure Watson AI credentials are properly configured in environment variables',
                timestamp: new Date().toISOString()
            });
        }
        
        try {
            console.log('[QUIZ-AI] Using Watson AI to analyze PDF content for quiz generation...');
            
            const prompt = `You are an educational assessment expert. Analyze the following PDF document content and create exactly ${count} high-quality multiple-choice questions that test comprehension and understanding of the key concepts.

DOCUMENT CONTENT TO ANALYZE:
${text}

INSTRUCTIONS:
1. Read and understand the entire document content above
2. Identify the most important concepts, facts, processes, and key information
3. Create ${count} questions that test different aspects of this content
4. Each question must have exactly 4 options (A, B, C, D) with only one correct answer
5. Make questions specific to the actual content, not generic
6. Provide detailed explanations based on the document
7. Vary difficulty levels and question types

FORMAT: Return a valid JSON array with this exact structure:
[
  {
    "question": "Specific question about the document content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation based on the document content"
  }
]

Generate ${count} questions now:`;

            const aiResponse = await watsonxService.generateText(prompt, {
                max_new_tokens: 1000,
                temperature: 0.3  // Lower temperature for more factual responses
            });
            
            if (!aiResponse) {
                throw new Error('Empty response from Watson AI service');
            }
            
            // Clean the response and try to extract JSON
            const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
            
            try {
                quiz = JSON.parse(cleanResponse);
            } catch (parseError) {
                console.log(`[QUIZ-ERROR] Failed to parse Watson AI JSON response: ${parseError.message}`);
                console.log(`[QUIZ-DEBUG] Raw AI response: ${cleanResponse.substring(0, 500)}...`);
                throw new Error(`JSON parsing failed: ${parseError.message}`);
            }
            
            // Validate the quiz structure
            if (!Array.isArray(quiz) || quiz.length === 0) {
                throw new Error(`Invalid quiz format: Expected array of questions, got ${Array.isArray(quiz) ? quiz.length : typeof quiz}`);
            }
            
            // Validate each question
            quiz.forEach((q, index) => {
                if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
                    typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 ||
                    !q.explanation) {
                    throw new Error(`Question ${index + 1} validation failed: Missing or invalid properties`);
                }
            });
            
            // Ensure we have the requested number of questions
            quiz = quiz.slice(0, count);
            
            console.log(`[QUIZ-SUCCESS] Watson AI generated ${quiz.length} quiz questions from PDF analysis`);
            
        } catch (aiError) {
            console.error('[QUIZ-ERROR] Watson AI analysis failed:', aiError.message);
        }
        
        // Fall back to NLU-based quiz generation if Watson AI failed
        if (quiz.length === 0 && nluService.initialized) {
            try {
                console.log('[QUIZ-INFO] Using Watson NLU for content analysis as fallback...');
                const keywords = await nluService.extractKeywords(text, count * 2);
                
                quiz = keywords.slice(0, count).map((keyword, index) => ({
                    id: index + 1,
                    question: `Based on the PDF content, what is the significance of "${keyword.text}"?`,
                    options: [
                        `${keyword.text} is a key concept discussed in the document`,
                        `${keyword.text} is not mentioned in the document`,
                        `${keyword.text} is only briefly referenced`,
                        `${keyword.text} is used as an example`
                    ],
                    correctIndex: 0,
                    explanation: `According to the document content, ${keyword.text} is identified as an important concept with relevance score: ${keyword.relevance.toFixed(2)}`
                }));
                
                method = 'nlu-keyword-analysis';
                console.log(`[QUIZ-SUCCESS] Generated ${quiz.length} NLU-based quiz questions from PDF analysis`);
            } catch (nluError) {
                console.error('[QUIZ-ERROR] NLU analysis also failed:', nluError.message);
            }
        }
        
        // If both AI methods failed, return error
        if (quiz.length === 0) {
            return res.status(503).json({ 
                error: ERROR_CODES.QUIZ_005,
                code: 'QUIZ_005',
                details: 'Both Watson AI and NLU quiz generation failed',
                resolution: 'Ensure Watson services are properly configured and available',
                timestamp: new Date().toISOString()
            });
        }        // Add unique IDs to questions
        quiz = quiz.map((q, index) => ({
            ...q,
            id: index + 1
        }));

        const duration = Date.now() - startTime;
        console.log(`[QUIZ-SUCCESS] Quiz generated using Watson AI analysis {
            "count": ${quiz.length},
            "method": "${method}",
            "processingTime": "${duration}ms",
            "filename": "${fileData.filename}"
        }`);

        res.json({ 
            quiz,
            message: 'Quiz generated successfully using Watson AI analysis',
            source: 'watson-ai-analysis',
            metadata: {
                fileId: fileId,
                filename: fileData.filename,
                questionsCount: quiz.length,
                contentLength: text.length,
                generatedAt: new Date().toISOString(),
                processingTime: duration,
                controller: controllerPath,
                contentAnalyzed: true
            }
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[QUIZ-ERROR] Generation failed after ${duration}ms:`, error);
        res.status(500).json({ 
            error: ERROR_CODES.QUIZ_008,
            code: 'QUIZ_008',
            details: `Unexpected server error: ${error.message}`,
            resolution: 'Check server logs and ensure all dependencies are properly installed',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
};
