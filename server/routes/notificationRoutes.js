const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, NotificationController.getNotifications);
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);
router.post('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);
router.post('/:id/read', authenticateToken, NotificationController.markAsRead);

module.exports = router;
