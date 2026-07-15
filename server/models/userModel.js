const db = require('../config/db');

const UserModel = {
  findByEmail: async (email) => {
    const [rows] = await db.execute(
      `SELECT u.*, p.name, p.profile_pic_url, p.bio, p.phone, p.age, p.gender, p.address, p.city, p.state, p.blood_group, p.last_donation_date, p.license_number, p.is_available
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.role, u.status, u.blood_type, u.created_at, p.name, p.profile_pic_url, p.bio, p.phone, p.age, p.gender, p.address, p.city, p.state, p.blood_group, p.last_donation_date, p.license_number, p.is_available
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  },

  createUser: async ({ email, passwordHash, role, status, name, phone, age, gender, address, city, state, bloodGroup, lastDonationDate, licenseNumber }) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert into users
      const [userResult] = await conn.execute(
        'INSERT INTO users (email, password_hash, role, status, blood_type) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, role, status || 'verified', role === 'donor' ? bloodGroup || null : null]
      );
      const userId = userResult.insertId;

      // 2. Insert into profiles
      await conn.execute(
        `INSERT INTO profiles (
          user_id, name, phone, age, gender, address, city, state, blood_group, last_donation_date, license_number, is_available
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          userId,
          name,
          phone || null,
          age ? Number(age) : null,
          gender || null,
          address || null,
          city || null,
          state || null,
          bloodGroup || null,
          lastDonationDate || null,
          licenseNumber || null
        ]
      );

      await conn.commit();
      return userId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  updatePassword: async (userId, newPasswordHash) => {
    const [result] = await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, userId]
    );
    return result.affectedRows > 0;
  },

  getAllUsers: async () => {
    const [rows] = await db.execute(
      `SELECT u.id, u.email, u.role, u.status, u.created_at, p.name, p.phone, p.city, p.blood_group
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  deleteUser: async (userId) => {
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    return result.affectedRows > 0;
  },

  updateUserStatus: async (userId, status) => {
    const [result] = await db.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = UserModel;
