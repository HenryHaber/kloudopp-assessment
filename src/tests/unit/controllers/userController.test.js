const User = require('../../../src/models/User');
const userController = require('../../../src/controllers/userController');

// Mock dependencies
jest.mock('../../../src/models/User');

describe('User Controller', () => {
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

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      req.user = { id: '123' };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        userType: 'client',
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          userType: 'client',
          firstName: 'John',
          lastName: 'Doe'
        })
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.getProfile(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.getPublicProfile).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: '123',
            email: 'test@example.com'
          })
        }
      });
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: '123' };

      User.findByPk.mockResolvedValue(null);

      await userController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle errors', async () => {
      req.user = { id: '123' };

      User.findByPk.mockRejectedValue(new Error('Database error'));

      await userController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while fetching profile'
      });
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      req.user = { id: '123' };
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith',
        profilePicture: 'https://example.com/pic.jpg'
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: null,
        save: jest.fn(),
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          profilePicture: 'https://example.com/pic.jpg'
        })
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.updateProfile(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.firstName).toBe('Jane');
      expect(mockUser.lastName).toBe('Smith');
      expect(mockUser.profilePicture).toBe('https://example.com/pic.jpg');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Smith'
          })
        }
      });
    });

    it('should update only provided fields', async () => {
      req.user = { id: '123' };
      req.body = {
        firstName: 'Jane'
      };

      const mockUser = {
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'old_pic.jpg',
        save: jest.fn(),
        getPublicProfile: jest.fn().mockReturnValue({
          id: '123',
          firstName: 'Jane',
          lastName: 'Doe',
          profilePicture: 'old_pic.jpg'
        })
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.updateProfile(req, res);

      expect(mockUser.firstName).toBe('Jane');
      expect(mockUser.lastName).toBe('Doe'); // Unchanged
      expect(mockUser.profilePicture).toBe('old_pic.jpg'); // Unchanged
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: '123' };
      req.body = { firstName: 'Jane' };

      User.findByPk.mockResolvedValue(null);

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle errors', async () => {
      req.user = { id: '123' };
      req.body = { firstName: 'Jane' };

      User.findByPk.mockRejectedValue(new Error('Database error'));

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while updating profile'
      });
    });
  });

  describe('deactivateAccount', () => {
    it('should successfully deactivate user account', async () => {
      req.user = { id: '123' };

      const mockUser = {
        id: '123',
        isActive: true,
        refreshToken: 'some_token',
        save: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.deactivateAccount(req, res);

      expect(User.findByPk).toHaveBeenCalledWith('123');
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deactivated successfully'
      });
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: '123' };

      User.findByPk.mockResolvedValue(null);

      await userController.deactivateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle errors', async () => {
      req.user = { id: '123' };

      User.findByPk.mockRejectedValue(new Error('Database error'));

      await userController.deactivateAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while deactivating account'
      });
    });

    it('should invalidate refresh token when deactivating', async () => {
      req.user = { id: '123' };

      const mockUser = {
        id: '123',
        isActive: true,
        refreshToken: 'valid_refresh_token',
        save: jest.fn()
      };

      User.findByPk.mockResolvedValue(mockUser);

      await userController.deactivateAccount(req, res);

      expect(mockUser.refreshToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});

