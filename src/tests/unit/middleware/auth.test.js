const { verifyAccessToken } = require('../../../src/utils/jwt');
const {
  authenticate,
  requireClient,
  requireFreelancer,
  requireRole
} = require('../../../src/middleware/auth');

// Mock the jwt utils
jest.mock('../../../src/utils/jwt');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token and call next', () => {
      const mockDecoded = {
        id: '123',
        email: 'test@example.com',
        userType: 'client'
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyAccessToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer header', () => {
      const mockDecoded = { id: '123', email: 'test@example.com', userType: 'client' };
      req.headers.authorization = 'Bearer my-test-token-123';
      verifyAccessToken.mockReturnValue(mockDecoded);

      authenticate(req, res, next);

      expect(verifyAccessToken).toHaveBeenCalledWith('my-test-token-123');
    });
  });

  describe('requireClient', () => {
    it('should call next if user is a client', () => {
      req.user = { userType: 'client' };

      requireClient(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a client', () => {
      req.user = { userType: 'freelancer' };

      requireClient(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Client role required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing user object gracefully', () => {
      req.user = null;

      expect(() => requireClient(req, res, next)).toThrow();
    });
  });

  describe('requireFreelancer', () => {
    it('should call next if user is a freelancer', () => {
      req.user = { userType: 'freelancer' };

      requireFreelancer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a freelancer', () => {
      req.user = { userType: 'client' };

      requireFreelancer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Freelancer role required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next if user has allowed role', () => {
      req.user = { userType: 'client' };
      const middleware = requireRole(['client', 'freelancer']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have allowed role', () => {
      req.user = { userType: 'client' };
      const middleware = requireRole(['freelancer']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with single role in array', () => {
      req.user = { userType: 'freelancer' };
      const middleware = requireRole(['freelancer']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should work with multiple roles', () => {
      req.user = { userType: 'client' };
      const middleware = requireRole(['client', 'freelancer', 'admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

