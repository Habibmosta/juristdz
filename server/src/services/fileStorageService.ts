import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { db } from '@/database/connection';
import { DocumentAttachment } from '@/types/document';

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  allowedMimeTypes?: string[];
  encrypt?: boolean;
  generateThumbnail?: boolean;
}

export interface FileUploadResult {
  attachment: DocumentAttachment;
  filePath: string;
  encrypted: boolean;
}

export class FileStorageService {
  private readonly storageBasePath: string;
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB default
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  constructor() {
    this.storageBasePath = process.env.DOCUMENT_STORAGE_PATH || './storage/documents';
    this.ensureStorageDirectories();
  }

  /**
   * Upload and store a file attachment
   * Validates: Requirements - Secure file storage with encryption
   */
  async uploadFile(
    documentId: string,
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    uploadedBy: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      this.validateFile(fileBuffer, mimeType, originalFilename, options);

      // Generate unique filename
      const fileExtension = path.extname(originalFilename);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      
      // Create directory structure: /storage/documents/{year}/{month}/{documentId}/
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const documentDir = path.join(this.storageBasePath, year, month, documentId);
      
      await this.ensureDirectory(documentDir);

      // File path
      const filePath = path.join(documentDir, uniqueFilename);

      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Check for duplicate files
      const existingFile = await this.findFileByHash(documentId, fileHash);
      if (existingFile) {
        logger.info('File already exists, returning existing attachment', { 
          documentId, 
          fileHash,
          existingFileId: existingFile.id 
        });
        return {
          attachment: existingFile,
          filePath: existingFile.url,
          encrypted: existingFile.isEncrypted
        };
      }

      let finalBuffer = fileBuffer;
      let encryptionKeyId: string | undefined;
      let isEncrypted = false;

      // Encrypt file if requested or if it contains sensitive data
      if (options.encrypt || this.shouldEncryptFile(mimeType, originalFilename)) {
        const encryptionResult = await this.encryptFile(fileBuffer);
        finalBuffer = encryptionResult.encryptedData;
        encryptionKeyId = encryptionResult.keyId;
        isEncrypted = true;
      }

      // Write file to disk
      await fs.writeFile(filePath, finalBuffer);

      // Create attachment record
      const attachment: DocumentAttachment = {
        id: uuidv4(),
        filename: uniqueFilename,
        originalFilename,
        mimeType,
        size: fileBuffer.length,
        url: this.getFileUrl(filePath),
        uploadedAt: new Date(),
        uploadedBy,
        isEncrypted,
        encryptionKeyId
      };

      // Save to database
      await this.saveAttachmentToDatabase(documentId, attachment, filePath, fileHash);

      // Generate thumbnail if needed
      if (options.generateThumbnail && this.isImageFile(mimeType)) {
        await this.generateThumbnail(filePath, attachment.id);
      }

      logger.info('File uploaded successfully', {
        documentId,
        attachmentId: attachment.id,
        filename: originalFilename,
        size: attachment.size,
        encrypted: isEncrypted
      });

      return {
        attachment,
        filePath,
        encrypted: isEncrypted
      };

    } catch (error) {
      logger.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Download a file attachment
   * Validates: Requirements - Secure file access with permission check
   */
  async downloadFile(
    attachmentId: string,
    userId: string
  ): Promise<{ buffer: Buffer; attachment: DocumentAttachment }> {
    try {
      // Get attachment info
      const attachment = await this.getAttachment(attachmentId);
      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Check document access permissions
      const hasAccess = await this.checkFileAccess(attachmentId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get file path
      const filePath = await this.getAttachmentFilePath(attachmentId);
      if (!filePath) {
        throw new Error('File path not found');
      }

      // Read file
      let fileBuffer = await fs.readFile(filePath);

      // Decrypt if encrypted
      if (attachment.isEncrypted && attachment.encryptionKeyId) {
        fileBuffer = await this.decryptFile(fileBuffer, attachment.encryptionKeyId);
      }

      // Log access
      await this.logFileAccess(attachmentId, userId, 'downloaded');

      return {
        buffer: fileBuffer,
        attachment
      };

    } catch (error) {
      logger.error('File download error:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Delete a file attachment
   * Validates: Requirements - Secure file deletion
   */
  async deleteFile(attachmentId: string, userId: string): Promise<void> {
    try {
      // Check permissions
      const hasAccess = await this.checkFileAccess(attachmentId, userId, 'delete');
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Get file path
      const filePath = await this.getAttachmentFilePath(attachmentId);
      
      // Delete from filesystem
      if (filePath) {
        try {
          await fs.unlink(filePath);
          
          // Delete thumbnail if exists
          const thumbnailPath = this.getThumbnailPath(filePath);
          try {
            await fs.unlink(thumbnailPath);
          } catch (thumbnailError) {
            // Thumbnail might not exist, ignore error
          }
        } catch (fsError) {
          logger.warn('Failed to delete file from filesystem:', fsError);
        }
      }

      // Delete from database
      await db.query('DELETE FROM document_attachments WHERE id = $1', [attachmentId]);

      // Log deletion
      await this.logFileAccess(attachmentId, userId, 'deleted');

      logger.info('File deleted successfully', { attachmentId, userId });

    } catch (error) {
      logger.error('File deletion error:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get document attachments
   * Validates: Requirements - Document attachment listing
   */
  async getDocumentAttachments(documentId: string, userId: string): Promise<DocumentAttachment[]> {
    try {
      // Check document access
      const hasAccess = await this.checkDocumentAccess(documentId, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const result = await db.query(
        'SELECT * FROM document_attachments WHERE document_id = $1 ORDER BY uploaded_at DESC',
        [documentId]
      );

      return (result as any).rows.map((row: any) => this.mapRowToAttachment(row));

    } catch (error) {
      logger.error('Get document attachments error:', error);
      throw new Error('Failed to retrieve attachments');
    }
  }

  // Private helper methods
  private validateFile(
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
    options: FileUploadOptions
  ): void {
    // Check file size
    const maxSize = options.maxSize || this.maxFileSize;
    if (fileBuffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Check MIME type
    const allowedTypes = options.allowedMimeTypes || this.allowedMimeTypes;
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Check filename for security
    if (this.containsUnsafeCharacters(filename)) {
      throw new Error('Filename contains unsafe characters');
    }

    // Scan for malware (placeholder - would integrate with antivirus)
    if (this.detectMalware(fileBuffer)) {
      throw new Error('File contains malware');
    }
  }

  private containsUnsafeCharacters(filename: string): boolean {
    const unsafeChars = /[<>:"|?*\x00-\x1f]/;
    return unsafeChars.test(filename);
  }

  private detectMalware(fileBuffer: Buffer): boolean {
    // Placeholder for malware detection
    // In production, this would integrate with antivirus scanning
    return false;
  }

  private shouldEncryptFile(mimeType: string, filename: string): boolean {
    // Encrypt sensitive document types
    const sensitiveTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    return sensitiveTypes.includes(mimeType) || 
           filename.toLowerCase().includes('confidential') ||
           filename.toLowerCase().includes('secret');
  }

  private async encryptFile(fileBuffer: Buffer): Promise<{ encryptedData: Buffer; keyId: string }> {
    // Generate encryption key
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const keyId = uuidv4();

    // Encrypt file
    const cipher = crypto.createCipher('aes-256-cbc', key);
    const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);

    // Store encryption key securely (in production, use a key management service)
    await this.storeEncryptionKey(keyId, key, iv);

    return {
      encryptedData: Buffer.concat([iv, encryptedData]),
      keyId
    };
  }

  private async decryptFile(encryptedBuffer: Buffer, keyId: string): Promise<Buffer> {
    // Retrieve encryption key
    const keyData = await this.getEncryptionKey(keyId);
    if (!keyData) {
      throw new Error('Encryption key not found');
    }

    // Extract IV and encrypted data
    const iv = encryptedBuffer.slice(0, 16);
    const encryptedData = encryptedBuffer.slice(16);

    // Decrypt file
    const decipher = crypto.createDecipher('aes-256-cbc', keyData.key);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    return decryptedData;
  }

  private async storeEncryptionKey(keyId: string, key: Buffer, iv: Buffer): Promise<void> {
    // In production, this would use a secure key management service
    // For now, store in database with additional encryption
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default-master-key';
    const cipher = crypto.createCipher('aes-256-cbc', masterKey);
    const encryptedKey = Buffer.concat([cipher.update(key), cipher.final()]);

    await db.query(
      'INSERT INTO encryption_keys (id, encrypted_key, iv, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [keyId, encryptedKey, iv]
    );
  }

  private async getEncryptionKey(keyId: string): Promise<{ key: Buffer; iv: Buffer } | null> {
    const result = await db.query(
      'SELECT encrypted_key, iv FROM encryption_keys WHERE id = $1',
      [keyId]
    );

    if (!result || (result as any).rows.length === 0) {
      return null;
    }

    const row = (result as any).rows[0];
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || 'default-master-key';
    const decipher = crypto.createDecipher('aes-256-cbc', masterKey);
    const key = Buffer.concat([decipher.update(row.encrypted_key), decipher.final()]);

    return {
      key,
      iv: row.iv
    };
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async generateThumbnail(filePath: string, attachmentId: string): Promise<void> {
    // Placeholder for thumbnail generation
    // In production, this would use a library like sharp or jimp
    logger.info('Thumbnail generation requested', { filePath, attachmentId });
  }

  private getThumbnailPath(filePath: string): string {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath, path.extname(filePath));
    return path.join(dir, `${filename}_thumb.jpg`);
  }

  private getFileUrl(filePath: string): string {
    // Convert absolute path to relative URL
    const relativePath = path.relative(this.storageBasePath, filePath);
    return `/api/files/${relativePath.replace(/\\/g, '/')}`;
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directory:', error);
      throw new Error('Failed to create storage directory');
    }
  }

  private async ensureStorageDirectories(): Promise<void> {
    await this.ensureDirectory(this.storageBasePath);
  }

  private async findFileByHash(documentId: string, fileHash: string): Promise<DocumentAttachment | null> {
    const result = await db.query(
      'SELECT * FROM document_attachments WHERE document_id = $1 AND file_hash = $2',
      [documentId, fileHash]
    );

    if (result && (result as any).rows.length > 0) {
      return this.mapRowToAttachment((result as any).rows[0]);
    }

    return null;
  }

  private async saveAttachmentToDatabase(
    documentId: string,
    attachment: DocumentAttachment,
    filePath: string,
    fileHash: string
  ): Promise<void> {
    await db.query(
      `INSERT INTO document_attachments (
        id, document_id, filename, original_filename, mime_type, file_size,
        file_path, file_hash, uploaded_by, uploaded_at, is_encrypted, encryption_key_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        attachment.id, documentId, attachment.filename, attachment.originalFilename,
        attachment.mimeType, attachment.size, filePath, fileHash,
        attachment.uploadedBy, attachment.uploadedAt, attachment.isEncrypted,
        attachment.encryptionKeyId
      ]
    );
  }

  private async getAttachment(attachmentId: string): Promise<DocumentAttachment | null> {
    const result = await db.query(
      'SELECT * FROM document_attachments WHERE id = $1',
      [attachmentId]
    );

    if (result && (result as any).rows.length > 0) {
      return this.mapRowToAttachment((result as any).rows[0]);
    }

    return null;
  }

  private async getAttachmentFilePath(attachmentId: string): Promise<string | null> {
    const result = await db.query(
      'SELECT file_path FROM document_attachments WHERE id = $1',
      [attachmentId]
    );

    if (result && (result as any).rows.length > 0) {
      return (result as any).rows[0].file_path;
    }

    return null;
  }

  private async checkFileAccess(
    attachmentId: string,
    userId: string,
    action: string = 'read'
  ): Promise<boolean> {
    // Get document ID for this attachment
    const result = await db.query(
      'SELECT document_id FROM document_attachments WHERE id = $1',
      [attachmentId]
    );

    if (!result || (result as any).rows.length === 0) {
      return false;
    }

    const documentId = (result as any).rows[0].document_id;
    return this.checkDocumentAccess(documentId, userId);
  }

  private async checkDocumentAccess(documentId: string, userId: string): Promise<boolean> {
    // Check if user owns document or has permissions
    const result = await db.query(
      `SELECT d.owner_id, dp.permissions
       FROM documents d
       LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $2 AND dp.is_active = true
       WHERE d.id = $1`,
      [documentId, userId]
    );

    if (!result || (result as any).rows.length === 0) {
      return false;
    }

    const row = (result as any).rows[0];
    
    // Owner has access
    if (row.owner_id === userId) {
      return true;
    }

    // Check explicit permissions
    if (row.permissions && row.permissions.includes('read')) {
      return true;
    }

    return false;
  }

  private async logFileAccess(attachmentId: string, userId: string, action: string): Promise<void> {
    try {
      await db.query(
        `INSERT INTO file_access_log (attachment_id, user_id, action, timestamp)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [attachmentId, userId, action]
      );
    } catch (error) {
      logger.error('Failed to log file access:', error);
    }
  }

  private mapRowToAttachment(row: any): DocumentAttachment {
    return {
      id: row.id,
      filename: row.filename,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      size: row.file_size,
      url: row.file_path,
      uploadedAt: new Date(row.uploaded_at),
      uploadedBy: row.uploaded_by,
      isEncrypted: row.is_encrypted,
      encryptionKeyId: row.encryption_key_id
    };
  }
}

export const fileStorageService = new FileStorageService();