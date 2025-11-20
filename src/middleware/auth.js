const {verifyAccessToken} = require('../utils/jwt');


const authenticate = (req, res, next) => {

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: false, message: 'Authorization header missing or malformed' });
    }
    const token = authHeader.substring(7);
    req.user = verifyAccessToken(token)
    next ();
  }
  catch (e) {
    return res.status(401).json({ status: false, message: 'Invalid or expired Token', error: e.message });
  }
}
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ status: false, message: 'Access denied: Clients only' });
  }
  next();
}
const requireFreelancer = (req, res, next) => {
  if (req.user.role !== 'freelancer') {
    return res.status(403).json({ status: false, message: 'Access denied: Freelancers only' });
  }
  next();
}

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ status: false, message: 'Access denied: Insufficient permissions' });
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