const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { profileUpdateValidation } = require('../middleware/validator');

router.get('/me', authenticate, userController.getProfile);
router.put('/profile', authenticate, profileUpdateValidation, userController.updateProfile);
router.delete('/account', authenticate, userController.deactivateAccount);

module.exports = router;
