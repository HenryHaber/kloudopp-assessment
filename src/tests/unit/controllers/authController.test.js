// Mock dependencies
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/utils/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));
jest.mock('crypto');

const User = require('../../../src/models/User');
const { generateTokenPair, verifyRefreshToken } = require('../../../src/utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../../src/utils/emailService');
const authController = require('../../../src/controllers/authController');
const crypto = require('crypto');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      userType: 'client',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should successfully register a new user', async () => {
      req.body = signupData;

      const mockUser = {
        id: '123',
        email: signupData.email,
        userType: signupData.userType,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        isEmailVerified: false,
        authProvider: 'local',
        refreshToken: null,
        save: jest.fn(),
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: signupData.email,
          userType: signupData.userType,
          firstName: signupData.firstName,
          lastName: signupData.lastName
        })
      };

      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue('hashed_password');
      crypto.randomBytes.mockReturnValue({ toString: () => 'verification_token' });
      User.create.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(true);
      generateTokenPair.mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      });

      await authController.signup(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: signupData.email } });
      expect(User.hashPassword).toHaveBeenCalledWith(signupData.password);
      expect(User.create).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('registered successfully')
        })
      );
    });

    it('should return error if user already exists', async () => {
      req.body = signupData;

      User.findOne.mockResolvedValue({ id: '123', email: signupData.email });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists'
      });
    });

    it('should continue signup even if email sending fails', async () => {
      req.body = signupData;

      const mockUser = {
        id: '123',
        email: signupData.email,
        refreshToken: null,
        save: jest.fn(),
        getPublicProfile: jest.fn().mockReturnValue({ id: '123' })
      };

      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue('hashed_password');
      crypto.randomBytes.mockReturnValue({ toString: () => 'verification_token' });
      User.create.mockResolvedValue(mockUser);
      sendVerificationEmail.mockRejectedValue(new Error('Email service error'));
      generateTokenPair.mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      });

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          emailSent: false
        })
      );
    });

    it('should handle errors during signup', async () => {
      req.body = signupData;

      User.findOne.mockRejectedValue(new Error('Database error'));

      await authController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'An error occurred during signup'
        })
      );
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    it('should successfully login a user', async () => {
      req.body = loginData;

      const mockUser = {
        id: '123',
        email: loginData.email,
        isActive: true,
        refreshToken: null,
        lastLogin: null,
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: loginData.email
        })
      };

      User.findOne.mockResolvedValue(mockUser);
      generateTokenPair.mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      });

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: loginData.email } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful'
        })
      );
    });

    it('should return error if user not found', async () => {
      req.body = loginData;

      User.findOne.mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should return error if account is deactivated', async () => {
      req.body = loginData;

      const mockUser = {
        isActive: false
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    });

    it('should return error if password is invalid', async () => {
      req.body = loginData;

      const mockUser = {
        isActive: true,
        validatePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    it('should handle errors during login', async () => {
      req.body = loginData;

      User.findOne.mockRejectedValue(new Error('Database error'));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'An error occurred during login'
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      req.body = { refreshToken: 'old_refresh_token' };

      const mockDecoded = {
        id: '123',
        email: 'test@example.com',
        userType: 'client'
      };

      const mockUser = {
        id: '123',
        refreshToken: 'old_refresh_token',
        save: jest.fn()
      };

      verifyRefreshToken.mockReturnValue(mockDecoded);
      User.findByPk.mockResolvedValue(mockUser);
      generateTokenPair.mockReturnValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token'
      });

      await authController.refreshToken(req, res);

      expect(verifyRefreshToken).toHaveBeenCalledWith('old_refresh_token');
      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Token refreshed successfully'
        })
      );
    });

    it('should return error if refresh token is missing', async () => {
      req.body = {};

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required'
      });
    });

    it('should return error if refresh token is invalid', async () => {
      req.body = { refreshToken: 'invalid_token' };

      verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    });

    it('should return error if user not found', async () => {
      req.body = { refreshToken: 'valid_token' };

      verifyRefreshToken.mockReturnValue({ id: '123' });
      User.findByPk.mockResolvedValue(null);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token'
      });
    });

    it('should return error if refresh token does not match', async () => {
      req.body = { refreshToken: 'token_1' };

      const mockUser = {
        refreshToken: 'token_2'
      };

      verifyRefreshToken.mockReturnValue({ id: '123' });
      User.findByPk.mockResolvedValue(mockUser);

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token'
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      req.user = { id: '123' };

      const mockUser = {
        refreshToken: 'some_token',
        save: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await authController.logout(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful'
        })
      );
    });

    it('should handle logout even if user not found', async () => {
      req.user = { id: '123' };

      User.findByPk.mockResolvedValue(null);

      await authController.logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful'
        })
      );
    });
  });
});

