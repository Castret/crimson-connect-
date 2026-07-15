const db = require('../config/db');

const LogModel = {
  create: async (userId, action, details) => {
    try {
      const [result] = await db.execute(
        'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId || null, action, details || null]
      );
      return result.insertId;
    } catch (err) {
      console.error('Failed to write system log:', err);
      // Don't crash request if logging fails
      return null;
    }
  },

  getAll: async (limit = 100, offset = 0) => {
    const [rows] = await db.execute(
      `SELECT l.*, u.email, pr.name AS user_name
       FROM logs l
       LEFT JOIN users u ON l.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  }
};

module.exports = LogModel;
