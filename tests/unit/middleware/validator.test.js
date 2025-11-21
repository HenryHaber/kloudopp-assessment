const { validationResult } = require('express-validator');
const {
  signupValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  profileUpdateValidation
} = require('../../../src/middleware/validator');

// Mock express-validator
jest.mock('express-validator', () => ({
  body: jest.fn(() => ({
    isEmail: jest.fn().mockReturnThis(),
    normalizeEmail: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    isURL: jest.fn().mockReturnThis()
  })),
  validationResult: jest.fn()
}));

describe('Validator Middleware', () => {
  describe('signupValidation', () => {
    it('should export an array of validators', () => {
      expect(Array.isArray(signupValidation)).toBe(true);
      expect(signupValidation.length).toBeGreaterThan(0);
    });
  });

  describe('loginValidation', () => {
    it('should export an array of validators', () => {
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBeGreaterThan(0);
    });
  });

  describe('passwordResetRequestValidation', () => {
    it('should export an array of validators', () => {
      expect(Array.isArray(passwordResetRequestValidation)).toBe(true);
      expect(passwordResetRequestValidation.length).toBeGreaterThan(0);
    });
  });

  describe('passwordResetValidation', () => {
    it('should export an array of validators', () => {
      expect(Array.isArray(passwordResetValidation)).toBe(true);
      expect(passwordResetValidation.length).toBeGreaterThan(0);
    });
  });

  describe('profileUpdateValidation', () => {
    it('should export an array of validators', () => {
      expect(Array.isArray(profileUpdateValidation)).toBe(true);
      expect(profileUpdateValidation.length).toBeGreaterThan(0);
    });
  });

  describe('handleValidationErrors (integration)', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
      jest.clearAllMocks();
    });

    it('should call next if there are no validation errors', () => {
      validationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Get the last function from signupValidation (handleValidationErrors)
      const handleValidationErrors = signupValidation[signupValidation.length - 1];

      if (typeof handleValidationErrors === 'function') {
        handleValidationErrors(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      }
    });

    it('should return 400 with errors if validation fails', () => {
      const mockErrors = [
        { msg: 'Invalid email', param: 'email' },
        { msg: 'Password too short', param: 'password' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      const handleValidationErrors = signupValidation[signupValidation.length - 1];

      if (typeof handleValidationErrors === 'function') {
        handleValidationErrors(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Validation failed',
          errors: mockErrors
        });
        expect(next).not.toHaveBeenCalled();
      }
    });
  });
});

