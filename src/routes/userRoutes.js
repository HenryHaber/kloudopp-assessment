const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('../config/passport');

router.get('/profile', passport.authenticate('jwt', { session: false }), userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/account', userController.deactivateAccount);

module.exports = router;

