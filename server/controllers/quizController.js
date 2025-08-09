const path = require('path');
const fs = require('fs');
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
        let method = 'watsonx-api';
        
        try {
            const prompt = `Based on the following content, create exactly ${count} multiple-choice questions. Each question should have exactly 4 options (A, B, C, D) with only one correct answer. Also provide a detailed explanation for each correct answer.

Content: ${text.substring(0, 2000)}

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

            console.log('[QUIZ-AI] Attempting Watson AI generation...');
            const aiResponse = await watsonxService.generateText(prompt);
            console.log('[QUIZ-AI] Watson AI response received:', typeof aiResponse, aiResponse ? 'has content' : 'empty');
            
            // Try to parse the AI response as JSON
            const responseText = aiResponse.text || aiResponse;
            
            if (!responseText) {
                throw new Error('Empty response from Watson AI service');
            }
            
            // Clean the response and try to extract JSON
            const cleanResponse = responseText.replace(/```json|```/g, '').trim();
            quiz = JSON.parse(cleanResponse);
            
            // Validate the quiz structure
            if (!Array.isArray(quiz) || quiz.length !== count) {
                throw new Error(`Invalid quiz format: Expected array of ${count} questions, got ${Array.isArray(quiz) ? quiz.length : typeof quiz}`);
            }
            
            // Validate each question
            quiz.forEach((q, index) => {
                if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || 
                    typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 ||
                    !q.explanation) {
                    throw new Error(`Question ${index + 1} validation failed: Missing or invalid properties`);
                }
            });
            
            console.log('[QUIZ-AI] Watson AI quiz successfully parsed and validated');
            
        } catch (aiError) {
            console.error('[QUIZ-ERROR] Watson AI generation failed, falling back to dynamic method:', aiError);
            method = 'dynamic-fallback';
            quiz = generateDynamicFallbackQuiz(text, count);
        }

        // Add unique IDs to questions
        quiz = quiz.map((q, index) => ({
            ...q,
            id: index + 1
        }));

        const duration = Date.now() - startTime;
        console.log(`[QUIZ-INFO] Quiz generated {
            "count": ${quiz.length},
            "method": "${method}",
            "processingTime": "${duration}ms"
        }`);

        res.json({ 
            quiz,
            message: 'Quiz generated successfully',
            source: method === 'watsonx-api' ? 'ai' : 'fallback',
            metadata: {
                fileId: fileId,
                questionsCount: quiz.length,
                contentLength: text.length,
                generatedAt: new Date().toISOString(),
                processingTime: duration,
                controller: controllerPath
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

// Dynamic fallback function to generate a generic quiz from any text
function generateDynamicFallbackQuiz(text, count) {
    console.log('[QUIZ-FALLBACK] Generating dynamic quiz from actual text content...');
    const quiz = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (let i = 0; i < count; i++) {
        if (sentences.length < 1) break;

        const mainSentence = sentences[i % sentences.length].trim();
        const otherOptions = [];
        // Find three other sentences to use as incorrect options
        for (let j = 1; j <= 3; j++) {
            const otherSentence = sentences[(i + j) % sentences.length].trim();
            if (otherSentence !== mainSentence && otherOptions.length < 3) {
                otherOptions.push(otherSentence);
            }
        }
        
        // If not enough unique sentences for options, just use a generic placeholder
        while (otherOptions.length < 3) {
            otherOptions.push("A different point from the document");
        }

        // Randomly place the correct answer
        const allOptions = [...otherOptions];
        const correctIndex = Math.floor(Math.random() * 4);
        allOptions.splice(correctIndex, 0, mainSentence);

        quiz.push({
            question: `Which of the following is a key point from this section of the document?`,
            options: allOptions,
            correctIndex: correctIndex,
            explanation: `The correct answer is based on the sentence: "${mainSentence}"`
        });
    }

    return quiz.slice(0, count);
}
