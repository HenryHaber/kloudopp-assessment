const jwt = require('jsonwebtoken');
const env = require('../config/env');

const getAccessSecret = () => env.JWT_ACCESS_SECRET || env.JWT_SECRET || 'access-secret';
const getRefreshSecret = () => env.JWT_REFRESH_SECRET || env.JWT_SECRET || 'refresh-secret';
const getAccessExpiry = () => env.JWT_ACCESS_EXPIRY || '15m';
const getRefreshExpiry = () => env.JWT_REFRESH_EXPIRY || '7d';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: getAccessExpiry() });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: getRefreshExpiry() });
};

const generateTokenPair = (payload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload)
});

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getAccessSecret());
  } catch (e) {
    throw new Error('Invalid or expired access token');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (e) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken
};