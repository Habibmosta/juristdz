/**
 * Document Management System - Folder Service
 * 
 * Provides comprehensive folder management with hierarchy validation,
 * nested folder support up to 5 levels, and path management.
 * 
 * Requirements: 2.2, 2.6
 */

import { supabaseService } from './supabaseService';
import type { Folder, FolderContents } from '../../../types/document-management';

// Folder creation request
export interface FolderCreateRequest {
  name: string;
  caseId: string;
  parentId?: string;
  userId: string;
  description?: string;
  customFields?: Record<string, any>;
}

// Folder update request
export interface FolderUpdateRequest {
  name?: string;
  description?: string;
  customFields?: Record<string, any>;
}

// Folder query options
export interface FolderQueryOptions {
  caseId?: string;
  parentId?: string;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Folder operation result
export interface FolderOperationResult {
  success: boolean;
  folder?: Folder;
  error?: string;
  warnings?: string[];
}

// Folder list result
export interface FolderListResult {
  success: boolean;
  folders?: Folder[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}

// Folder contents result
export interface FolderContentsResult {
  success: boolean;
  contents?: FolderContents;
  error?: string;
}

// Folder hierarchy validation result
export interface HierarchyValidationResult {
  isValid: boolean;
  currentDepth: number;
  maxDepthExceeded: boolean;
  circularReference: boolean;
  errors: string[];
}

export class FolderService {
  private readonly MAX_FOLDER_DEPTH = 5;

  /**
   * Create a new folder
   */
  async createFolder(createRequest: FolderCreateRequest): Promise<FolderOperationResult> {
    try {
      // Validate case exists
      const caseExists = await this.validateCaseExists(createRequest.caseId);
      if (!caseExists) {
        return {
          success: false,
          error: `Case not found: ${createRequest.caseId}`
        };
      }

      // Validate parent folder if specified
      let parentFolder: Folder | null = null;
      if (createRequest.parentId) {
        const parentResult = await this.getFolder(createRequest.parentId, createRequest.userId);
        if (!parentResult.success) {
          return {
            success: false,
            error: `Parent folder not found: ${createRequest.parentId}`
          };
        }
        parentFolder = parentResult.folder!;

        // Ensure parent belongs to the same case
        if (parentFolder.caseId !== createRequest.caseId) {
          return {
            success: false,
            error: 'Parent folder must belong to the same case'
          };
        }
      }

      // Validate hierarchy depth
      const hierarchyValidation = await this.validateHierarchy(
        createRequest.parentId,
        createRequest.caseId
      );

      if (!hierarchyValidation.isValid) {
        return {
          success: false,
          error: `Folder hierarchy validation failed: ${hierarchyValidation.errors.join(', ')}`
        };
      }

      // Check for duplicate folder names at the same level
      const duplicateCheck = await this.checkDuplicateName(
        createRequest.name,
        createRequest.caseId,
        createRequest.parentId
      );

      if (duplicateCheck) {
        return {
          success: false,
          error: `Folder with name '${createRequest.name}' already exists at this level`
        };
      }

      // Calculate folder level and path
      const level = parentFolder ? parentFolder.level + 1 : 0;
      const path = parentFolder 
        ? `${parentFolder.path}/${createRequest.name}`
        : `/${createRequest.name}`;

      // Create folder record
      const folderData = {
        case_id: createRequest.caseId,
        name: createRequest.name,
        parent_id: createRequest.parentId || null,
        path,
        level,
        description: createRequest.description,
        custom_fields: createRequest.customFields || {},
        created_by: createRequest.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };

      const createResult = await supabaseService.insert('folders', folderData);

      if (!createResult.success) {
        return {
          success: false,
          error: `Folder creation failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'folder',
        createResult.data.id,
        'create',
        {
          folderName: createRequest.name,
          caseId: createRequest.caseId,
          parentId: createRequest.parentId,
          level,
          path
        },
        createRequest.userId
      );

      const folder = this.mapDatabaseRecordToFolder(createResult.data);

      return {
        success: true,
        folder
      };

    } catch (error) {
      return {
        success: false,
        error: `Folder creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get folder by ID
   */
  async getFolder(folderId: string, userId: string): Promise<FolderOperationResult> {
    try {
      const result = await supabaseService.findById('folders', folderId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Folder not found'
        };
      }

      const folderRecord = result.data;

      // Check if folder is deleted
      if (folderRecord.is_deleted) {
        return {
          success: false,
          error: 'Folder has been deleted'
        };
      }

      // Check permissions (basic case-level permission check)
      const hasPermission = await this.checkFolderPermission(folderId, userId, 'view');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions'
        };
      }

      const folder = this.mapDatabaseRecordToFolder(folderRecord);

      return {
        success: true,
        folder
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve folder: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update folder
   */
  async updateFolder(
    folderId: string,
    updateRequest: FolderUpdateRequest,
    userId: string
  ): Promise<FolderOperationResult> {
    try {
      // Check if folder exists and user has permission
      const existingFolder = await this.getFolder(folderId, userId);
      if (!existingFolder.success) {
        return existingFolder;
      }

      // Check edit permission
      const hasPermission = await this.checkFolderPermission(folderId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to edit folder'
        };
      }

      // Check for duplicate name if name is being changed
      if (updateRequest.name && updateRequest.name !== existingFolder.folder!.name) {
        const duplicateCheck = await this.checkDuplicateName(
          updateRequest.name,
          existingFolder.folder!.caseId,
          existingFolder.folder!.parentId
        );

        if (duplicateCheck) {
          return {
            success: false,
            error: `Folder with name '${updateRequest.name}' already exists at this level`
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updateRequest.name) {
        updateData.name = updateRequest.name;
        // Update path if name changes
        const parentPath = existingFolder.folder!.parentId 
          ? await this.getFolderPath(existingFolder.folder!.parentId)
          : '';
        updateData.path = parentPath ? `${parentPath}/${updateRequest.name}` : `/${updateRequest.name}`;
      }

      if (updateRequest.description !== undefined) updateData.description = updateRequest.description;
      if (updateRequest.customFields) updateData.custom_fields = updateRequest.customFields;

      // Update folder
      const updateResult = await supabaseService.update('folders', folderId, updateData);

      if (!updateResult.success) {
        return {
          success: false,
          error: `Folder update failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // If name changed, update paths of all descendant folders
      if (updateRequest.name && updateRequest.name !== existingFolder.folder!.name) {
        await this.updateDescendantPaths(folderId, updateData.path);
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'folder',
        folderId,
        'update',
        {
          changes: updateRequest,
          previousValues: {
            name: existingFolder.folder!.name,
            description: existingFolder.folder!.description
          }
        },
        userId
      );

      // Get updated folder
      const updatedFolder = await this.getFolder(folderId, userId);
      return updatedFolder;

    } catch (error) {
      return {
        success: false,
        error: `Folder update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete folder (soft delete)
   */
  async deleteFolder(folderId: string, userId: string): Promise<FolderOperationResult> {
    try {
      // Check if folder exists and user has permission
      const existingFolder = await this.getFolder(folderId, userId);
      if (!existingFolder.success) {
        return existingFolder;
      }

      // Check delete permission
      const hasPermission = await this.checkFolderPermission(folderId, userId, 'delete');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to delete folder'
        };
      }

      // Check if folder has contents
      const contentsResult = await this.getFolderContents(folderId, userId);
      if (contentsResult.success && contentsResult.contents) {
        const hasContents = 
          (contentsResult.contents.folders && contentsResult.contents.folders.length > 0) ||
          (contentsResult.contents.documents && contentsResult.contents.documents.length > 0);

        if (hasContents) {
          return {
            success: false,
            error: 'Cannot delete folder: folder contains subfolders or documents',
            warnings: ['Move or delete all contents before deleting the folder']
          };
        }
      }

      // Soft delete folder
      const deleteResult = await supabaseService.update('folders', folderId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Folder deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'folder',
        folderId,
        'delete',
        {
          folderName: existingFolder.folder!.name,
          folderPath: existingFolder.folder!.path,
          softDelete: true
        },
        userId
      );

      return {
        success: true,
        folder: existingFolder.folder
      };

    } catch (error) {
      return {
        success: false,
        error: `Folder deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Move folder to different parent
   */
  async moveFolder(
    folderId: string,
    targetParentId: string | null,
    userId: string
  ): Promise<FolderOperationResult> {
    try {
      // Check if folder exists and user has permission
      const existingFolder = await this.getFolder(folderId, userId);
      if (!existingFolder.success) {
        return existingFolder;
      }

      // Check edit permission
      const hasPermission = await this.checkFolderPermission(folderId, userId, 'edit');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to move folder'
        };
      }

      // Validate target parent if specified
      let targetParent: Folder | null = null;
      if (targetParentId) {
        const parentResult = await this.getFolder(targetParentId, userId);
        if (!parentResult.success) {
          return {
            success: false,
            error: `Target parent folder not found: ${targetParentId}`
          };
        }
        targetParent = parentResult.folder!;

        // Ensure target parent belongs to the same case
        if (targetParent.caseId !== existingFolder.folder!.caseId) {
          return {
            success: false,
            error: 'Target parent folder must belong to the same case'
          };
        }

        // Prevent moving folder into itself or its descendants
        if (await this.isDescendantOf(targetParentId, folderId)) {
          return {
            success: false,
            error: 'Cannot move folder into itself or its descendants'
          };
        }
      }

      // Validate hierarchy depth after move
      const hierarchyValidation = await this.validateHierarchy(
        targetParentId,
        existingFolder.folder!.caseId,
        folderId
      );

      if (!hierarchyValidation.isValid) {
        return {
          success: false,
          error: `Move would violate hierarchy constraints: ${hierarchyValidation.errors.join(', ')}`
        };
      }

      // Check for duplicate name at target location
      const duplicateCheck = await this.checkDuplicateName(
        existingFolder.folder!.name,
        existingFolder.folder!.caseId,
        targetParentId,
        folderId // Exclude current folder from duplicate check
      );

      if (duplicateCheck) {
        return {
          success: false,
          error: `Folder with name '${existingFolder.folder!.name}' already exists at target location`
        };
      }

      // Calculate new level and path
      const newLevel = targetParent ? targetParent.level + 1 : 0;
      const newPath = targetParent 
        ? `${targetParent.path}/${existingFolder.folder!.name}`
        : `/${existingFolder.folder!.name}`;

      // Update folder
      const updateResult = await supabaseService.update('folders', folderId, {
        parent_id: targetParentId,
        level: newLevel,
        path: newPath,
        updated_at: new Date().toISOString()
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: `Folder move failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Update paths of all descendant folders
      await this.updateDescendantPaths(folderId, newPath);

      // Create audit entry
      await supabaseService.createAuditEntry(
        'folder',
        folderId,
        'move',
        {
          fromParentId: existingFolder.folder!.parentId,
          toParentId: targetParentId,
          fromPath: existingFolder.folder!.path,
          toPath: newPath,
          folderName: existingFolder.folder!.name
        },
        userId
      );

      // Get updated folder
      const updatedFolder = await this.getFolder(folderId, userId);
      return updatedFolder;

    } catch (error) {
      return {
        success: false,
        error: `Folder move failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get folder contents (subfolders and documents)
   */
  async getFolderContents(folderId: string, userId: string): Promise<FolderContentsResult> {
    try {
      // Check if folder exists and user has permission
      const folderResult = await this.getFolder(folderId, userId);
      if (!folderResult.success) {
        return {
          success: false,
          error: folderResult.error
        };
      }

      // Get subfolders
      const foldersResult = await supabaseService.query('folders', {
        filters: {
          parent_id: folderId,
          is_deleted: false
        },
        sortBy: 'name',
        sortOrder: 'asc'
      });

      // Get documents in this folder
      const documentsResult = await supabaseService.query('documents', {
        filters: {
          folder_id: folderId,
          is_deleted: false
        },
        sortBy: 'name',
        sortOrder: 'asc'
      });

      const folders = foldersResult.success && foldersResult.data 
        ? foldersResult.data.map(record => this.mapDatabaseRecordToFolder(record))
        : [];

      const documents = documentsResult.success && documentsResult.data 
        ? documentsResult.data.map(record => this.mapDatabaseRecordToDocument(record))
        : [];

      // Filter based on user permissions
      const accessibleFolders = [];
      for (const folder of folders) {
        const hasPermission = await this.checkFolderPermission(folder.id, userId, 'view');
        if (hasPermission) {
          accessibleFolders.push(folder);
        }
      }

      const accessibleDocuments = [];
      for (const document of documents) {
        const hasPermission = await this.checkDocumentPermission(document.id, userId, 'view');
        if (hasPermission) {
          accessibleDocuments.push(document);
        }
      }

      const contents: FolderContents = {
        folders: accessibleFolders,
        documents: accessibleDocuments,
        totalCount: accessibleFolders.length + accessibleDocuments.length
      };

      return {
        success: true,
        contents
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get folder contents: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List folders with filtering
   */
  async listFolders(options: FolderQueryOptions = {}, userId: string): Promise<FolderListResult> {
    try {
      // Build query filters
      const filters: any = {};
      
      if (options.caseId) filters.case_id = options.caseId;
      if (options.parentId !== undefined) filters.parent_id = options.parentId;
      if (!options.includeDeleted) filters.is_deleted = false;

      // Build query options
      const queryOptions: any = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'name',
        sortOrder: options.sortOrder || 'asc'
      };

      const result = await supabaseService.query('folders', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to list folders: ${result.error?.message || 'Unknown error'}`
        };
      }

      // Filter folders based on user permissions
      const folders: Folder[] = [];
      for (const record of result.data || []) {
        const hasPermission = await this.checkFolderPermission(record.id, userId, 'view');
        if (hasPermission) {
          folders.push(this.mapDatabaseRecordToFolder(record));
        }
      }

      return {
        success: true,
        folders,
        totalCount: result.count,
        hasMore: (options.offset || 0) + (options.limit || 50) < (result.count || 0)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to list folders: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get folder hierarchy (breadcrumb path)
   */
  async getFolderHierarchy(folderId: string, userId: string): Promise<{
    success: boolean;
    hierarchy?: Folder[];
    error?: string;
  }> {
    try {
      const hierarchy: Folder[] = [];
      let currentFolderId: string | null = folderId;

      while (currentFolderId) {
        const folderResult = await this.getFolder(currentFolderId, userId);
        if (!folderResult.success) {
          return {
            success: false,
            error: folderResult.error
          };
        }

        hierarchy.unshift(folderResult.folder!);
        currentFolderId = folderResult.folder!.parentId;
      }

      return {
        success: true,
        hierarchy
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get folder hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate folder hierarchy constraints
   */
  private async validateHierarchy(
    parentId: string | null,
    caseId: string,
    excludeFolderId?: string
  ): Promise<HierarchyValidationResult> {
    const result: HierarchyValidationResult = {
      isValid: true,
      currentDepth: 0,
      maxDepthExceeded: false,
      circularReference: false,
      errors: []
    };

    try {
      if (!parentId) {
        // Root level folder is always valid
        return result;
      }

      // Calculate depth by traversing up the hierarchy
      let currentParentId: string | null = parentId;
      let depth = 1;
      const visitedIds = new Set<string>();

      while (currentParentId) {
        // Check for circular reference
        if (visitedIds.has(currentParentId)) {
          result.isValid = false;
          result.circularReference = true;
          result.errors.push('Circular reference detected in folder hierarchy');
          break;
        }

        visitedIds.add(currentParentId);

        // Check if we're trying to create a circular reference with the folder being moved
        if (excludeFolderId && currentParentId === excludeFolderId) {
          result.isValid = false;
          result.circularReference = true;
          result.errors.push('Cannot move folder into itself or its descendants');
          break;
        }

        // Get parent folder
        const parentResult = await supabaseService.findById('folders', currentParentId);
        if (!parentResult.success || !parentResult.data) {
          result.isValid = false;
          result.errors.push(`Parent folder not found: ${currentParentId}`);
          break;
        }

        const parentFolder = parentResult.data;

        // Ensure parent belongs to the same case
        if (parentFolder.case_id !== caseId) {
          result.isValid = false;
          result.errors.push('All folders in hierarchy must belong to the same case');
          break;
        }

        // Check if parent is deleted
        if (parentFolder.is_deleted) {
          result.isValid = false;
          result.errors.push('Cannot create folder under deleted parent');
          break;
        }

        depth++;
        currentParentId = parentFolder.parent_id;

        // Check max depth
        if (depth > this.MAX_FOLDER_DEPTH) {
          result.isValid = false;
          result.maxDepthExceeded = true;
          result.errors.push(`Maximum folder depth of ${this.MAX_FOLDER_DEPTH} levels exceeded`);
          break;
        }
      }

      result.currentDepth = depth;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Hierarchy validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Check if folder is descendant of another folder
   */
  private async isDescendantOf(folderId: string, ancestorId: string): Promise<boolean> {
    try {
      let currentParentId: string | null = folderId;
      const visitedIds = new Set<string>();

      while (currentParentId) {
        if (visitedIds.has(currentParentId)) {
          // Circular reference detected
          break;
        }
        visitedIds.add(currentParentId);

        if (currentParentId === ancestorId) {
          return true;
        }

        const folderResult = await supabaseService.findById('folders', currentParentId);
        if (!folderResult.success || !folderResult.data) {
          break;
        }

        currentParentId = folderResult.data.parent_id;
      }

      return false;

    } catch (error) {
      console.error('Failed to check folder ancestry:', error);
      return false;
    }
  }

  /**
   * Check for duplicate folder names at the same level
   */
  private async checkDuplicateName(
    name: string,
    caseId: string,
    parentId: string | null,
    excludeFolderId?: string
  ): Promise<boolean> {
    try {
      const filters: any = {
        name,
        case_id: caseId,
        parent_id: parentId,
        is_deleted: false
      };

      const result = await supabaseService.query('folders', {
        filters,
        limit: 1
      });

      if (result.success && result.data && result.data.length > 0) {
        // If excluding a folder (for updates), check if the found folder is different
        if (excludeFolderId) {
          return result.data[0].id !== excludeFolderId;
        }
        return true;
      }

      return false;

    } catch (error) {
      console.error('Failed to check duplicate folder name:', error);
      return false;
    }
  }

  /**
   * Update paths of all descendant folders
   */
  private async updateDescendantPaths(folderId: string, newParentPath: string): Promise<void> {
    try {
      // Get all descendant folders
      const descendantsResult = await supabaseService.query('folders', {
        filters: {
          is_deleted: false
        },
        // We'll filter by path prefix in the application since SQL LIKE might not be available
      });

      if (!descendantsResult.success || !descendantsResult.data) {
        return;
      }

      // Get the current folder to know its old path
      const currentFolderResult = await supabaseService.findById('folders', folderId);
      if (!currentFolderResult.success || !currentFolderResult.data) {
        return;
      }

      const oldPath = currentFolderResult.data.path;

      // Filter descendants by path prefix
      const descendants = descendantsResult.data.filter(folder => 
        folder.path.startsWith(oldPath + '/') && folder.id !== folderId
      );

      // Update each descendant's path
      for (const descendant of descendants) {
        const relativePath = descendant.path.substring(oldPath.length);
        const newPath = newParentPath + relativePath;

        await supabaseService.update('folders', descendant.id, {
          path: newPath,
          updated_at: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Failed to update descendant paths:', error);
    }
  }

  /**
   * Get folder path by ID
   */
  private async getFolderPath(folderId: string): Promise<string> {
    try {
      const result = await supabaseService.findById('folders', folderId);
      return result.success && result.data ? result.data.path : '';
    } catch (error) {
      console.error('Failed to get folder path:', error);
      return '';
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
   * Check folder permission for user
   */
  private async checkFolderPermission(
    folderId: string,
    userId: string,
    permission: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    try {
      // Get folder to check case association
      const folderResult = await supabaseService.findById('folders', folderId);
      if (!folderResult.success || !folderResult.data) {
        return false;
      }

      const folder = folderResult.data;

      // Check if user is the folder creator
      if (folder.created_by === userId) {
        return true;
      }

      // Check case-level permissions
      if (folder.case_id) {
        return await this.checkCasePermission(folder.case_id, userId, permission);
      }

      return false;

    } catch (error) {
      console.error('Failed to check folder permission:', error);
      return false;
    }
  }

  /**
   * Check document permission for user (used in folder contents)
   */
  private async checkDocumentPermission(
    documentId: string,
    userId: string,
    permission: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    try {
      // This would integrate with the document service
      // For now, implement basic permission check
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
        return await this.checkCasePermission(document.case_id, userId, permission);
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
    permission: 'view' | 'edit' | 'delete'
  ): Promise<boolean> {
    try {
      // This would integrate with the existing case management system
      const caseResult = await supabaseService.query('case_permissions', {
        filters: {
          case_id: caseId,
          user_id: userId
        },
        limit: 1
      });

      if (caseResult.success && caseResult.data && caseResult.data.length > 0) {
        const casePerm = caseResult.data[0];
        const permissionLevels = ['view', 'edit', 'delete'];
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
   * Map database record to Folder interface
   */
  private mapDatabaseRecordToFolder(record: any): Folder {
    return {
      id: record.id,
      caseId: record.case_id,
      name: record.name,
      parentId: record.parent_id,
      path: record.path,
      level: record.level,
      description: record.description,
      customFields: record.custom_fields || {},
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      isDeleted: record.is_deleted,
      deletedAt: record.deleted_at ? new Date(record.deleted_at) : undefined
    };
  }

  /**
   * Map database record to Document interface (simplified for folder contents)
   */
  private mapDatabaseRecordToDocument(record: any): any {
    return {
      id: record.id,
      caseId: record.case_id,
      name: record.name,
      originalName: record.original_name,
      mimeType: record.mime_type,
      size: record.size,
      folderId: record.folder_id,
      tags: record.tags || [],
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      isDeleted: record.is_deleted
    };
  }
}

// Export singleton instance
export const folderService = new FolderService();
export default folderService;
