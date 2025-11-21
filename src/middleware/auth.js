const { verifyAccessToken } = require('../utils/jwt');


const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
const requireClient = (req, res, next) => {
  if (req.user.userType !== 'client') {
    return res.status(403).json({ success: false, message: 'Access denied. Client role required.' });
  }
  next();
}
const requireFreelancer = (req, res, next) => {
  if (req.user.userType !== 'freelancer') {
    return res.status(403).json({ success: false, message: 'Access denied. Freelancer role required.' });
  }
  next();
}

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}


module.exports = {
  authenticate,
  requireClient,
  requireFreelancer,
  requireRole
};