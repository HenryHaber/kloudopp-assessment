const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const {signupValidation, loginValidation, passwordResetRequestValidation} = require('../middleware/validator');

router.post('/signup', authLimiter, signupValidation, authController.signup);
router.post('/login', authLimiter, loginValidation, authController.login);
router.get('/verify-email',  authController.verifyEmail);
router.post('/request-password-reset', authLimiter, passwordResetRequestValidation, authController.requestPasswordReset);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), authController.googleCallback);


module.exports = router;