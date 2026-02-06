/**
 * Test Setup for JuristDZ Systems
 * 
 * Configures Jest testing environment with property-based testing support
 * for both Pure Translation System and Document Management System.
 */

import * as fc from 'fast-check';
import { initializeTestConfig } from './document-management/testConfig';
import { setupTestDatabase, cleanupAfterEach, cleanupAfterAll } from './document-management/testDatabase';

// Initialize test configuration (includes fast-check configuration)
initializeTestConfig();

// Global test setup
beforeAll(async () => {
  // Setup test database for document management tests
  try {
    await setupTestDatabase();
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Global test cleanup after each test
afterEach(async () => {
  // Clean up test data after each test
  try {
    await cleanupAfterEach();
  } catch (error) {
    console.warn('⚠️ Test cleanup warning:', error);
  }
});

// Global test cleanup after all tests
afterAll(async () => {
  // Final cleanup
  try {
    await cleanupAfterAll();
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.warn('⚠️ Final cleanup warning:', error);
  }
});

// Custom Jest matchers for Pure Translation System
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePurityScore(expectedScore: number): R;
      toBeCompletelyPure(targetLanguage: string): R;
      toContainNoMixedContent(): R;
      toHaveNoCorruptedCharacters(): R;
      toHaveNoUIElements(): R;
      toMeetZeroTolerancePolicy(): R;
      // Document Management System matchers
      toBeValidDocument(): R;
      toHaveValidPermissions(): R;
      toBeEncrypted(): R;
      toHaveValidSignature(): R;
    }
  }
}

// Extend Jest matchers
expect.extend({
  toHavePurityScore(received: any, expectedScore: number) {
    const purityScore = received.purityScore || received.overall || 0;
    const pass = purityScore === expectedScore;
    
    return {
      message: () =>
        `expected purity score to be ${expectedScore}, but received ${purityScore}`,
      pass,
    };
  },

  toBeCompletelyPure(received: string, targetLanguage: string) {
    // Simple language detection for testing
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const cyrillicRegex = /[\u0400-\u04FF]/;
    const hasArabic = arabicRegex.test(received);
    const hasCyrillic = cyrillicRegex.test(received);
    
    let pass = true;
    let issues: string[] = [];
    
    if (targetLanguage === 'ar' && !hasArabic) {
      pass = false;
      issues.push('Expected Arabic text but found none');
    }
    
    if (targetLanguage === 'fr' && hasArabic) {
      pass = false;
      issues.push('Found Arabic characters in French text');
    }
    
    if (hasCyrillic) {
      pass = false;
      issues.push('Found Cyrillic characters');
    }
    
    return {
      message: () =>
        `expected text to be completely pure in ${targetLanguage}. Issues: ${issues.join(', ')}`,
      pass,
    };
  },

  toContainNoMixedContent(received: string) {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const latinRegex = /[a-zA-Z]/;
    const cyrillicRegex = /[\u0400-\u04FF]/;
    
    const hasArabic = arabicRegex.test(received);
    const hasLatin = latinRegex.test(received);
    const hasCyrillic = cyrillicRegex.test(received);
    
    const scriptCount = [hasArabic, hasLatin, hasCyrillic].filter(Boolean).length;
    const pass = scriptCount <= 1;
    
    return {
      message: () =>
        `expected text to contain only one script, but found ${scriptCount} different scripts`,
      pass,
    };
  },

  toHaveNoCorruptedCharacters(received: string) {
    const corruptedPatterns = [
      /процедة/g, // Cyrillic mixed with Arabic
      /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F\u2010-\u2027\u2030-\u205E]/g
    ];
    
    const hasCorrupted = corruptedPatterns.some(pattern => pattern.test(received));
    const pass = !hasCorrupted;
    
    return {
      message: () =>
        `expected text to have no corrupted characters, but found corrupted content`,
      pass,
    };
  },

  toHaveNoUIElements(received: string) {
    const uiElements = [
      'AUTO-TRANSLATE',
      'Pro',
      'V2',
      'Defined',
      'JuristDZ'
    ];
    
    const hasUIElements = uiElements.some(element => received.includes(element));
    const pass = !hasUIElements;
    
    return {
      message: () =>
        `expected text to have no UI elements, but found UI contamination`,
      pass,
    };
  },

  toMeetZeroTolerancePolicy(received: any) {
    const purityScore = received.purityScore || received.overall || 0;
    const pass = purityScore === 100;
    
    return {
      message: () =>
        `expected to meet zero tolerance policy (100% purity), but got ${purityScore}%`,
      pass,
    };
  },

  // Document Management System matchers
  toBeValidDocument(received: any) {
    const requiredFields = ['id', 'name', 'mimeType', 'size', 'createdAt', 'createdBy'];
    const missingFields = requiredFields.filter(field => !(field in received));
    const pass = missingFields.length === 0;
    
    return {
      message: () =>
        `expected document to have all required fields, but missing: ${missingFields.join(', ')}`,
      pass,
    };
  },

  toHaveValidPermissions(received: any) {
    const validPermissions = ['view', 'edit', 'delete', 'share', 'sign'];
    const hasValidPermissions = received.permissions && 
      Array.isArray(received.permissions) &&
      received.permissions.every((perm: string) => validPermissions.includes(perm));
    
    return {
      message: () =>
        `expected to have valid permissions array, but got: ${JSON.stringify(received.permissions)}`,
      pass: hasValidPermissions,
    };
  },

  toBeEncrypted(received: any) {
    const hasEncryptionKey = received.encryptionKey && typeof received.encryptionKey === 'string';
    const hasChecksum = received.checksum && typeof received.checksum === 'string';
    const pass = hasEncryptionKey && hasChecksum;
    
    return {
      message: () =>
        `expected document to be encrypted with encryptionKey and checksum`,
      pass,
    };
  },

  toHaveValidSignature(received: any) {
    const hasSignatureData = received.signatureData && typeof received.signatureData === 'string';
    const hasCertificate = received.certificate && typeof received.certificate === 'string';
    const hasTimestamp = received.timestamp && received.timestamp instanceof Date;
    const pass = hasSignatureData && hasCertificate && hasTimestamp;
    
    return {
      message: () =>
        `expected signature to have signatureData, certificate, and timestamp`,
      pass,
    };
  }
});

// Test data generators for property-based testing
export const testGenerators = {
  // Generate mixed content with problematic patterns
  mixedContent: fc.string().map(s => 
    s + 'Pro' + 'محامي' + 'V2' + 'AUTO-TRANSLATE'
  ),

  // Generate corrupted characters
  corruptedContent: fc.string().map(s => 
    s.replace(/a/g, 'процедة').replace(/e/g, 'Defined')
  ),

  // Generate UI elements
  uiElements: fc.constantFrom(
    'AUTO-TRANSLATE', 'Pro', 'V2', 'Defined', 'JuristDZ'
  ),

  // Generate Arabic text
  arabicText: fc.stringOf(fc.constantFrom(
    'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'
  )),

  // Generate French text
  frenchText: fc.stringOf(fc.constantFrom(
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'à', 'â', 'ä', 'ç', 'è', 'é', 'ê', 'ë', 'î', 'ï', 'ô', 'ö', 'ù', 'û', 'ü', 'ÿ'
  )),

  // Generate legal content
  legalContent: fc.constantFrom(
    'Les témoins sont définis dans l\'article 1 du Code de Procédure Pénale',
    'الشهود معرفون في المادة 1 من قانون الإجراءات الجزائية',
    'Conditions pour devenir témoin',
    'شروط لتصبح شاهداً',
    'Procédure pour désigner des témoins',
    'الإجراء لتعيين شهود'
  ),

  // Generate problematic user-reported content
  userReportedContent: fc.constantFrom(
    'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
    'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
    'Les témoins sont Pro V2 الشهود AUTO-TRANSLATE',
    'Defined محامي процедة JuristDZ'
  ),

  // Document Management System generators
  documentId: fc.uuid(),
  
  fileName: fc.oneof(
    fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.pdf'),
    fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.docx'),
    fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.txt')
  ),
  
  fileSize: fc.integer({ min: 1, max: 50 * 1024 * 1024 }), // Up to 50MB
  
  mimeType: fc.constantFrom(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'text/plain'
  ),
  
  documentCategory: fc.constantFrom(
    'contract',
    'pleading',
    'evidence',
    'correspondence',
    'template',
    'other'
  ),
  
  confidentialityLevel: fc.constantFrom(
    'public',
    'internal',
    'confidential',
    'restricted'
  ),
  
  userRole: fc.constantFrom(
    'avocat',
    'notaire',
    'huissier',
    'magistrate',
    'admin'
  ),
  
  permission: fc.constantFrom(
    'view',
    'edit',
    'delete',
    'share',
    'sign'
  ),
  
  folderDepth: fc.integer({ min: 0, max: 5 }),
  
  encryptionKey: fc.string({ minLength: 32, maxLength: 64 }),
  
  checksum: fc.string({ minLength: 32, maxLength: 64 }),
  
  tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 })
};

// Test utilities
export const testUtils = {
  // Create a mock translation request
  createMockTranslationRequest: (overrides: any = {}) => ({
    text: 'Test content',
    sourceLanguage: 'fr' as const,
    targetLanguage: 'ar' as const,
    contentType: 'legal_document' as const,
    priority: 'normal' as const,
    ...overrides
  }),

  // Create a mock pure translation result
  createMockPureTranslationResult: (overrides: any = {}) => ({
    translatedText: 'نص مترجم',
    purityScore: 100,
    qualityMetrics: {
      purityScore: 100,
      terminologyAccuracy: 95,
      contextualRelevance: 90,
      readabilityScore: 85,
      professionalismScore: 95,
      encodingIntegrity: 100
    },
    processingTime: 150,
    method: 'primary_ai' as const,
    confidence: 95,
    warnings: [],
    metadata: {
      requestId: 'test-123',
      timestamp: new Date(),
      processingSteps: [],
      fallbackUsed: false,
      cacheHit: false
    },
    ...overrides
  }),

  // Validate purity score
  validatePurityScore: (score: number): boolean => {
    return score >= 0 && score <= 100 && Number.isInteger(score);
  },

  // Check if text is pure in target language
  isPureText: (text: string, targetLanguage: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const cyrillicRegex = /[\u0400-\u04FF]/;
    const uiElements = ['AUTO-TRANSLATE', 'Pro', 'V2', 'Defined'];
    
    // Check for corrupted characters
    if (cyrillicRegex.test(text)) return false;
    
    // Check for UI elements
    if (uiElements.some(element => text.includes(element))) return false;
    
    // Check language consistency
    if (targetLanguage === 'ar') {
      return arabicRegex.test(text);
    } else if (targetLanguage === 'fr') {
      return !arabicRegex.test(text);
    }
    
    return true;
  },

  // Document Management System utilities
  createMockDocument: (overrides: any = {}) => ({
    id: 'doc-123',
    caseId: 'case-456',
    name: 'test-document.pdf',
    originalName: 'test-document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    checksum: 'abc123',
    encryptionKey: 'key123',
    storagePath: '/documents/doc-123',
    tags: ['legal', 'contract'],
    metadata: {
      description: 'Test document',
      category: 'contract' as const,
      confidentialityLevel: 'confidential' as const,
      customFields: {}
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    currentVersionId: 'version-1',
    isDeleted: false,
    ...overrides
  }),

  createMockFolder: (overrides: any = {}) => ({
    id: 'folder-123',
    caseId: 'case-456',
    name: 'Test Folder',
    parentId: null,
    path: '/Test Folder',
    level: 0,
    createdAt: new Date(),
    createdBy: 'user-123',
    isDeleted: false,
    ...overrides
  }),

  createMockSignature: (overrides: any = {}) => ({
    id: 'sig-123',
    signerId: 'user-123',
    signatureData: 'signature-data-base64',
    certificate: 'certificate-data',
    timestamp: new Date(),
    ipAddress: '192.168.1.1',
    location: 'Algiers, Algeria',
    ...overrides
  }),

  isValidFileType: (mimeType: string): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];
    return allowedTypes.includes(mimeType);
  },

  isValidFileSize: (size: number): boolean => {
    return size > 0 && size <= 50 * 1024 * 1024; // 50MB limit
  },

  isValidFolderDepth: (depth: number): boolean => {
    return depth >= 0 && depth <= 5;
  },

  validateDocumentStructure: (doc: any): boolean => {
    const requiredFields = ['id', 'name', 'mimeType', 'size', 'createdAt', 'createdBy'];
    return requiredFields.every(field => field in doc);
  }
};

// Global test configuration
export const testConfig = {
  propertyTestRuns: 100,
  timeoutMs: 30000,
  maxTextLength: 10000,
  supportedLanguages: ['fr', 'ar'] as const,
  zeroToleranceThreshold: 100,
  // Document Management System configuration
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'],
  maxFolderDepth: 5,
  encryptionAlgorithm: 'AES-256'
};

console.log('JuristDZ Systems test setup completed');
console.log(`Property-based testing configured with ${testConfig.propertyTestRuns} runs per test`);
console.log('Document Management System test utilities loaded');