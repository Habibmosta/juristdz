/**
 * Document Management System - Setup Tests
 * 
 * Tests to verify that the TypeScript project setup is working correctly
 * and all configurations are properly initialized.
 */

import * as fc from 'fast-check';
import { testGenerators, testUtils, testConfig } from '../setup';

describe('Document Management System - Project Setup', () => {
  describe('TypeScript Configuration', () => {
    it('should have strict mode enabled', () => {
      // This test will fail to compile if strict mode is not properly configured
      const testValue: string | null = null;
      
      // This should cause a TypeScript error if strict null checks are disabled
      expect(() => {
        // @ts-expect-error - This should error with strict null checks
        const length = testValue.length;
        return length;
      }).toBeDefined();
    });

    it('should enforce type safety', () => {
      interface TestInterface {
        requiredField: string;
        optionalField?: number;
      }

      const testObject: TestInterface = {
        requiredField: 'test'
      };

      expect(testObject.requiredField).toBe('test');
      expect(testObject.optionalField).toBeUndefined();
    });
  });

  describe('Property-Based Testing Setup', () => {
    it('should generate valid document IDs', () => {
      fc.assert(
        fc.property(testGenerators.documentId, (id) => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
          // UUID format check
          expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        })
      );
    });

    it('should generate valid file names', () => {
      fc.assert(
        fc.property(testGenerators.fileName, (fileName) => {
          expect(typeof fileName).toBe('string');
          expect(fileName.length).toBeGreaterThan(4); // At least ".pdf"
          expect(fileName).toMatch(/\.(pdf|docx|txt)$/);
        })
      );
    });

    it('should generate valid file sizes within limits', () => {
      fc.assert(
        fc.property(testGenerators.fileSize, (size) => {
          expect(testUtils.isValidFileSize(size)).toBe(true);
          expect(size).toBeGreaterThan(0);
          expect(size).toBeLessThanOrEqual(testConfig.maxFileSize);
        })
      );
    });

    it('should generate valid MIME types', () => {
      fc.assert(
        fc.property(testGenerators.mimeType, (mimeType) => {
          expect(testUtils.isValidFileType(mimeType)).toBe(true);
        })
      );
    });

    it('should generate valid folder depths', () => {
      fc.assert(
        fc.property(testGenerators.folderDepth, (depth) => {
          expect(testUtils.isValidFolderDepth(depth)).toBe(true);
          expect(depth).toBeGreaterThanOrEqual(0);
          expect(depth).toBeLessThanOrEqual(5);
        })
      );
    });
  });

  describe('Test Utilities', () => {
    it('should create valid mock documents', () => {
      const mockDoc = testUtils.createMockDocument();
      
      expect(mockDoc).toBeValidDocument();
      expect(mockDoc).toBeEncrypted();
      expect(testUtils.validateDocumentStructure(mockDoc)).toBe(true);
    });

    it('should create valid mock folders', () => {
      const mockFolder = testUtils.createMockFolder();
      
      expect(mockFolder.id).toBeDefined();
      expect(mockFolder.name).toBeDefined();
      expect(mockFolder.caseId).toBeDefined();
      expect(mockFolder.level).toBeGreaterThanOrEqual(0);
    });

    it('should create valid mock signatures', () => {
      const mockSignature = testUtils.createMockSignature();
      
      expect(mockSignature).toHaveValidSignature();
      expect(mockSignature.signerId).toBeDefined();
      expect(mockSignature.timestamp).toBeInstanceOf(Date);
    });

    it('should validate file types correctly', () => {
      expect(testUtils.isValidFileType('application/pdf')).toBe(true);
      expect(testUtils.isValidFileType('application/msword')).toBe(true);
      expect(testUtils.isValidFileType('image/jpeg')).toBe(true);
      expect(testUtils.isValidFileType('application/exe')).toBe(false);
      expect(testUtils.isValidFileType('text/html')).toBe(false);
    });

    it('should validate file sizes correctly', () => {
      expect(testUtils.isValidFileSize(1024)).toBe(true);
      expect(testUtils.isValidFileSize(50 * 1024 * 1024)).toBe(true);
      expect(testUtils.isValidFileSize(0)).toBe(false);
      expect(testUtils.isValidFileSize(51 * 1024 * 1024)).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should have correct test configuration values', () => {
      expect(testConfig.propertyTestRuns).toBe(100);
      expect(testConfig.maxFileSize).toBe(50 * 1024 * 1024);
      expect(testConfig.allowedFileTypes).toContain('pdf');
      expect(testConfig.allowedFileTypes).toContain('docx');
      expect(testConfig.maxFolderDepth).toBe(5);
      expect(testConfig.encryptionAlgorithm).toBe('AES-256');
    });

    it('should support required languages', () => {
      expect(testConfig.supportedLanguages).toContain('fr');
      expect(testConfig.supportedLanguages).toContain('ar');
    });
  });

  describe('Custom Jest Matchers', () => {
    it('should validate documents with toBeValidDocument matcher', () => {
      const validDoc = testUtils.createMockDocument();
      const invalidDoc = { name: 'test' }; // Missing required fields
      
      expect(validDoc).toBeValidDocument();
      expect(invalidDoc).not.toBeValidDocument();
    });

    it('should validate encryption with toBeEncrypted matcher', () => {
      const encryptedDoc = testUtils.createMockDocument();
      const unencryptedDoc = { ...encryptedDoc, encryptionKey: undefined };
      
      expect(encryptedDoc).toBeEncrypted();
      expect(unencryptedDoc).not.toBeEncrypted();
    });

    it('should validate signatures with toHaveValidSignature matcher', () => {
      const validSignature = testUtils.createMockSignature();
      const invalidSignature = { signatureData: 'test' }; // Missing required fields
      
      expect(validSignature).toHaveValidSignature();
      expect(invalidSignature).not.toHaveValidSignature();
    });
  });
});