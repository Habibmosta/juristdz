import { config } from '@/config/environment';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock external services for testing
jest.mock('@/database/connection', () => ({
  db: {
    query: jest.fn(),
    getClient: jest.fn(),
    transaction: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
  },
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Test database setup functions
export async function setupTestDatabase(): Promise<void> {
  // Mock database setup for testing
  console.log('Setting up test database...');
}

export async function cleanupTestDatabase(): Promise<void> {
  // Mock database cleanup for testing
  console.log('Cleaning up test database...');
}