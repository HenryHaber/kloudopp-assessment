const {body, validationResult} = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: false, errors: errors.array() });
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


module.exports = {
    signupValidation,
    loginValidation,
  passwordResetRequestValidation
}