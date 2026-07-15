const NotificationModel = require('../models/notificationModel');

const NotificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const notifications = await NotificationModel.getByUserId(userId);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const notificationId = Number(req.params.id);
      await NotificationModel.markAsRead(notificationId, userId);
      res.json({ message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user.id;
      await NotificationModel.markAllAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const unreadCount = await NotificationModel.getUnreadCount(userId);
      res.json({ unreadCount });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = NotificationController;
