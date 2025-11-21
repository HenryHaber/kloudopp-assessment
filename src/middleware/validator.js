const {body, validationResult} = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const signupValidation  = [
    body('email')
    .isEmail()
   .normalizeEmail()
    .withMessage('Invalid email address'),

    body('password')
        .isLength({ min: 8 })
       .withMessage('Password must be at least 8 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter'),

    body('userType')
    .isIn(['client', 'freelancer'])
    .withMessage('Invalid user type'),


    body('firstName').optional(),
    body('lastName').optional(),
    handleValidationErrors

];

const loginValidation = [
    body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
]

const passwordResetRequestValidation = [
    body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
    handleValidationErrors
]

// Added validations required by tests
const passwordResetValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  handleValidationErrors
];

const profileUpdateValidation = [
  body('firstName').optional().isLength({ max: 50 }).withMessage('First name too long'),
  body('lastName').optional().isLength({ max: 50 }).withMessage('Last name too long'),
  body('profilePicture').optional().isURL().withMessage('Invalid profile picture URL'),
  handleValidationErrors
];

module.exports = {
    signupValidation,
    loginValidation,
    passwordResetRequestValidation,
    passwordResetValidation,
    profileUpdateValidation
}