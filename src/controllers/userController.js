const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: { user: user.getPublicProfile() } });
  } catch (e) {
    console.error('Get Profile Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred while fetching profile' });
  }
}
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, profilePicture } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    await user.save();
    return res.json({ success: true, message: 'Profile updated successfully', data: { user: user.getPublicProfile() } });
  } catch (e) {
    console.error('Update Profile Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred while updating profile' });
  }
}
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = false;
    user.refreshToken = null;
    await user.save();
    return res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (e) {
    console.error('Deactivate Account Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred while deactivating account' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deactivateAccount
};