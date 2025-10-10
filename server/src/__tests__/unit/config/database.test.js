const mongoose = require('mongoose');
const connectDB = require('../../../config/database');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('connectDB function', () => {
    test('should connect to MongoDB successfully', async () => {
      mongoose.connect.mockResolvedValueOnce();

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('MongoDB connected successfully');
      expect(process.exit).not.toHaveBeenCalled();
    });

    test('should handle MongoDB connection failure', async () => {
      const error = new Error('Connection failed');
      mongoose.connect.mockRejectedValueOnce(error);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('MongoDB connection failed:', error.message);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should call mongoose.connect with correct URI', async () => {
      // Mock the config module
      jest.doMock('../../../config', () => ({
        MONGO_URI: 'mongodb://test-uri'
      }));

      mongoose.connect.mockResolvedValueOnce();

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(expect.any(String));
    });

    test('should handle different types of connection errors', async () => {
      const networkError = new Error('Network timeout');
      mongoose.connect.mockRejectedValueOnce(networkError);

      await connectDB();

      expect(console.error).toHaveBeenCalledWith('MongoDB connection failed:', networkError.message);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should handle connection error without message', async () => {
      const error = new Error();
      error.message = undefined;
      mongoose.connect.mockRejectedValueOnce(error);

      await connectDB();

      expect(console.error).toHaveBeenCalledWith('MongoDB connection failed:', undefined);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('Module Export', () => {
    test('should export a function', () => {
      expect(typeof connectDB).toBe('function');
    });

    test('should be an async function', () => {
      expect(connectDB.constructor.name).toBe('AsyncFunction');
    });
  });
});
