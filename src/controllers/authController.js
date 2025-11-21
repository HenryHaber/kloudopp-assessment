const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');


const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      userType,
      emailVerificationToken,
      authProvider: 'local'
    });

    let emailSent = true;
    try {
      await sendVerificationEmail(email, emailVerificationToken);
    } catch (e) {
      console.error('Error sending verification email:', e.message);
      emailSent = false;
    }

    const { accessToken, refreshToken } = generateTokenPair(user.getPublicProfile());
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      emailSent,
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (e) {
    console.error('Error during signup:', e);
    return res.status(500).json({ success: false, message: 'An error occurred during signup', error: e.message });
  }
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokenPair(user.getPublicProfile());
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
        refreshToken
      }
    });
  } catch (e) {
    console.error('Login Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred during login', error: e.message });
  }

}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }
    let decoded;
    try { decoded = verifyRefreshToken(refreshToken); } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const basePayload = user.getPublicProfile ? user.getPublicProfile() : { id: user.id, email: user.email, userType: user.userType };
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(basePayload);
    user.refreshToken = newRefreshToken;
    await user.save();
    return res.json({ success: true, message: 'Token refreshed successfully', data: { accessToken, refreshToken: newRefreshToken } });
  } catch (e) {
    console.error('Refresh Token Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred during token refresh' });
  }
}

const logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    return res.json({ success: true, message: 'Logout successful' });
  } catch (e) {
    console.error('Logout Error:', e);
    return res.status(500).json({ success: false, message: 'An error occurred during logout', error: e.message });
  }

}

const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (e) {
    console.error('Email Verification Error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error', error: e.message });
  }
}

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + 3600000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiry;
    await user.save();

    let emailSent = true;
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (e) {
      console.error('Password Reset Email Error:', e.message);
      emailSent = false;
    }

    return res.json({ success: true, message: 'Password reset email sent', emailSent });
  } catch (e) {
    console.error('Password Reset Request Error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error', error: e.message });
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({ where: { passwordResetToken: token } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. Please log in with your new password.' });
  } catch (e) {
    console.error('Password Reset Error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error', error: e.message });
  }
}

const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const { accessToken, refreshToken } = generateTokenPair(user.getPublicProfile());

    user.refreshToken = refreshToken;
    await user.save();

    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    return res.redirect(redirectUrl);
  } catch (e) {
    console.error('Google OAuth Callback Error:', e);
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=Internal server error`);
  }
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  googleCallback
};
