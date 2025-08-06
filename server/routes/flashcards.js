const express = require('express');
const router = express.Router();
const { generateFlashcards } = require('../controllers/flashcardsController');
router.post('/', generateFlashcards);
module.exports = router;
