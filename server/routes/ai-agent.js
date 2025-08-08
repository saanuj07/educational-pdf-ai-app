const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/aiAgentController');

// AI Agent chat endpoint
router.post('/chat', aiAgentController.chatWithAgent);

// Get AI agent capabilities
router.get('/capabilities', (req, res) => {
  res.json({
    personalities: [
      { id: 'helpful', name: 'Helpful & Friendly', description: 'Supportive and encouraging' },
      { id: 'academic', name: 'Academic & Formal', description: 'Scholarly and precise' },
      { id: 'casual', name: 'Casual & Relaxed', description: 'Easy-going and conversational' },
      { id: 'encouraging', name: 'Encouraging & Motivating', description: 'Uplifting and confidence-building' }
    ],
    modes: [
      { id: 'chat', name: 'General Chat', description: 'Open conversation and questions' },
      { id: 'tutor', name: 'Tutoring Mode', description: 'Step-by-step teaching' },
      { id: 'quiz', name: 'Quiz Master', description: 'Testing knowledge and skills' },
      { id: 'study', name: 'Study Buddy', description: 'Study strategies and techniques' }
    ],
    features: [
      'Document analysis and Q&A',
      'Study material generation',
      'Concept explanation',
      'Learning strategy advice',
      'Interactive content creation',
      'Voice input support',
      'Conversation export'
    ]
  });
});

// Health check for AI agent
router.get('/health', (req, res) => {
  res.json({
    status: 'active',
    service: 'AI Learning Assistant',
    timestamp: new Date().toISOString(),
    capabilities: {
      watson_ai: process.env.WATSON_API_KEY ? 'available' : 'fallback_mode',
      speech_recognition: 'browser_supported',
      conversation_export: 'available'
    }
  });
});

module.exports = router;
