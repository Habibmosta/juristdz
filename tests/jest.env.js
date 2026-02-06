/**
 * Jest Environment Setup
 * 
 * Sets up environment variables and global configurations for testing.
 */

// Mock import.meta for Node.js environment
global.importMeta = {
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
    VITE_SUPABASE_SERVICE_KEY: process.env.VITE_SUPABASE_SERVICE_KEY || 'test-service-key',
    NODE_ENV: 'test'
  }
};

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Suppress console warnings during tests unless in debug mode
if (!process.env.DEBUG) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Only show warnings that are not related to test setup
    if (!args[0]?.toString().includes('Warning: Failed to cleanup') && 
        !args[0]?.toString().includes('Test cleanup warning')) {
      originalWarn.apply(console, args);
    }
  };
}

// Set up global test timeout
jest.setTimeout(30000);