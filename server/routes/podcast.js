const express = require('express');
const router = express.Router();
const { generatePodcast, getAudioFile } = require('../controllers/podcastController');

router.post('/', generatePodcast);
router.get('/audio/:filename', getAudioFile);

module.exports = router;
