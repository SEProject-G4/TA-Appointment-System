// Mock dotenv before requiring config
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const config = require('../../../config');

describe('Config Module', () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh import
    jest.resetModules();
  });

  describe('Environment Variables', () => {
    test('should load PORT from environment', () => {
      process.env.PORT = '3000';
      const config = require('../../../config');
      expect(config.PORT).toBe('3000');
    });

    test('should load SESSION_SECRET from environment', () => {
      process.env.SESSION_SECRET = 'test-secret';
      const config = require('../../../config');
      expect(config.SESSION_SECRET).toBe('test-secret');
    });

    test('should load FRONTEND_URL from environment', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const config = require('../../../config');
      expect(config.FRONTEND_URL).toBe('http://localhost:3000');
    });

    test('should load BACKEND_URL from environment', () => {
      process.env.BACKEND_URL = 'http://localhost:5000';
      const config = require('../../../config');
      expect(config.BACKEND_URL).toBe('http://localhost:5000');
    });

    test('should load MONGO_URI from environment', () => {
      process.env.MONGO_URI = 'mongodb://localhost:27017/test';
      const config = require('../../../config');
      expect(config.MONGO_URI).toBe('mongodb://localhost:27017/test');
    });

    test('should load Google OAuth configuration from environment', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      const config = require('../../../config');
      expect(config.GOOGLE_CLIENT_ID).toBe('test-client-id');
      expect(config.GOOGLE_CLIENT_SECRET).toBe('test-client-secret');
    });

    test('should load email configuration from environment', () => {
      process.env.GMAIL_USER = 'test@gmail.com';
      process.env.GMAIL_PASS = 'test-password';
      const config = require('../../../config');
      expect(config.GMAIL_USER).toBe('test@gmail.com');
      expect(config.GMAIL_PASS).toBe('test-password');
    });
  });

  describe('Configuration Object Structure', () => {
    test('should export all required configuration properties', () => {
      const requiredProperties = [
        'PORT',
        'SESSION_SECRET',
        'FRONTEND_URL',
        'BACKEND_URL',
        'MONGO_URI',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GMAIL_USER',
        'GMAIL_PASS'
      ];

      requiredProperties.forEach(prop => {
        expect(config).toHaveProperty(prop);
      });
    });

    test('should handle undefined environment variables', () => {
      // Store original environment variables
      const originalEnv = {
        PORT: process.env.PORT,
        SESSION_SECRET: process.env.SESSION_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL,
        BACKEND_URL: process.env.BACKEND_URL,
        MONGO_URI: process.env.MONGO_URI,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GMAIL_USER: process.env.GMAIL_USER,
        GMAIL_PASS: process.env.GMAIL_PASS
      };
      
      // Clear specific environment variables
      delete process.env.PORT;
      delete process.env.SESSION_SECRET;
      delete process.env.FRONTEND_URL;
      delete process.env.BACKEND_URL;
      delete process.env.MONGO_URI;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GMAIL_USER;
      delete process.env.GMAIL_PASS;
      
      // Clear module cache and require fresh
      jest.resetModules();
      const config = require('../../../config');
      
      expect(config.PORT).toBeUndefined();
      expect(config.SESSION_SECRET).toBeUndefined();
      expect(config.FRONTEND_URL).toBeUndefined();
      expect(config.BACKEND_URL).toBeUndefined();
      expect(config.MONGO_URI).toBeUndefined();
      expect(config.GOOGLE_CLIENT_ID).toBeUndefined();
      expect(config.GOOGLE_CLIENT_SECRET).toBeUndefined();
      expect(config.GMAIL_USER).toBeUndefined();
      expect(config.GMAIL_PASS).toBeUndefined();
      
      // Restore original environment variables
      Object.assign(process.env, originalEnv);
    });
  });

  describe('Module Export', () => {
    test('should export an object', () => {
      expect(typeof config).toBe('object');
      expect(config).not.toBeNull();
    });

    test('should not be an array', () => {
      expect(Array.isArray(config)).toBe(false);
    });
  });
});
