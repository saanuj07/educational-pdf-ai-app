const express = require('express');
const router = express.Router();
const { generatePodcast } = require('../controllers/podcastController');
router.post('/', generatePodcast);
module.exports = router;
