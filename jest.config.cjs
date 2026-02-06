module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // 30 seconds for property-based tests
  verbose: true,
  // Handle TypeScript with CommonJS
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        target: 'es2020'
      }
    }
  },
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/jest.env.js'],
  // Ignore problematic files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  // Transform node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(fast-check)/)'
  ],
  // Module name mapping for mocks
  moduleNameMapper: {
    '^../../src/document-management/config$': '<rootDir>/tests/__mocks__/config.ts',
    '^../config$': '<rootDir>/tests/__mocks__/config.ts'
  }
};