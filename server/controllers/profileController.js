const ProfileModel = require('../models/profileModel');
const LogModel = require('../models/logModel');

const ProfileController = {
  getCurrentProfile: async (req, res, next) => {
    try {
      const profile = await ProfileModel.getProfileByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(profile);
    } catch (err) {
      next(err);
    }
  },

  getProfileById: async (req, res, next) => {
    try {
      const profile = await ProfileModel.getProfileByUserId(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(profile);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let avatarUrl = undefined;

      // Handle avatar upload if present
      if (req.files && req.files.avatar && req.files.avatar.length > 0) {
        avatarUrl = `/uploads/${req.files.avatar[0].filename}`;
      }

      const { name, bio, phone, age, gender, address, city, state, bloodGroup, lastDonationDate, licenseNumber } = req.body;

      await ProfileModel.updateProfile(userId, role, {
        name,
        bio,
        profilePicUrl: avatarUrl,
        phone,
        age: age ? Number(age) : undefined,
        gender,
        address,
        city,
        state,
        bloodGroup,
        lastDonationDate: lastDonationDate || null,
        licenseNumber
      });

      // Fetch updated profile
      const updatedProfile = await ProfileModel.getProfileByUserId(userId);

      // Log profile update
      await LogModel.create(userId, 'PROFILE_UPDATE', 'User updated profile information');

      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ProfileController;
