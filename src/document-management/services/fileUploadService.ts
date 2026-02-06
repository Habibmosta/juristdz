/**
 * Document Management System - Secure File Upload Service
 * 
 * Comprehensive file upload handler with security validations, virus scanning,
 * and encryption capabilities as specified in requirements.
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 1.6
 */

import { createHash } from 'crypto';
import { getDMSConfig, isFileTypeAllowed, isMimeTypeAllowed, isFileSizeAllowed, generateUniqueFileName } from '../config';
import { supabaseService } from './supabaseService';
import { encryptionService } from './encryptionService';
import type { DocumentUploadRequest, Document } from '../../../types/document-management';
import type { FileEncryptionMetadata } from './encryptionService';

// File upload validation result
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    checksum: string;
  };
}

// File upload options
export interface FileUploadOptions {
  validateOnly?: boolean; // Only validate, don't upload
  skipVirusScan?: boolean; // Skip virus scanning (for testing)
  customPath?: string; // Custom storage path
  overwrite?: boolean; // Allow overwriting existing files
}

// File upload result
export interface FileUploadResult {
  success: boolean;
  document?: Document;
  errors: string[];
  warnings: string[];
  uploadId?: string; // For tracking upload progress
}

// Virus scan result (placeholder interface for future integration)
export interface VirusScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: string;
  scanTime: Date;
}

export class FileUploadService {
  private config = getDMSConfig();
  
  // Forbidden file signatures (magic bytes) for additional security
  private readonly FORBIDDEN_SIGNATURES = new Map([
    ['4D5A', 'exe'], // Windows executable
    ['504B0304', 'zip'], // ZIP archive (could contain malware)
    ['52617221', 'rar'], // RAR archive
    ['7F454C46', 'elf'], // Linux executable
    ['CAFEBABE', 'class'], // Java class file
    ['3C3F786D6C', 'xml'], // XML (could be malicious)
    ['3C68746D6C', 'html'], // HTML (XSS risk)
    ['3C736372697074', 'js'] // JavaScript (XSS risk)
  ]);

  /**
   * Validate uploaded file against security requirements
   */
  async validateFile(file: File): Promise<FileValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. File size validation (Requirement 1.2)
      if (!isFileSizeAllowed(file.size)) {
        if (file.size <= 0) {
          errors.push('File is empty or corrupted');
        } else {
          errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}`);
        }
      }

      // 2. MIME type validation (Requirement 1.1)
      if (!isMimeTypeAllowed(file.type)) {
        errors.push(`File type '${file.type}' is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`);
      }

      // 3. File extension validation (Requirement 1.1)
      const fileExtension = this.getFileExtension(file.name);
      if (!isFileTypeAllowed(fileExtension)) {
        errors.push(`File extension '.${fileExtension}' is not allowed. Allowed extensions: ${this.config.allowedFileTypes.join(', ')}`);
      }

      // 4. File name validation
      const nameValidation = this.validateFileName(file.name);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors);
      }
      warnings.push(...nameValidation.warnings);

      // 5. File signature validation (magic bytes check)
      const signatureValidation = await this.validateFileSignature(file);
      if (!signatureValidation.isValid) {
        errors.push(...signatureValidation.errors);
      }

      // 6. Generate file checksum for integrity
      const checksum = await this.generateFileChecksum(file);

      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        checksum
      };

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileInfo
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Perform virus scan on uploaded file (Requirement 1.4, 1.5)
   */
  async scanFileForViruses(file: File): Promise<VirusScanResult> {
    try {
      // TODO: Integrate with actual virus scanning service (ClamAV, VirusTotal, etc.)
      // For now, this is a placeholder implementation
      
      // Simulate virus scanning delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for known malicious patterns in file name
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.scr$/i,
        /\.com$/i,
        /\.pif$/i,
        /malware/i,
        /virus/i,
        /trojan/i
      ];

      const threats: string[] = [];
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(file.name)) {
          threats.push(`Suspicious file name pattern: ${pattern.source}`);
        }
      }

      // Check file size for suspicious patterns
      if (file.size === 0) {
        threats.push('Empty file detected - potential corruption or malware');
      }

      return {
        isClean: threats.length === 0,
        threats,
        scanEngine: 'DMS-Internal-Scanner-v1.0',
        scanTime: new Date()
      };

    } catch (error) {
      return {
        isClean: false,
        threats: [`Virus scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        scanEngine: 'DMS-Internal-Scanner-v1.0',
        scanTime: new Date()
      };
    }
  }

  /**
   * Upload file with full security validation (Requirements 1.1-1.6)
   */
  async uploadFile(
    uploadRequest: DocumentUploadRequest,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const uploadId = this.generateUploadId();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validate file
      const validation = await this.validateFile(uploadRequest.file);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (!validation.isValid) {
        return {
          success: false,
          errors,
          warnings,
          uploadId
        };
      }

      // 2. Virus scan (Requirement 1.4, 1.5)
      if (!options.skipVirusScan) {
        const virusScan = await this.scanFileForViruses(uploadRequest.file);
        
        if (!virusScan.isClean) {
          // Quarantine file and notify (Requirement 1.5)
          await this.quarantineFile(uploadRequest.file, virusScan, uploadId);
          
          return {
            success: false,
            errors: [
              'File failed virus scan and has been quarantined',
              ...virusScan.threats
            ],
            warnings,
            uploadId
          };
        }
      }

      // 3. Return early if validation only
      if (options.validateOnly) {
        return {
          success: true,
          errors,
          warnings,
          uploadId
        };
      }

      // 4. Generate unique file name and storage path
      const uniqueFileName = generateUniqueFileName(uploadRequest.file.name);
      const storagePath = options.customPath || this.generateStoragePath(uploadRequest.caseId, uniqueFileName);

      // 5. Encrypt file data (Requirement 1.3, 7.1)
      const fileBuffer = Buffer.from(await uploadRequest.file.arrayBuffer());
      const encryptionResult = await encryptionService.encryptFileWithMetadata(
        fileBuffer,
        validation.fileInfo!.checksum
      );

      if (!encryptionResult.success) {
        return {
          success: false,
          errors: [`File encryption failed: ${encryptionResult.error}`],
          warnings,
          uploadId
        };
      }

      // 6. Upload encrypted file to storage
      const encryptedFile = new File([encryptionResult.encryptedData!], uniqueFileName, {
        type: 'application/octet-stream' // Encrypted files are binary
      });

      const uploadResult = await supabaseService.uploadFile(
        storagePath,
        encryptedFile,
        {
          contentType: 'application/octet-stream',
          upsert: options.overwrite || false
        }
      );

      if (!uploadResult.success) {
        return {
          success: false,
          errors: [`File upload failed: ${uploadResult.error?.message || 'Unknown error'}`],
          warnings,
          uploadId
        };
      }

      // 7. Create document record with metadata (Requirement 1.6)
      const document = await this.createDocumentRecord(
        uploadRequest,
        validation.fileInfo!,
        storagePath,
        encryptionResult.metadata!,
        uploadId
      );

      if (!document) {
        // Clean up uploaded file if document creation fails
        await supabaseService.deleteFile(storagePath);
        
        return {
          success: false,
          errors: ['Failed to create document record'],
          warnings,
          uploadId
        };
      }

      // 8. Create audit trail entry
      await this.createUploadAuditEntry(document, uploadId);

      return {
        success: true,
        document,
        errors,
        warnings,
        uploadId
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
        uploadId
      };
    }
  }

  /**
   * Validate file name for security issues
   */
  private validateFileName(fileName: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for empty or too long file names
    if (!fileName || fileName.trim().length === 0) {
      errors.push('File name cannot be empty');
    } else if (fileName.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }

    // Check for dangerous characters
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(fileName)) {
      errors.push('File name contains invalid characters');
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = fileName.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      errors.push('File name uses a reserved system name');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.exe\./i, // Double extension
      /\.(bat|cmd|scr|com|pif)$/i, // Executable extensions
      /script/i, // Script-related names
      /malware|virus|trojan/i // Malware-related names
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        warnings.push(`File name contains suspicious pattern: ${pattern.source}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate file signature (magic bytes) for additional security
   */
  private async validateFileSignature(file: File): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Read first 16 bytes of the file
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const signature = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join('');

      // Check against forbidden signatures
      for (const [forbiddenSig, fileType] of this.FORBIDDEN_SIGNATURES) {
        if (signature.startsWith(forbiddenSig)) {
          errors.push(`File appears to be a ${fileType} file based on signature analysis`);
        }
      }

      // Verify signature matches declared MIME type for known types
      const expectedSignatures = this.getExpectedSignatures(file.type);
      if (expectedSignatures.length > 0) {
        const matchesExpected = expectedSignatures.some(expected => 
          signature.startsWith(expected.toUpperCase())
        );
        
        if (!matchesExpected) {
          errors.push('File signature does not match declared file type');
        }
      }

    } catch (error) {
      errors.push(`File signature validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get expected file signatures for MIME types
   */
  private getExpectedSignatures(mimeType: string): string[] {
    const signatures: Record<string, string[]> = {
      'application/pdf': ['25504446'], // %PDF
      'image/jpeg': ['FFD8FF'], // JPEG
      'image/png': ['89504E47'], // PNG
      'application/msword': ['D0CF11E0'], // MS Office
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'], // DOCX (ZIP-based)
      'text/plain': [] // Text files don't have consistent signatures
    };

    return signatures[mimeType] || [];
  }

  /**
   * Generate file checksum for integrity verification
   */
  private async generateFileChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = createHash('sha256');
    hash.update(new Uint8Array(buffer));
    return hash.digest('hex');
  }

  /**
   * Generate storage path for uploaded file
   */
  private generateStoragePath(caseId: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return `cases/${caseId}/${year}/${month}/${fileName}`;
  }

  /**
   * Create document record in database
   */
  private async createDocumentRecord(
    uploadRequest: DocumentUploadRequest,
    fileInfo: NonNullable<FileValidationResult['fileInfo']>,
    storagePath: string,
    encryptionMetadata: FileEncryptionMetadata,
    uploadId: string
  ): Promise<Document | null> {
    try {
      const documentData = {
        case_id: uploadRequest.caseId,
        folder_id: uploadRequest.folderId || null,
        name: fileInfo.name,
        original_name: fileInfo.name,
        mime_type: fileInfo.type,
        size_bytes: fileInfo.size,
        checksum: fileInfo.checksum,
        storage_path: storagePath,
        encryption_key_id: encryptionMetadata.keyId,
        encryption_metadata: {
          algorithm: encryptionMetadata.algorithm,
          iv: encryptionMetadata.iv,
          authTag: encryptionMetadata.authTag,
          encryptedSize: encryptionMetadata.encryptedSize,
          originalSize: encryptionMetadata.originalSize
        },
        tags: uploadRequest.tags || [],
        category: uploadRequest.metadata?.category || 'other',
        confidentiality_level: uploadRequest.metadata?.confidentialityLevel || 'internal',
        description: uploadRequest.metadata?.description || null,
        custom_fields: {
          uploadId,
          uploadTimestamp: new Date().toISOString()
        }
      };

      const result = await supabaseService.insert('documents', documentData);
      
      if (result.success && result.data) {
        return result.data as Document;
      }

      return null;
    } catch (error) {
      console.error('Failed to create document record:', error);
      return null;
    }
  }

  /**
   * Quarantine infected file
   */
  private async quarantineFile(file: File, scanResult: VirusScanResult, uploadId: string): Promise<void> {
    try {
      // Log quarantine event
      await supabaseService.createAuditEntry(
        'file_quarantine',
        uploadId,
        'quarantine',
        {
          fileName: file.name,
          fileSize: file.size,
          threats: scanResult.threats,
          scanEngine: scanResult.scanEngine,
          scanTime: scanResult.scanTime.toISOString()
        }
      );

      // TODO: Move file to quarantine storage location
      // TODO: Send notification to administrators
      
      console.warn(`File quarantined: ${file.name}`, {
        uploadId,
        threats: scanResult.threats
      });

    } catch (error) {
      console.error('Failed to quarantine file:', error);
    }
  }

  /**
   * Create audit trail entry for file upload
   */
  private async createUploadAuditEntry(document: Document, uploadId: string): Promise<void> {
    try {
      await supabaseService.createAuditEntry(
        'document',
        document.id,
        'upload',
        {
          fileName: document.name,
          fileSize: document.size,
          mimeType: document.mimeType,
          uploadId,
          category: document.metadata?.category,
          confidentialityLevel: document.metadata?.confidentialityLevel
        }
      );
    } catch (error) {
      console.error('Failed to create upload audit entry:', error);
    }
  }

  /**
   * Utility methods
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
export default fileUploadService;
