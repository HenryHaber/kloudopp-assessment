// Test setup file
// require('dotenv').config({ path: '.env.test' });
require('../../config/env');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};
