const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');

// Mock bcrypt first
jest.mock('bcryptjs');

// Mock Sequelize
jest.mock('../../../src/config/database', () => {
  const mockBcrypt = require('bcryptjs');
  return {
    sequelize: {
      define: jest.fn((modelName, attributes, options) => {
        // Create a mock model class
        class MockModel {
          constructor(data) {
            Object.assign(this, data);
          }

          static async create(data) {
            return new MockModel(data);
          }

          static async findOne(options) {
            return null;
          }

          static async findByPk(id) {
            return null;
          }

          async save() {
            return this;
          }
        }

        // Add static methods to the model
        MockModel.hashPassword = async (password) => {
          const salt = await mockBcrypt.genSalt(10);
          return mockBcrypt.hash(password, salt);
        };

        // Add instance methods
        MockModel.prototype.validatePassword = async function(password) {
          return mockBcrypt.compare(password, this.passwordHash);
        };

        MockModel.prototype.getPublicProfile = function() {
          return {
            id: this.id,
            email: this.email,
            userType: this.userType,
            firstName: this.firstName,
            lastName: this.lastName,
            profilePicture: this.profilePicture,
            isEmailVerified: this.isEmailVerified,
            authProvider: this.authProvider,
            isActive: this.isActive,
            lastLogin: this.lastLogin,
            createdAt: this.createdAt
          };
        };

        return MockModel;
      }),
      Sequelize: {
        Op: {
          ne: Symbol('ne')
        }
      }
    }
  };
});

describe('User Model', () => {
  describe('User.hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'hashed_password';

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await User.hashPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 'salt');
      expect(result).toBe(hashedPassword);
    });

    it('should generate unique hashes for the same password', async () => {
      const password = 'TestPassword123!';

      bcrypt.genSalt.mockResolvedValueOnce('salt1').mockResolvedValueOnce('salt2');
      bcrypt.hash.mockResolvedValueOnce('hash1').mockResolvedValueOnce('hash2');

      const hash1 = await User.hashPassword(password);
      const hash2 = await User.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('user.validatePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = 'hashed_password';

      const user = new User({
        id: '123',
        email: 'test@example.com',
        passwordHash: hashedPassword
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await user.validatePassword(password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'WrongPassword123!';
      const hashedPassword = 'hashed_password';

      const user = new User({
        id: '123',
        email: 'test@example.com',
        passwordHash: hashedPassword
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await user.validatePassword(password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('user.getPublicProfile', () => {
    it('should return only public fields', () => {
      const user = new User({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        userType: 'client',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: 'https://example.com/pic.jpg',
        isEmailVerified: true,
        authProvider: 'local',
        isActive: true,
        lastLogin: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        refreshToken: 'secret_refresh_token',
        emailVerificationToken: 'secret_token',
        passwordResetToken: 'secret_reset_token'
      });

      const publicProfile = user.getPublicProfile();

      // Should include public fields
      expect(publicProfile).toHaveProperty('id');
      expect(publicProfile).toHaveProperty('email');
      expect(publicProfile).toHaveProperty('userType');
      expect(publicProfile).toHaveProperty('firstName');
      expect(publicProfile).toHaveProperty('lastName');
      expect(publicProfile).toHaveProperty('profilePicture');
      expect(publicProfile).toHaveProperty('isEmailVerified');
      expect(publicProfile).toHaveProperty('authProvider');
      expect(publicProfile).toHaveProperty('isActive');
      expect(publicProfile).toHaveProperty('lastLogin');
      expect(publicProfile).toHaveProperty('createdAt');

      // Should NOT include sensitive fields
      expect(publicProfile).not.toHaveProperty('passwordHash');
      expect(publicProfile).not.toHaveProperty('refreshToken');
      expect(publicProfile).not.toHaveProperty('emailVerificationToken');
      expect(publicProfile).not.toHaveProperty('passwordResetToken');
      expect(publicProfile).not.toHaveProperty('passwordResetExpires');
    });

    it('should return correct values for all public fields', () => {
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        userType: 'freelancer',
        firstName: 'Jane',
        lastName: 'Smith',
        profilePicture: 'https://example.com/pic.jpg',
        isEmailVerified: false,
        authProvider: 'google',
        isActive: true,
        lastLogin: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01')
      };

      const user = new User(userData);
      const publicProfile = user.getPublicProfile();

      expect(publicProfile.id).toBe(userData.id);
      expect(publicProfile.email).toBe(userData.email);
      expect(publicProfile.userType).toBe(userData.userType);
      expect(publicProfile.firstName).toBe(userData.firstName);
      expect(publicProfile.lastName).toBe(userData.lastName);
      expect(publicProfile.profilePicture).toBe(userData.profilePicture);
      expect(publicProfile.isEmailVerified).toBe(userData.isEmailVerified);
      expect(publicProfile.authProvider).toBe(userData.authProvider);
      expect(publicProfile.isActive).toBe(userData.isActive);
    });
  });
});

