const db = require('../config/db');

const ProfileModel = {
  getProfileByUserId: async (userId) => {
    // Get base user and profile
    const [userRows] = await db.execute(
      `SELECT u.id, u.email, u.role, u.created_at, p.name, p.bio, p.profile_pic_url, p.phone, p.age, p.gender, p.address, p.city, p.state, p.blood_group, p.last_donation_date, p.license_number
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (userRows.length === 0) return null;
    return userRows[0];
  },

  updateProfile: async (userId, role, { name, bio, profilePicUrl, phone, age, gender, address, city, state, bloodGroup, lastDonationDate, licenseNumber }) => {
    const profileUpdates = [];
    const profileParams = [];

    if (name !== undefined) {
      profileUpdates.push('name = ?');
      profileParams.push(name);
    }
    if (bio !== undefined) {
      profileUpdates.push('bio = ?');
      profileParams.push(bio);
    }
    if (profilePicUrl !== undefined) {
      profileUpdates.push('profile_pic_url = ?');
      profileParams.push(profilePicUrl);
    }
    if (phone !== undefined) {
      profileUpdates.push('phone = ?');
      profileParams.push(phone);
    }
    if (age !== undefined) {
      profileUpdates.push('age = ?');
      profileParams.push(age ? Number(age) : null);
    }
    if (gender !== undefined) {
      profileUpdates.push('gender = ?');
      profileParams.push(gender);
    }
    if (address !== undefined) {
      profileUpdates.push('address = ?');
      profileParams.push(address);
    }
    if (city !== undefined) {
      profileUpdates.push('city = ?');
      profileParams.push(city);
    }
    if (state !== undefined) {
      profileUpdates.push('state = ?');
      profileParams.push(state);
    }
    if (bloodGroup !== undefined) {
      profileUpdates.push('blood_group = ?');
      profileParams.push(bloodGroup);
    }
    if (lastDonationDate !== undefined) {
      profileUpdates.push('last_donation_date = ?');
      profileParams.push(lastDonationDate || null);
    }
    if (licenseNumber !== undefined) {
      profileUpdates.push('license_number = ?');
      profileParams.push(licenseNumber);
    }

    if (profileUpdates.length > 0) {
      profileParams.push(userId);
      const [result] = await db.execute(
        `UPDATE profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        profileParams
      );
      return result.affectedRows > 0;
    }
    return false;
  }
};

module.exports = ProfileModel;
