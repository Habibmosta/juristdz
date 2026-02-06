/**
 * Document Management System - AES-256 Encryption Service
 * 
 * Provides secure file encryption and decryption using AES-256-GCM algorithm
 * with proper key management and security best practices.
 * 
 * Requirements: 1.3, 7.1, 7.2
 */

import { createCipherGCM, createDecipherGCM, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { supabaseService } from './supabaseService';

const scryptAsync = promisify(scrypt);

// Encryption configuration
export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: 32; // 256 bits
  ivLength: 16; // 128 bits
  tagLength: 16; // 128 bits
  saltLength: 32; // 256 bits
}

// Encryption key metadata
export interface EncryptionKey {
  id: string;
  keyData: string; // Base64 encoded
  algorithm: string;
  createdAt: Date;
  isActive: boolean;
  keyDerivationSalt?: string; // For password-derived keys
}

// Encryption result
export interface EncryptionResult {
  success: boolean;
  encryptedData?: Buffer;
  keyId?: string;
  iv?: Buffer;
  authTag?: Buffer;
  error?: string;
}

// Decryption result
export interface DecryptionResult {
  success: boolean;
  decryptedData?: Buffer;
  error?: string;
}

// File encryption metadata
export interface FileEncryptionMetadata {
  keyId: string;
  algorithm: string;
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
  encryptedSize: number;
  originalSize: number;
  checksum: string; // SHA-256 of original file
}

export class EncryptionService {
  private readonly config: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 32
  };

  /**
   * Generate a new encryption key
   */
  async generateEncryptionKey(): Promise<EncryptionKey> {
    try {
      // Generate random 256-bit key
      const keyBytes = randomBytes(this.config.keyLength);
      const keyData = keyBytes.toString('base64');

      // Store key in database
      const keyRecord = await supabaseService.insert('encryption_keys', {
        key_data: keyData,
        algorithm: this.config.algorithm,
        is_active: true,
        created_at: new Date().toISOString()
      });

      if (!keyRecord.success || !keyRecord.data) {
        throw new Error('Failed to store encryption key');
      }

      return {
        id: keyRecord.data.id,
        keyData,
        algorithm: this.config.algorithm,
        createdAt: new Date(keyRecord.data.created_at),
        isActive: keyRecord.data.is_active
      };
    } catch (error) {
      throw new Error(`Failed to generate encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive encryption key from password (for user-specific encryption)
   */
  async deriveKeyFromPassword(password: string, salt?: Buffer): Promise<EncryptionKey> {
    try {
      // Generate salt if not provided
      const keySalt = salt || randomBytes(this.config.saltLength);
      
      // Derive key using scrypt
      const derivedKey = await scryptAsync(password, keySalt, this.config.keyLength) as Buffer;
      const keyData = derivedKey.toString('base64');
      const saltData = keySalt.toString('base64');

      // Store key in database
      const keyRecord = await supabaseService.insert('encryption_keys', {
        key_data: keyData,
        algorithm: this.config.algorithm,
        key_derivation_salt: saltData,
        is_active: true,
        created_at: new Date().toISOString()
      });

      if (!keyRecord.success || !keyRecord.data) {
        throw new Error('Failed to store derived encryption key');
      }

      return {
        id: keyRecord.data.id,
        keyData,
        algorithm: this.config.algorithm,
        createdAt: new Date(keyRecord.data.created_at),
        isActive: keyRecord.data.is_active,
        keyDerivationSalt: saltData
      };
    } catch (error) {
      throw new Error(`Failed to derive encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve encryption key by ID
   */
  async getEncryptionKey(keyId: string): Promise<EncryptionKey | null> {
    try {
      const result = await supabaseService.findById('encryption_keys', keyId);
      
      if (!result.success || !result.data) {
        return null;
      }

      const keyRecord = result.data;
      return {
        id: keyRecord.id,
        keyData: keyRecord.key_data,
        algorithm: keyRecord.algorithm,
        createdAt: new Date(keyRecord.created_at),
        isActive: keyRecord.is_active,
        keyDerivationSalt: keyRecord.key_derivation_salt
      };
    } catch (error) {
      console.error('Failed to retrieve encryption key:', error);
      return null;
    }
  }

  /**
   * Encrypt file data using AES-256-GCM
   */
  async encryptFile(fileData: Buffer, keyId?: string): Promise<EncryptionResult> {
    try {
      // Get or generate encryption key
      let encryptionKey: EncryptionKey;
      
      if (keyId) {
        const existingKey = await this.getEncryptionKey(keyId);
        if (!existingKey) {
          return {
            success: false,
            error: `Encryption key not found: ${keyId}`
          };
        }
        encryptionKey = existingKey;
      } else {
        encryptionKey = await this.generateEncryptionKey();
      }

      // Generate random IV
      const iv = randomBytes(this.config.ivLength);
      
      // Create cipher
      const key = Buffer.from(encryptionKey.keyData, 'base64');
      const cipher = createCipherGCM(this.config.algorithm, key, iv);

      // Encrypt data
      const encryptedChunks: Buffer[] = [];
      encryptedChunks.push(cipher.update(fileData));
      encryptedChunks.push(cipher.final());

      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine encrypted data
      const encryptedData = Buffer.concat(encryptedChunks);

      return {
        success: true,
        encryptedData,
        keyId: encryptionKey.id,
        iv,
        authTag
      };
    } catch (error) {
      return {
        success: false,
        error: `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Decrypt file data using AES-256-GCM
   */
  async decryptFile(
    encryptedData: Buffer,
    keyId: string,
    iv: Buffer,
    authTag: Buffer
  ): Promise<DecryptionResult> {
    try {
      // Get encryption key
      const encryptionKey = await this.getEncryptionKey(keyId);
      if (!encryptionKey) {
        return {
          success: false,
          error: `Encryption key not found: ${keyId}`
        };
      }

      if (!encryptionKey.isActive) {
        return {
          success: false,
          error: 'Encryption key is not active'
        };
      }

      // Create decipher
      const key = Buffer.from(encryptionKey.keyData, 'base64');
      const decipher = createDecipherGCM(this.config.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      const decryptedChunks: Buffer[] = [];
      decryptedChunks.push(decipher.update(encryptedData));
      decryptedChunks.push(decipher.final());

      // Combine decrypted data
      const decryptedData = Buffer.concat(decryptedChunks);

      return {
        success: true,
        decryptedData
      };
    } catch (error) {
      return {
        success: false,
        error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Encrypt file with metadata generation
   */
  async encryptFileWithMetadata(
    fileData: Buffer,
    originalChecksum: string,
    keyId?: string
  ): Promise<{
    success: boolean;
    encryptedData?: Buffer;
    metadata?: FileEncryptionMetadata;
    error?: string;
  }> {
    try {
      const encryptionResult = await this.encryptFile(fileData, keyId);
      
      if (!encryptionResult.success) {
        return {
          success: false,
          error: encryptionResult.error
        };
      }

      const metadata: FileEncryptionMetadata = {
        keyId: encryptionResult.keyId!,
        algorithm: this.config.algorithm,
        iv: encryptionResult.iv!.toString('base64'),
        authTag: encryptionResult.authTag!.toString('base64'),
        encryptedSize: encryptionResult.encryptedData!.length,
        originalSize: fileData.length,
        checksum: originalChecksum
      };

      return {
        success: true,
        encryptedData: encryptionResult.encryptedData,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: `File encryption with metadata failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Decrypt file using metadata
   */
  async decryptFileWithMetadata(
    encryptedData: Buffer,
    metadata: FileEncryptionMetadata
  ): Promise<DecryptionResult> {
    try {
      const iv = Buffer.from(metadata.iv, 'base64');
      const authTag = Buffer.from(metadata.authTag, 'base64');

      return await this.decryptFile(encryptedData, metadata.keyId, iv, authTag);
    } catch (error) {
      return {
        success: false,
        error: `File decryption with metadata failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Rotate encryption key (create new key and mark old as inactive)
   */
  async rotateEncryptionKey(oldKeyId: string): Promise<{
    success: boolean;
    newKey?: EncryptionKey;
    error?: string;
  }> {
    try {
      // Generate new key
      const newKey = await this.generateEncryptionKey();

      // Mark old key as inactive
      const updateResult = await supabaseService.update('encryption_keys', oldKeyId, {
        is_active: false,
        rotated_at: new Date().toISOString(),
        replaced_by: newKey.id
      });

      if (!updateResult.success) {
        throw new Error('Failed to deactivate old encryption key');
      }

      // Create audit entry for key rotation
      await supabaseService.createAuditEntry(
        'encryption_key',
        oldKeyId,
        'rotate',
        {
          oldKeyId,
          newKeyId: newKey.id,
          algorithm: this.config.algorithm
        }
      );

      return {
        success: true,
        newKey
      };
    } catch (error) {
      return {
        success: false,
        error: `Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Securely delete encryption key
   */
  async deleteEncryptionKey(keyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if key is still in use
      const documentsUsingKey = await supabaseService.query('documents', {
        filters: { encryption_key_id: keyId },
        limit: 1
      });

      if (documentsUsingKey.success && documentsUsingKey.data && documentsUsingKey.data.length > 0) {
        return {
          success: false,
          error: 'Cannot delete encryption key: still in use by documents'
        };
      }

      // Mark key as deleted (don't actually delete for audit purposes)
      const updateResult = await supabaseService.update('encryption_keys', keyId, {
        is_active: false,
        deleted_at: new Date().toISOString(),
        key_data: null // Clear the actual key data
      });

      if (!updateResult.success) {
        throw new Error('Failed to delete encryption key');
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'encryption_key',
        keyId,
        'delete',
        {
          keyId,
          algorithm: this.config.algorithm
        }
      );

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: `Key deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get encryption statistics
   */
  async getEncryptionStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    inactiveKeys: number;
    deletedKeys: number;
    algorithmsInUse: string[];
  }> {
    try {
      const allKeys = await supabaseService.query('encryption_keys', {
        select: 'id, algorithm, is_active, deleted_at'
      });

      if (!allKeys.success || !allKeys.data) {
        throw new Error('Failed to retrieve encryption statistics');
      }

      const keys = allKeys.data;
      const totalKeys = keys.length;
      const activeKeys = keys.filter(k => k.is_active && !k.deleted_at).length;
      const inactiveKeys = keys.filter(k => !k.is_active && !k.deleted_at).length;
      const deletedKeys = keys.filter(k => k.deleted_at).length;
      const algorithmsInUse = [...new Set(keys.map(k => k.algorithm))];

      return {
        totalKeys,
        activeKeys,
        inactiveKeys,
        deletedKeys,
        algorithmsInUse
      };
    } catch (error) {
      console.error('Failed to get encryption statistics:', error);
      return {
        totalKeys: 0,
        activeKeys: 0,
        inactiveKeys: 0,
        deletedKeys: 0,
        algorithmsInUse: []
      };
    }
  }

  /**
   * Validate encryption configuration
   */
  validateConfig(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (this.config.keyLength !== 32) {
      errors.push('Key length must be 32 bytes for AES-256');
    }

    if (this.config.ivLength !== 16) {
      errors.push('IV length must be 16 bytes for AES-256-GCM');
    }

    if (this.config.tagLength !== 16) {
      errors.push('Auth tag length must be 16 bytes for AES-256-GCM');
    }

    if (this.config.algorithm !== 'aes-256-gcm') {
      errors.push('Algorithm must be aes-256-gcm');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
export default encryptionService;
