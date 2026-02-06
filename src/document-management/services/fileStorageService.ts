/**
 * Document Management System - File Storage Service
 * 
 * Provides secure file storage and retrieval with Supabase integration,
 * encryption support, and comprehensive metadata management.
 * 
 * Requirements: 1.6, 7.1, 7.2
 */

import { supabaseService } from './supabaseService';
import { encryptionService } from './encryptionService';
import type { Document } from '../../../types/document-management';
import type { FileEncryptionMetadata } from './encryptionService';

// File storage configuration
export interface StorageConfig {
  bucketName: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

// File storage options
export interface StorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  overwrite?: boolean;
  generateThumbnail?: boolean;
  customMetadata?: Record<string, any>;
}

// File storage result
export interface StorageResult {
  success: boolean;
  filePath?: string;
  fileUrl?: string;
  metadata?: FileStorageMetadata;
  error?: string;
}

// File retrieval result
export interface RetrievalResult {
  success: boolean;
  fileData?: Buffer;
  metadata?: FileStorageMetadata;
  error?: string;
}

// File storage metadata
export interface FileStorageMetadata {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  storagePath: string;
  isEncrypted: boolean;
  encryptionMetadata?: FileEncryptionMetadata;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  customMetadata?: Record<string, any>;
}

// File listing options
export interface ListingOptions {
  prefix?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'size' | 'created_at' | 'last_modified';
  sortOrder?: 'asc' | 'desc';
  includeMetadata?: boolean;
}

// File listing result
export interface ListingResult {
  success: boolean;
  files?: FileStorageMetadata[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}

export class FileStorageService {
  private config: StorageConfig = {
    bucketName: 'documents',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ],
    encryptionEnabled: true,
    compressionEnabled: false
  };

  /**
   * Store file in Supabase storage with encryption
   */
  async storeFile(
    file: File,
    storagePath: string,
    options: StorageOptions = {}
  ): Promise<StorageResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: `File validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Generate unique storage path if needed
      const finalStoragePath = storagePath || this.generateStoragePath(file.name);

      // Prepare file data
      let fileData = Buffer.from(await file.arrayBuffer());
      let encryptionMetadata: FileEncryptionMetadata | undefined;

      // Encrypt file if enabled
      if (options.encrypt !== false && this.config.encryptionEnabled) {
        const checksum = await this.generateChecksum(fileData);
        const encryptionResult = await encryptionService.encryptFileWithMetadata(
          fileData,
          checksum
        );

        if (!encryptionResult.success) {
          return {
            success: false,
            error: `File encryption failed: ${encryptionResult.error}`
          };
        }

        fileData = encryptionResult.encryptedData!;
        encryptionMetadata = encryptionResult.metadata!;
      }

      // Create file object for upload
      const fileToUpload = new File([fileData], file.name, {
        type: encryptionMetadata ? 'application/octet-stream' : file.type
      });

      // Upload to Supabase storage
      const uploadResult = await supabaseService.uploadFile(
        finalStoragePath,
        fileToUpload,
        {
          contentType: fileToUpload.type,
          upsert: options.overwrite || false
        }
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: `Storage upload failed: ${uploadResult.error?.message || 'Unknown error'}`
        };
      }

      // Generate file metadata
      const metadata: FileStorageMetadata = {
        fileName: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        checksum: await this.generateChecksum(Buffer.from(await file.arrayBuffer())),
        storagePath: finalStoragePath,
        isEncrypted: !!encryptionMetadata,
        encryptionMetadata,
        uploadedAt: new Date(),
        customMetadata: options.customMetadata
      };

      // Store metadata in database
      await this.storeFileMetadata(metadata);

      // Get public URL if available
      const fileUrl = await this.getFileUrl(finalStoragePath);

      return {
        success: true,
        filePath: finalStoragePath,
        fileUrl,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `File storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Retrieve file from storage with decryption
   */
  async retrieveFile(storagePath: string): Promise<RetrievalResult> {
    try {
      // Get file metadata
      const metadata = await this.getFileMetadata(storagePath);
      if (!metadata) {
        return {
          success: false,
          error: 'File metadata not found'
        };
      }

      // Download file from storage
      const downloadResult = await supabaseService.downloadFile(storagePath);
      if (!downloadResult.success || !downloadResult.data) {
        return {
          success: false,
          error: `File download failed: ${downloadResult.error?.message || 'Unknown error'}`
        };
      }

      let fileData = downloadResult.data;

      // Decrypt file if encrypted
      if (metadata.isEncrypted && metadata.encryptionMetadata) {
        const decryptionResult = await encryptionService.decryptFileWithMetadata(
          fileData,
          metadata.encryptionMetadata
        );

        if (!decryptionResult.success) {
          return {
            success: false,
            error: `File decryption failed: ${decryptionResult.error}`
          };
        }

        fileData = decryptionResult.decryptedData!;
      }

      // Update last accessed timestamp
      await this.updateLastAccessed(storagePath);

      return {
        success: true,
        fileData,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `File retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(storagePath: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get file metadata before deletion
      const metadata = await this.getFileMetadata(storagePath);

      // Delete from storage
      const deleteResult = await supabaseService.deleteFile(storagePath);
      if (!deleteResult.success) {
        return {
          success: false,
          error: `Storage deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Remove metadata from database
      await this.deleteFileMetadata(storagePath);

      // Create audit entry
      if (metadata) {
        await supabaseService.createAuditEntry(
          'file_storage',
          storagePath,
          'delete',
          {
            fileName: metadata.fileName,
            size: metadata.size,
            isEncrypted: metadata.isEncrypted
          }
        );
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List files in storage
   */
  async listFiles(options: ListingOptions = {}): Promise<ListingResult> {
    try {
      const listResult = await supabaseService.listFiles(
        options.prefix || '',
        {
          limit: options.limit || 100,
          offset: options.offset || 0,
          sortBy: options.sortBy || 'created_at',
          sortOrder: options.sortOrder || 'desc'
        }
      );

      if (!listResult.success) {
        return {
          success: false,
          error: `File listing failed: ${listResult.error?.message || 'Unknown error'}`
        };
      }

      const files: FileStorageMetadata[] = [];

      if (options.includeMetadata && listResult.data) {
        // Get metadata for each file
        for (const file of listResult.data) {
          const metadata = await this.getFileMetadata(file.name);
          if (metadata) {
            files.push(metadata);
          }
        }
      }

      return {
        success: true,
        files,
        totalCount: listResult.count,
        hasMore: (options.offset || 0) + (options.limit || 100) < (listResult.count || 0)
      };

    } catch (error) {
      return {
        success: false,
        error: `File listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get file URL for direct access
   */
  async getFileUrl(storagePath: string, expiresIn?: number): Promise<string | null> {
    try {
      const urlResult = await supabaseService.getFileUrl(storagePath, expiresIn);
      return urlResult.success ? urlResult.url : null;
    } catch (error) {
      console.error('Failed to get file URL:', error);
      return null;
    }
  }

  /**
   * Move file to new location
   */
  async moveFile(
    currentPath: string,
    newPath: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get current file metadata
      const metadata = await this.getFileMetadata(currentPath);
      if (!metadata) {
        return {
          success: false,
          error: 'File metadata not found'
        };
      }

      // Move file in storage
      const moveResult = await supabaseService.moveFile(currentPath, newPath);
      if (!moveResult.success) {
        return {
          success: false,
          error: `File move failed: ${moveResult.error?.message || 'Unknown error'}`
        };
      }

      // Update metadata with new path
      await this.updateFileMetadata(currentPath, {
        storagePath: newPath
      });

      // Create audit entry
      await supabaseService.createAuditEntry(
        'file_storage',
        currentPath,
        'move',
        {
          oldPath: currentPath,
          newPath: newPath,
          fileName: metadata.fileName
        }
      );

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `File move failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Copy file to new location
   */
  async copyFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Copy file in storage
      const copyResult = await supabaseService.copyFile(sourcePath, destinationPath);
      if (!copyResult.success) {
        return {
          success: false,
          error: `File copy failed: ${copyResult.error?.message || 'Unknown error'}`
        };
      }

      // Get source metadata and create copy
      const sourceMetadata = await this.getFileMetadata(sourcePath);
      if (sourceMetadata) {
        const copyMetadata: FileStorageMetadata = {
          ...sourceMetadata,
          storagePath: destinationPath,
          uploadedAt: new Date()
        };
        await this.storeFileMetadata(copyMetadata);
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `File copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    encryptedFiles: number;
    averageFileSize: number;
    storageUsageByType: Record<string, { count: number; size: number }>;
  }> {
    try {
      const metadataResult = await supabaseService.query('file_metadata', {
        select: 'mime_type, size, is_encrypted'
      });

      if (!metadataResult.success || !metadataResult.data) {
        throw new Error('Failed to retrieve storage statistics');
      }

      const files = metadataResult.data;
      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
      const encryptedFiles = files.filter(file => file.is_encrypted).length;
      const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      const storageUsageByType: Record<string, { count: number; size: number }> = {};
      files.forEach(file => {
        const mimeType = file.mime_type || 'unknown';
        if (!storageUsageByType[mimeType]) {
          storageUsageByType[mimeType] = { count: 0, size: 0 };
        }
        storageUsageByType[mimeType].count++;
        storageUsageByType[mimeType].size += file.size || 0;
      });

      return {
        totalFiles,
        totalSize,
        encryptedFiles,
        averageFileSize,
        storageUsageByType
      };

    } catch (error) {
      console.error('Failed to get storage statistics:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        encryptedFiles: 0,
        averageFileSize: 0,
        storageUsageByType: {}
      };
    }
  }

  /**
   * Validate file before storage
   */
  private validateFile(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type '${file.type}' is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate storage path for file
   */
  private generateStoragePath(fileName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    
    return `files/${timestamp}_${randomSuffix}.${extension}`;
  }

  /**
   * Generate file checksum
   */
  private async generateChecksum(data: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Store file metadata in database
   */
  private async storeFileMetadata(metadata: FileStorageMetadata): Promise<void> {
    try {
      await supabaseService.insert('file_metadata', {
        storage_path: metadata.storagePath,
        file_name: metadata.fileName,
        original_name: metadata.originalName,
        mime_type: metadata.mimeType,
        size: metadata.size,
        checksum: metadata.checksum,
        is_encrypted: metadata.isEncrypted,
        encryption_metadata: metadata.encryptionMetadata,
        uploaded_at: metadata.uploadedAt.toISOString(),
        custom_metadata: metadata.customMetadata
      });
    } catch (error) {
      console.error('Failed to store file metadata:', error);
    }
  }

  /**
   * Get file metadata from database
   */
  private async getFileMetadata(storagePath: string): Promise<FileStorageMetadata | null> {
    try {
      const result = await supabaseService.query('file_metadata', {
        filters: { storage_path: storagePath },
        limit: 1
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return null;
      }

      const record = result.data[0];
      return {
        fileName: record.file_name,
        originalName: record.original_name,
        mimeType: record.mime_type,
        size: record.size,
        checksum: record.checksum,
        storagePath: record.storage_path,
        isEncrypted: record.is_encrypted,
        encryptionMetadata: record.encryption_metadata,
        uploadedAt: new Date(record.uploaded_at),
        lastAccessedAt: record.last_accessed_at ? new Date(record.last_accessed_at) : undefined,
        customMetadata: record.custom_metadata
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  /**
   * Update file metadata
   */
  private async updateFileMetadata(
    storagePath: string,
    updates: Partial<FileStorageMetadata>
  ): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.storagePath) updateData.storage_path = updates.storagePath;
      if (updates.fileName) updateData.file_name = updates.fileName;
      if (updates.lastAccessedAt) updateData.last_accessed_at = updates.lastAccessedAt.toISOString();
      if (updates.customMetadata) updateData.custom_metadata = updates.customMetadata;

      await supabaseService.update('file_metadata', storagePath, updateData, 'storage_path');
    } catch (error) {
      console.error('Failed to update file metadata:', error);
    }
  }

  /**
   * Delete file metadata from database
   */
  private async deleteFileMetadata(storagePath: string): Promise<void> {
    try {
      await supabaseService.delete('file_metadata', storagePath, 'storage_path');
    } catch (error) {
      console.error('Failed to delete file metadata:', error);
    }
  }

  /**
   * Update last accessed timestamp
   */
  private async updateLastAccessed(storagePath: string): Promise<void> {
    try {
      await this.updateFileMetadata(storagePath, {
        lastAccessedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to update last accessed timestamp:', error);
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const fileStorageService = new FileStorageService();
export default fileStorageService;
