const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    res.json({ status: true, data: user.getPublicProfile() });
    
    
  }
  catch (e) {
    console.error('Get Profile Error:', e);
    res.json({ status: false, message: 'Internal server error', error: e.message });
  }
}
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, profilePicture } = req.body;
    
    const user = await User.findByPk(userId);
    if(!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }
    
    if(firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    
    await user.save();
    res.status(200).json({
      status: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
       })
    
  }
  catch (e) {
    console.error('Update Profile Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
  
}
const deactivateAccount = async (req, res) => {

  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: 'User not found' });
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ status: true, message: 'Account deactivated successfully' });
  }
  catch (e) {
    console.error('Deactivate Account Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deactivateAccount
};