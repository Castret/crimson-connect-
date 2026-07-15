const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Define profile upload fields
const profileUpload = upload.fields([
  { name: 'avatar', maxCount: 1 }
]);

router.get('/', authenticateToken, ProfileController.getCurrentProfile);
router.get('/:id', authenticateToken, ProfileController.getProfileById);
router.put('/', authenticateToken, profileUpload, ProfileController.updateProfile);

module.exports = router;
