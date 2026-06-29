const express = require('express');
const aiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', optionalAuth, aiController.chat);
router.get('/recommendations', aiController.getRecommendations);

module.exports = router;
