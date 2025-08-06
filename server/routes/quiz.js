const express = require('express');
const router = express.Router();
const { generateQuiz } = require('../controllers/quizController');

console.log('📊 Loading quiz routes...');

router.post('/generate', (req, res, next) => {
  console.log('📊 Quiz generate endpoint called');
  generateQuiz(req, res, next);
});

module.exports = router;
