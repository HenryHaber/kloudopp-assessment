// Mock dependencies before imports
jest.mock('../../../src/models/User');
jest.mock('../../../src/utils/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn()
}));

const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { generateTokenPair } = require('../../../src/utils/jwt');
const { sendVerificationEmail } = require('../../../src/utils/emailService');

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      userType: 'client',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should successfully register a new user', async () => {
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
          lastName: signupData.lastName,
          isEmailVerified: false,
          authProvider: 'local'
        })
      };

      User.findOne.mockResolvedValue(null);
      User.hashPassword.mockResolvedValue('hashed_password');
      User.create.mockResolvedValue(mockUser);
      sendVerificationEmail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', signupData.email);
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...signupData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...signupData,
          password: 'weak'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for invalid userType', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...signupData,
          userType: 'invalid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: '123', email: signupData.email });

      const response = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    it('should successfully login a user', async () => {
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
          email: loginData.email,
          userType: 'client'
        })
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
    });

    it('should return validation error for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: loginData.password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return error for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for deactivated account', async () => {
      const mockUser = {
        isActive: false
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const mockUser = {
        id: '123',
        refreshToken: 'old_refresh_token',
        save: jest.fn()
      };

      // Create real tokens for this test
      const tokens = generateTokenPair({ id: '123', email: 'test@example.com', userType: 'client' });

      User.findByPk.mockResolvedValue({
        ...mockUser,
        refreshToken: tokens.refreshToken
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: tokens.refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return error if refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token is required');
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout user', async () => {
      const mockUser = {
        id: '123',
        refreshToken: 'some_token',
        save: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      const tokens = generateTokenPair({ id: '123', email: 'test@example.com', userType: 'client' });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });
});

