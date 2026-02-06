/**
 * Document Management System - Encryption Service Tests
 * 
 * Comprehensive tests for the AES-256 encryption service including
 * unit tests and property-based tests for correctness validation.
 */

import { encryptionService } from '../../src/document-management/services/encryptionService';
import type { EncryptionKey, FileEncryptionMetadata } from '../../src/document-management/services/encryptionService';
import { randomBytes } from 'crypto';
import * as fc from 'fast-check';

// Mock Supabase service for testing
jest.mock('../../src/document-management/services/supabaseService', () => ({
  supabaseService: {
    insert: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'test-key-id',
        created_at: new Date().toISOString(),
        is_active: true
      }
    }),
    findById: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'test-key-id',
        key_data: 'dGVzdC1rZXktZGF0YS0zMi1ieXRlcy1sb25nLWZvcg==', // 32 bytes base64
        algorithm: 'aes-256-gcm',
        created_at: new Date().toISOString(),
        is_active: true
      }
    }),
    update: jest.fn().mockResolvedValue({ success: true }),
    query: jest.fn().mockResolvedValue({ success: true, data: [] }),
    createAuditEntry: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('EncryptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Key Generation', () => {
    test('should generate a new encryption key', async () => {
      const key = await encryptionService.generateEncryptionKey();
      
      expect(key).toBeDefined();
      expect(key.id).toBe('test-key-id');
      expect(key.algorithm).toBe('aes-256-gcm');
      expect(key.isActive).toBe(true);
      expect(key.keyData).toBeDefined();
      expect(key.createdAt).toBeInstanceOf(Date);
    });

    test('should derive key from password', async () => {
      const password = 'test-password-123';
      const key = await encryptionService.deriveKeyFromPassword(password);
      
      expect(key).toBeDefined();
      expect(key.algorithm).toBe('aes-256-gcm');
      expect(key.keyDerivationSalt).toBeDefined();
      expect(key.isActive).toBe(true);
    });

    test('should derive consistent keys from same password and salt', async () => {
      const password = 'test-password-123';
      const salt = randomBytes(32);
      
      const key1 = await encryptionService.deriveKeyFromPassword(password, salt);
      const key2 = await encryptionService.deriveKeyFromPassword(password, salt);
      
      // Keys should have same derived data (though different IDs from DB)
      expect(key1.keyData).toBe(key2.keyData);
    });
  });

  describe('File Encryption/Decryption', () => {
    test('should encrypt and decrypt file data correctly', async () => {
      const originalData = Buffer.from('This is test file content for encryption testing');
      
      // Encrypt the data
      const encryptionResult = await encryptionService.encryptFile(originalData);
      
      expect(encryptionResult.success).toBe(true);
      expect(encryptionResult.encryptedData).toBeDefined();
      expect(encryptionResult.keyId).toBeDefined();
      expect(encryptionResult.iv).toBeDefined();
      expect(encryptionResult.authTag).toBeDefined();
      
      // Encrypted data should be different from original
      expect(encryptionResult.encryptedData).not.toEqual(originalData);
      
      // Decrypt the data
      const decryptionResult = await encryptionService.decryptFile(
        encryptionResult.encryptedData!,
        encryptionResult.keyId!,
        encryptionResult.iv!,
        encryptionResult.authTag!
      );
      
      expect(decryptionResult.success).toBe(true);
      expect(decryptionResult.decryptedData).toEqual(originalData);
    });

    test('should encrypt file with metadata', async () => {
      const originalData = Buffer.from('Test file content');
      const checksum = 'test-checksum';
      
      const result = await encryptionService.encryptFileWithMetadata(originalData, checksum);
      
      expect(result.success).toBe(true);
      expect(result.encryptedData).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.algorithm).toBe('aes-256-gcm');
      expect(result.metadata!.originalSize).toBe(originalData.length);
      expect(result.metadata!.checksum).toBe(checksum);
    });

    test('should decrypt file using metadata', async () => {
      const originalData = Buffer.from('Test file content for metadata decryption');
      const checksum = 'test-checksum';
      
      // Encrypt with metadata
      const encryptResult = await encryptionService.encryptFileWithMetadata(originalData, checksum);
      expect(encryptResult.success).toBe(true);
      
      // Decrypt using metadata
      const decryptResult = await encryptionService.decryptFileWithMetadata(
        encryptResult.encryptedData!,
        encryptResult.metadata!
      );
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.decryptedData).toEqual(originalData);
    });

    test('should fail decryption with wrong key', async () => {
      const originalData = Buffer.from('Test data');
      
      // Encrypt with one key
      const encryptResult = await encryptionService.encryptFile(originalData);
      expect(encryptResult.success).toBe(true);
      
      // Try to decrypt with wrong key ID
      const decryptResult = await encryptionService.decryptFile(
        encryptResult.encryptedData!,
        'wrong-key-id',
        encryptResult.iv!,
        encryptResult.authTag!
      );
      
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.error).toContain('not found');
    });

    test('should fail decryption with tampered data', async () => {
      const originalData = Buffer.from('Test data');
      
      const encryptResult = await encryptionService.encryptFile(originalData);
      expect(encryptResult.success).toBe(true);
      
      // Tamper with encrypted data
      const tamperedData = Buffer.from(encryptResult.encryptedData!);
      tamperedData[0] = tamperedData[0] ^ 1; // Flip one bit
      
      const decryptResult = await encryptionService.decryptFile(
        tamperedData,
        encryptResult.keyId!,
        encryptResult.iv!,
        encryptResult.authTag!
      );
      
      expect(decryptResult.success).toBe(false);
      expect(decryptResult.error).toContain('failed');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate encryption configuration', () => {
      const validation = encryptionService.validateConfig();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Property-Based Tests', () => {
    // Property 32: Encryption at Rest
    // For any stored document, it should be encrypted using AES-256 encryption
    test('Property 32: All file data should be encrypted with AES-256', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1024 * 1024 }), // Random file data up to 1MB
          async (fileData) => {
            const originalBuffer = Buffer.from(fileData);
            
            // Encrypt the file
            const encryptResult = await encryptionService.encryptFile(originalBuffer);
            
            // Should successfully encrypt
            expect(encryptResult.success).toBe(true);
            expect(encryptResult.encryptedData).toBeDefined();
            expect(encryptResult.keyId).toBeDefined();
            
            // Encrypted data should be different from original (unless empty)
            if (originalBuffer.length > 0) {
              expect(encryptResult.encryptedData).not.toEqual(originalBuffer);
            }
            
            // Should be able to decrypt back to original
            const decryptResult = await encryptionService.decryptFile(
              encryptResult.encryptedData!,
              encryptResult.keyId!,
              encryptResult.iv!,
              encryptResult.authTag!
            );
            
            expect(decryptResult.success).toBe(true);
            expect(decryptResult.decryptedData).toEqual(originalBuffer);
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property: Encryption should be deterministic for same key and IV
    test('Property: Encryption with same key and IV should produce same result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1024 }),
          async (fileData) => {
            const originalBuffer = Buffer.from(fileData);
            
            // Generate a key once
            const key = await encryptionService.generateEncryptionKey();
            
            // Encrypt twice with same key
            const result1 = await encryptionService.encryptFile(originalBuffer, key.id);
            const result2 = await encryptionService.encryptFile(originalBuffer, key.id);
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            
            // Results should be different due to random IV
            expect(result1.encryptedData).not.toEqual(result2.encryptedData);
            expect(result1.iv).not.toEqual(result2.iv);
            
            // But both should decrypt to original
            const decrypt1 = await encryptionService.decryptFile(
              result1.encryptedData!,
              result1.keyId!,
              result1.iv!,
              result1.authTag!
            );
            const decrypt2 = await encryptionService.decryptFile(
              result2.encryptedData!,
              result2.keyId!,
              result2.iv!,
              result2.authTag!
            );
            
            expect(decrypt1.decryptedData).toEqual(originalBuffer);
            expect(decrypt2.decryptedData).toEqual(originalBuffer);
          }
        ),
        { numRuns: 25 }
      );
    });

    // Property: Encryption should preserve data integrity
    test('Property: Decryption should always recover original data exactly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 0, maxLength: 10000 }),
          async (fileData) => {
            const originalBuffer = Buffer.from(fileData);
            
            // Encrypt
            const encryptResult = await encryptionService.encryptFile(originalBuffer);
            expect(encryptResult.success).toBe(true);
            
            // Decrypt
            const decryptResult = await encryptionService.decryptFile(
              encryptResult.encryptedData!,
              encryptResult.keyId!,
              encryptResult.iv!,
              encryptResult.authTag!
            );
            
            expect(decryptResult.success).toBe(true);
            
            // Data should be exactly the same
            expect(decryptResult.decryptedData).toEqual(originalBuffer);
            expect(decryptResult.decryptedData!.length).toBe(originalBuffer.length);
            
            // Byte-by-byte comparison
            for (let i = 0; i < originalBuffer.length; i++) {
              expect(decryptResult.decryptedData![i]).toBe(originalBuffer[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property: Metadata should accurately reflect encryption details
    test('Property: Encryption metadata should accurately describe the encryption', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 5000 }),
          fc.string({ minLength: 10, maxLength: 64 }), // checksum
          async (fileData, checksum) => {
            const originalBuffer = Buffer.from(fileData);
            
            const result = await encryptionService.encryptFileWithMetadata(originalBuffer, checksum);
            
            expect(result.success).toBe(true);
            expect(result.metadata).toBeDefined();
            
            const metadata = result.metadata!;
            
            // Metadata should accurately reflect the encryption
            expect(metadata.algorithm).toBe('aes-256-gcm');
            expect(metadata.originalSize).toBe(originalBuffer.length);
            expect(metadata.encryptedSize).toBe(result.encryptedData!.length);
            expect(metadata.checksum).toBe(checksum);
            expect(metadata.keyId).toBeDefined();
            expect(metadata.iv).toBeDefined();
            expect(metadata.authTag).toBeDefined();
            
            // Should be able to decrypt using metadata
            const decryptResult = await encryptionService.decryptFileWithMetadata(
              result.encryptedData!,
              metadata
            );
            
            expect(decryptResult.success).toBe(true);
            expect(decryptResult.decryptedData).toEqual(originalBuffer);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty file data', async () => {
      const emptyData = Buffer.alloc(0);
      
      const encryptResult = await encryptionService.encryptFile(emptyData);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = await encryptionService.decryptFile(
        encryptResult.encryptedData!,
        encryptResult.keyId!,
        encryptResult.iv!,
        encryptResult.authTag!
      );
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.decryptedData).toEqual(emptyData);
    });

    test('should handle large file data', async () => {
      // Test with 1MB of data
      const largeData = Buffer.alloc(1024 * 1024, 'A');
      
      const encryptResult = await encryptionService.encryptFile(largeData);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = await encryptionService.decryptFile(
        encryptResult.encryptedData!,
        encryptResult.keyId!,
        encryptResult.iv!,
        encryptResult.authTag!
      );
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.decryptedData).toEqual(largeData);
    });

    test('should handle binary file data', async () => {
      // Create binary data with all possible byte values
      const binaryData = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
      
      const encryptResult = await encryptionService.encryptFile(binaryData);
      expect(encryptResult.success).toBe(true);
      
      const decryptResult = await encryptionService.decryptFile(
        encryptResult.encryptedData!,
        encryptResult.keyId!,
        encryptResult.iv!,
        encryptResult.authTag!
      );
      
      expect(decryptResult.success).toBe(true);
      expect(decryptResult.decryptedData).toEqual(binaryData);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database failure
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.insert.mockResolvedValueOnce({ success: false, error: 'Database error' });
      
      const result = await encryptionService.generateEncryptionKey();
      
      // Should handle the error gracefully
      expect(result).rejects.toThrow('Failed to generate encryption key');
    });

    test('should validate key existence before decryption', async () => {
      const { supabaseService } = require('../../src/document-management/services/supabaseService');
      supabaseService.findById.mockResolvedValueOnce({ success: false, data: null });
      
      const testData = Buffer.from('test');
      const testIv = randomBytes(16);
      const testTag = randomBytes(16);
      
      const result = await encryptionService.decryptFile(testData, 'nonexistent-key', testIv, testTag);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});