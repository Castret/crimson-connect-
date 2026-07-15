const db = require('../config/db');

const NotificationModel = {
  create: async (userId, senderId, type, entityId) => {
    // Avoid double notifications for blood requests or appointments from self
    if (Number(userId) === Number(senderId)) return null;

    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, sender_id, type, entity_id, is_read) VALUES (?, ?, ?, ?, FALSE)',
      [userId, senderId || null, type, entityId || null]
    );
    return result.insertId;
  },

  createMany: async (notifications) => {
    if (!notifications || notifications.length === 0) return 0;

    // Filter out notifications where user_id === sender_id
    const validNotifications = notifications.filter(n => Number(n.userId) !== Number(n.senderId));
    if (validNotifications.length === 0) return 0;

    const placeholders = validNotifications.map(() => '(?, ?, ?, ?, FALSE)').join(', ');
    const values = [];
    for (const n of validNotifications) {
      values.push(n.userId, n.senderId || null, n.type, n.entityId || null);
    }

    const [result] = await db.execute(
      `INSERT INTO notifications (user_id, sender_id, type, entity_id, is_read) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows;
  },

  getByUserId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT n.*, pr.name AS sender_name, pr.profile_pic_url AS sender_avatar
       FROM notifications n
       LEFT JOIN profiles pr ON n.sender_id = pr.user_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [userId]
    );
    return rows;
  },

  markAsRead: async (notificationId, userId) => {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  markAllAsRead: async (userId) => {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows > 0;
  },

  getUnreadCount: async (userId) => {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return rows[0] ? rows[0].unread_count : 0;
  }
};

module.exports = NotificationModel;
