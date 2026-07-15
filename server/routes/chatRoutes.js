const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, ChatController.getUserChats);
router.post('/', authenticateToken, ChatController.getOrCreateChat);
router.get('/:id/messages', authenticateToken, ChatController.getMessages);
router.post('/:id/read', authenticateToken, ChatController.markAsRead);

module.exports = router;
