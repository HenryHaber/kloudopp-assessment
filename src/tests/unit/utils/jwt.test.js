const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair
} = require('../../../src/utils/jwt');

// Set up test environment variables
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

describe('JWT Utils', () => {
  const mockPayload = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    userType: 'client'
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userType).toBe(mockPayload.userType);
    });

    it('should set correct expiration time', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(15 * 60); // 15 minutes in seconds
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userType).toBe(mockPayload.userType);
    });

    it('should set correct expiration time', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60); // 7 days in seconds
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userType).toBe(mockPayload.userType);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        mockPayload,
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        verifyAccessToken(expiredToken);
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for token signed with wrong secret', () => {
      const wrongToken = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '15m' });

      expect(() => {
        verifyAccessToken(wrongToken);
      }).toThrow('Invalid or expired access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.id).toBe(mockPayload.id);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.userType).toBe(mockPayload.userType);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        mockPayload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        verifyRefreshToken(expiredToken);
      }).toThrow('Invalid or expired refresh token');
    });
  });

  describe('generateTokenPair', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      userType: 'freelancer'
    };

    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate tokens with correct payload', () => {
      const tokens = generateTokenPair(mockUser);

      const accessDecoded = jwt.verify(tokens.accessToken, process.env.JWT_ACCESS_SECRET);
      const refreshDecoded = jwt.verify(tokens.refreshToken, process.env.JWT_REFRESH_SECRET);

      expect(accessDecoded.id).toBe(mockUser.id);
      expect(accessDecoded.email).toBe(mockUser.email);
      expect(accessDecoded.userType).toBe(mockUser.userType);

      expect(refreshDecoded.id).toBe(mockUser.id);
      expect(refreshDecoded.email).toBe(mockUser.email);
      expect(refreshDecoded.userType).toBe(mockUser.userType);
    });

    it('should generate different tokens each time', async () => {
      const tokens1 = generateTokenPair(mockUser);
      // Small delay to ensure different iat (issued at) timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      const tokens2 = generateTokenPair(mockUser);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });
});

