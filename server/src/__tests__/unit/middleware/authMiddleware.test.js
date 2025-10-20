const authMiddleware = require('../../../middleware/authMiddleware');
const authService = require('../../../services/authService');

// Mock dependencies
jest.mock('../../../services/authService');
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(null), // Always return cache miss for testing
    set: jest.fn(),
    del: jest.fn(),
    getStats: jest.fn().mockReturnValue({})
  }));
});

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {},
      sessionID: 'test-session-id'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protected middleware', () => {
    test('should call next() when user is authenticated', async () => {
      const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
      req.session.userId = 'user123';
      authService.findUserByIdOptimized.mockResolvedValue(mockUser);

      await authMiddleware.protected(req, res, next);

      expect(authService.findUserByIdOptimized).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when no session userId', async () => {
      req.session = {};

      await authMiddleware.protected(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authorized, no session' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when user not found', async () => {
      req.session.userId = 'user123';
      authService.findUserByIdOptimized.mockResolvedValue(null);
      req.session.destroy = jest.fn((callback) => callback && callback());

      await authMiddleware.protected(req, res, next);

      expect(authService.findUserByIdOptimized).toHaveBeenCalledWith('user123');
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 500 when authService throws error', async () => {
      req.session.userId = 'user123';
      const error = new Error('Database error');
      authService.findUserByIdOptimized.mockRejectedValue(error);

      await authMiddleware.protected(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should log cache miss when user not in cache', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      req.session.userId = 'user123';
      const mockUser = { _id: 'user123', name: 'Test User', email: 'test@example.com' };
      authService.findUserByIdOptimized.mockResolvedValue(mockUser);

      await authMiddleware.protected(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith('💾 Cache miss for user:', 'user123');
      expect(consoleSpy).toHaveBeenCalledWith('✅ User cached:', 'test@example.com');

      consoleSpy.mockRestore();
    });
  });

  describe('authorize middleware', () => {
    test('should call next() when user has required role', () => {
      req.user = { role: 'lecturer' };
      const authorize = authMiddleware.authorize(['lecturer']);

      authorize(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should call next() when user has one of multiple required roles', () => {
      req.user = { role: 'admin' };
      const authorize = authMiddleware.authorize(['admin', 'lecturer']);

      authorize(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 401 when no user data found', () => {
      req.user = undefined;
      const authorize = authMiddleware.authorize(['lecturer']);

      authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No user data found in request' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 when user does not have required role', () => {
      req.user = { role: 'undergraduate' };
      const authorize = authMiddleware.authorize(['lecturer']);

      authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Forbidden: You do not have the required role',
        required: ['lecturer'],
        current: 'undergraduate'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle single role as string', () => {
      req.user = { role: 'lecturer' };
      const authorize = authMiddleware.authorize('lecturer');

      authorize(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access when roles array is empty', () => {
      req.user = { role: 'any-role' };
      const authorize = authMiddleware.authorize([]);

      authorize(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 403 when user role is not in required roles', () => {
      req.user = { role: 'postgraduate' };
      const authorize = authMiddleware.authorize(['lecturer', 'admin']);

      authorize(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Forbidden: You do not have the required role',
        required: ['lecturer', 'admin'],
        current: 'postgraduate'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Module Exports', () => {
    test('should export protected function', () => {
      expect(typeof authMiddleware.protected).toBe('function');
    });

    test('should export authorize function', () => {
      expect(typeof authMiddleware.authorize).toBe('function');
    });

    test('should export both functions', () => {
      expect(authMiddleware).toHaveProperty('protected');
      expect(authMiddleware).toHaveProperty('authorize');
    });
  });
});
