// Test setup file
const mongoose = require('mongoose');

// Mock console.log to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/ta-appointment-test';

// Global test timeout
jest.setTimeout(10000);
