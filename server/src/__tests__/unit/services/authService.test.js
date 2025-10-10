const authService = require('../../../services/authService');
const User = require('../../../models/User');

// Mock User model
jest.mock('../../../models/User');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFirstLogin', () => {
    test('should update user data for first login', () => {
      const mockUser = {
        name: 'Old Name',
        firstLogin: true,
        googleId: null,
        profilePicture: 'old-picture.jpg',
        save: jest.fn()
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      authService.handleFirstLogin(mockUser, payload);

      expect(mockUser.name).toBe('New Name');
      expect(mockUser.firstLogin).toBe(false);
      expect(mockUser.googleId).toBe('google-id-123');
      expect(mockUser.profilePicture).toBe('new-picture.jpg');
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should handle save error gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockUser = {
        name: 'Test User',
        firstLogin: true,
        googleId: null,
        profilePicture: 'test.jpg',
        save: jest.fn().mockImplementation(() => {
          throw new Error('Save failed');
        })
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      authService.handleFirstLogin(mockUser, payload);

      expect(consoleSpy).toHaveBeenCalledWith('Error handling first login:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    test('should not throw error when save fails', () => {
      const mockUser = {
        name: 'Test User',
        firstLogin: true,
        googleId: null,
        profilePicture: 'test.jpg',
        save: jest.fn().mockImplementation(() => {
          throw new Error('Save failed');
        })
      };

      const payload = {
        name: 'New Name',
        sub: 'google-id-123',
        picture: 'new-picture.jpg'
      };

      expect(() => {
        authService.handleFirstLogin(mockUser, payload);
      }).not.toThrow();
    });
  });

  describe('findUserById', () => {
    test('should return user when found', async () => {
      const mockUser = { _id: 'user123', name: 'Test User' };
      User.findById.mockResolvedValue(mockUser);

      const result = await authService.findUserById('user123');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(authService.findUserById('nonexistent')).rejects.toThrow('User not found');
      expect(User.findById).toHaveBeenCalledWith('nonexistent');
    });

    test('should handle database errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database connection failed');
      User.findById.mockRejectedValue(error);

      await expect(authService.findUserById('user123')).rejects.toThrow('Database connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error finding user by ID:', error);
      consoleSpy.mockRestore();
    });

    test('should rethrow error after logging', async () => {
      const error = new Error('Database error');
      User.findById.mockRejectedValue(error);

      await expect(authService.findUserById('user123')).rejects.toThrow('Database error');
    });
  });

  describe('findUserByEmail', () => {
    test('should return user when found by email', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', name: 'Test User' };
      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.findUserByEmail('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user not found by email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.findUserByEmail('nonexistent@example.com')).rejects.toThrow('User not found');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should handle database errors for email lookup', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database connection failed');
      User.findOne.mockRejectedValue(error);

      await expect(authService.findUserByEmail('test@example.com')).rejects.toThrow('Database connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('Error finding user by email:', error);
      consoleSpy.mockRestore();
    });

    test('should rethrow error after logging for email lookup', async () => {
      const error = new Error('Database error');
      User.findOne.mockRejectedValue(error);

      await expect(authService.findUserByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('Module Exports', () => {
    test('should export all required functions', () => {
      expect(authService).toHaveProperty('handleFirstLogin');
      expect(authService).toHaveProperty('findUserById');
      expect(authService).toHaveProperty('findUserByEmail');
    });

    test('should export functions with correct types', () => {
      expect(typeof authService.handleFirstLogin).toBe('function');
      expect(typeof authService.findUserById).toBe('function');
      expect(typeof authService.findUserByEmail).toBe('function');
    });
  });
});
