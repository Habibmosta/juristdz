/**
 * Document Management System - Test Utilities
 * 
 * Comprehensive utilities for testing document management functionality.
 * Provides helpers for creating test data, validating results, and managing
 * test scenarios.
 * 
 * Requirements: All (testing foundation)
 */

import * as fc from 'fast-check';
import { mockGenerators } from './mockGenerators';
import { testConfig } from './testConfig';

// =====================================================
// VALIDATION UTILITIES
// =====================================================

/**
 * Validate document structure and required fields
 */
export const validateDocument = (document: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields = ['id', 'name', 'mimeType', 'size', 'createdAt', 'createdBy'];
  requiredFields.forEach(field => {
    if (!(field in document) || document[field] === null || document[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Type validation
  if (document.id && typeof document.id !== 'string') {
    errors.push('Document ID must be a string');
  }
  
  if (document.name && typeof document.name !== 'string') {
    errors.push('Document name must be a string');
  }
  
  if (document.size && typeof document.size !== 'number') {
    errors.push('Document size must be a number');
  }
  
  if (document.createdAt && !(document.createdAt instanceof Date)) {
    errors.push('Created date must be a Date object');
  }
  
  // Business rule validation
  if (document.size && document.size <= 0) {
    errors.push('Document size must be greater than 0');
  }
  
  if (document.size && document.size > testConfig.fileValidation.maxFileSize) {
    errors.push(`Document size exceeds maximum limit of ${testConfig.fileValidation.maxFileSize} bytes`);
  }
  
  if (document.mimeType && !testConfig.fileValidation.allowedMimeTypes.includes(document.mimeType)) {
    errors.push(`MIME type ${document.mimeType} is not allowed`);
  }
  
  if (document.tags && !Array.isArray(document.tags)) {
    errors.push('Document tags must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate folder structure and hierarchy
 */
export const validateFolder = (folder: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields = ['id', 'name', 'caseId', 'level', 'createdAt', 'createdBy'];
  requiredFields.forEach(field => {
    if (!(field in folder) || folder[field] === null || folder[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Hierarchy validation
  if (folder.level && (folder.level < 0 || folder.level > testConfig.folderHierarchy.maxDepth)) {
    errors.push(`Folder level ${folder.level} exceeds maximum depth of ${testConfig.folderHierarchy.maxDepth}`);
  }
  
  // Name validation
  if (folder.name && folder.name.length === 0) {
    errors.push('Folder name cannot be empty');
  }
  
  if (folder.name && folder.name.length > testConfig.folderHierarchy.maxNameLength) {
    errors.push(`Folder name exceeds maximum length of ${testConfig.folderHierarchy.maxNameLength}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate template structure and content
 */
export const validateTemplate = (template: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields = ['id', 'name', 'category', 'language', 'content', 'applicableRoles'];
  requiredFields.forEach(field => {
    if (!(field in template) || template[field] === null || template[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Language validation
  if (template.language && !testConfig.template.supportedLanguages.includes(template.language)) {
    errors.push(`Language ${template.language} is not supported`);
  }
  
  // Category validation
  if (template.category && !testConfig.template.categories.includes(template.category)) {
    errors.push(`Category ${template.category} is not valid`);
  }
  
  // Roles validation
  if (template.applicableRoles && Array.isArray(template.applicableRoles)) {
    template.applicableRoles.forEach((role: string) => {
      if (!testConfig.template.userRoles.includes(role)) {
        errors.push(`Role ${role} is not valid`);
      }
    });
  }
  
  // Content validation
  if (template.content && template.content.length > testConfig.template.maxContentLength) {
    errors.push(`Template content exceeds maximum length of ${testConfig.template.maxContentLength}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate signature workflow structure
 */
export const validateSignatureWorkflow = (workflow: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields = ['id', 'documentId', 'status', 'signers', 'createdAt', 'createdBy'];
  requiredFields.forEach(field => {
    if (!(field in workflow) || workflow[field] === null || workflow[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Status validation
  if (workflow.status && !testConfig.signatureWorkflow.workflowStatuses.includes(workflow.status)) {
    errors.push(`Workflow status ${workflow.status} is not valid`);
  }
  
  // Signers validation
  if (workflow.signers && Array.isArray(workflow.signers)) {
    if (workflow.signers.length < testConfig.signatureWorkflow.minSigners) {
      errors.push(`Workflow must have at least ${testConfig.signatureWorkflow.minSigners} signer(s)`);
    }
    
    if (workflow.signers.length > testConfig.signatureWorkflow.maxSigners) {
      errors.push(`Workflow cannot have more than ${testConfig.signatureWorkflow.maxSigners} signers`);
    }
    
    workflow.signers.forEach((signer: any, index: number) => {
      if (!signer.email || typeof signer.email !== 'string') {
        errors.push(`Signer ${index + 1} must have a valid email address`);
      }
      
      if (signer.status && !testConfig.signatureWorkflow.signerStatuses.includes(signer.status)) {
        errors.push(`Signer ${index + 1} has invalid status: ${signer.status}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// =====================================================
// TEST DATA CREATION UTILITIES
// =====================================================

/**
 * Create a minimal valid document for testing
 */
export const createMinimalDocument = (overrides: any = {}): any => {
  return {
    id: fc.sample(mockGenerators.documentId, 1)[0],
    caseId: fc.sample(mockGenerators.caseId, 1)[0],
    name: 'test-document.pdf',
    originalName: 'test-document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    checksum: fc.sample(mockGenerators.checksum, 1)[0],
    encryptionKey: fc.sample(mockGenerators.encryptionKey, 1)[0],
    storagePath: '/test/document.pdf',
    tags: ['test'],
    metadata: {
      category: 'contract',
      confidentialityLevel: 'internal',
      customFields: {}
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: fc.sample(mockGenerators.userId, 1)[0],
    currentVersionId: fc.sample(mockGenerators.documentId, 1)[0],
    isDeleted: false,
    ...overrides
  };
};

/**
 * Create a minimal valid folder for testing
 */
export const createMinimalFolder = (overrides: any = {}): any => {
  return {
    id: fc.sample(mockGenerators.folderId, 1)[0],
    caseId: fc.sample(mockGenerators.caseId, 1)[0],
    name: 'Test Folder',
    parentId: null,
    path: '/Test Folder',
    level: 0,
    createdAt: new Date(),
    createdBy: fc.sample(mockGenerators.userId, 1)[0],
    isDeleted: false,
    ...overrides
  };
};

/**
 * Create a minimal valid template for testing
 */
export const createMinimalTemplate = (overrides: any = {}): any => {
  return {
    id: fc.sample(mockGenerators.documentId, 1)[0],
    name: 'Test Template',
    description: 'A test template',
    category: 'contract',
    language: 'fr',
    applicableRoles: ['avocat'],
    content: 'This is a test template with {{variable}}',
    variables: [
      {
        name: 'variable',
        type: 'text',
        label: 'Test Variable',
        required: true
      }
    ],
    createdAt: new Date(),
    createdBy: fc.sample(mockGenerators.userId, 1)[0],
    isActive: true,
    ...overrides
  };
};

/**
 * Create a minimal valid signature workflow for testing
 */
export const createMinimalSignatureWorkflow = (overrides: any = {}): any => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  return {
    id: fc.sample(mockGenerators.documentId, 1)[0],
    documentId: fc.sample(mockGenerators.documentId, 1)[0],
    status: 'pending',
    signers: [
      {
        id: fc.sample(mockGenerators.userId, 1)[0],
        email: 'test@example.com',
        name: 'Test Signer',
        role: 'avocat',
        order: 1,
        status: 'pending'
      }
    ],
    createdAt: new Date(),
    createdBy: fc.sample(mockGenerators.userId, 1)[0],
    expiresAt: expiresAt,
    ...overrides
  };
};

// =====================================================
// PROPERTY TEST HELPERS
// =====================================================

/**
 * Create a property test for document validation
 */
export const createDocumentValidationProperty = () => {
  return fc.property(mockGenerators.document, (document) => {
    const validation = validateDocument(document);
    
    // All generated documents should be valid
    if (!validation.isValid) {
      console.error('Generated invalid document:', document);
      console.error('Validation errors:', validation.errors);
    }
    
    return validation.isValid;
  });
};

/**
 * Create a property test for folder validation
 */
export const createFolderValidationProperty = () => {
  return fc.property(mockGenerators.folder, (folder) => {
    const validation = validateFolder(folder);
    
    // All generated folders should be valid
    if (!validation.isValid) {
      console.error('Generated invalid folder:', folder);
      console.error('Validation errors:', validation.errors);
    }
    
    return validation.isValid;
  });
};

/**
 * Create a property test for template validation
 */
export const createTemplateValidationProperty = () => {
  return fc.property(mockGenerators.template, (template) => {
    const validation = validateTemplate(template);
    
    // All generated templates should be valid
    if (!validation.isValid) {
      console.error('Generated invalid template:', template);
      console.error('Validation errors:', validation.errors);
    }
    
    return validation.isValid;
  });
};

// =====================================================
// PERFORMANCE TEST UTILITIES
// =====================================================

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T> | T,
  label: string = 'Operation'
): Promise<{ result: T; executionTime: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  console.log(`${label} took ${executionTime.toFixed(2)}ms`);
  
  return { result, executionTime };
};

/**
 * Test performance against configured limits
 */
export const testPerformanceLimit = async <T>(
  fn: () => Promise<T> | T,
  maxTimeMs: number,
  label: string = 'Operation'
): Promise<{ passed: boolean; executionTime: number; result?: T }> => {
  try {
    const { result, executionTime } = await measureExecutionTime(fn, label);
    const passed = executionTime <= maxTimeMs;
    
    if (!passed) {
      console.warn(`Performance test failed: ${label} took ${executionTime.toFixed(2)}ms (limit: ${maxTimeMs}ms)`);
    }
    
    return { passed, executionTime, result };
  } catch (error) {
    console.error(`Performance test error for ${label}:`, error);
    return { passed: false, executionTime: Infinity };
  }
};

// =====================================================
// ERROR SIMULATION UTILITIES
// =====================================================

/**
 * Simulate network errors for testing error handling
 */
export const simulateNetworkError = (errorRate: number = 0.1): boolean => {
  return Math.random() < errorRate;
};

/**
 * Simulate database errors for testing error handling
 */
export const simulateDatabaseError = (errorRate: number = 0.05): boolean => {
  return Math.random() < errorRate;
};

/**
 * Create a mock error for testing
 */
export const createMockError = (type: string, message: string): Error => {
  const error = new Error(message);
  error.name = type;
  return error;
};

// =====================================================
// ASSERTION HELPERS
// =====================================================

/**
 * Assert that a value is a valid UUID
 */
export const assertValidUUID = (value: any): void => {
  expect(typeof value).toBe('string');
  expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
};

/**
 * Assert that a value is a valid email address
 */
export const assertValidEmail = (value: any): void => {
  expect(typeof value).toBe('string');
  expect(value).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

/**
 * Assert that a value is a valid file size
 */
export const assertValidFileSize = (value: any): void => {
  expect(typeof value).toBe('number');
  expect(value).toBeGreaterThan(0);
  expect(value).toBeLessThanOrEqual(testConfig.fileValidation.maxFileSize);
};

/**
 * Assert that a value is a valid MIME type
 */
export const assertValidMimeType = (value: any): void => {
  expect(typeof value).toBe('string');
  expect(testConfig.fileValidation.allowedMimeTypes).toContain(value);
};

/**
 * Assert that a folder depth is valid
 */
export const assertValidFolderDepth = (value: any): void => {
  expect(typeof value).toBe('number');
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(testConfig.folderHierarchy.maxDepth);
};

// =====================================================
// CLEANUP UTILITIES
// =====================================================

/**
 * Clean up test data arrays
 */
export const cleanupTestArrays = (...arrays: any[][]): void => {
  arrays.forEach(array => {
    if (Array.isArray(array)) {
      array.length = 0;
    }
  });
};

/**
 * Reset test counters and state
 */
export const resetTestState = (): void => {
  // Reset any global test state if needed
  console.log('Test state reset');
};

// =====================================================
// EXPORT ALL UTILITIES
// =====================================================

export const testUtils = {
  // Validation
  validateDocument,
  validateFolder,
  validateTemplate,
  validateSignatureWorkflow,
  
  // Test data creation
  createMinimalDocument,
  createMinimalFolder,
  createMinimalTemplate,
  createMinimalSignatureWorkflow,
  
  // Property test helpers
  createDocumentValidationProperty,
  createFolderValidationProperty,
  createTemplateValidationProperty,
  
  // Performance testing
  measureExecutionTime,
  testPerformanceLimit,
  
  // Error simulation
  simulateNetworkError,
  simulateDatabaseError,
  createMockError,
  
  // Assertions
  assertValidUUID,
  assertValidEmail,
  assertValidFileSize,
  assertValidMimeType,
  assertValidFolderDepth,
  
  // Cleanup
  cleanupTestArrays,
  resetTestState
};