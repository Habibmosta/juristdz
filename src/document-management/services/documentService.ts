/**
 * Document Management System - Document Service
 * 
 * Provides comprehensive document CRUD operations with case association,
 * metadata management, and security controls.
 * 
 * Requirements: 2.1, 2.6, 7.3, 7.4
 */

import { supabaseService } from './supabaseService';
import { fileStorageService } from './fileStorageService';
import { fileUploadService } from './fileUploadService';
import { versionControlService } from './versionControlService';
import type { 
  Document, 
  DocumentUploadRequest, 
  DocumentMetadata,
  DocumentCategory,
  ConfidentialityLevel 
} from '../../../types/document-management';

// Document query options
export interface DocumentQueryOptions {
  caseId?: string;
  folderId?: string;
  category?: DocumentCategory;
  confidentialityLevel?: ConfidentialityLevel;
  tags?: string[];
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'size';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

// Document update request
export interface DocumentUpdateRequest {
  name?: string;
  description?: string;
  category?: DocumentCategory;
  confidentialityLevel?: ConfidentialityLevel;
  tags?: string[];
  folderId?: string;
  customFields?: Record<string, any>;
}

// Document operation result
export interface DocumentOperationResult {
  success: boolean;
  document?: Document;
  error?: string;
  warnings?: string[];
}

// Document list result
export interface DocumentListResult {
  success: boolean;
  documents?: Document[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}

// Document statistics
export interface DocumentStatistics {
  totalDocuments: number;
  documentsByCategory: Record<DocumentCategory, number>;
  documentsByConfidentiality: Record<ConfidentialityLevel, number>;
  totalSize: number;
  averageSize: number;
  recentUploads: number; // Last 7 days
  mostUsedTags: Array<{ tag: string; count: number }>;
}

export class DocumentService {
  /**
   * Create a new document by uploading a file
   */
  async createDocument(uploadRequest: DocumentUploadRequest): Promise<DocumentOperationResult> {
    try {
      // Validate case association
      if (uploadRequest.caseId) {
        const caseExists = await this.validateCaseExists(uploadRequest.caseId);
        if (!caseExists) {
          return {
            success: false,
            error: `Case not found: ${uploadRequest.caseId}`
          };
        }
      }

      // Validate folder association
      if (uploadRequest.folderId) {
        const folderExists = await this.validateFolderExists(uploadRequest.folderId);
        if (!folderExists) {
          return {
            success: false,
            error: `Folder not found: ${uploadRequest.folderId}`
          };
        }
      }

      // Upload file using file upload service
      const uploadResult = await fileUploadService.uploadFile(uploadRequest.file, {
        caseId: uploadRequest.caseId,
        folderId: uploadRequest.folderId,
        category: uploadRequest.metadata?.category,
        confidentialityLevel: uploadRequest.metadata?.confidentialityLevel,
        tags: uploadRequest.metadata?.tags || [],
        description: uploadRequest.metadata?.description,
        customFields: uploadRequest.metadata?.customFields
      });

      if (!uploadResult.success) {
        return {
          success: false,
          error: `File upload failed: ${uploadResult.error}`
        };
      }

      // Create document record
      const documentData = {
        case_id: uploadRequest.caseId,
        folder_id: uploadRequest.folderId,
        name: uploadRequest.file.name,
        original_name: uploadRequest.file.name,
        mime_type: uploadRequest.file.type,
        size: uploadRequest.file.size,
        checksum: uploadResult.checksum,
        encryption_key: uploadResult.encryptionKey,
        storage_path: uploadResult.storagePath,
        tags: uploadRequest.metadata?.tags || [],
        description: uploadRequest.metadata?.description,
        category: uploadRequest.metadata?.category || 'other',
        confidentiality_level: uploadRequest.metadata?.confidentialityLevel || 'internal',
        custom_fields: uploadRequest.metadata?.customFields || {},
        created_by: uploadRequest.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_version_id: uploadResult.versionId,
        is_deleted: false
      };

      const createResult = await supabaseService.insert('documents', documentData);

      if (!createResult.success) {
        // Clean up uploaded file if document creation fails
        await fileStorageService.deleteFile(uploadResult.storagePath);
        return {
          success: false,
          error: `Document creation failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        createResult.data.id,
        'create',
        {
          fileName: uploadRequest.file.name,
          fileSize: uploadRequest.file.size,
          caseId: uploadRequest.caseId,
          category: uploadRequest.metadata?.category
        },
        uploadRequest.userId
      );

      // Convert database record to Document interface
      const document = this.mapDatabaseRecordToDocument(createResult.data);

      return {
        success: true,
        document
      };

    } catch (error) {
      return {
        success: false,
        error: `Document creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<DocumentOperationResult> {
    try {
      const result = await supabaseService.findById('documents', documentId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      const documentRecord = result.data;

      // Check if document is deleted
      if (documentRecord.is_deleted) {
        return {
          success: false,
          error: 'Document has been deleted'
        };
      }

      // Check permissions
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'view');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions'
        };
      }

      const document = this.mapDatabaseRecordToDocument(documentRecord);

      return {
        success: true,
        document
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string, 
    updateRequest: DocumentUpdateRequest, 
    userId: string
  ): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check edit permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to edit document'
        };
      }

      // Validate folder if being changed
      if (updateRequest.folderId) {
        const folderExists = await this.validateFolderExists(updateRequest.folderId);
        if (!folderExists) {
          return {
            success: false,
            error: `Folder not found: ${updateRequest.folderId}`
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updateRequest.name) updateData.name = updateRequest.name;
      if (updateRequest.description !== undefined) updateData.description = updateRequest.description;
      if (updateRequest.category) updateData.category = updateRequest.category;
      if (updateRequest.confidentialityLevel) updateData.confidentiality_level = updateRequest.confidentialityLevel;
      if (updateRequest.tags) updateData.tags = updateRequest.tags;
      if (updateRequest.folderId !== undefined) updateData.folder_id = updateRequest.folderId;
      if (updateRequest.customFields) updateData.custom_fields = updateRequest.customFields;

      // Update document
      const updateResult = await supabaseService.update('documents', documentId, updateData);

      if (!updateResult.success) {
        return {
          success: false,
          error: `Document update failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'update',
        {
          changes: updateRequest,
          previousValues: {
            name: existingDoc.document!.name,
            category: existingDoc.document!.metadata.category,
            confidentialityLevel: existingDoc.document!.metadata.confidentialityLevel
          }
        },
        userId
      );

      // Get updated document
      const updatedDoc = await this.getDocument(documentId, userId);
      return updatedDoc;

    } catch (error) {
      return {
        success: false,
        error: `Document update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update document content with automatic versioning
   */
  async updateDocumentContent(
    documentId: string,
    newContent: Buffer,
    userId: string,
    changeDescription?: string
  ): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check edit permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to update document content'
        };
      }

      // Create new version with the updated content
      const versionResult = await versionControlService.createVersion(documentId, newContent, {
        changeDescription: changeDescription || 'Document content updated',
        userId
      });

      if (!versionResult.success) {
        return {
          success: false,
          error: `Failed to create new version: ${versionResult.error}`,
          warnings: versionResult.warnings
        };
      }

      // Update document's updated_at timestamp
      const updateResult = await supabaseService.update('documents', documentId, {
        updated_at: new Date().toISOString(),
        size_bytes: newContent.length
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: `Document update failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry for content update
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'content_update',
        {
          newVersionId: versionResult.version!.id,
          newVersionNumber: versionResult.version!.versionNumber,
          changeDescription,
          contentSize: newContent.length
        },
        userId
      );

      // Get updated document
      const updatedDoc = await this.getDocument(documentId, userId);
      return updatedDoc;

    } catch (error) {
      return {
        success: false,
        error: `Document content update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(documentId: string, userId: string): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check delete permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'delete');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to delete document'
        };
      }

      // Soft delete document
      const deleteResult = await supabaseService.update('documents', documentId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Document deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'delete',
        {
          fileName: existingDoc.document!.name,
          fileSize: existingDoc.document!.size,
          softDelete: true
        },
        userId
      );

      return {
        success: true,
        document: existingDoc.document
      };

    } catch (error) {
      return {
        success: false,
        error: `Document deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Permanently delete document and its file
   */
  async permanentlyDeleteDocument(documentId: string, userId: string): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check delete permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'delete');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to permanently delete document'
        };
      }

      // Delete file from storage
      if (existingDoc.document!.storagePath) {
        await fileStorageService.deleteFile(existingDoc.document!.storagePath);
      }

      // Delete document record
      const deleteResult = await supabaseService.delete('documents', documentId);

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Permanent document deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'permanent_delete',
        {
          fileName: existingDoc.document!.name,
          fileSize: existingDoc.document!.size,
          storagePath: existingDoc.document!.storagePath
        },
        userId
      );

      return {
        success: true,
        document: existingDoc.document
      };

    } catch (error) {
      return {
        success: false,
        error: `Permanent document deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List documents with filtering and pagination
   */
  async listDocuments(options: DocumentQueryOptions = {}, userId: string): Promise<DocumentListResult> {
    try {
      // Build query filters
      const filters: any = {};
      
      if (options.caseId) filters.case_id = options.caseId;
      if (options.folderId) filters.folder_id = options.folderId;
      if (options.category) filters.category = options.category;
      if (options.confidentialityLevel) filters.confidentiality_level = options.confidentialityLevel;
      if (!options.includeDeleted) filters.is_deleted = false;

      // Build query options
      const queryOptions: any = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc'
      };

      // Add date range filter
      if (options.dateFrom || options.dateTo) {
        queryOptions.dateRange = {
          field: 'created_at',
          from: options.dateFrom?.toISOString(),
          to: options.dateTo?.toISOString()
        };
      }

      // Add search term
      if (options.searchTerm) {
        queryOptions.search = {
          fields: ['name', 'description'],
          term: options.searchTerm
        };
      }

      // Add tags filter
      if (options.tags && options.tags.length > 0) {
        queryOptions.arrayContains = {
          field: 'tags',
          values: options.tags
        };
      }

      const result = await supabaseService.query('documents', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to list documents: ${result.error?.message || 'Unknown error'}`
        };
      }

      // Filter documents based on user permissions
      const documents: Document[] = [];
      for (const record of result.data || []) {
        const hasPermission = await this.checkDocumentPermission(record.id, userId, 'view');
        if (hasPermission) {
          documents.push(this.mapDatabaseRecordToDocument(record));
        }
      }

      return {
        success: true,
        documents,
        totalCount: result.count,
        hasMore: (options.offset || 0) + (options.limit || 50) < (result.count || 0)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get document version history
   */
  async getDocumentVersionHistory(
    documentId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    success: boolean;
    versions?: any[];
    totalCount?: number;
    hasMore?: boolean;
    error?: string;
  }> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return {
          success: false,
          error: existingDoc.error
        };
      }

      // Get version history using version control service
      const versionResult = await versionControlService.getVersionHistory(documentId, {
        ...options,
        userId
      });

      return versionResult;

    } catch (error) {
      return {
        success: false,
        error: `Failed to get document version history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Restore document to a previous version
   */
  async restoreDocumentVersion(
    documentId: string,
    versionId: string,
    userId: string,
    changeDescription?: string
  ): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check edit permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to restore document version'
        };
      }

      // Restore version using version control service
      const restoreResult = await versionControlService.restoreVersion(
        documentId,
        versionId,
        userId,
        changeDescription
      );

      if (!restoreResult.success) {
        return {
          success: false,
          error: `Version restoration failed: ${restoreResult.error}`
        };
      }

      // Get updated document
      const updatedDoc = await this.getDocument(documentId, userId);
      return updatedDoc;

    } catch (error) {
      return {
        success: false,
        error: `Document version restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Move document to different folder
   */
  async moveDocument(documentId: string, targetFolderId: string | null, userId: string): Promise<DocumentOperationResult> {
    try {
      // Check if document exists and user has permission
      const existingDoc = await this.getDocument(documentId, userId);
      if (!existingDoc.success) {
        return existingDoc;
      }

      // Check edit permission
      const hasPermission = await this.checkDocumentPermission(documentId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to move document'
        };
      }

      // Validate target folder if specified
      if (targetFolderId) {
        const folderExists = await this.validateFolderExists(targetFolderId);
        if (!folderExists) {
          return {
            success: false,
            error: `Target folder not found: ${targetFolderId}`
          };
        }
      }

      // Update document folder
      const updateResult = await supabaseService.update('documents', documentId, {
        folder_id: targetFolderId,
        updated_at: new Date().toISOString()
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: `Document move failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'move',
        {
          fromFolderId: existingDoc.document!.folderId,
          toFolderId: targetFolderId,
          fileName: existingDoc.document!.name
        },
        userId
      );

      // Get updated document
      const updatedDoc = await this.getDocument(documentId, userId);
      return updatedDoc;

    } catch (error) {
      return {
        success: false,
        error: `Document move failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(caseId?: string, userId?: string): Promise<DocumentStatistics> {
    try {
      const filters: any = { is_deleted: false };
      if (caseId) filters.case_id = caseId;

      const result = await supabaseService.query('documents', {
        filters,
        select: 'category, confidentiality_level, size, tags, created_at'
      });

      if (!result.success || !result.data) {
        throw new Error('Failed to retrieve document statistics');
      }

      const documents = result.data;
      const totalDocuments = documents.length;
      const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
      const averageSize = totalDocuments > 0 ? totalSize / totalDocuments : 0;

      // Count by category
      const documentsByCategory: Record<DocumentCategory, number> = {
        contract: 0,
        pleading: 0,
        evidence: 0,
        correspondence: 0,
        template: 0,
        other: 0
      };

      // Count by confidentiality level
      const documentsByConfidentiality: Record<ConfidentialityLevel, number> = {
        public: 0,
        internal: 0,
        confidential: 0,
        restricted: 0
      };

      // Count recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      let recentUploads = 0;

      // Count tags
      const tagCounts: Record<string, number> = {};

      documents.forEach(doc => {
        // Category counts
        if (doc.category && doc.category in documentsByCategory) {
          documentsByCategory[doc.category as DocumentCategory]++;
        }

        // Confidentiality counts
        if (doc.confidentiality_level && doc.confidentiality_level in documentsByConfidentiality) {
          documentsByConfidentiality[doc.confidentiality_level as ConfidentialityLevel]++;
        }

        // Recent uploads
        if (doc.created_at && new Date(doc.created_at) > sevenDaysAgo) {
          recentUploads++;
        }

        // Tag counts
        if (doc.tags && Array.isArray(doc.tags)) {
          doc.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Get most used tags (top 10)
      const mostUsedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      return {
        totalDocuments,
        documentsByCategory,
        documentsByConfidentiality,
        totalSize,
        averageSize,
        recentUploads,
        mostUsedTags
      };

    } catch (error) {
      console.error('Failed to get document statistics:', error);
      return {
        totalDocuments: 0,
        documentsByCategory: {
          contract: 0,
          pleading: 0,
          evidence: 0,
          correspondence: 0,
          template: 0,
          other: 0
        },
        documentsByConfidentiality: {
          public: 0,
          internal: 0,
          confidential: 0,
          restricted: 0
        },
        totalSize: 0,
        averageSize: 0,
        recentUploads: 0,
        mostUsedTags: []
      };
    }
  }

  /**
   * Validate if case exists
   */
  private async validateCaseExists(caseId: string): Promise<boolean> {
    try {
      const result = await supabaseService.findById('cases', caseId);
      return result.success && !!result.data;
    } catch (error) {
      console.error('Failed to validate case existence:', error);
      return false;
    }
  }

  /**
   * Validate if folder exists
   */
  private async validateFolderExists(folderId: string): Promise<boolean> {
    try {
      const result = await supabaseService.findById('folders', folderId);
      return result.success && !!result.data && !result.data.is_deleted;
    } catch (error) {
      console.error('Failed to validate folder existence:', error);
      return false;
    }
  }

  /**
   * Check document permission for user
   */
  private async checkDocumentPermission(
    documentId: string, 
    userId: string, 
    permission: 'view' | 'edit' | 'delete' | 'share'
  ): Promise<boolean> {
    try {
      // Get document to check case association
      const docResult = await supabaseService.findById('documents', documentId);
      if (!docResult.success || !docResult.data) {
        return false;
      }

      const document = docResult.data;

      // Check if user is the document creator
      if (document.created_by === userId) {
        return true;
      }

      // Check case-level permissions
      if (document.case_id) {
        const casePermission = await this.checkCasePermission(document.case_id, userId, permission);
        if (casePermission) {
          return true;
        }
      }

      // Check document-specific permissions
      const permissionResult = await supabaseService.query('document_permissions', {
        filters: {
          document_id: documentId,
          user_id: userId,
          permission: permission
        },
        limit: 1
      });

      if (permissionResult.success && permissionResult.data && permissionResult.data.length > 0) {
        const perm = permissionResult.data[0];
        // Check if permission is still valid (not expired)
        if (!perm.expires_at || new Date(perm.expires_at) > new Date()) {
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Failed to check document permission:', error);
      return false;
    }
  }

  /**
   * Check case permission for user
   */
  private async checkCasePermission(
    caseId: string, 
    userId: string, 
    permission: 'view' | 'edit' | 'delete' | 'share'
  ): Promise<boolean> {
    try {
      // This would integrate with the existing case management system
      // For now, we'll implement a basic check
      const caseResult = await supabaseService.query('case_permissions', {
        filters: {
          case_id: caseId,
          user_id: userId
        },
        limit: 1
      });

      if (caseResult.success && caseResult.data && caseResult.data.length > 0) {
        const casePerm = caseResult.data[0];
        // Check if user has the required permission level
        const permissionLevels = ['view', 'edit', 'delete', 'share'];
        const userLevel = permissionLevels.indexOf(casePerm.permission_level);
        const requiredLevel = permissionLevels.indexOf(permission);
        
        return userLevel >= requiredLevel;
      }

      return false;

    } catch (error) {
      console.error('Failed to check case permission:', error);
      return false;
    }
  }

  /**
   * Map database record to Document interface
   */
  private mapDatabaseRecordToDocument(record: any): Document {
    return {
      id: record.id,
      caseId: record.case_id,
      name: record.name,
      originalName: record.original_name,
      mimeType: record.mime_type,
      size: record.size,
      checksum: record.checksum,
      encryptionKey: record.encryption_key,
      storagePath: record.storage_path,
      folderId: record.folder_id,
      tags: record.tags || [],
      metadata: {
        description: record.description,
        category: record.category,
        confidentialityLevel: record.confidentiality_level,
        retentionPeriod: record.retention_period,
        customFields: record.custom_fields || {}
      },
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      currentVersionId: record.current_version_id,
      isDeleted: record.is_deleted,
      deletedAt: record.deleted_at ? new Date(record.deleted_at) : undefined
    };
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;
