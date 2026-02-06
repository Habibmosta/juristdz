/**
 * Case Management Integration Service
 * 
 * Integrates document management with the existing case management system.
 * Provides automatic workspace creation, case-document associations, and
 * permission inheritance from case management.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.7
 */

import { createClient } from '@supabase/supabase-js';
import { Document, Folder, Permission } from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Case Integration Service Class
 * Handles integration between document management and case management
 */
class CaseIntegrationService {
  /**
   * Create automatic document workspace for a new case
   * Requirements: 8.3
   */
  async createCaseWorkspace(caseId: string, createdBy: string): Promise<{
    rootFolder: Folder;
    defaultFolders: Folder[];
  }> {
    try {
      // Verify case exists
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id, title')
        .eq('id', caseId)
        .single();

      if (caseError || !caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }

      const now = new Date();

      // Create root folder for the case
      const rootFolderId = crypto.randomUUID();
      const rootFolder: Folder = {
        id: rootFolderId,
        caseId,
        name: `Case: ${caseData.title}`,
        path: '/',
        level: 0,
        createdAt: now,
        createdBy,
        isDeleted: false
      };

      await supabase.from('folders').insert({
        id: rootFolder.id,
        case_id: rootFolder.caseId,
        name: rootFolder.name,
        path: rootFolder.path,
        level: rootFolder.level,
        created_at: rootFolder.createdAt.toISOString(),
        created_by: rootFolder.createdBy,
        is_deleted: rootFolder.isDeleted
      });

      // Create default subfolders
      const defaultFolderNames = [
        'Pleadings',
        'Evidence',
        'Correspondence',
        'Contracts',
        'Court Documents',
        'Research',
        'Client Documents'
      ];

      const defaultFolders: Folder[] = [];

      for (const folderName of defaultFolderNames) {
        const folderId = crypto.randomUUID();
        const folder: Folder = {
          id: folderId,
          caseId,
          name: folderName,
          parentId: rootFolderId,
          path: `/${folderName}`,
          level: 1,
          createdAt: now,
          createdBy,
          isDeleted: false
        };

        await supabase.from('folders').insert({
          id: folder.id,
          case_id: folder.caseId,
          name: folder.name,
          parent_id: folder.parentId,
          path: folder.path,
          level: folder.level,
          created_at: folder.createdAt.toISOString(),
          created_by: folder.createdBy,
          is_deleted: folder.isDeleted
        });

        defaultFolders.push(folder);
      }

      // Create audit entry
      await this.createAuditEntry({
        entityType: 'case_workspace',
        entityId: caseId,
        action: 'workspace_created',
        userId: createdBy,
        timestamp: now,
        details: {
          rootFolderId,
          defaultFolderCount: defaultFolders.length
        }
      });

      return { rootFolder, defaultFolders };
    } catch (error) {
      console.error('Error creating case workspace:', error);
      throw error;
    }
  }

  /**
   * Get all documents associated with a case
   * Requirements: 8.1
   */
  async getCaseDocuments(caseId: string, options?: {
    folderId?: string;
    includeDeleted?: boolean;
    sortBy?: 'name' | 'created_at' | 'updated_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Document[]> {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('case_id', caseId);

      if (options?.folderId) {
        query = query.eq('folder_id', options.folderId);
      }

      if (!options?.includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      if (options?.sortBy) {
        query = query.order(options.sortBy, { 
          ascending: options.sortOrder === 'asc' 
        });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch case documents: ${error.message}`);
      }

      return (data || []).map(d => this.mapDocumentFromDb(d));
    } catch (error) {
      console.error('Error fetching case documents:', error);
      throw error;
    }
  }

  /**
   * Get case folder structure
   * Requirements: 8.1
   */
  async getCaseFolderStructure(caseId: string): Promise<Folder[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_deleted', false)
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch folder structure: ${error.message}`);
      }

      return (data || []).map(f => this.mapFolderFromDb(f));
    } catch (error) {
      console.error('Error fetching folder structure:', error);
      throw error;
    }
  }

  /**
   * Get case document statistics
   * Requirements: 8.1
   */
  async getCaseDocumentStats(caseId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    documentsByType: Record<string, number>;
    recentDocuments: Document[];
  }> {
    try {
      const documents = await this.getCaseDocuments(caseId);

      const totalDocuments = documents.length;
      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

      const documentsByType: Record<string, number> = {};
      for (const doc of documents) {
        const type = doc.mimeType;
        documentsByType[type] = (documentsByType[type] || 0) + 1;
      }

      const recentDocuments = documents
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      return {
        totalDocuments,
        totalSize,
        documentsByType,
        recentDocuments
      };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw error;
    }
  }

  /**
   * Associate document with case
   * Requirements: 8.1
   */
  async associateDocumentWithCase(
    documentId: string,
    caseId: string,
    folderId?: string
  ): Promise<void> {
    try {
      const updates: any = { case_id: caseId };
      if (folderId) {
        updates.folder_id = folderId;
      }

      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId);

      if (error) {
        throw new Error(`Failed to associate document with case: ${error.message}`);
      }

      await this.createAuditEntry({
        entityType: 'document',
        entityId: documentId,
        action: 'case_association_updated',
        timestamp: new Date(),
        details: { caseId, folderId }
      });
    } catch (error) {
      console.error('Error associating document with case:', error);
      throw error;
    }
  }

  /**
   * Move document to different folder within case
   * Requirements: 8.1
   */
  async moveDocumentToFolder(
    documentId: string,
    targetFolderId: string,
    movedBy: string
  ): Promise<void> {
    try {
      // Verify folder exists and get case ID
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('case_id')
        .eq('id', targetFolderId)
        .single();

      if (folderError || !folder) {
        throw new Error(`Target folder not found: ${targetFolderId}`);
      }

      // Update document
      const { error } = await supabase
        .from('documents')
        .update({ folder_id: targetFolderId })
        .eq('id', documentId);

      if (error) {
        throw new Error(`Failed to move document: ${error.message}`);
      }

      await this.createAuditEntry({
        entityType: 'document',
        entityId: documentId,
        action: 'moved',
        userId: movedBy,
        timestamp: new Date(),
        details: { targetFolderId }
      });
    } catch (error) {
      console.error('Error moving document:', error);
      throw error;
    }
  }

  /**
   * Delete case workspace (when case is deleted)
   * Requirements: 8.3
   */
  async deleteCaseWorkspace(caseId: string, deletedBy: string): Promise<void> {
    try {
      // Soft delete all folders
      await supabase
        .from('folders')
        .update({ is_deleted: true })
        .eq('case_id', caseId);

      // Soft delete all documents
      await supabase
        .from('documents')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('case_id', caseId);

      await this.createAuditEntry({
        entityType: 'case_workspace',
        entityId: caseId,
        action: 'workspace_deleted',
        userId: deletedBy,
        timestamp: new Date(),
        details: { reason: 'case_deleted' }
      });
    } catch (error) {
      console.error('Error deleting case workspace:', error);
      throw error;
    }
  }

  /**
   * Inherit permissions from case management system
   * Requirements: 8.2
   */
  async inheritCasePermissions(caseId: string, documentId: string): Promise<void> {
    try {
      // Get case permissions
      const { data: casePermissions, error: permError } = await supabase
        .from('case_permissions')
        .select('*')
        .eq('case_id', caseId);

      if (permError) {
        throw new Error(`Failed to fetch case permissions: ${permError.message}`);
      }

      if (!casePermissions || casePermissions.length === 0) {
        return; // No permissions to inherit
      }

      // Create corresponding document permissions
      const documentPermissions = casePermissions.map(cp => ({
        id: crypto.randomUUID(),
        document_id: documentId,
        user_id: cp.user_id,
        role_id: cp.role_id,
        permission: this.mapCasePermissionToDocumentPermission(cp.permission_level),
        granted_by: 'system',
        granted_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('document_permissions')
        .insert(documentPermissions);

      if (insertError) {
        throw new Error(`Failed to create document permissions: ${insertError.message}`);
      }

      await this.createAuditEntry({
        entityType: 'document',
        entityId: documentId,
        action: 'permissions_inherited',
        timestamp: new Date(),
        details: {
          caseId,
          permissionCount: documentPermissions.length
        }
      });
    } catch (error) {
      console.error('Error inheriting case permissions:', error);
      throw error;
    }
  }

  /**
   * Sync document permissions with case permissions
   * Requirements: 8.2
   */
  async syncDocumentPermissionsWithCase(caseId: string): Promise<void> {
    try {
      // Get all documents for the case
      const documents = await this.getCaseDocuments(caseId);

      // Get current case permissions
      const { data: casePermissions, error: permError } = await supabase
        .from('case_permissions')
        .select('*')
        .eq('case_id', caseId);

      if (permError) {
        throw new Error(`Failed to fetch case permissions: ${permError.message}`);
      }

      // For each document, update permissions
      for (const document of documents) {
        // Remove existing permissions
        await supabase
          .from('document_permissions')
          .delete()
          .eq('document_id', document.id)
          .eq('granted_by', 'system'); // Only remove system-granted permissions

        // Add new permissions from case
        if (casePermissions && casePermissions.length > 0) {
          const documentPermissions = casePermissions.map(cp => ({
            id: crypto.randomUUID(),
            document_id: document.id,
            user_id: cp.user_id,
            role_id: cp.role_id,
            permission: this.mapCasePermissionToDocumentPermission(cp.permission_level),
            granted_by: 'system',
            granted_at: new Date().toISOString()
          }));

          await supabase
            .from('document_permissions')
            .insert(documentPermissions);
        }
      }

      await this.createAuditEntry({
        entityType: 'case',
        entityId: caseId,
        action: 'permissions_synced',
        timestamp: new Date(),
        details: {
          documentCount: documents.length,
          permissionCount: casePermissions?.length || 0
        }
      });
    } catch (error) {
      console.error('Error syncing permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission to access case documents
   * Requirements: 8.2
   */
  async canAccessCaseDocuments(caseId: string, userId: string): Promise<boolean> {
    try {
      // Check case permissions
      const { data: casePermission, error } = await supabase
        .from('case_permissions')
        .select('permission_level')
        .eq('case_id', caseId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking case permissions:', error);
        return false;
      }

      return !!casePermission;
    } catch (error) {
      console.error('Error checking case access:', error);
      return false;
    }
  }

  /**
   * Get user's effective permissions for a document based on case permissions
   * Requirements: 8.2
   */
  async getUserDocumentPermissions(
    documentId: string,
    userId: string
  ): Promise<Permission[]> {
    try {
      // Get document's case
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('case_id')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        return [];
      }

      // Get case permissions
      const { data: casePermission, error: permError } = await supabase
        .from('case_permissions')
        .select('permission_level')
        .eq('case_id', document.case_id)
        .eq('user_id', userId)
        .single();

      if (permError || !casePermission) {
        return [];
      }

      // Map case permission to document permissions
      return this.mapCasePermissionToDocumentPermissions(casePermission.permission_level);
    } catch (error) {
      console.error('Error getting user document permissions:', error);
      return [];
    }
  }

  /**
   * Bulk export documents from a case
   * Requirements: 8.7
   */
  async bulkExportDocuments(
    documentIds: string[],
    options?: {
      format?: 'zip' | 'tar';
      includeMetadata?: boolean;
      includeFolderStructure?: boolean;
    }
  ): Promise<{
    exportId: string;
    documentCount: number;
    totalSize: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }> {
    try {
      if (!documentIds || documentIds.length === 0) {
        throw new Error('No documents specified for export');
      }

      // Get documents
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      if (!documents || documents.length === 0) {
        throw new Error('No documents found for export');
      }

      const exportId = crypto.randomUUID();
      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

      // Create export record
      await supabase
        .from('document_exports')
        .insert({
          id: exportId,
          document_ids: documentIds,
          format: options?.format || 'zip',
          include_metadata: options?.includeMetadata ?? true,
          include_folder_structure: options?.includeFolderStructure ?? true,
          document_count: documents.length,
          total_size: totalSize,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      // Create audit entry
      await this.createAuditEntry({
        entityType: 'export',
        entityId: exportId,
        action: 'export_initiated',
        timestamp: new Date(),
        details: {
          documentCount: documents.length,
          totalSize,
          format: options?.format || 'zip'
        }
      });

      // TODO: Trigger async export processing
      console.log(`Export ${exportId} initiated for ${documents.length} documents`);

      return {
        exportId,
        documentCount: documents.length,
        totalSize,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error initiating bulk export:', error);
      throw error;
    }
  }

  /**
   * Export entire case workspace
   * Requirements: 8.7
   */
  async exportCaseWorkspace(caseId: string, options?: {
    format?: 'zip' | 'tar';
    includeMetadata?: boolean;
    includeDeleted?: boolean;
  }): Promise<{
    exportId: string;
    documentCount: number;
    totalSize: number;
    status: string;
  }> {
    try {
      // Get all documents for the case
      const documents = await this.getCaseDocuments(caseId, {
        includeDeleted: options?.includeDeleted
      });

      const documentIds = documents.map(d => d.id);

      return await this.bulkExportDocuments(documentIds, {
        format: options?.format,
        includeMetadata: options?.includeMetadata,
        includeFolderStructure: true
      });
    } catch (error) {
      console.error('Error exporting case workspace:', error);
      throw error;
    }
  }

  /**
   * Bulk delete documents
   * Requirements: 8.7
   */
  async bulkDeleteDocuments(
    documentIds: string[],
    deletedBy: string,
    permanent?: boolean
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    totalProcessed: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const documentId of documentIds) {
      try {
        if (permanent) {
          // Permanent delete
          const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', documentId);

          if (error) {
            failed.push({ id: documentId, error: error.message });
          } else {
            successful.push(documentId);
          }
        } else {
          // Soft delete
          const { error } = await supabase
            .from('documents')
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString()
            })
            .eq('id', documentId);

          if (error) {
            failed.push({ id: documentId, error: error.message });
          } else {
            successful.push(documentId);
          }
        }
      } catch (error: any) {
        failed.push({ id: documentId, error: error.message });
      }
    }

    // Create audit entry
    await this.createAuditEntry({
      entityType: 'bulk_operation',
      entityId: crypto.randomUUID(),
      action: 'bulk_delete',
      userId: deletedBy,
      timestamp: new Date(),
      details: {
        documentCount: documentIds.length,
        successful: successful.length,
        failed: failed.length,
        permanent
      }
    });

    return {
      successful,
      failed,
      totalProcessed: documentIds.length
    };
  }

  /**
   * Bulk move documents to a folder
   * Requirements: 8.7
   */
  async bulkMoveDocuments(
    documentIds: string[],
    targetFolderId: string,
    movedBy: string
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    totalProcessed: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // Verify target folder exists
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id, case_id')
      .eq('id', targetFolderId)
      .single();

    if (folderError || !folder) {
      throw new Error(`Target folder not found: ${targetFolderId}`);
    }

    for (const documentId of documentIds) {
      try {
        const { error } = await supabase
          .from('documents')
          .update({ folder_id: targetFolderId })
          .eq('id', documentId);

        if (error) {
          failed.push({ id: documentId, error: error.message });
        } else {
          successful.push(documentId);
        }
      } catch (error: any) {
        failed.push({ id: documentId, error: error.message });
      }
    }

    // Create audit entry
    await this.createAuditEntry({
      entityType: 'bulk_operation',
      entityId: crypto.randomUUID(),
      action: 'bulk_move',
      userId: movedBy,
      timestamp: new Date(),
      details: {
        documentCount: documentIds.length,
        targetFolderId,
        successful: successful.length,
        failed: failed.length
      }
    });

    return {
      successful,
      failed,
      totalProcessed: documentIds.length
    };
  }

  /**
   * Bulk tag documents
   * Requirements: 8.7
   */
  async bulkTagDocuments(
    documentIds: string[],
    tags: string[],
    taggedBy: string,
    operation: 'add' | 'remove' | 'replace'
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    totalProcessed: number;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const documentId of documentIds) {
      try {
        // Get current document
        const { data: document, error: fetchError } = await supabase
          .from('documents')
          .select('tags')
          .eq('id', documentId)
          .single();

        if (fetchError || !document) {
          failed.push({ id: documentId, error: 'Document not found' });
          continue;
        }

        let newTags: string[] = [];

        switch (operation) {
          case 'add':
            newTags = [...new Set([...(document.tags || []), ...tags])];
            break;
          case 'remove':
            newTags = (document.tags || []).filter(t => !tags.includes(t));
            break;
          case 'replace':
            newTags = tags;
            break;
        }

        const { error: updateError } = await supabase
          .from('documents')
          .update({ tags: newTags })
          .eq('id', documentId);

        if (updateError) {
          failed.push({ id: documentId, error: updateError.message });
        } else {
          successful.push(documentId);
        }
      } catch (error: any) {
        failed.push({ id: documentId, error: error.message });
      }
    }

    // Create audit entry
    await this.createAuditEntry({
      entityType: 'bulk_operation',
      entityId: crypto.randomUUID(),
      action: 'bulk_tag',
      userId: taggedBy,
      timestamp: new Date(),
      details: {
        documentCount: documentIds.length,
        tags,
        operation,
        successful: successful.length,
        failed: failed.length
      }
    });

    return {
      successful,
      failed,
      totalProcessed: documentIds.length
    };
  }

  /**
   * Get export status
   * Requirements: 8.7
   */
  async getExportStatus(exportId: string): Promise<{
    exportId: string;
    status: string;
    documentCount: number;
    totalSize: number;
    downloadUrl?: string;
    createdAt: Date;
    completedAt?: Date;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('document_exports')
        .select('*')
        .eq('id', exportId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        exportId: data.id,
        status: data.status,
        documentCount: data.document_count,
        totalSize: data.total_size,
        downloadUrl: data.download_url,
        createdAt: new Date(data.created_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined
      };
    } catch (error) {
      console.error('Error fetching export status:', error);
      return null;
    }
  }

  /**
   * Map case permission level to document permission
   */
  private mapCasePermissionToDocumentPermission(casePermissionLevel: string): Permission {
    switch (casePermissionLevel) {
      case 'owner':
      case 'admin':
        return Permission.DELETE;
      case 'editor':
        return Permission.EDIT;
      case 'viewer':
      default:
        return Permission.VIEW;
    }
  }

  /**
   * Map case permission level to array of document permissions
   */
  private mapCasePermissionToDocumentPermissions(casePermissionLevel: string): Permission[] {
    switch (casePermissionLevel) {
      case 'owner':
      case 'admin':
        return [Permission.VIEW, Permission.EDIT, Permission.DELETE, Permission.SHARE, Permission.SIGN];
      case 'editor':
        return [Permission.VIEW, Permission.EDIT, Permission.SHARE];
      case 'viewer':
      default:
        return [Permission.VIEW];
    }
  }

  /**
   * Create audit entry
   */
  private async createAuditEntry(entry: {
    entityType: string;
    entityId: string;
    action: string;
    userId?: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    details: Record<string, any>;
  }): Promise<void> {
    const { error } = await supabase
      .from('audit_trail')
      .insert({
        id: crypto.randomUUID(),
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        user_id: entry.userId,
        timestamp: entry.timestamp.toISOString(),
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        details: entry.details
      });

    if (error) {
      console.error('Error creating audit entry:', error);
    }
  }

  /**
   * Map database document to Document interface
   */
  private mapDocumentFromDb(dbDoc: any): Document {
    return {
      id: dbDoc.id,
      caseId: dbDoc.case_id,
      name: dbDoc.name,
      originalName: dbDoc.original_name,
      mimeType: dbDoc.mime_type,
      size: dbDoc.size,
      checksum: dbDoc.checksum,
      encryptionKey: dbDoc.encryption_key,
      storagePath: dbDoc.storage_path,
      folderId: dbDoc.folder_id,
      tags: dbDoc.tags || [],
      metadata: dbDoc.metadata || {},
      createdAt: new Date(dbDoc.created_at),
      updatedAt: new Date(dbDoc.updated_at),
      createdBy: dbDoc.created_by,
      currentVersionId: dbDoc.current_version_id,
      isDeleted: dbDoc.is_deleted,
      deletedAt: dbDoc.deleted_at ? new Date(dbDoc.deleted_at) : undefined
    };
  }

  /**
   * Map database folder to Folder interface
   */
  private mapFolderFromDb(dbFolder: any): Folder {
    return {
      id: dbFolder.id,
      caseId: dbFolder.case_id,
      name: dbFolder.name,
      parentId: dbFolder.parent_id,
      path: dbFolder.path,
      level: dbFolder.level,
      createdAt: new Date(dbFolder.created_at),
      createdBy: dbFolder.created_by,
      isDeleted: dbFolder.is_deleted
    };
  }
}

// Export singleton instance
export const caseIntegrationService = new CaseIntegrationService();
export default caseIntegrationService;
