const db = require('../config/db');

const ChatModel = {
  getOrCreateChat: async (userId1, userId2) => {
    const u1 = Math.min(userId1, userId2);
    const u2 = Math.max(userId1, userId2);

    // Try finding existing chat
    const [existing] = await db.execute(
      'SELECT id FROM chats WHERE user_id_1 = ? AND user_id_2 = ?',
      [u1, u2]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Insert new chat
    const [result] = await db.execute(
      'INSERT INTO chats (user_id_1, user_id_2) VALUES (?, ?)',
      [u1, u2]
    );
    return result.insertId;
  },

  getUserChats: async (userId) => {
    const [rows] = await db.execute(
      `SELECT c.id AS chat_id, c.updated_at,
              u.id AS other_user_id, u.email AS other_user_email, u.role AS other_user_role,
              pr.name AS other_user_name, pr.profile_pic_url AS other_user_avatar,
              m.content AS last_message, m.sender_id AS last_message_sender, m.created_at AS last_message_time, m.is_read AS last_message_read
       FROM chats c
       JOIN users u ON u.id = IF(c.user_id_1 = ?, c.user_id_2, c.user_id_1)
       JOIN profiles pr ON u.id = pr.user_id
       LEFT JOIN (
         SELECT m1.*
         FROM messages m1
         INNER JOIN (
           SELECT chat_id, MAX(id) AS max_id
           FROM messages
           GROUP BY chat_id
         ) m2 ON m1.id = m2.max_id
       ) m ON c.id = m.chat_id
       WHERE c.user_id_1 = ? OR c.user_id_2 = ?
       ORDER BY c.updated_at DESC`,
      [userId, userId, userId]
    );
    return rows;
  },

  saveMessage: async (chatId, senderId, content, imageUrl) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert message
      const [msgResult] = await conn.execute(
        'INSERT INTO messages (chat_id, sender_id, content, image_url, is_read) VALUES (?, ?, ?, ?, FALSE)',
        [chatId, senderId, content || null, imageUrl || null]
      );
      const messageId = msgResult.insertId;

      // 2. Update chat timestamp
      await conn.execute(
        'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [chatId]
      );

      await conn.commit();
      return messageId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getMessages: async (chatId) => {
    const [rows] = await db.execute(
      `SELECT m.*, pr.name AS sender_name, pr.profile_pic_url AS sender_avatar
       FROM messages m
       JOIN profiles pr ON m.sender_id = pr.user_id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [chatId]
    );
    return rows;
  },

  markAsRead: async (chatId, userId) => {
    const [result] = await db.execute(
      'UPDATE messages SET is_read = TRUE WHERE chat_id = ? AND sender_id != ? AND is_read = FALSE',
      [chatId, userId]
    );
    return result.affectedRows > 0;
  },

  getUnreadCount: async (userId) => {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS unread_count 
       FROM messages m
       JOIN chats c ON m.chat_id = c.id
       WHERE (c.user_id_1 = ? OR c.user_id_2 = ?) AND m.sender_id != ? AND m.is_read = FALSE`,
      [userId, userId, userId]
    );
    return rows[0] ? rows[0].unread_count : 0;
  }
};

module.exports = ChatModel;
