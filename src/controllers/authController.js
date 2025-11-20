const User = require('../models/User');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail} = require('../utils/emailService');
const { generateAccessToken } = require('../utils//jwt');
const {verifyRefreshToken} = require('../utils/jwt');


const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const passwordHash = await User.hashPassword(password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user  = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      userType,
      emailVerificationToken,
      authProvider: 'local'
        });

    try {
      await sendVerificationEmail(email, emailVerificationToken);
    }
    catch (e) {
      console.error('Error sending verification email:', e.message);
    }
    const token = generateAccessToken(user.toJSON()); // Convert user to plain object

    user.refreshToken = token.refreshToken;
    await  user.save();

    res.status(201).json({
     status: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: user.getPublicProfile(),
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      }
    });
  }
  catch (e) {
    console.error('Error during signup:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
}
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if(!user){
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive){
      return res.status(403).json({ status: false, message: 'Account is deactivated. Please contact support.' });
    }
    const isPasswordValid = await user.validatePassword(password);
    if(!isPasswordValid){
      return res.status(400).json({status: false, message: 'Invalid email or password' });
    }


    const token = generateAccessToken(user.toJSON()); // Convert user to plain object
    user.refreshToken = token.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
     status: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      }
    });
  }
  catch (e) {
    console.error('Login Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }

}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken){
      return res.status(400).json({status: false, message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.id);
    if(!user || user.refreshToken !== refreshToken){
      return res.status(401).json({status: false, message: 'Invalid refresh token' });
    }

    const token = generateAccessToken(user.toJSON()); // Convert user to plain object
    user.refreshToken = token.refreshToken;
    await user.save();
    res.json({
     status: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
      }
    });
  }
  catch (e) {
    console.error('Refresh Token Error:', e);
    res.status(500).json({status: false, message: 'Internal server error', error: e.message });
  }
}

const logout = async (req, res) => {

  try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (user){
        user.refreshToken = null;
        await user.save();
      }

      res.status(200).json({ status: true, message: 'Logout successful' });
  }
  catch (e) {
    console.error('Logout Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }

}

const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token){
      return res.status(400).json({ status: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({ where: { emailVerificationToken: token } });
    if (!user){
      return res.status(400).json({ status: false, message: 'Invalid verification token' });
    }


    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.json({ status: true, message: 'Email verified successfully' });
  }
  catch (e) {

    console.error('Email Verification Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
}

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user){
      return res.status(400).json({ status: false, message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + 3600000;

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpiry;
    await user.save();

    await sendPasswordResetEmail(email, resetToken);
    res.json({ status: true, message: 'Password reset email sent' });
  }
  catch (e){
    console.error('Password Reset Request Error:', e);
    res.status(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({ where: { passwordResetToken: token } });
    if (!user){
      return res.status(400).json({ status: false, message: 'Invalid or expired password reset token' });
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await user.save();

    res.json({ status: true, message: 'Password reset successful. Please log in with your new password.' });
  }
  catch (e) {
    console.error('Password Reset Error:', e);
    res.json(500).json({ status: false, message: 'Internal server error', error: e.message });
  }
}

const googleCallback = async (req, res) => {

  try {
    const user = req.user;
    const token = generateAccessToken(user.toJSON()); // Convert user to plain object

    user.refreshToken = token.refreshToken;
    await user.save();

    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?accessToken=${token.accessToken}&refreshToken=${token.refreshToken}`;
    res.redirect(redirectUrl);
  }
  catch (e) {
      console.error('Google OAuth Callback Error:', e);
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=Internal server error`);
  }
}

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
