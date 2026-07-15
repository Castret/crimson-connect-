const LogModel = require('../models/logModel');
const UserModel = require('../models/userModel');
const db = require('../config/db');

const AdminController = {
  getStats: async (req, res, next) => {
    try {
      const [rows] = await db.execute(`
        SELECT 
          SUM(CASE WHEN role = 'donor' THEN 1 ELSE 0 END) AS donors,
          SUM(CASE WHEN role = 'bloodbank' THEN 1 ELSE 0 END) AS bloodbanks,
          SUM(CASE WHEN role = 'hospital' THEN 1 ELSE 0 END) AS hospitals,
          SUM(CASE WHEN status = 'pending' AND role IN ('bloodbank', 'hospital') THEN 1 ELSE 0 END) AS pending,
          (SELECT COUNT(*) FROM emergency_requests WHERE status = 'pending') AS emergencies
        FROM users
      `);
      const stats = rows[0] || {};

      res.json({
        donors: Number(stats.donors || 0),
        bloodbanks: Number(stats.bloodbanks || 0),
        hospitals: Number(stats.hospitals || 0),
        pending: Number(stats.pending || 0),
        emergencies: Number(stats.emergencies || 0)
      });
    } catch (err) {
      next(err);
    }
  },

  getLogs: async (req, res, next) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const offset = Number(req.query.offset) || 0;

      const logs = await LogModel.getAll(limit, offset);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  getUsers: async (req, res, next) => {
    try {
      const users = await UserModel.getAllUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const targetUserId = Number(req.params.id);

      if (adminId === targetUserId) {
        return res.status(400).json({ message: 'You cannot delete your own admin account' });
      }

      const user = await UserModel.findById(targetUserId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await UserModel.deleteUser(targetUserId);

      await LogModel.create(adminId, 'USER_DELETED_BY_ADMIN', `Deleted user account ID: ${targetUserId} (${user.email})`);

      res.json({ message: 'User account successfully deleted' });
    } catch (err) {
      next(err);
    }
  },

  updateUserStatus: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const targetUserId = Number(req.params.id);
      const { status } = req.body;

      if (!['pending', 'verified', 'suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const user = await UserModel.findById(targetUserId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await UserModel.updateUserStatus(targetUserId, status);

      await LogModel.create(adminId, 'USER_STATUS_UPDATED', `Updated user ID: ${targetUserId} (${user.email}) status to ${status}`);

      res.json({ message: `User status successfully updated to ${status}` });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AdminController;
