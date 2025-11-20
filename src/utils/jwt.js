const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateAccessToken = (payload)=> {
  return jwt.sign(
      payload,
      process.env.JWT_SECRET, {
        expiresIn: '15m'});
}

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '7d'});
}

const verifyAccessToken = (token) => {
  try {
    return jwt.verify (token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify (token, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    return null;
  }
}


module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};