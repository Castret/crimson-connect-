const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Require admin role for all sub-routes
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/stats', AdminController.getStats);
router.get('/logs', AdminController.getLogs);
router.get('/users', AdminController.getUsers);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/status', AdminController.updateUserStatus);

module.exports = router;
