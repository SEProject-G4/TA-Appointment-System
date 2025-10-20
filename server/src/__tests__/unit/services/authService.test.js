const authService = require('../../../services/authService');
const User = require('../../../models/User');

// Mock User model
jest.mock('../../../models/User');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFirstLogin', () => {
    test('should update user data for first login', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Old Name',
        firstLogin: true,
        googleId: null,
        profilePicture: 'old-picture.jpg',
        email: 'test@example.com'
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      User.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await authService.handleFirstLogin(mockUser, payload);

      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: 'New Name',
            firstLogin: false,
            googleId: 'google-id-123',
            profilePicture: 'new-picture.jpg'
          })
        })
      );
      expect(mockUser.name).toBe('New Name');
      expect(mockUser.firstLogin).toBe(false);
      expect(mockUser.googleId).toBe('google-id-123');
      expect(mockUser.profilePicture).toBe('new-picture.jpg');
      
      consoleSpy.mockRestore();
    });

    test('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        firstLogin: true,
        googleId: null,
        profilePicture: 'test.jpg',
        email: 'test@example.com'
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      User.updateOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(authService.handleFirstLogin(mockUser, payload)).rejects.toThrow('Database error');
      expect(consoleSpy).toHaveBeenCalledWith('Error handling first login:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('should log first login completion', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        firstLogin: true,
        googleId: null,
        profilePicture: 'test.jpg',
        email: 'test@example.com'
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      User.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      await authService.handleFirstLogin(mockUser, payload);

      expect(consoleSpy).toHaveBeenCalledWith('First login completed for user: test@example.com');
      
      consoleSpy.mockRestore();
    });
  });

  describe('findUserById', () => {
    test('should return user when found', async () => {
      const mockUser = { _id: 'user123', name: 'Test User' };
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockUser)
      };
      User.findById.mockReturnValue(mockQuery);

      const result = await authService.findUserById('user123');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockQuery.lean).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user not found', async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null)
      };
      User.findById.mockReturnValue(mockQuery);

      await expect(authService.findUserById('nonexistent')).rejects.toThrow('User not found');
      expect(User.findById).toHaveBeenCalledWith('nonexistent');
    });

    test('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database connection failed');
      const mockQuery = {
        lean: jest.fn().mockRejectedValue(error)
      };
      User.findById.mockReturnValue(mockQuery);

      await expect(authService.findUserById('user123')).rejects.toThrow('Database connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error finding user by ID:', error);
      consoleSpy.mockRestore();
    });

    test('should rethrow error after logging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database error');
      const mockQuery = {
        lean: jest.fn().mockRejectedValue(error)
      };
      User.findById.mockReturnValue(mockQuery);

      await expect(authService.findUserById('user123')).rejects.toThrow('Database error');
      consoleSpy.mockRestore();
    });
  });

  describe('findUserByEmail', () => {
    test('should return user when found by email', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', name: 'Test User' };
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(mockUser)
      };
      User.findOne.mockReturnValue(mockQuery);

      const result = await authService.findUserByEmail('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockQuery.lean).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user not found by email', async () => {
      const mockQuery = {
        lean: jest.fn().mockResolvedValue(null)
      };
      User.findOne.mockReturnValue(mockQuery);

      await expect(authService.findUserByEmail('nonexistent@example.com')).rejects.toThrow('User not found');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should handle database errors for email lookup', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database connection failed');
      const mockQuery = {
        lean: jest.fn().mockRejectedValue(error)
      };
      User.findOne.mockReturnValue(mockQuery);

      await expect(authService.findUserByEmail('test@example.com')).rejects.toThrow('Database connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error finding user by email:', error);
      consoleSpy.mockRestore();
    });

    test('should rethrow error after logging for email lookup', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database error');
      const mockQuery = {
        lean: jest.fn().mockRejectedValue(error)
      };
      User.findOne.mockReturnValue(mockQuery);

      await expect(authService.findUserByEmail('test@example.com')).rejects.toThrow('Database error');
      consoleSpy.mockRestore();
    });
  });

  describe('Module Exports', () => {
    test('should export all required functions', () => {
      expect(authService).toHaveProperty('handleFirstLogin');
      expect(authService).toHaveProperty('findUserById');
      expect(authService).toHaveProperty('findUserByIdOptimized');
      expect(authService).toHaveProperty('findUserByEmail');
      expect(authService).toHaveProperty('findUsersByIds');
      expect(authService).toHaveProperty('updateLastActivity');
      expect(authService).toHaveProperty('getUserSessionInfo');
    });

    test('should export functions with correct types', () => {
      expect(typeof authService.handleFirstLogin).toBe('function');
      expect(typeof authService.findUserById).toBe('function');
      expect(typeof authService.findUserByIdOptimized).toBe('function');
      expect(typeof authService.findUserByEmail).toBe('function');
      expect(typeof authService.findUsersByIds).toBe('function');
      expect(typeof authService.updateLastActivity).toBe('function');
      expect(typeof authService.getUserSessionInfo).toBe('function');
    });
  });
});
