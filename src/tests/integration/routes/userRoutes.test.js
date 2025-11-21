// Mock dependencies before imports
jest.mock('../../../src/models/User');

const request = require('supertest');
const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { generateTokenPair } = require('../../../src/utils/jwt');

describe('User Routes Integration Tests', () => {
  let authToken;
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: '123',
      email: 'test@example.com',
      userType: 'client',
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: null,
      isEmailVerified: true,
      authProvider: 'local',
      isActive: true,
      save: jest.fn(),
      getPublicProfile: jest.fn().mockReturnValue({
        id: '123',
        email: 'test@example.com',
        userType: 'client',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        authProvider: 'local'
      })
    };

    const tokens = generateTokenPair({
      id: mockUser.id,
      email: mockUser.email,
      userType: mockUser.userType
    });
    authToken = tokens.accessToken;
  });

  describe('GET /api/users/me', () => {
    it('should get user profile with valid token', async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('firstName', 'John');
      expect(User.findByPk).toHaveBeenCalledWith('123');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          userType: 'client'
        })
      };

      User.findByPk.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Jane',
          lastName: 'Smith'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.firstName).toBe('Jane');
      expect(response.body.data.user.lastName).toBe('Smith');
      expect(updatedUser.save).toHaveBeenCalled();
    });

    it('should update profile picture', async () => {
      const updatedUser = {
        ...mockUser,
        profilePicture: 'https://example.com/pic.jpg',
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          profilePicture: 'https://example.com/pic.jpg'
        })
      };

      User.findByPk.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profilePicture: 'https://example.com/pic.jpg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.profilePicture).toBe('https://example.com/pic.jpg');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ firstName: 'Jane' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid data', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'A'.repeat(100) // Too long
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Jane' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should deactivate user account', async () => {
      User.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account deactivated successfully');
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });
});

