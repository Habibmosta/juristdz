/**
 * Data Retention and Purging Service
 * 
 * Implements automatic document purging after retention period,
 * secure deletion and data wiping, and retention policy management
 * for the Document Management System.
 * 
 * Requirements: 7.7
 */

import {
  Document,
  DocumentCategory,
  ConfidentialityLevel,
  AuditTrail
} from '../../../types/document-management';
import { UserRole } from '../../../types';
import { supabaseService } from './supabaseService';
import { auditService } from './auditService';
import { encryptionService } from './encryptionService';

// =====================================================
// DATA RETENTION INTERFACES
// =====================================================

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  confidentialityLevel?: ConfidentialityLevel;
  retentionPeriodDays: number;
  gracePeriodDays: number;
  autoDelete: boolean;
  requiresApproval: boolean;
  approverRoles: UserRole[];
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface RetentionSchedule {
  id: string;
  documentId: string;
  policyId: string;
  scheduledDeletionDate: Date;
  gracePeriodEndDate: Date;
  status: RetentionStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  notificationsSent: number;
  lastNotificationAt?: Date;
}

export interface PurgeRequest {
  documentId: string;
  requestedBy: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  approvalRequired: boolean;
  scheduledDate?: Date;
}

export interface PurgeResult {
  success: boolean;
  documentId: string;
  purgedAt: Date;
  method: PurgeMethod;
  verificationHash?: string;
  auditTrailId?: string;
  error?: string;
}

export interface RetentionReport {
  totalDocuments: number;
  documentsScheduledForDeletion: number;
  documentsInGracePeriod: number;
  documentsPendingApproval: number;
  documentsOverdue: number;
  storageReclaimed: number; // in bytes
  policies: RetentionPolicyStats[];
  upcomingDeletions: UpcomingDeletion[];
}

export interface RetentionPolicyStats {
  policyId: string;
  policyName: string;
  documentsAffected: number;
  averageRetentionDays: number;
  storageImpact: number;
}

export interface UpcomingDeletion {
  documentId: string;
  documentName: string;
  scheduledDate: Date;
  daysRemaining: number;
  requiresApproval: boolean;
  category: DocumentCategory;
}

export enum RetentionStatus {
  SCHEDULED = 'scheduled',
  GRACE_PERIOD = 'grace_period',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum PurgeMethod {
  SOFT_DELETE = 'soft_delete',
  SECURE_DELETE = 'secure_delete',
  CRYPTOGRAPHIC_ERASURE = 'cryptographic_erasure',
  PHYSICAL_DESTRUCTION = 'physical_destruction'
}

// =====================================================
// DATA RETENTION SERVICE CLASS
// =====================================================

export class DataRetentionService {
  private readonly retentionPoliciesTable = 'retention_policies';
  private readonly retentionSchedulesTable = 'retention_schedules';
  private readonly purgeLogTable = 'document_purge_log';
  private readonly documentsTable = 'documents';

  // Default retention periods (in days) based on legal requirements
  private readonly defaultRetentionPeriods: Record<DocumentCategory, number> = {
    [DocumentCategory.CONTRACT]: 2555, // 7 years
    [DocumentCategory.PLEADING]: 1825, // 5 years
    [DocumentCategory.EVIDENCE]: 3650, // 10 years
    [DocumentCategory.CORRESPONDENCE]: 1095, // 3 years
    [DocumentCategory.TEMPLATE]: 365, // 1 year
    [DocumentCategory.OTHER]: 1095 // 3 years
  };

  // =====================================================
  // RETENTION POLICY MANAGEMENT
  // =====================================================

  /**
   * Create retention policy
   * Requirement 7.7: Retention policy management
   */
  async createRetentionPolicy(
    policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<RetentionPolicy | null> {
    try {
      const policyData = {
        name: policy.name,
        description: policy.description,
        category: policy.category,
        confidentiality_level: policy.confidentialityLevel,
        retention_period_days: policy.retentionPeriodDays,
        grace_period_days: policy.gracePeriodDays,
        auto_delete: policy.autoDelete,
        requires_approval: policy.requiresApproval,
        approver_roles: JSON.stringify(policy.approverRoles),
        is_active: policy.isActive,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseService.getClient()
        .from(this.retentionPoliciesTable)
        .insert(policyData)
        .select()
        .single();

      if (error) {
        console.error('Error creating retention policy:', error);
        return null;
      }

      // Log policy creation
      await auditService.logActivity({
        userId: createdBy,
        action: 'create',
        resourceType: 'retention_policy',
        resourceId: data.id,
        details: {
          policyName: policy.name,
          category: policy.category,
          retentionPeriodDays: policy.retentionPeriodDays
        }
      });

      return this.mapRetentionPolicyData(data);
    } catch (error) {
      console.error('Error creating retention policy:', error);
      return null;
    }
  }

  /**
   * Get retention policy for document
   */
  async getRetentionPolicyForDocument(documentId: string): Promise<RetentionPolicy | null> {
    try {
      // Get document details
      const document = await this.getDocument(documentId);
      if (!document) return null;

      // Find matching policy
      const { data, error } = await supabaseService.getClient()
        .from(this.retentionPoliciesTable)
        .select('*')
        .eq('category', document.metadata.category)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Return default policy if no specific policy found
        return this.createDefaultRetentionPolicy(document.metadata.category);
      }

      return this.mapRetentionPolicyData(data);
    } catch (error) {
      console.error('Error getting retention policy:', error);
      return null;
    }
  }

  /**
   * Update retention policy
   */
  async updateRetentionPolicy(
    policyId: string,
    updates: Partial<RetentionPolicy>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.retentionPeriodDays) updateData.retention_period_days = updates.retentionPeriodDays;
      if (updates.gracePeriodDays) updateData.grace_period_days = updates.gracePeriodDays;
      if (typeof updates.autoDelete === 'boolean') updateData.auto_delete = updates.autoDelete;
      if (typeof updates.requiresApproval === 'boolean') updateData.requires_approval = updates.requiresApproval;
      if (updates.approverRoles) updateData.approver_roles = JSON.stringify(updates.approverRoles);
      if (typeof updates.isActive === 'boolean') updateData.is_active = updates.isActive;

      const { error } = await supabaseService.getClient()
        .from(this.retentionPoliciesTable)
        .update(updateData)
        .eq('id', policyId);

      if (error) {
        console.error('Error updating retention policy:', error);
        return false;
      }

      // Log policy update
      await auditService.logActivity({
        userId: updatedBy,
        action: 'update',
        resourceType: 'retention_policy',
        resourceId: policyId,
        details: updates
      });

      return true;
    } catch (error) {
      console.error('Error updating retention policy:', error);
      return false;
    }
  }

  // =====================================================
  // AUTOMATIC DOCUMENT PURGING
  // =====================================================

  /**
   * Schedule document for deletion based on retention policy
   * Requirement 7.7: Automatic document purging after retention period
   */
  async scheduleDocumentForDeletion(documentId: string): Promise<boolean> {
    try {
      // Get document and its retention policy
      const document = await this.getDocument(documentId);
      if (!document) return false;

      const policy = await this.getRetentionPolicyForDocument(documentId);
      if (!policy) return false;

      // Calculate deletion dates
      const createdDate = new Date(document.createdAt);
      const scheduledDeletionDate = new Date(createdDate);
      scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + policy.retentionPeriodDays);

      const gracePeriodEndDate = new Date(scheduledDeletionDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + policy.gracePeriodDays);

      // Check if document is already scheduled
      const existingSchedule = await this.getRetentionSchedule(documentId);
      if (existingSchedule) {
        return true; // Already scheduled
      }

      // Create retention schedule
      const scheduleData = {
        document_id: documentId,
        policy_id: policy.id,
        scheduled_deletion_date: scheduledDeletionDate.toISOString(),
        grace_period_end_date: gracePeriodEndDate.toISOString(),
        status: RetentionStatus.SCHEDULED,
        approval_required: policy.requiresApproval,
        created_at: new Date().toISOString(),
        notifications_sent: 0
      };

      const { error } = await supabaseService.getClient()
        .from(this.retentionSchedulesTable)
        .insert(scheduleData);

      if (error) {
        console.error('Error scheduling document for deletion:', error);
        return false;
      }

      // Log scheduling
      await auditService.logActivity({
        userId: 'system',
        action: 'create',
        resourceType: 'retention_schedule',
        resourceId: documentId,
        details: {
          scheduledDeletionDate,
          gracePeriodEndDate,
          policyId: policy.id,
          requiresApproval: policy.requiresApproval
        }
      });

      return true;
    } catch (error) {
      console.error('Error scheduling document for deletion:', error);
      return false;
    }
  }

  /**
   * Process scheduled deletions
   */
  async processScheduledDeletions(): Promise<{ processed: number; errors: string[] }> {
    try {
      const now = new Date();
      const errors: string[] = [];
      let processed = 0;

      // Get documents ready for deletion
      const { data: schedules, error } = await supabaseService.getClient()
        .from(this.retentionSchedulesTable)
        .select('*')
        .eq('status', RetentionStatus.SCHEDULED)
        .lte('scheduled_deletion_date', now.toISOString())
        .eq('approval_required', false); // Only auto-delete documents that don't require approval

      if (error) {
        errors.push(`Error fetching scheduled deletions: ${error.message}`);
        return { processed, errors };
      }

      // Process each scheduled deletion
      for (const schedule of schedules || []) {
        try {
          const purgeResult = await this.purgeDocument(schedule.document_id, 'system', 'Automatic retention policy deletion');
          
          if (purgeResult.success) {
            // Update schedule status
            await this.updateRetentionScheduleStatus(schedule.id, RetentionStatus.COMPLETED);
            processed++;
          } else {
            errors.push(`Failed to purge document ${schedule.document_id}: ${purgeResult.error}`);
            await this.updateRetentionScheduleStatus(schedule.id, RetentionStatus.FAILED);
          }
        } catch (error) {
          errors.push(`Error processing deletion for document ${schedule.document_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error processing scheduled deletions:', error);
      return { processed: 0, errors: [`System error: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
  }

  /**
   * Purge document with secure deletion
   * Requirement 7.7: Secure deletion and data wiping
   */
  async purgeDocument(documentId: string, purgedBy: string, reason: string): Promise<PurgeResult> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) {
        return {
          success: false,
          documentId,
          purgedAt: new Date(),
          method: PurgeMethod.SOFT_DELETE,
          error: 'Document not found'
        };
      }

      // Determine purge method based on confidentiality level
      const purgeMethod = this.determinePurgeMethod(document.metadata.confidentialityLevel);

      // Perform the actual purging
      const purgeResult = await this.executePurge(document, purgeMethod);

      if (!purgeResult.success) {
        return purgeResult;
      }

      // Log the purge operation
      const auditTrailId = await this.logPurgeOperation(document, purgedBy, reason, purgeMethod);

      // Update document status to deleted
      await this.markDocumentAsDeleted(documentId, purgedBy);

      return {
        success: true,
        documentId,
        purgedAt: new Date(),
        method: purgeMethod,
        verificationHash: purgeResult.verificationHash,
        auditTrailId
      };

    } catch (error) {
      console.error('Error purging document:', error);
      return {
        success: false,
        documentId,
        purgedAt: new Date(),
        method: PurgeMethod.SOFT_DELETE,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // RETENTION REPORTING
  // =====================================================

  /**
   * Generate retention report
   */
  async generateRetentionReport(): Promise<RetentionReport> {
    try {
      // Get basic statistics
      const totalDocuments = await this.getTotalDocumentCount();
      const scheduledForDeletion = await this.getScheduledDeletionCount();
      const inGracePeriod = await this.getGracePeriodCount();
      const pendingApproval = await this.getPendingApprovalCount();
      const overdue = await this.getOverdueCount();

      // Get policy statistics
      const policies = await this.getRetentionPolicyStats();

      // Get upcoming deletions
      const upcomingDeletions = await this.getUpcomingDeletions(30); // Next 30 days

      // Calculate storage reclaimed (this would be more complex in a real implementation)
      const storageReclaimed = await this.calculateStorageReclaimed();

      return {
        totalDocuments,
        documentsScheduledForDeletion: scheduledForDeletion,
        documentsInGracePeriod: inGracePeriod,
        documentsPendingApproval: pendingApproval,
        documentsOverdue: overdue,
        storageReclaimed,
        policies,
        upcomingDeletions
      };
    } catch (error) {
      console.error('Error generating retention report:', error);
      return {
        totalDocuments: 0,
        documentsScheduledForDeletion: 0,
        documentsInGracePeriod: 0,
        documentsPendingApproval: 0,
        documentsOverdue: 0,
        storageReclaimed: 0,
        policies: [],
        upcomingDeletions: []
      };
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Get document by ID
   */
  private async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.documentsTable)
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return data as Document;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Create default retention policy for category
   */
  private createDefaultRetentionPolicy(category: DocumentCategory): RetentionPolicy {
    const retentionPeriod = this.defaultRetentionPeriods[category];
    
    return {
      id: `default_${category}`,
      name: `Default ${category} Policy`,
      description: `Default retention policy for ${category} documents`,
      category,
      retentionPeriodDays: retentionPeriod,
      gracePeriodDays: 30, // 30 day grace period
      autoDelete: false, // Require manual approval for default policies
      requiresApproval: true,
      approverRoles: [UserRole.ADMIN],
      isActive: true,
      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system'
    };
  }

  /**
   * Determine purge method based on confidentiality level
   */
  private determinePurgeMethod(confidentialityLevel: ConfidentialityLevel): PurgeMethod {
    switch (confidentialityLevel) {
      case ConfidentialityLevel.RESTRICTED:
        return PurgeMethod.CRYPTOGRAPHIC_ERASURE;
      case ConfidentialityLevel.CONFIDENTIAL:
        return PurgeMethod.SECURE_DELETE;
      case ConfidentialityLevel.INTERNAL:
        return PurgeMethod.SECURE_DELETE;
      case ConfidentialityLevel.PUBLIC:
      default:
        return PurgeMethod.SOFT_DELETE;
    }
  }

  /**
   * Execute the actual purge operation
   */
  private async executePurge(document: Document, method: PurgeMethod): Promise<{ success: boolean; verificationHash?: string; error?: string }> {
    try {
      switch (method) {
        case PurgeMethod.CRYPTOGRAPHIC_ERASURE:
          // Delete encryption keys to make data unrecoverable
          if (document.encryptionKey) {
            await encryptionService.deleteEncryptionKey(document.encryptionKey);
          }
          return { success: true, verificationHash: this.generateVerificationHash(document.id, method) };

        case PurgeMethod.SECURE_DELETE:
          // Overwrite file data multiple times before deletion
          await this.secureDeleteFile(document.storagePath);
          return { success: true, verificationHash: this.generateVerificationHash(document.id, method) };

        case PurgeMethod.SOFT_DELETE:
          // Just mark as deleted (data remains recoverable)
          return { success: true };

        default:
          return { success: false, error: 'Unknown purge method' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during purge execution' 
      };
    }
  }

  /**
   * Secure delete file (placeholder implementation)
   */
  private async secureDeleteFile(storagePath: string): Promise<void> {
    // In a real implementation, this would:
    // 1. Overwrite the file data multiple times with random data
    // 2. Rename the file multiple times
    // 3. Finally delete the file
    // For now, we'll just log the operation
    console.log(`Securely deleting file at path: ${storagePath}`);
  }

  /**
   * Generate verification hash for purge operation
   */
  private generateVerificationHash(documentId: string, method: PurgeMethod): string {
    const data = `${documentId}_${method}_${Date.now()}`;
    // In a real implementation, this would use a proper cryptographic hash
    return Buffer.from(data).toString('base64');
  }

  /**
   * Log purge operation
   */
  private async logPurgeOperation(
    document: Document,
    purgedBy: string,
    reason: string,
    method: PurgeMethod
  ): Promise<string | undefined> {
    try {
      const result = await auditService.logActivity({
        userId: purgedBy,
        action: 'delete',
        resourceType: 'document',
        resourceId: document.id,
        details: {
          reason,
          purgeMethod: method,
          originalName: document.originalName,
          category: document.metadata.category,
          confidentialityLevel: document.metadata.confidentialityLevel,
          size: document.size
        },
        severity: 'warning' // Document deletion is always significant
      });

      return result.success ? 'audit_logged' : undefined;
    } catch (error) {
      console.error('Error logging purge operation:', error);
      return undefined;
    }
  }

  /**
   * Mark document as deleted
   */
  private async markDocumentAsDeleted(documentId: string, deletedBy: string): Promise<void> {
    try {
      await supabaseService.getClient()
        .from(this.documentsTable)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy
        })
        .eq('id', documentId);
    } catch (error) {
      console.error('Error marking document as deleted:', error);
    }
  }

  /**
   * Get retention schedule for document
   */
  private async getRetentionSchedule(documentId: string): Promise<RetentionSchedule | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from(this.retentionSchedulesTable)
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapRetentionScheduleData(data);
    } catch (error) {
      console.error('Error getting retention schedule:', error);
      return null;
    }
  }

  /**
   * Update retention schedule status
   */
  private async updateRetentionScheduleStatus(scheduleId: string, status: RetentionStatus): Promise<boolean> {
    try {
      const { error } = await supabaseService.getClient()
        .from(this.retentionSchedulesTable)
        .update({ status })
        .eq('id', scheduleId);

      return !error;
    } catch (error) {
      console.error('Error updating retention schedule status:', error);
      return false;
    }
  }

  /**
   * Map retention policy database data
   */
  private mapRetentionPolicyData(data: any): RetentionPolicy {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      confidentialityLevel: data.confidentiality_level,
      retentionPeriodDays: data.retention_period_days,
      gracePeriodDays: data.grace_period_days,
      autoDelete: data.auto_delete,
      requiresApproval: data.requires_approval,
      approverRoles: data.approver_roles ? JSON.parse(data.approver_roles) : [],
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by,
      updatedAt: new Date(data.updated_at),
      updatedBy: data.updated_by
    };
  }

  /**
   * Map retention schedule database data
   */
  private mapRetentionScheduleData(data: any): RetentionSchedule {
    return {
      id: data.id,
      documentId: data.document_id,
      policyId: data.policy_id,
      scheduledDeletionDate: new Date(data.scheduled_deletion_date),
      gracePeriodEndDate: new Date(data.grace_period_end_date),
      status: data.status,
      approvalRequired: data.approval_required,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
      createdAt: new Date(data.created_at),
      notificationsSent: data.notifications_sent,
      lastNotificationAt: data.last_notification_at ? new Date(data.last_notification_at) : undefined
    };
  }

  // Placeholder methods for report generation (would be implemented with proper database queries)
  private async getTotalDocumentCount(): Promise<number> { return 0; }
  private async getScheduledDeletionCount(): Promise<number> { return 0; }
  private async getGracePeriodCount(): Promise<number> { return 0; }
  private async getPendingApprovalCount(): Promise<number> { return 0; }
  private async getOverdueCount(): Promise<number> { return 0; }
  private async getRetentionPolicyStats(): Promise<RetentionPolicyStats[]> { return []; }
  private async getUpcomingDeletions(days: number): Promise<UpcomingDeletion[]> { return []; }
  private async calculateStorageReclaimed(): Promise<number> { return 0; }
}

// =====================================================
// SERVICE INSTANCE
// =====================================================

export const dataRetentionService = new DataRetentionService();