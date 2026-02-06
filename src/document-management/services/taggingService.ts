/**
 * Document Management System - Tagging and Organization Service
 * 
 * Provides comprehensive tagging functionality with tag management,
 * search indexing, and document categorization features.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

import { supabaseService } from './supabaseService';
import type { DocumentCategory } from '../../../types/document-management';

// Tag interface
export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  category?: DocumentCategory;
  caseId?: string;
  isSystemTag: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isDeleted: boolean;
}

// Tag creation request
export interface TagCreateRequest {
  name: string;
  description?: string;
  color?: string;
  category?: DocumentCategory;
  caseId?: string;
  userId: string;
}

// Tag update request
export interface TagUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
  category?: DocumentCategory;
}

// Tag query options
export interface TagQueryOptions {
  caseId?: string;
  category?: DocumentCategory;
  searchTerm?: string;
  includeSystemTags?: boolean;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'usage_count' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Tag operation result
export interface TagOperationResult {
  success: boolean;
  tag?: Tag;
  error?: string;
  warnings?: string[];
}

// Tag list result
export interface TagListResult {
  success: boolean;
  tags?: Tag[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}

// Tag assignment result
export interface TagAssignmentResult {
  success: boolean;
  assignedTags?: string[];
  removedTags?: string[];
  error?: string;
}

// Tag statistics
export interface TagStatistics {
  totalTags: number;
  systemTags: number;
  userTags: number;
  tagsByCategory: Record<DocumentCategory, number>;
  mostUsedTags: Array<{ tag: Tag; count: number }>;
  recentTags: Tag[];
  unusedTags: Tag[];
}

// Document tag assignment
export interface DocumentTagAssignment {
  documentId: string;
  tagIds: string[];
  userId: string;
}

export class TaggingService {
  /**
   * Create a new tag
   */
  async createTag(createRequest: TagCreateRequest): Promise<TagOperationResult> {
    try {
      // Validate case if specified
      if (createRequest.caseId) {
        const caseExists = await this.validateCaseExists(createRequest.caseId);
        if (!caseExists) {
          return {
            success: false,
            error: `Case not found: ${createRequest.caseId}`
          };
        }
      }

      // Check for duplicate tag name in the same scope
      const duplicateCheck = await this.checkDuplicateTag(
        createRequest.name,
        createRequest.caseId
      );

      if (duplicateCheck) {
        return {
          success: false,
          error: `Tag with name '${createRequest.name}' already exists in this scope`
        };
      }

      // Normalize tag name
      const normalizedName = this.normalizeTagName(createRequest.name);

      // Create tag record
      const tagData = {
        name: normalizedName,
        description: createRequest.description,
        color: createRequest.color || this.generateTagColor(),
        category: createRequest.category,
        case_id: createRequest.caseId,
        is_system_tag: false,
        usage_count: 0,
        created_by: createRequest.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };

      const createResult = await supabaseService.insert('tags', tagData);

      if (!createResult.success) {
        return {
          success: false,
          error: `Tag creation failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'tag',
        createResult.data.id,
        'create',
        {
          tagName: normalizedName,
          caseId: createRequest.caseId,
          category: createRequest.category
        },
        createRequest.userId
      );

      const tag = this.mapDatabaseRecordToTag(createResult.data);

      return {
        success: true,
        tag
      };

    } catch (error) {
      return {
        success: false,
        error: `Tag creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tag by ID
   */
  async getTag(tagId: string): Promise<TagOperationResult> {
    try {
      const result = await supabaseService.findById('tags', tagId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Tag not found'
        };
      }

      const tagRecord = result.data;

      // Check if tag is deleted
      if (tagRecord.is_deleted) {
        return {
          success: false,
          error: 'Tag has been deleted'
        };
      }

      const tag = this.mapDatabaseRecordToTag(tagRecord);

      return {
        success: true,
        tag
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update tag
   */
  async updateTag(
    tagId: string,
    updateRequest: TagUpdateRequest,
    userId: string
  ): Promise<TagOperationResult> {
    try {
      // Check if tag exists
      const existingTag = await this.getTag(tagId);
      if (!existingTag.success) {
        return existingTag;
      }

      // Check if user can update this tag
      const canUpdate = await this.canUserModifyTag(tagId, userId);
      if (!canUpdate) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to update tag'
        };
      }

      // Check for duplicate name if name is being changed
      if (updateRequest.name && updateRequest.name !== existingTag.tag!.name) {
        const normalizedName = this.normalizeTagName(updateRequest.name);
        const duplicateCheck = await this.checkDuplicateTag(
          normalizedName,
          existingTag.tag!.caseId,
          tagId
        );

        if (duplicateCheck) {
          return {
            success: false,
            error: `Tag with name '${normalizedName}' already exists in this scope`
          };
        }
      }

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updateRequest.name) {
        updateData.name = this.normalizeTagName(updateRequest.name);
      }
      if (updateRequest.description !== undefined) updateData.description = updateRequest.description;
      if (updateRequest.color) updateData.color = updateRequest.color;
      if (updateRequest.category) updateData.category = updateRequest.category;

      // Update tag
      const updateResult = await supabaseService.update('tags', tagId, updateData);

      if (!updateResult.success) {
        return {
          success: false,
          error: `Tag update failed: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'tag',
        tagId,
        'update',
        {
          changes: updateRequest,
          previousValues: {
            name: existingTag.tag!.name,
            description: existingTag.tag!.description,
            category: existingTag.tag!.category
          }
        },
        userId
      );

      // Get updated tag
      const updatedTag = await this.getTag(tagId);
      return updatedTag;

    } catch (error) {
      return {
        success: false,
        error: `Tag update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete tag (soft delete)
   */
  async deleteTag(tagId: string, userId: string): Promise<TagOperationResult> {
    try {
      // Check if tag exists
      const existingTag = await this.getTag(tagId);
      if (!existingTag.success) {
        return existingTag;
      }

      // Check if user can delete this tag
      const canDelete = await this.canUserModifyTag(tagId, userId);
      if (!canDelete) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to delete tag'
        };
      }

      // Check if tag is in use
      const usageCount = await this.getTagUsageCount(tagId);
      if (usageCount > 0) {
        return {
          success: false,
          error: 'Cannot delete tag: tag is currently in use by documents',
          warnings: [`Tag is used by ${usageCount} document(s). Remove tag from documents first.`]
        };
      }

      // Soft delete tag
      const deleteResult = await supabaseService.update('tags', tagId, {
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Tag deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'tag',
        tagId,
        'delete',
        {
          tagName: existingTag.tag!.name,
          usageCount,
          softDelete: true
        },
        userId
      );

      return {
        success: true,
        tag: existingTag.tag
      };

    } catch (error) {
      return {
        success: false,
        error: `Tag deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List tags with filtering
   */
  async listTags(options: TagQueryOptions = {}): Promise<TagListResult> {
    try {
      // Build query filters
      const filters: any = {};
      
      if (options.caseId) filters.case_id = options.caseId;
      if (options.category) filters.category = options.category;
      if (!options.includeDeleted) filters.is_deleted = false;
      if (!options.includeSystemTags) filters.is_system_tag = false;

      // Build query options
      const queryOptions: any = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: options.sortBy || 'name',
        sortOrder: options.sortOrder || 'asc'
      };

      // Add search term
      if (options.searchTerm) {
        queryOptions.search = {
          fields: ['name', 'description'],
          term: options.searchTerm
        };
      }

      const result = await supabaseService.query('tags', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to list tags: ${result.error?.message || 'Unknown error'}`
        };
      }

      const tags = (result.data || []).map(record => this.mapDatabaseRecordToTag(record));

      return {
        success: true,
        tags,
        totalCount: result.count,
        hasMore: (options.offset || 0) + (options.limit || 50) < (result.count || 0)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to list tags: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Assign tags to document
   */
  async assignTagsToDocument(assignment: DocumentTagAssignment): Promise<TagAssignmentResult> {
    try {
      // Validate document exists
      const documentExists = await this.validateDocumentExists(assignment.documentId);
      if (!documentExists) {
        return {
          success: false,
          error: `Document not found: ${assignment.documentId}`
        };
      }

      // Validate all tags exist
      const validTags = await this.validateTagsExist(assignment.tagIds);
      if (validTags.length !== assignment.tagIds.length) {
        const invalidTags = assignment.tagIds.filter(id => !validTags.includes(id));
        return {
          success: false,
          error: `Invalid tag IDs: ${invalidTags.join(', ')}`
        };
      }

      // Get current document tags
      const currentTags = await this.getDocumentTags(assignment.documentId);
      const currentTagIds = currentTags.map(tag => tag.id);

      // Calculate changes
      const tagsToAdd = assignment.tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !assignment.tagIds.includes(id));

      // Update document tags
      const updateResult = await supabaseService.update('documents', assignment.documentId, {
        tags: assignment.tagIds,
        updated_at: new Date().toISOString()
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: `Failed to update document tags: ${updateResult.error?.message || 'Unknown error'}`
        };
      }

      // Update tag usage counts
      await this.updateTagUsageCounts(tagsToAdd, tagsToRemove);

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        assignment.documentId,
        'tags_updated',
        {
          addedTags: tagsToAdd,
          removedTags: tagsToRemove,
          finalTags: assignment.tagIds
        },
        assignment.userId
      );

      return {
        success: true,
        assignedTags: tagsToAdd,
        removedTags: tagsToRemove
      };

    } catch (error) {
      return {
        success: false,
        error: `Tag assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tags assigned to a document
   */
  async getDocumentTags(documentId: string): Promise<Tag[]> {
    try {
      // Get document to retrieve tag IDs
      const docResult = await supabaseService.findById('documents', documentId);
      if (!docResult.success || !docResult.data) {
        return [];
      }

      const tagIds = docResult.data.tags || [];
      if (tagIds.length === 0) {
        return [];
      }

      // Get tag details
      const tagsResult = await supabaseService.query('tags', {
        filters: {
          id: { in: tagIds },
          is_deleted: false
        }
      });

      if (!tagsResult.success || !tagsResult.data) {
        return [];
      }

      return tagsResult.data.map(record => this.mapDatabaseRecordToTag(record));

    } catch (error) {
      console.error('Failed to get document tags:', error);
      return [];
    }
  }

  /**
   * Search documents by tags
   */
  async searchDocumentsByTags(
    tagIds: string[],
    options: {
      caseId?: string;
      matchAll?: boolean; // true = AND, false = OR
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    success: boolean;
    documents?: any[];
    totalCount?: number;
    error?: string;
  }> {
    try {
      if (tagIds.length === 0) {
        return {
          success: true,
          documents: [],
          totalCount: 0
        };
      }

      // Build query filters
      const filters: any = {
        is_deleted: false
      };

      if (options.caseId) {
        filters.case_id = options.caseId;
      }

      // Add tag filter
      if (options.matchAll) {
        // All tags must be present (AND)
        filters.tags = { containsAll: tagIds };
      } else {
        // Any tag can be present (OR)
        filters.tags = { containsAny: tagIds };
      }

      const queryOptions = {
        filters,
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: 'updated_at',
        sortOrder: 'desc' as const
      };

      const result = await supabaseService.query('documents', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Document search failed: ${result.error?.message || 'Unknown error'}`
        };
      }

      return {
        success: true,
        documents: result.data || [],
        totalCount: result.count
      };

    } catch (error) {
      return {
        success: false,
        error: `Document search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tag suggestions based on partial input
   */
  async getTagSuggestions(
    partialName: string,
    options: {
      caseId?: string;
      category?: DocumentCategory;
      limit?: number;
    } = {}
  ): Promise<{
    success: boolean;
    suggestions?: Tag[];
    error?: string;
  }> {
    try {
      const filters: any = {
        is_deleted: false
      };

      if (options.caseId) filters.case_id = options.caseId;
      if (options.category) filters.category = options.category;

      const queryOptions = {
        filters,
        search: {
          fields: ['name'],
          term: partialName
        },
        limit: options.limit || 10,
        sortBy: 'usage_count',
        sortOrder: 'desc' as const
      };

      const result = await supabaseService.query('tags', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Tag suggestions failed: ${result.error?.message || 'Unknown error'}`
        };
      }

      const suggestions = (result.data || []).map(record => this.mapDatabaseRecordToTag(record));

      return {
        success: true,
        suggestions
      };

    } catch (error) {
      return {
        success: false,
        error: `Tag suggestions failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get tag statistics
   */
  async getTagStatistics(caseId?: string): Promise<TagStatistics> {
    try {
      const filters: any = { is_deleted: false };
      if (caseId) filters.case_id = caseId;

      const result = await supabaseService.query('tags', {
        filters,
        select: 'id, name, category, is_system_tag, usage_count, created_at'
      });

      if (!result.success || !result.data) {
        throw new Error('Failed to retrieve tag statistics');
      }

      const tags = result.data;
      const totalTags = tags.length;
      const systemTags = tags.filter(tag => tag.is_system_tag).length;
      const userTags = totalTags - systemTags;

      // Count by category
      const tagsByCategory: Record<DocumentCategory, number> = {
        contract: 0,
        pleading: 0,
        evidence: 0,
        correspondence: 0,
        template: 0,
        other: 0
      };

      tags.forEach(tag => {
        if (tag.category && tag.category in tagsByCategory) {
          tagsByCategory[tag.category as DocumentCategory]++;
        }
      });

      // Most used tags (top 10)
      const mostUsedTags = tags
        .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
        .slice(0, 10)
        .map(tag => ({
          tag: this.mapDatabaseRecordToTag(tag),
          count: tag.usage_count || 0
        }));

      // Recent tags (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentTags = tags
        .filter(tag => new Date(tag.created_at) > thirtyDaysAgo)
        .map(tag => this.mapDatabaseRecordToTag(tag));

      // Unused tags
      const unusedTags = tags
        .filter(tag => (tag.usage_count || 0) === 0)
        .map(tag => this.mapDatabaseRecordToTag(tag));

      return {
        totalTags,
        systemTags,
        userTags,
        tagsByCategory,
        mostUsedTags,
        recentTags,
        unusedTags
      };

    } catch (error) {
      console.error('Failed to get tag statistics:', error);
      return {
        totalTags: 0,
        systemTags: 0,
        userTags: 0,
        tagsByCategory: {
          contract: 0,
          pleading: 0,
          evidence: 0,
          correspondence: 0,
          template: 0,
          other: 0
        },
        mostUsedTags: [],
        recentTags: [],
        unusedTags: []
      };
    }
  }

  /**
   * Create system tags for a case
   */
  async createSystemTags(caseId: string, userId: string): Promise<{
    success: boolean;
    createdTags?: Tag[];
    error?: string;
  }> {
    try {
      const systemTagDefinitions = [
        { name: 'urgent', description: 'Urgent documents requiring immediate attention', color: '#ff4444' },
        { name: 'draft', description: 'Draft documents in progress', color: '#ffaa00' },
        { name: 'final', description: 'Final approved documents', color: '#00aa00' },
        { name: 'confidential', description: 'Confidential documents with restricted access', color: '#aa0000' },
        { name: 'public', description: 'Public documents for general access', color: '#0066cc' },
        { name: 'archived', description: 'Archived documents for reference', color: '#666666' }
      ];

      const createdTags: Tag[] = [];

      for (const tagDef of systemTagDefinitions) {
        // Check if system tag already exists
        const existingTag = await this.findTagByName(tagDef.name, caseId);
        if (existingTag) {
          continue;
        }

        const tagData = {
          name: tagDef.name,
          description: tagDef.description,
          color: tagDef.color,
          case_id: caseId,
          is_system_tag: true,
          usage_count: 0,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        };

        const createResult = await supabaseService.insert('tags', tagData);
        if (createResult.success) {
          createdTags.push(this.mapDatabaseRecordToTag(createResult.data));
        }
      }

      return {
        success: true,
        createdTags
      };

    } catch (error) {
      return {
        success: false,
        error: `System tag creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Normalize tag name (lowercase, trim, replace spaces with hyphens)
   */
  private normalizeTagName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Generate a random color for tags
   */
  private generateTagColor(): string {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Check for duplicate tag name
   */
  private async checkDuplicateTag(
    name: string,
    caseId?: string,
    excludeTagId?: string
  ): Promise<boolean> {
    try {
      const filters: any = {
        name,
        is_deleted: false
      };

      if (caseId) filters.case_id = caseId;

      const result = await supabaseService.query('tags', {
        filters,
        limit: 1
      });

      if (result.success && result.data && result.data.length > 0) {
        if (excludeTagId) {
          return result.data[0].id !== excludeTagId;
        }
        return true;
      }

      return false;

    } catch (error) {
      console.error('Failed to check duplicate tag:', error);
      return false;
    }
  }

  /**
   * Find tag by name
   */
  private async findTagByName(name: string, caseId?: string): Promise<Tag | null> {
    try {
      const filters: any = {
        name: this.normalizeTagName(name),
        is_deleted: false
      };

      if (caseId) filters.case_id = caseId;

      const result = await supabaseService.query('tags', {
        filters,
        limit: 1
      });

      if (result.success && result.data && result.data.length > 0) {
        return this.mapDatabaseRecordToTag(result.data[0]);
      }

      return null;

    } catch (error) {
      console.error('Failed to find tag by name:', error);
      return null;
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
   * Validate if document exists
   */
  private async validateDocumentExists(documentId: string): Promise<boolean> {
    try {
      const result = await supabaseService.findById('documents', documentId);
      return result.success && !!result.data && !result.data.is_deleted;
    } catch (error) {
      console.error('Failed to validate document existence:', error);
      return false;
    }
  }

  /**
   * Validate if tags exist
   */
  private async validateTagsExist(tagIds: string[]): Promise<string[]> {
    try {
      if (tagIds.length === 0) return [];

      const result = await supabaseService.query('tags', {
        filters: {
          id: { in: tagIds },
          is_deleted: false
        },
        select: 'id'
      });

      if (result.success && result.data) {
        return result.data.map(tag => tag.id);
      }

      return [];

    } catch (error) {
      console.error('Failed to validate tags existence:', error);
      return [];
    }
  }

  /**
   * Check if user can modify tag
   */
  private async canUserModifyTag(tagId: string, userId: string): Promise<boolean> {
    try {
      const tagResult = await supabaseService.findById('tags', tagId);
      if (!tagResult.success || !tagResult.data) {
        return false;
      }

      const tag = tagResult.data;

      // System tags can only be modified by system administrators
      if (tag.is_system_tag) {
        // This would check for admin role - simplified for now
        return false;
      }

      // User can modify tags they created
      if (tag.created_by === userId) {
        return true;
      }

      // Check case-level permissions if tag is case-specific
      if (tag.case_id) {
        return await this.checkCasePermission(tag.case_id, userId, 'edit');
      }

      return false;

    } catch (error) {
      console.error('Failed to check tag modification permission:', error);
      return false;
    }
  }

  /**
   * Get tag usage count
   */
  private async getTagUsageCount(tagId: string): Promise<number> {
    try {
      const result = await supabaseService.query('documents', {
        filters: {
          tags: { contains: tagId },
          is_deleted: false
        },
        select: 'id'
      });

      return result.success && result.data ? result.data.length : 0;

    } catch (error) {
      console.error('Failed to get tag usage count:', error);
      return 0;
    }
  }

  /**
   * Update tag usage counts
   */
  private async updateTagUsageCounts(addedTags: string[], removedTags: string[]): Promise<void> {
    try {
      // Increment usage count for added tags
      for (const tagId of addedTags) {
        await supabaseService.incrementField('tags', tagId, 'usage_count', 1);
      }

      // Decrement usage count for removed tags
      for (const tagId of removedTags) {
        await supabaseService.incrementField('tags', tagId, 'usage_count', -1);
      }

    } catch (error) {
      console.error('Failed to update tag usage counts:', error);
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
   * Map database record to Tag interface
   */
  private mapDatabaseRecordToTag(record: any): Tag {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      color: record.color,
      category: record.category,
      caseId: record.case_id,
      isSystemTag: record.is_system_tag,
      usageCount: record.usage_count || 0,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      isDeleted: record.is_deleted
    };
  }
}

// Export singleton instance
export const taggingService = new TaggingService();
export default taggingService;
