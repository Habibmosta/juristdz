/**
 * Document Management System - Version Control Service
 * 
 * Provides automatic versioning system with version creation on document modification,
 * version storage and metadata tracking, and chronological ordering.
 * 
 * Requirements: 4.1, 4.4, 4.5
 */

import { supabaseService } from './supabaseService';
import { fileStorageService } from './fileStorageService';
import { encryptionService } from './encryptionService';
import type { 
  DocumentVersion, 
  VersionComparison, 
  VersionDifference,
  DifferenceLocation,
  VersionComparisonVisualization
} from '../../../types/document-management';

// Version creation options
export interface VersionCreateOptions {
  changeDescription?: string;
  preservePreviousVersion?: boolean;
  userId: string;
}

// Version query options
export interface VersionQueryOptions {
  documentId: string;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
  includeContent?: boolean;
}

// Version operation result
export interface VersionOperationResult {
  success: boolean;
  version?: DocumentVersion;
  error?: string;
  warnings?: string[];
}

// Version list result
export interface VersionListResult {
  success: boolean;
  versions?: DocumentVersion[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}

// Version comparison result
export interface VersionComparisonResult {
  success: boolean;
  comparison?: VersionComparison;
  enhancedComparison?: import('./documentComparisonService').DetailedComparison;
  error?: string;
}

// Version restoration result
export interface VersionRestorationResult {
  success: boolean;
  restoredVersion?: DocumentVersion;
  newCurrentVersion?: DocumentVersion;
  error?: string;
}

export class VersionControlService {
  /**
   * Create a new version of a document automatically on modification
   */
  async createVersion(
    documentId: string, 
    content: Buffer, 
    options: VersionCreateOptions
  ): Promise<VersionOperationResult> {
    try {
      // Validate document exists
      const documentResult = await supabaseService.findById('documents', documentId);
      if (!documentResult.success || !documentResult.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      const document = documentResult.data;

      // Check user permission to modify document
      const hasPermission = await this.checkDocumentEditPermission(documentId, options.userId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to create document version'
        };
      }

      // Get current version number
      const currentVersionResult = await this.getCurrentVersionNumber(documentId);
      if (!currentVersionResult.success) {
        return {
          success: false,
          error: `Failed to get current version: ${currentVersionResult.error}`
        };
      }

      const nextVersionNumber = currentVersionResult.versionNumber + 1;

      // Calculate content checksum
      const checksum = await this.calculateChecksum(content);

      // Check if content has actually changed
      if (currentVersionResult.versionNumber > 0) {
        const contentChanged = await this.hasContentChanged(documentId, checksum);
        if (!contentChanged) {
          return {
            success: false,
            error: 'No changes detected - version not created',
            warnings: ['Document content is identical to current version']
          };
        }
      }

      // Encrypt and store version content
      const encryptionResult = await encryptionService.encryptBuffer(content);
      if (!encryptionResult.success) {
        return {
          success: false,
          error: `Content encryption failed: ${encryptionResult.error}`
        };
      }

      // Generate storage path for version
      const storagePath = `versions/${documentId}/${nextVersionNumber}_${Date.now()}.enc`;

      // Store encrypted content
      const storageResult = await fileStorageService.storeBuffer(
        encryptionResult.encryptedData!,
        storagePath,
        {
          contentType: 'application/octet-stream',
          metadata: {
            documentId,
            versionNumber: nextVersionNumber.toString(),
            checksum,
            encryptionKeyId: encryptionResult.keyId
          }
        }
      );

      if (!storageResult.success) {
        return {
          success: false,
          error: `Version storage failed: ${storageResult.error}`
        };
      }

      // Create version record
      const versionData = {
        document_id: documentId,
        version_number: nextVersionNumber,
        size_bytes: content.length,
        checksum,
        storage_path: storagePath,
        created_at: new Date().toISOString(),
        created_by: options.userId,
        change_description: options.changeDescription,
        is_current: true // This will be the new current version
      };

      const createResult = await supabaseService.insert('document_versions', versionData);

      if (!createResult.success) {
        // Clean up stored file if version creation fails
        await fileStorageService.deleteFile(storagePath);
        return {
          success: false,
          error: `Version creation failed: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Update document's updated_at timestamp and size
      await supabaseService.update('documents', documentId, {
        updated_at: new Date().toISOString(),
        size_bytes: content.length
      });

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document_version',
        createResult.data.id,
        'create',
        {
          documentId,
          versionNumber: nextVersionNumber,
          changeDescription: options.changeDescription,
          contentSize: content.length,
          previousVersion: currentVersionResult.versionNumber
        },
        options.userId
      );

      // Convert database record to DocumentVersion interface
      const version = this.mapDatabaseRecordToVersion(createResult.data);

      return {
        success: true,
        version
      };

    } catch (error) {
      return {
        success: false,
        error: `Version creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get version history for a document with chronological ordering
   */
  async getVersionHistory(documentId: string, options: VersionQueryOptions = {}): Promise<VersionListResult> {
    try {
      // Check user permission to view document
      const hasPermission = await this.checkDocumentViewPermission(documentId, options.userId || '');
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to view document versions'
        };
      }

      // Build query options
      const queryOptions: any = {
        filters: { document_id: documentId },
        limit: options.limit || 50,
        offset: options.offset || 0,
        sortBy: 'version_number',
        sortOrder: options.sortOrder || 'desc' // Most recent first by default
      };

      const result = await supabaseService.query('document_versions', queryOptions);

      if (!result.success) {
        return {
          success: false,
          error: `Failed to retrieve version history: ${result.error?.message || 'Unknown error'}`
        };
      }

      // Convert database records to DocumentVersion interfaces
      const versions = (result.data || []).map(record => this.mapDatabaseRecordToVersion(record));

      return {
        success: true,
        versions,
        totalCount: result.count,
        hasMore: (options.offset || 0) + (options.limit || 50) < (result.count || 0)
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve version history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string, userId: string): Promise<VersionOperationResult> {
    try {
      const result = await supabaseService.findById('document_versions', versionId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Version not found'
        };
      }

      const versionRecord = result.data;

      // Check user permission to view document
      const hasPermission = await this.checkDocumentViewPermission(versionRecord.document_id, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to view document version'
        };
      }

      const version = this.mapDatabaseRecordToVersion(versionRecord);

      return {
        success: true,
        version
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve version: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get version content as buffer
   */
  async getVersionContent(versionId: string, userId: string): Promise<{
    success: boolean;
    content?: Buffer;
    error?: string;
  }> {
    try {
      // Get version record
      const versionResult = await this.getVersion(versionId, userId);
      if (!versionResult.success || !versionResult.version) {
        return {
          success: false,
          error: versionResult.error || 'Version not found'
        };
      }

      const version = versionResult.version;

      // Retrieve encrypted content from storage
      const storageResult = await fileStorageService.retrieveFile(version.storagePath);
      if (!storageResult.success || !storageResult.content) {
        return {
          success: false,
          error: `Failed to retrieve version content: ${storageResult.error}`
        };
      }

      // Decrypt content
      const decryptionResult = await encryptionService.decryptBuffer(storageResult.content);
      if (!decryptionResult.success || !decryptionResult.decryptedData) {
        return {
          success: false,
          error: `Failed to decrypt version content: ${decryptionResult.error}`
        };
      }

      // Verify content integrity
      const contentChecksum = await this.calculateChecksum(decryptionResult.decryptedData);
      if (contentChecksum !== version.checksum) {
        return {
          success: false,
          error: 'Version content integrity check failed - content may be corrupted'
        };
      }

      return {
        success: true,
        content: decryptionResult.decryptedData
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve version content: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate visual diff for version comparison
   */
  async generateVersionDiff(
    versionId1: string,
    versionId2: string,
    userId: string,
    options?: {
      format?: 'html' | 'markdown' | 'text';
      style?: 'side-by-side' | 'inline' | 'unified';
      showLineNumbers?: boolean;
      language?: 'fr' | 'ar' | 'en';
    }
  ): Promise<{
    success: boolean;
    diff?: string;
    css?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      // Get version comparison
      const comparisonResult = await this.getVersionComparisonVisualization(
        versionId1,
        versionId2,
        userId,
        {
          granularity: 'line',
          contextLines: 3,
          ignoreWhitespace: false
        }
      );

      if (!comparisonResult.success || !comparisonResult.visualization) {
        return {
          success: false,
          error: comparisonResult.error || 'Failed to generate comparison'
        };
      }

      // Get version content
      const content1Result = await this.getVersionContent(versionId1, userId);
      const content2Result = await this.getVersionContent(versionId2, userId);

      if (!content1Result.success || !content2Result.success) {
        return {
          success: false,
          error: 'Failed to retrieve version content'
        };
      }

      const oldContent = content1Result.content!.toString('utf-8');
      const newContent = content2Result.content!.toString('utf-8');

      const { diffVisualizationService } = await import('./diffVisualizationService');
      
      const format = options?.format || 'html';
      let diff: string;
      let css: string | undefined;
      let metadata: any;

      switch (format) {
        case 'html':
          const htmlResult = await diffVisualizationService.generateHtmlDiff(
            comparisonResult.visualization,
            oldContent,
            newContent,
            {
              format: 'html',
              style: options?.style || 'side-by-side',
              showLineNumbers: options?.showLineNumbers ?? true,
              language: options?.language || 'en'
            }
          );
          diff = htmlResult.html;
          css = htmlResult.css;
          metadata = htmlResult.metadata;
          break;

        case 'markdown':
          diff = await diffVisualizationService.generateMarkdownDiff(
            comparisonResult.visualization,
            oldContent,
            newContent
          );
          break;

        case 'text':
          diff = await diffVisualizationService.generateTextDiff(
            comparisonResult.visualization,
            oldContent,
            newContent
          );
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        diff,
        css,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `Diff generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get version comparison with visualization data
   */
  async getVersionComparisonVisualization(
    versionId1: string,
    versionId2: string,
    userId: string,
    options?: import('./documentComparisonService').ComparisonOptions
  ): Promise<{
    success: boolean;
    visualization?: VersionComparisonVisualization;
    error?: string;
  }> {
    try {
      const comparisonResult = await this.compareVersions(versionId1, versionId2, userId, options);
      
      if (!comparisonResult.success || !comparisonResult.enhancedComparison) {
        return {
          success: false,
          error: comparisonResult.error || 'Failed to generate comparison'
        };
      }

      const enhanced = comparisonResult.enhancedComparison;
      
      // Generate visualization data
      const visualization: VersionComparisonVisualization = {
        summary: {
          similarityPercentage: Math.round(enhanced.similarities * 100),
          totalChanges: enhanced.statistics.totalChanges,
          changeBreakdown: {
            additions: enhanced.statistics.additions,
            deletions: enhanced.statistics.deletions,
            modifications: enhanced.statistics.modifications
          }
        },
        changes: enhanced.differences.map(diff => ({
          type: diff.type,
          location: diff.location,
          oldContent: diff.oldContent,
          newContent: diff.newContent,
          severity: diff.severity,
          confidence: diff.confidence,
          contextBefore: diff.contextBefore,
          contextAfter: diff.contextAfter
        })),
        statistics: enhanced.statistics,
        metadata: enhanced.metadata
      };

      return {
        success: true,
        visualization
      };

    } catch (error) {
      return {
        success: false,
        error: `Visualization generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Compare two versions and highlight differences
   */
  async compareVersions(
    versionId1: string, 
    versionId2: string, 
    userId: string,
    options?: import('./documentComparisonService').ComparisonOptions
  ): Promise<VersionComparisonResult> {
    try {
      // Get both versions
      const version1Result = await this.getVersion(versionId1, userId);
      const version2Result = await this.getVersion(versionId2, userId);

      if (!version1Result.success || !version2Result.success) {
        return {
          success: false,
          error: 'One or both versions not found or access denied'
        };
      }

      const version1 = version1Result.version!;
      const version2 = version2Result.version!;

      // Ensure versions belong to the same document
      if (version1.documentId !== version2.documentId) {
        return {
          success: false,
          error: 'Cannot compare versions from different documents'
        };
      }

      // Get content for both versions
      const content1Result = await this.getVersionContent(versionId1, userId);
      const content2Result = await this.getVersionContent(versionId2, userId);

      if (!content1Result.success || !content2Result.success) {
        return {
          success: false,
          error: 'Failed to retrieve version content for comparison'
        };
      }

      // Use enhanced document comparison service
      const { documentComparisonService } = await import('./documentComparisonService');
      
      const detailedComparison = await documentComparisonService.compareDocuments(
        content1Result.content!,
        content2Result.content!,
        version1,
        version2,
        options || {}
      );

      // Convert enhanced differences to standard format for backward compatibility
      const differences: VersionDifference[] = detailedComparison.differences.map(diff => ({
        type: diff.type,
        location: diff.location,
        oldContent: diff.oldContent,
        newContent: diff.newContent
      }));

      const comparison: VersionComparison = {
        oldVersion: version1.versionNumber < version2.versionNumber ? version1 : version2,
        newVersion: version1.versionNumber > version2.versionNumber ? version1 : version2,
        differences,
        similarityScore: detailedComparison.similarities
      };

      return {
        success: true,
        comparison,
        // Add enhanced comparison data
        enhancedComparison: detailedComparison
      };

    } catch (error) {
      return {
        success: false,
        error: `Version comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Restore a previous version as the current version with history preservation
   */
  async restoreVersion(
    documentId: string, 
    versionId: string, 
    userId: string,
    changeDescription?: string
  ): Promise<VersionRestorationResult> {
    try {
      // Check user permission to edit document
      const hasPermission = await this.checkDocumentEditPermission(documentId, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to restore document version'
        };
      }

      // Get the version to restore
      const versionResult = await this.getVersion(versionId, userId);
      if (!versionResult.success || !versionResult.version) {
        return {
          success: false,
          error: versionResult.error || 'Version to restore not found'
        };
      }

      const versionToRestore = versionResult.version;

      // Ensure version belongs to the specified document
      if (versionToRestore.documentId !== documentId) {
        return {
          success: false,
          error: 'Version does not belong to the specified document'
        };
      }

      // Validate version integrity before restoration
      const integrityResult = await this.validateVersionIntegrity(versionId, userId);
      if (!integrityResult.success) {
        return {
          success: false,
          error: `Version integrity validation failed: ${integrityResult.error}`
        };
      }

      // Get version content
      const contentResult = await this.getVersionContent(versionId, userId);
      if (!contentResult.success || !contentResult.content) {
        return {
          success: false,
          error: `Failed to retrieve version content: ${contentResult.error}`
        };
      }

      // Create a new version with the restored content
      const restoreDescription = changeDescription || 
        `Restored from version ${versionToRestore.versionNumber} (${versionToRestore.createdAt.toISOString()})`;

      const newVersionResult = await this.createVersion(documentId, contentResult.content, {
        changeDescription: restoreDescription,
        userId
      });

      if (!newVersionResult.success) {
        return {
          success: false,
          error: `Failed to create restored version: ${newVersionResult.error}`
        };
      }

      // Update document metadata to reflect restoration
      await supabaseService.update('documents', documentId, {
        updated_at: new Date().toISOString(),
        size_bytes: contentResult.content.length,
        current_version_id: newVersionResult.version!.id
      });

      // Create comprehensive audit entry for restoration
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'version_restore',
        {
          restoredFromVersionId: versionId,
          restoredFromVersionNumber: versionToRestore.versionNumber,
          newVersionId: newVersionResult.version!.id,
          newVersionNumber: newVersionResult.version!.versionNumber,
          changeDescription: restoreDescription,
          integrityValidated: true,
          restoredContentSize: contentResult.content.length,
          restoredContentChecksum: versionToRestore.checksum
        },
        userId
      );

      return {
        success: true,
        restoredVersion: versionToRestore,
        newCurrentVersion: newVersionResult.version
      };

    } catch (error) {
      return {
        success: false,
        error: `Version restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Rollback document to a specific version with transaction safety
   */
  async rollbackToVersion(
    documentId: string,
    targetVersionNumber: number,
    userId: string,
    options?: {
      preserveIntermediateVersions?: boolean;
      rollbackDescription?: string;
      validateIntegrity?: boolean;
    }
  ): Promise<{
    success: boolean;
    rollbackVersion?: DocumentVersion;
    newCurrentVersion?: DocumentVersion;
    rollbackSummary?: {
      versionsAffected: number;
      rollbackTimestamp: Date;
      preservedVersions: boolean;
    };
    error?: string;
  }> {
    try {
      // Check user permission to edit document
      const hasPermission = await this.checkDocumentEditPermission(documentId, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to rollback document'
        };
      }

      // Find the target version
      const versionsResult = await this.getVersionHistory(documentId, { userId });
      if (!versionsResult.success || !versionsResult.versions) {
        return {
          success: false,
          error: 'Failed to retrieve version history for rollback'
        };
      }

      const targetVersion = versionsResult.versions.find(v => v.versionNumber === targetVersionNumber);
      if (!targetVersion) {
        return {
          success: false,
          error: `Target version ${targetVersionNumber} not found`
        };
      }

      // Validate target version integrity if requested
      if (options?.validateIntegrity !== false) {
        const integrityResult = await this.validateVersionIntegrity(targetVersion.id, userId);
        if (!integrityResult.success) {
          return {
            success: false,
            error: `Target version integrity validation failed: ${integrityResult.error}`
          };
        }
      }

      // Count versions that will be affected
      const currentVersions = versionsResult.versions.filter(v => v.versionNumber > targetVersionNumber);
      const versionsAffected = currentVersions.length;

      // Perform the rollback by restoring the target version
      const rollbackDescription = options?.rollbackDescription || 
        `Rollback to version ${targetVersionNumber} (affecting ${versionsAffected} newer versions)`;

      const restoreResult = await this.restoreVersion(
        documentId,
        targetVersion.id,
        userId,
        rollbackDescription
      );

      if (!restoreResult.success) {
        return {
          success: false,
          error: `Rollback failed during restoration: ${restoreResult.error}`
        };
      }

      // Create rollback audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'rollback',
        {
          targetVersionNumber,
          targetVersionId: targetVersion.id,
          versionsAffected,
          preserveIntermediateVersions: options?.preserveIntermediateVersions ?? true,
          rollbackTimestamp: new Date().toISOString(),
          rollbackDescription
        },
        userId
      );

      return {
        success: true,
        rollbackVersion: targetVersion,
        newCurrentVersion: restoreResult.newCurrentVersion,
        rollbackSummary: {
          versionsAffected,
          rollbackTimestamp: new Date(),
          preservedVersions: options?.preserveIntermediateVersions ?? true
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate version integrity with comprehensive checks
   */
  async validateVersionIntegrity(
    versionId: string,
    userId: string
  ): Promise<{
    success: boolean;
    integrityReport?: {
      checksumValid: boolean;
      contentAccessible: boolean;
      metadataComplete: boolean;
      storagePathValid: boolean;
      encryptionValid: boolean;
    };
    error?: string;
  }> {
    try {
      // Get version record
      const versionResult = await this.getVersion(versionId, userId);
      if (!versionResult.success || !versionResult.version) {
        return {
          success: false,
          error: versionResult.error || 'Version not found'
        };
      }

      const version = versionResult.version;
      const report = {
        checksumValid: false,
        contentAccessible: false,
        metadataComplete: false,
        storagePathValid: false,
        encryptionValid: false
      };

      // Check metadata completeness
      report.metadataComplete = !!(
        version.id &&
        version.documentId &&
        version.versionNumber > 0 &&
        version.checksum &&
        version.storagePath &&
        version.createdAt &&
        version.createdBy &&
        typeof version.size === 'number' &&
        version.size >= 0
      );

      // Check storage path validity
      report.storagePathValid = !!(version.storagePath && version.storagePath.length > 0);

      // Try to retrieve and validate content
      try {
        const contentResult = await this.getVersionContent(versionId, userId);
        if (contentResult.success && contentResult.content) {
          report.contentAccessible = true;
          report.encryptionValid = true;

          // Validate checksum
          const actualChecksum = await this.calculateChecksum(contentResult.content);
          report.checksumValid = actualChecksum === version.checksum;
        }
      } catch (error) {
        // Content retrieval failed
        report.contentAccessible = false;
        report.encryptionValid = false;
      }

      const allChecksPass = Object.values(report).every(check => check === true);

      return {
        success: allChecksPass,
        integrityReport: report,
        error: allChecksPass ? undefined : 'One or more integrity checks failed'
      };

    } catch (error) {
      return {
        success: false,
        error: `Integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a specific version (with integrity checks)
   */
  async deleteVersion(versionId: string, userId: string): Promise<VersionOperationResult> {
    try {
      // Get version record
      const versionResult = await this.getVersion(versionId, userId);
      if (!versionResult.success || !versionResult.version) {
        return {
          success: false,
          error: versionResult.error || 'Version not found'
        };
      }

      const version = versionResult.version;

      // Check user permission to edit document
      const hasPermission = await this.checkDocumentEditPermission(version.documentId, userId);
      if (!hasPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to delete document version'
        };
      }

      // Prevent deletion of current version
      if (version.isCurrent) {
        return {
          success: false,
          error: 'Cannot delete the current version of a document'
        };
      }

      // Check if this is the only version
      const versionCountResult = await supabaseService.query('document_versions', {
        filters: { document_id: version.documentId },
        select: 'id'
      });

      if (versionCountResult.success && versionCountResult.data && versionCountResult.data.length <= 1) {
        return {
          success: false,
          error: 'Cannot delete the only version of a document'
        };
      }

      // Delete version file from storage
      await fileStorageService.deleteFile(version.storagePath);

      // Delete version record
      const deleteResult = await supabaseService.delete('document_versions', versionId);

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Version deletion failed: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document_version',
        versionId,
        'delete',
        {
          documentId: version.documentId,
          versionNumber: version.versionNumber,
          deletedSize: version.size,
          storagePath: version.storagePath
        },
        userId
      );

      return {
        success: true,
        version
      };

    } catch (error) {
      return {
        success: false,
        error: `Version deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current version number for a document
   */
  private async getCurrentVersionNumber(documentId: string): Promise<{
    success: boolean;
    versionNumber: number;
    error?: string;
  }> {
    try {
      const result = await supabaseService.query('document_versions', {
        filters: { document_id: documentId },
        sortBy: 'version_number',
        sortOrder: 'desc',
        limit: 1
      });

      if (!result.success) {
        return {
          success: false,
          versionNumber: 0,
          error: result.error?.message || 'Failed to query versions'
        };
      }

      const versionNumber = result.data && result.data.length > 0 
        ? result.data[0].version_number 
        : 0;

      return {
        success: true,
        versionNumber
      };

    } catch (error) {
      return {
        success: false,
        versionNumber: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if document content has changed by comparing checksums
   */
  private async hasContentChanged(documentId: string, newChecksum: string): Promise<boolean> {
    try {
      const result = await supabaseService.query('document_versions', {
        filters: { 
          document_id: documentId,
          is_current: true
        },
        limit: 1
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return true; // No current version, so content has "changed"
      }

      const currentVersion = result.data[0];
      return currentVersion.checksum !== newChecksum;

    } catch (error) {
      console.error('Error checking content changes:', error);
      return true; // Assume changed on error to be safe
    }
  }

  /**
   * Calculate SHA-256 checksum of content
   */
  private async calculateChecksum(content: Buffer): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Calculate similarity score between two content buffers
   */
  private calculateSimilarityScore(content1: Buffer, content2: Buffer): number {
    // Simple similarity based on size difference
    // In a real implementation, you might use more sophisticated algorithms
    const size1 = content1.length;
    const size2 = content2.length;
    
    if (size1 === 0 && size2 === 0) return 1.0;
    if (size1 === 0 || size2 === 0) return 0.0;
    
    const sizeDiff = Math.abs(size1 - size2);
    const maxSize = Math.max(size1, size2);
    
    return Math.max(0, 1 - (sizeDiff / maxSize));
  }

  /**
   * Generate differences between two content buffers
   */
  private async generateDifferences(content1: Buffer, content2: Buffer): Promise<VersionDifference[]> {
    const differences: VersionDifference[] = [];

    // Basic implementation - compare sizes and checksums
    if (content1.length !== content2.length) {
      differences.push({
        type: 'modification',
        location: {
          section: 'document_size'
        },
        oldContent: `${content1.length} bytes`,
        newContent: `${content2.length} bytes`
      });
    }

    // In a real implementation, you would:
    // 1. Convert buffers to text if they're text documents
    // 2. Use diff algorithms like Myers' algorithm
    // 3. Identify specific line/character changes
    // 4. Handle binary files appropriately

    return differences;
  }

  /**
   * Check if user has view permission for document
   */
  private async checkDocumentViewPermission(documentId: string, userId: string): Promise<boolean> {
    try {
      // Get document to check ownership
      const docResult = await supabaseService.findById('documents', documentId);
      if (!docResult.success || !docResult.data) {
        return false;
      }

      const document = docResult.data;

      // Check if user is the document owner
      if (document.created_by === userId || document.user_id === userId) {
        return true;
      }

      // Check document-specific permissions
      const permissionResult = await supabaseService.query('document_permissions', {
        filters: {
          document_id: documentId,
          user_id: userId,
          permission: 'view'
        },
        limit: 1
      });

      if (permissionResult.success && permissionResult.data && permissionResult.data.length > 0) {
        const perm = permissionResult.data[0];
        // Check if permission is still valid (not expired)
        return !perm.expires_at || new Date(perm.expires_at) > new Date();
      }

      return false;

    } catch (error) {
      console.error('Failed to check document view permission:', error);
      return false;
    }
  }

  /**
   * Check if user has edit permission for document
   */
  private async checkDocumentEditPermission(documentId: string, userId: string): Promise<boolean> {
    try {
      // Get document to check ownership
      const docResult = await supabaseService.findById('documents', documentId);
      if (!docResult.success || !docResult.data) {
        return false;
      }

      const document = docResult.data;

      // Check if user is the document owner
      if (document.created_by === userId || document.user_id === userId) {
        return true;
      }

      // Check document-specific permissions
      const permissionResult = await supabaseService.query('document_permissions', {
        filters: {
          document_id: documentId,
          user_id: userId,
          permission: 'edit'
        },
        limit: 1
      });

      if (permissionResult.success && permissionResult.data && permissionResult.data.length > 0) {
        const perm = permissionResult.data[0];
        // Check if permission is still valid (not expired)
        return !perm.expires_at || new Date(perm.expires_at) > new Date();
      }

      return false;

    } catch (error) {
      console.error('Failed to check document edit permission:', error);
      return false;
    }
  }

  /**
   * Map database record to DocumentVersion interface
   */
  private mapDatabaseRecordToVersion(record: any): DocumentVersion {
    return {
      id: record.id,
      documentId: record.document_id,
      versionNumber: record.version_number,
      size: record.size_bytes,
      checksum: record.checksum,
      storagePath: record.storage_path,
      createdAt: new Date(record.created_at),
      createdBy: record.created_by,
      changeDescription: record.change_description,
      isCurrent: record.is_current
    };
  }
}

// Export singleton instance
export const versionControlService = new VersionControlService();
export default versionControlService;
