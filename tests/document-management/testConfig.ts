/**
 * Document Management System - Test Configuration
 * 
 * Centralized configuration for all document management system tests.
 * Provides consistent settings for property-based testing, database setup,
 * and test execution parameters.
 * 
 * Requirements: All (testing foundation)
 */

import * as fc from 'fast-check';

// =====================================================
// PROPERTY-BASED TESTING CONFIGURATION
// =====================================================

/**
 * Property-based testing configuration as specified in design document
 */
export const propertyTestConfig = {
  // Minimum 100 iterations per property test as per design requirements
  numRuns: 100,
  
  // Enable verbose output for debugging
  verbose: true,
  
  // Seed for reproducible tests (can be overridden)
  seed: Date.now(),
  
  // Don't stop on first failure to gather more information
  endOnFailure: false,
  
  // Timeout for individual property tests (30 seconds)
  timeout: 30000,
  
  // Maximum shrinking attempts to find minimal failing examples
  maxShrinks: 1000,
  
  // Skip properties that take too long
  skipAllAfterTimeLimit: 60000, // 1 minute total
  
  // Interrupt after timeout
  interruptAfterTimeLimit: 90000, // 1.5 minutes absolute limit
  
  // Custom reporter for property test results
  reporter: (runDetails: fc.RunDetails<any>) => {
    if (runDetails.failed) {
      console.error(`❌ Property test failed after ${runDetails.numRuns} runs`);
      console.error(`Counterexample: ${JSON.stringify(runDetails.counterexample, null, 2)}`);
      if (runDetails.error) {
        console.error(`Error: ${runDetails.error}`);
      }
    } else {
      console.log(`✅ Property test passed after ${runDetails.numRuns} runs`);
    }
  }
};

/**
 * Configure fast-check globally with our settings
 */
export const configureFastCheck = (): void => {
  fc.configureGlobal(propertyTestConfig);
};

// =====================================================
// TEST DATABASE CONFIGURATION
// =====================================================

/**
 * Test database configuration
 */
export const testDatabaseConfig = {
  // Connection settings
  connectionTimeout: 10000, // 10 seconds
  queryTimeout: 30000, // 30 seconds
  
  // Cleanup settings
  cleanupAfterEach: true,
  cleanupAfterAll: true,
  cleanupTimeout: 60000, // 1 minute for cleanup operations
  
  // Test data limits
  maxTestUsers: 100,
  maxTestDocuments: 1000,
  maxTestFolders: 500,
  maxTestTemplates: 100,
  
  // Retry settings for flaky operations
  maxRetries: 3,
  retryDelay: 1000, // 1 second between retries
  
  // Schema validation
  validateSchema: true,
  requiredTables: [
    'documents',
    'folders',
    'document_versions',
    'templates',
    'signature_workflows',
    'workflow_signers',
    'document_permissions',
    'share_links',
    'document_comments',
    'audit_trail',
    'encryption_keys',
    'document_workflows',
    'workflow_steps'
  ]
};

// =====================================================
// FILE VALIDATION CONFIGURATION
// =====================================================

/**
 * File validation configuration matching requirements
 */
export const fileValidationConfig = {
  // File size limits (Requirement 1.2)
  maxFileSize: 50 * 1024 * 1024, // 50MB
  minFileSize: 1, // 1 byte minimum
  
  // Allowed file types (Requirement 1.1)
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'],
  
  // Allowed MIME types (Requirement 1.1)
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain'
  ],
  
  // Forbidden file types for security testing
  forbiddenFileTypes: ['exe', 'bat', 'cmd', 'scr', 'com', 'pif', 'js', 'jar'],
  
  // Forbidden MIME types for security testing
  forbiddenMimeTypes: [
    'application/x-executable',
    'application/x-msdownload',
    'application/javascript',
    'text/html',
    'application/java-archive'
  ]
};

// =====================================================
// FOLDER HIERARCHY CONFIGURATION
// =====================================================

/**
 * Folder hierarchy configuration matching requirements
 */
export const folderHierarchyConfig = {
  // Maximum folder depth (Requirement 2.2)
  maxDepth: 5,
  
  // Minimum folder depth
  minDepth: 0,
  
  // Maximum folder name length
  maxNameLength: 255,
  
  // Minimum folder name length
  minNameLength: 1,
  
  // Maximum path length
  maxPathLength: 1000,
  
  // Path separator
  pathSeparator: '/',
  
  // Reserved folder names
  reservedNames: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'LPT1', 'LPT2']
};

// =====================================================
// SECURITY CONFIGURATION
// =====================================================

/**
 * Security testing configuration
 */
export const securityTestConfig = {
  // Encryption settings (Requirement 7.1)
  encryptionAlgorithm: 'AES-256',
  keyLength: 256,
  
  // Authentication settings (Requirement 7.5)
  requireMFA: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Access control settings
  defaultPermissions: ['view'],
  adminPermissions: ['view', 'edit', 'delete', 'share', 'sign'],
  
  // Audit trail settings (Requirement 7.3)
  auditAllOperations: true,
  auditRetentionDays: 2555, // 7 years
  
  // IP address validation
  allowedIPRanges: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
  
  // Rate limiting for testing
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 1000
};

// =====================================================
// TEMPLATE CONFIGURATION
// =====================================================

/**
 * Template testing configuration
 */
export const templateTestConfig = {
  // Supported languages (Requirement 3.5)
  supportedLanguages: ['fr', 'ar'],
  
  // Template categories
  categories: ['contract', 'motion', 'brief', 'notice', 'agreement', 'other'],
  
  // User roles for template access (Requirement 3.1)
  userRoles: ['avocat', 'notaire', 'huissier', 'magistrate', 'admin'],
  
  // Variable types
  variableTypes: ['text', 'date', 'number', 'boolean', 'list'],
  
  // Content limits
  maxContentLength: 100000, // 100KB
  minContentLength: 10,
  maxVariables: 50,
  
  // Template validation
  requireVariableLabels: true,
  allowEmptyTemplates: false
};

// =====================================================
// SIGNATURE WORKFLOW CONFIGURATION
// =====================================================

/**
 * Signature workflow testing configuration
 */
export const signatureWorkflowConfig = {
  // Workflow statuses (Requirement 6.1)
  workflowStatuses: ['pending', 'in_progress', 'completed', 'cancelled', 'expired'],
  
  // Signer statuses
  signerStatuses: ['pending', 'signed', 'declined'],
  
  // Workflow limits
  maxSigners: 10,
  minSigners: 1,
  
  // Expiration settings
  defaultExpirationDays: 30,
  maxExpirationDays: 365,
  minExpirationDays: 1,
  
  // Signature validation
  requireCertificate: true,
  requireTimestamp: true,
  requireIPAddress: true,
  
  // Compliance settings (Requirement 6.4)
  algerianCompliance: true,
  auditTrailRequired: true
};

// =====================================================
// PERFORMANCE TESTING CONFIGURATION
// =====================================================

/**
 * Performance testing configuration
 */
export const performanceTestConfig = {
  // Response time limits
  maxUploadTime: 5000, // 5 seconds for 50MB file
  maxSearchTime: 2000, // 2 seconds for search queries
  maxDownloadTime: 3000, // 3 seconds for file download
  
  // Concurrency limits
  maxConcurrentUsers: 100,
  maxConcurrentUploads: 10,
  maxConcurrentDownloads: 20,
  
  // Load testing
  rampUpTime: 30000, // 30 seconds
  testDuration: 300000, // 5 minutes
  
  // Memory limits
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB
  maxCPUUsage: 80, // 80%
  
  // Database performance
  maxQueryTime: 1000, // 1 second
  maxConnectionTime: 5000, // 5 seconds
  
  // Storage performance
  maxStorageLatency: 2000, // 2 seconds
  maxIndexingTime: 10000 // 10 seconds for content indexing
};

// =====================================================
// INTEGRATION TEST CONFIGURATION
// =====================================================

/**
 * Integration testing configuration
 */
export const integrationTestConfig = {
  // External service timeouts
  virusScanTimeout: 30000, // 30 seconds
  encryptionTimeout: 10000, // 10 seconds
  searchIndexTimeout: 15000, // 15 seconds
  
  // Case management integration
  caseManagementEnabled: true,
  syncTimeout: 5000, // 5 seconds
  
  // Notification system
  notificationTimeout: 3000, // 3 seconds
  emailTimeout: 10000, // 10 seconds
  
  // Multi-language support (Requirement 8.4)
  testLanguages: ['fr', 'ar'],
  rtlSupport: true,
  
  // Mobile support (Requirement 8.5)
  mobileViewports: [
    { width: 320, height: 568 }, // iPhone SE
    { width: 375, height: 667 }, // iPhone 8
    { width: 414, height: 896 }, // iPhone 11
    { width: 768, height: 1024 } // iPad
  ]
};

// =====================================================
// ERROR HANDLING CONFIGURATION
// =====================================================

/**
 * Error handling testing configuration
 */
export const errorHandlingConfig = {
  // Network errors
  simulateNetworkErrors: true,
  networkErrorRate: 0.1, // 10% error rate for testing
  
  // Database errors
  simulateDatabaseErrors: true,
  databaseErrorRate: 0.05, // 5% error rate for testing
  
  // Storage errors
  simulateStorageErrors: true,
  storageErrorRate: 0.05, // 5% error rate for testing
  
  // Timeout scenarios
  timeoutScenarios: [1000, 5000, 10000, 30000], // Various timeout values
  
  // Error recovery
  maxRetryAttempts: 3,
  retryBackoffMultiplier: 2,
  initialRetryDelay: 1000,
  
  // Error logging
  logAllErrors: true,
  errorLogLevel: 'error',
  includeStackTrace: true
};

// =====================================================
// TEST ENVIRONMENT CONFIGURATION
// =====================================================

/**
 * Test environment configuration
 */
export const testEnvironmentConfig = {
  // Environment type
  environment: process.env.NODE_ENV || 'test',
  
  // Test isolation
  isolateTests: true,
  parallelExecution: false, // Disable for database tests
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'warn',
  logToFile: false,
  logToConsole: true,
  
  // Debugging
  debugMode: process.env.DEBUG === 'true',
  verboseOutput: process.env.VERBOSE === 'true',
  
  // Test data
  useRealData: false,
  seedTestData: true,
  preserveTestData: false,
  
  // Coverage
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// =====================================================
// EXPORT CONSOLIDATED CONFIGURATION
// =====================================================

/**
 * Consolidated test configuration
 */
export const testConfig = {
  propertyTest: propertyTestConfig,
  database: testDatabaseConfig,
  fileValidation: fileValidationConfig,
  folderHierarchy: folderHierarchyConfig,
  security: securityTestConfig,
  template: templateTestConfig,
  signatureWorkflow: signatureWorkflowConfig,
  performance: performanceTestConfig,
  integration: integrationTestConfig,
  errorHandling: errorHandlingConfig,
  environment: testEnvironmentConfig
};

/**
 * Initialize all test configurations
 */
export const initializeTestConfig = (): void => {
  // Configure fast-check
  configureFastCheck();
  
  // Set Jest timeout to match our property test timeout
  if (typeof jest !== 'undefined') {
    jest.setTimeout(propertyTestConfig.timeout + 10000); // Add 10s buffer
  }
  
  // Log configuration in debug mode
  if (testEnvironmentConfig.debugMode) {
    console.log('🔧 Test configuration initialized:');
    console.log(`- Property test runs: ${propertyTestConfig.numRuns}`);
    console.log(`- Database cleanup: ${testDatabaseConfig.cleanupAfterEach ? 'enabled' : 'disabled'}`);
    console.log(`- Max file size: ${fileValidationConfig.maxFileSize / (1024 * 1024)}MB`);
    console.log(`- Max folder depth: ${folderHierarchyConfig.maxDepth}`);
    console.log(`- Supported languages: ${templateTestConfig.supportedLanguages.join(', ')}`);
  }
};

// Auto-initialize when imported
initializeTestConfig();