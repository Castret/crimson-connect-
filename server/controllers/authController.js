const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const LogModel = require('../models/logModel');
require('dotenv').config();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const AuthController = {
  register: async (req, res, next) => {
    try {
      const { email, password, role, name, phone, age, gender, address, city, state, bloodGroup, lastDonationDate, licenseNumber } = req.body;

      if (!email || !password || !role || !name) {
        return res.status(400).json({ message: 'Email, password, role, and name are required' });
      }

      if (!['donor', 'hospital', 'bloodbank', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role selection' });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const status = (role === 'hospital' || role === 'bloodbank') ? 'pending' : 'verified';

      // Create user
      const userId = await UserModel.createUser({
        email,
        passwordHash,
        role,
        status,
        name,
        phone,
        age,
        gender,
        address,
        city,
        state,
        bloodGroup,
        lastDonationDate: lastDonationDate || null,
        licenseNumber
      });

      // Fetch user profile
      const user = await UserModel.findById(userId);

      // Write log
      await LogModel.create(userId, 'USER_REGISTER', `New user registered with role: ${role}`);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        message: 'Registration successful',
        token: accessToken,
        accessToken,
        refreshToken,
        user
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ message: 'Your account is suspended. Please contact the administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Remove sensitive fields
      delete user.password_hash;

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Log login activity
      await LogModel.create(user.id, 'USER_LOGIN', 'User successfully logged in');

      res.json({
        message: 'Login successful',
        token: accessToken,
        accessToken,
        refreshToken,
        user
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      if (req.user) {
        await LogModel.create(req.user.id, 'USER_LOGOUT', 'User logged out');
      }
      res.json({ message: 'Logout successful' });
    } catch (err) {
      next(err);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await UserModel.findById(decoded.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const newAccessToken = generateAccessToken(user);
        res.json({
          token: newAccessToken,
          accessToken: newAccessToken
        });
      });
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }

      // Generate a mock reset token (or log it for developer visibility)
      const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      
      await LogModel.create(user.id, 'PASSWORD_RESET_REQUEST', 'Password reset code generated');

      res.json({
        message: 'Password reset link generated successfully.',
        resetToken // Send to client for demonstration
      });
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        const success = await UserModel.updatePassword(decoded.id, newPasswordHash);
        if (!success) {
          return res.status(404).json({ message: 'User not found' });
        }

        await LogModel.create(decoded.id, 'PASSWORD_RESET_COMPLETE', 'Password successfully reset');

        res.json({ message: 'Password has been reset successfully' });
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
