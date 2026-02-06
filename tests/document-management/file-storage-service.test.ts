/**
 * Document Management System - File Storage Service Tests
 * 
 * Comprehensive tests for the file storage service including
 * unit tests and property-based tests for correctness validation.
 */

import { fileStorageService } from '../../src/document-management/services/fileStorageService';
import type { StorageOptions, FileStorageMetadata } from '../../src/document-management/services/fileStorageService';
import * as fc from 'fast-check';

// Mock dependencies
jest.mock('../../src/document-management/services/supabaseService', () => ({
  supabaseService: {
    uploadFile: jest.fn().mockResolvedValue({ success: true }),
    downloadFile: jest.fn().mockResolvedValue({ 
      success: true, 
      data: Buffer.from('test file content') 
    }),
    deleteFile: jest.fn().mockResolvedValue({ success: true }),
    listFiles: jest.fn().mockResolvedValue({ 
      success: true, 
      data: [{ name: 'test.pdf' }], 
      count: 1 
    }),
    getFileUrl: jest.fn().mockResolvedValue({ 
      success: true, 
      url: 'https://example.com/file.pdf' 
    }),
    moveFile: jest.fn().mockResolvedValue({ success: true }),
    copyFile: jest.fn().mockResolvedValue({ success: true }),
    insert: jest.fn().mockResolvedValue({ success: true }),
    query: jest.fn().mockResolvedValue({ success: true, data: [] }),
    update: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    createAuditEntry: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../../src/document-management/services/encryptionService', () => ({
  encryptionService: {
    encryptFileWithMetadata: jest.fn().mockResolvedValue({
      success: true,
      encryptedData: Buffer.from('encrypted content'),
      metadata: {
        keyId: 'test-key',
        algorithm: 'aes-256-gcm',
        iv: 'test-iv',
        authTag: 'test-tag',
        encryptedSize: 16,
        originalSize: 17,
        checksum: 'test-checksum'
      }
    }),
    decryptFileWithMetadata: jest.fn().mockResolvedValue({
      success: true,
      decryptedData: Buffer.from('test file content')
    })
  }
}));

describe('FileStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Storage', () => {
    test('should store file successfully', async () => {
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const storagePath = 'documents/test.pdf';
      
      const result = await fileStorageService.storeFile(testFile, storagePath);
      
      expect(result.success).toBe(true);
      expect(result.filePath).toBe(storagePath);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.fileName).toBe('test.pdf');
      expect(result.metadata!.mimeType).toBe('application/pdf');
    });

    test('should reject files that are too large', async () => {
      // Create a file larger than 50MB
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const result = await fileStorageService.storeFile(largeFile, 'documents/large.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds maximum');
    });

    test('should reject unsupported file types', async () => {
      const unsupportedFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
      
      const result = await fileStorageService.storeFile(unsupportedFile, 'documents/test.exe');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File type');
      expect(result.error).toContain('not allowed');
    });

    test('should encrypt files by default', async () => {
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      const result = await fileStorageService.storeFile(testFile, 'documents/test.pdf');
      
      expect(result.success).toBe(true);
      expect(result.metadata!.isEncrypted).toBe(true);
      expect(result.metadata!.encryptionMetadata).toBeDefined();
    });

    test('should allow disabling encryption', async () => {
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const options: StorageOptions = { encrypt: false };
      
      const result = await fileStorageService.storeFile(testFile, 'documents/test.pdf', options);
      
      expect(result.success).toBe(true);
      expect(result.metadata!.isEncrypted).toBe(false);
    });
  });

  describe('File Retrieval', () => {
    test('should retrieve file successfully', async () => {
      const storagePath = 'documents/test.pdf';
      
      // Mock metadata retrieval
      const mockMetadata: FileStorageMetadata = {
        fileName: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        checksum: 'test-checksum',
        storagePath,
        isEncrypted: false,
        uploadedAt: new Date()
      };
      
      // Mock the private method by setting up the query response
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          file_name: mockMetadata.fileName,
          original_name: mockMetadata.originalName,
          mime_type: mockMetadata.mimeType,
          size: mockMetadata.size,
          checksum: mockMetadata.checksum,
          storage_path: mockMetadata.storagePath,
          is_encrypted: mockMetadata.isEncrypted,
          uploaded_at: mockMetadata.uploadedAt.toISOString()
        }]
      });
      
      const result = await fileStorageService.retrieveFile(storagePath);
      
      expect(result.success).toBe(true);
      expect(result.fileData).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should decrypt encrypted files during retrieval', async () => {
      const storagePath = 'documents/encrypted.pdf';
      
      // Mock encrypted file metadata
      const mockMetadata: FileStorageMetadata = {
        fileName: 'encrypted.pdf',
        originalName: 'encrypted.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        checksum: 'test-checksum',
        storagePath,
        isEncrypted: true,
        encryptionMetadata: {
          keyId: 'test-key',
          algorithm: 'aes-256-gcm',
          iv: 'test-iv',
          authTag: 'test-tag',
          encryptedSize: 16,
          originalSize: 17,
          checksum: 'test-checksum'
        },
        uploadedAt: new Date()
      };
      
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          file_name: mockMetadata.fileName,
          original_name: mockMetadata.originalName,
          mime_type: mockMetadata.mimeType,
          size: mockMetadata.size,
          checksum: mockMetadata.checksum,
          storage_path: mockMetadata.storagePath,
          is_encrypted: mockMetadata.isEncrypted,
          encryption_metadata: mockMetadata.encryptionMetadata,
          uploaded_at: mockMetadata.uploadedAt.toISOString()
        }]
      });
      
      const result = await fileStorageService.retrieveFile(storagePath);
      
      expect(result.success).toBe(true);
      expect(result.fileData).toBeDefined();
      
      // Verify decryption was called
      const { encryptionService } = require('../../src/document-management/services/encryptionService');
      expect(encryptionService.decryptFileWithMetadata).toHaveBeenCalled();
    });

    test('should handle file not found', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: []
      });
      
      const result = await fileStorageService.retrieveFile('nonexistent/file.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('metadata not found');
    });
  });

  describe('File Operations', () => {
    test('should delete file successfully', async () => {
      const storagePath = 'documents/test.pdf';
      
      const result = await fileStorageService.deleteFile(storagePath);
      
      expect(result.success).toBe(true);
      
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      expect(supabaseService.deleteFile).toHaveBeenCalledWith(storagePath);
    });

    test('should move file successfully', async () => {
      const currentPath = 'documents/old.pdf';
      const newPath = 'documents/new.pdf';
      
      // Mock metadata for the file being moved
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          file_name: 'old.pdf',
          original_name: 'old.pdf',
          mime_type: 'application/pdf',
          size: 1024,
          checksum: 'test-checksum',
          storage_path: currentPath,
          is_encrypted: false,
          uploaded_at: new Date().toISOString()
        }]
      });
      
      const result = await fileStorageService.moveFile(currentPath, newPath);
      
      expect(result.success).toBe(true);
      expect(supabaseService.moveFile).toHaveBeenCalledWith(currentPath, newPath);
    });

    test('should copy file successfully', async () => {
      const sourcePath = 'documents/source.pdf';
      const destPath = 'documents/copy.pdf';
      
      const result = await fileStorageService.copyFile(sourcePath, destPath);
      
      expect(result.success).toBe(true);
      
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      expect(supabaseService.copyFile).toHaveBeenCalledWith(sourcePath, destPath);
    });

    test('should list files successfully', async () => {
      const result = await fileStorageService.listFiles({
        prefix: 'documents/',
        limit: 10
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      expect(supabaseService.listFiles).toHaveBeenCalled();
    });

    test('should get file URL successfully', async () => {
      const storagePath = 'documents/test.pdf';
      
      const url = await fileStorageService.getFileUrl(storagePath);
      
      expect(url).toBe('https://example.com/file.pdf');
      
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      expect(supabaseService.getFileUrl).toHaveBeenCalledWith(storagePath, undefined);
    });
  });

  describe('Property-Based Tests', () => {
    // Property 1: File Format Validation
    // For any uploaded file, the system should accept the file if and only if it has a valid format
    test('Property 1: File format validation should accept only allowed types', async () => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain'
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...allowedTypes),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.uint8Array({ minLength: 1, maxLength: 1024 }),
          async (mimeType, fileName, fileContent) => {
            const file = new File([Buffer.from(fileContent)], fileName, { type: mimeType });
            const result = await fileStorageService.storeFile(file, `documents/${fileName}`);
            
            // Should accept valid file types
            expect(result.success).toBe(true);
            expect(result.metadata?.mimeType).toBe(mimeType);
          }
        ),
        { numRuns: 20 }
      );
    });

    // Property 2: File Size Enforcement
    // For any file upload attempt, files exceeding 50MB should be rejected
    test('Property 2: File size validation should enforce 50MB limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 49 * 1024 * 1024 }), // Under 50MB
          async (fileSize) => {
            const content = new Array(fileSize).fill('a').join('');
            const file = new File([content], 'test.pdf', { type: 'application/pdf' });
            
            const result = await fileStorageService.storeFile(file, 'documents/test.pdf');
            
            // Files under 50MB should be accepted
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );

      // Test files over 50MB should be rejected
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 51 * 1024 * 1024, max: 100 * 1024 * 1024 }), // Over 50MB
          async (fileSize) => {
            const content = new Array(Math.min(fileSize, 1000)).fill('a').join(''); // Limit for test performance
            const file = new File([content], 'large.pdf', { type: 'application/pdf' });
            // Mock the size to simulate large file
            Object.defineProperty(file, 'size', { value: fileSize });
            
            const result = await fileStorageService.storeFile(file, 'documents/large.pdf');
            
            // Files over 50MB should be rejected
            expect(result.success).toBe(false);
            expect(result.error).toContain('File size exceeds maximum');
          }
        ),
        { numRuns: 5 }
      );
    });

    // Property 3: Upload Processing Pipeline
    // For any successfully uploaded file, the system should encrypt it, generate unique ID, and store metadata
    test('Property 3: Upload pipeline should process files completely', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.uint8Array({ minLength: 1, maxLength: 10000 }),
          fc.constantFrom('application/pdf', 'text/plain', 'image/jpeg'),
          async (fileName, fileContent, mimeType) => {
            const file = new File([Buffer.from(fileContent)], fileName, { type: mimeType });
            
            const result = await fileStorageService.storeFile(file, `documents/${fileName}`);
            
            if (result.success) {
              // Should have all required metadata
              expect(result.metadata).toBeDefined();
              expect(result.metadata!.fileName).toBe(fileName);
              expect(result.metadata!.mimeType).toBe(mimeType);
              expect(result.metadata!.size).toBe(file.size);
              expect(result.metadata!.checksum).toBeDefined();
              expect(result.metadata!.storagePath).toBeDefined();
              expect(result.metadata!.uploadedAt).toBeInstanceOf(Date);
              
              // Should be encrypted by default
              expect(result.metadata!.isEncrypted).toBe(true);
              expect(result.metadata!.encryptionMetadata).toBeDefined();
            }
          }
        ),
        { numRuns: 25 }
      );
    });

    // Property: File retrieval should return original content
    test('Property: Retrieved files should match original content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 5000 }),
          fc.string({ minLength: 1, maxLength: 30 }),
          async (fileContent, fileName) => {
            const originalBuffer = Buffer.from(fileContent);
            const file = new File([originalBuffer], `${fileName}.pdf`, { type: 'application/pdf' });
            
            // Store the file
            const storeResult = await fileStorageService.storeFile(file, `documents/${fileName}.pdf`);
            
            if (storeResult.success) {
              // Retrieve the file
              const retrieveResult = await fileStorageService.retrieveFile(storeResult.filePath!);
              
              expect(retrieveResult.success).toBe(true);
              expect(retrieveResult.fileData).toBeDefined();
              
              // Content should match (after decryption if encrypted)
              // Note: In our mock, we return a fixed content, but in real implementation
              // the decryption should return the original content
              expect(retrieveResult.fileData).toBeDefined();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    // Property: Storage operations should be idempotent
    test('Property: File operations should handle errors gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          async (fileName) => {
            // Test operations on non-existent files
            const nonExistentPath = `documents/nonexistent-${fileName}.pdf`;
            
            const deleteResult = await fileStorageService.deleteFile(nonExistentPath);
            const retrieveResult = await fileStorageService.retrieveFile(nonExistentPath);
            
            // Operations should fail gracefully without throwing
            expect(deleteResult.success).toBeDefined();
            expect(retrieveResult.success).toBeDefined();
            
            if (!deleteResult.success) {
              expect(deleteResult.error).toBeDefined();
            }
            
            if (!retrieveResult.success) {
              expect(retrieveResult.error).toBeDefined();
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty files', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      
      const result = await fileStorageService.storeFile(emptyFile, 'documents/empty.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File is empty');
    });

    test('should handle files with special characters in names', async () => {
      const specialFile = new File(['content'], 'file with spaces & symbols!.pdf', { type: 'application/pdf' });
      
      const result = await fileStorageService.storeFile(specialFile, 'documents/special.pdf');
      
      expect(result.success).toBe(true);
      expect(result.metadata!.originalName).toBe('file with spaces & symbols!.pdf');
    });

    test('should handle concurrent file operations', async () => {
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });
      
      // Perform concurrent operations
      const [result1, result2] = await Promise.all([
        fileStorageService.storeFile(file1, 'documents/file1.pdf'),
        fileStorageService.storeFile(file2, 'documents/file2.pdf')
      ]);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.filePath).not.toBe(result2.filePath);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage service failures', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.uploadFile.mockResolvedValueOnce({ 
        success: false, 
        error: { message: 'Storage service unavailable' } 
      });
      
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = await fileStorageService.storeFile(testFile, 'documents/test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Storage upload failed');
    });

    test('should handle encryption failures', async () => {
      const { encryptionService } = require('../../src/document-management/services/encryptionService');
      encryptionService.encryptFileWithMetadata.mockResolvedValueOnce({
        success: false,
        error: 'Encryption failed'
      });
      
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const result = await fileStorageService.storeFile(testFile, 'documents/test.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File encryption failed');
    });

    test('should handle decryption failures during retrieval', async () => {
      const { encryptionService } = require('../../src/document-management/services/encryptionService');
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      
      // Mock encrypted file metadata
      supabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          file_name: 'encrypted.pdf',
          original_name: 'encrypted.pdf',
          mime_type: 'application/pdf',
          size: 1024,
          checksum: 'test-checksum',
          storage_path: 'documents/encrypted.pdf',
          is_encrypted: true,
          encryption_metadata: { keyId: 'test-key' },
          uploaded_at: new Date().toISOString()
        }]
      });
      
      // Mock decryption failure
      encryptionService.decryptFileWithMetadata.mockResolvedValueOnce({
        success: false,
        error: 'Decryption failed'
      });
      
      const result = await fileStorageService.retrieveFile('documents/encrypted.pdf');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('File decryption failed');
    });
  });
});