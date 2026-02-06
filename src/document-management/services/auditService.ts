/**
 * Document Management System - Audit Service
 * 
 * Provides comprehensive audit logging with activity logging for all document operations,
 * audit trail generation and storage, and compliance reporting capabilities.
 * 
 * Requirements: 7.3, 7.6
 */

import { supabaseService } from './supabaseService';
import type { 
  AuditTrail,
  SecurityEvent,
  ComplianceReport,
  ComplianceFinding,
  AccessAttempt
} from '../../../types/document-management';

// Audit interfaces
export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userName?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details: AuditDetails;
  severity: AuditSeverity;
  category: AuditCategory;
  outcome: AuditOutcome;
  duration?: number; // in milliseconds
  metadata?: Record<string, any>;
}

export interface AuditDetails {
  before?: any; // Previous state
  after?: any;  // New state
  changes?: AuditChange[];
  reason?: string;
  context?: string;
  relatedEntities?: RelatedEntity[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceFlags?: string[];
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}

export interface RelatedEntity {
  type: string;
  id: string;
  name?: string;
  relationship: string;
}

export interface AuditQuery {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  dateRange?: {
    from: Date;
    to: Date;
  };
  ipAddress?: string;
  sessionId?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStatistics {
  totalEntries: number;
  entriesByAction: Record<AuditAction, number>;
  entriesByCategory: Record<AuditCategory, number>;
  entriesBySeverity: Record<AuditSeverity, number>;
  entriesByOutcome: Record<AuditOutcome, number>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  topEntities: Array<{ entityType: string; entityId: string; count: number }>;
  timeDistribution: Array<{ date: string; count: number }>;
  riskDistribution: Record<string, number>;
}

export interface ComplianceReportRequest {
  type: ComplianceReportType;
  title: string;
  description?: string;
  period: {
    from: Date;
    to: Date;
  };
  scope?: {
    entityTypes?: string[];
    userIds?: string[];
    categories?: AuditCategory[];
  };
  includeDetails?: boolean;
  format?: 'json' | 'csv' | 'pdf';
}

export interface SecurityEventRequest {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  entityType?: string;
  entityId?: string;
  description: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}
export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  SHARE = 'share',
  UNSHARE = 'unshare',
  COMMENT = 'comment',
  SIGN = 'sign',
  APPROVE = 'approve',
  REJECT = 'reject',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  RESTORE = 'restore',
  ARCHIVE = 'archive',
  PURGE = 'purge',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  EXPORT = 'export',
  IMPORT = 'import',
  BACKUP = 'backup',
  RESTORE_BACKUP = 'restore_backup'
}

export enum AuditCategory {
  DOCUMENT_MANAGEMENT = 'document_management',
  ACCESS_CONTROL = 'access_control',
  AUTHENTICATION = 'authentication',
  COLLABORATION = 'collaboration',
  WORKFLOW = 'workflow',
  SIGNATURE = 'signature',
  TEMPLATE = 'template',
  VERSION_CONTROL = 'version_control',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  SYSTEM = 'system',
  DATA_MANAGEMENT = 'data_management'
}

export enum AuditSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
  DENIED = 'denied',
  ERROR = 'error'
}

export enum ComplianceReportType {
  ACCESS_LOG = 'access_log',
  PERMISSION_AUDIT = 'permission_audit',
  DATA_RETENTION = 'data_retention',
  SECURITY_ASSESSMENT = 'security_assessment',
  USER_ACTIVITY = 'user_activity',
  DOCUMENT_LIFECYCLE = 'document_lifecycle',
  COMPLIANCE_VIOLATIONS = 'compliance_violations'
}

export enum SecurityEventType {
  LOGIN_FAILURE = 'login_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH = 'data_breach',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  MALWARE_DETECTION = 'malware_detection',
  SYSTEM_COMPROMISE = 'system_compromise'
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Service operation results
export interface AuditResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

export interface AuditEntryResult extends AuditResult {
  entry?: AuditEntry;
}

export interface AuditListResult extends AuditResult {
  entries?: AuditEntry[];
  totalCount?: number;
  statistics?: AuditStatistics;
}

export interface ComplianceReportResult extends AuditResult {
  report?: ComplianceReport;
}

export interface SecurityEventResult extends AuditResult {
  event?: SecurityEvent;
}
export class AuditService {
  private readonly RETENTION_DAYS = 2555; // 7 years for legal compliance
  private readonly BATCH_SIZE = 1000;
  private readonly MAX_DETAIL_SIZE = 10000; // Max characters for details

  /**
   * Create an audit entry for any system activity
   */
  async createAuditEntry(
    entityType: string,
    entityId: string,
    action: AuditAction,
    details: Partial<AuditDetails>,
    userId?: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      severity?: AuditSeverity;
      category?: AuditCategory;
      outcome?: AuditOutcome;
      duration?: number;
    }
  ): Promise<AuditEntryResult> {
    try {
      // Get user information if userId provided
      let userName: string | undefined;
      if (userId) {
        const userResult = await this.getUserInfo(userId);
        userName = userResult?.name;
      }

      // Determine category based on entity type and action
      const category = options?.category || this.determineCategory(entityType, action);
      
      // Determine severity based on action and details
      const severity = options?.severity || this.determineSeverity(action, details);
      
      // Determine outcome
      const outcome = options?.outcome || AuditOutcome.SUCCESS;

      // Sanitize and limit details size
      const sanitizedDetails = this.sanitizeDetails(details);

      // Create audit entry
      const auditData = {
        entity_type: entityType,
        entity_id: entityId,
        action,
        user_id: userId,
        user_name: userName,
        timestamp: new Date().toISOString(),
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        session_id: options?.sessionId,
        details: sanitizedDetails,
        severity,
        category,
        outcome,
        duration: options?.duration,
        metadata: {
          source: 'document_management_system',
          version: '1.0.0'
        }
      };

      const createResult = await supabaseService.insert('audit_entries', auditData);
      if (!createResult.success) {
        return {
          success: false,
          error: `Failed to create audit entry: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Check for security events
      await this.checkForSecurityEvents(auditData);

      // Check for compliance violations
      await this.checkForComplianceViolations(auditData);

      const entry = this.mapDatabaseRecordToAuditEntry(createResult.data);

      return {
        success: true,
        entry
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create audit entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Query audit entries with filtering and pagination
   */
  async queryAuditEntries(query: AuditQuery): Promise<AuditListResult> {
    try {
      const filters: any = {};
      
      if (query.entityType) filters.entity_type = query.entityType;
      if (query.entityId) filters.entity_id = query.entityId;
      if (query.userId) filters.user_id = query.userId;
      if (query.action) filters.action = query.action;
      if (query.category) filters.category = query.category;
      if (query.severity) filters.severity = query.severity;
      if (query.outcome) filters.outcome = query.outcome;
      if (query.ipAddress) filters.ip_address = query.ipAddress;
      if (query.sessionId) filters.session_id = query.sessionId;
      
      if (query.dateRange) {
        filters.timestamp = {
          gte: query.dateRange.from.toISOString(),
          lte: query.dateRange.to.toISOString()
        };
      }

      // Text search across multiple fields
      if (query.searchText) {
        filters.or = [
          { user_name: { ilike: `%${query.searchText}%` } },
          { 'details->reason': { ilike: `%${query.searchText}%` } },
          { 'details->context': { ilike: `%${query.searchText}%` } }
        ];
      }

      const queryOptions = {
        filters,
        limit: query.limit || 100,
        offset: query.offset || 0,
        sortBy: query.sortBy || 'timestamp',
        sortOrder: query.sortOrder || 'desc'
      };

      const result = await supabaseService.query('audit_entries', queryOptions);
      if (!result.success) {
        return {
          success: false,
          error: `Failed to query audit entries: ${result.error?.message || 'Unknown error'}`
        };
      }

      const entries = (result.data || []).map(record => 
        this.mapDatabaseRecordToAuditEntry(record)
      );

      // Generate statistics if requested
      let statistics: AuditStatistics | undefined;
      if (query.limit === undefined || query.limit > 50) {
        statistics = await this.generateAuditStatistics(query);
      }

      return {
        success: true,
        entries,
        totalCount: result.count,
        statistics
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to query audit entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    options?: {
      includeRelated?: boolean;
      dateRange?: { from: Date; to: Date };
      limit?: number;
    }
  ): Promise<AuditListResult> {
    try {
      const query: AuditQuery = {
        entityType,
        entityId,
        dateRange: options?.dateRange,
        limit: options?.limit || 100,
        sortBy: 'timestamp',
        sortOrder: 'asc'
      };

      const result = await this.queryAuditEntries(query);
      
      if (!result.success) {
        return result;
      }

      // Include related entities if requested
      if (options?.includeRelated && result.entries) {
        const relatedEntries = await this.getRelatedAuditEntries(result.entries);
        result.entries = [...result.entries, ...relatedEntries];
        
        // Re-sort by timestamp
        result.entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: `Failed to get entity audit trail: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(request: ComplianceReportRequest): Promise<ComplianceReportResult> {
    try {
      // Query relevant audit entries
      const query: AuditQuery = {
        dateRange: request.period,
        limit: 10000 // Large limit for comprehensive reporting
      };

      // Apply scope filters
      if (request.scope?.entityTypes?.length) {
        query.entityType = request.scope.entityTypes[0];
      }

      if (request.scope?.userIds?.length) {
        query.userId = request.scope.userIds[0];
      }

      if (request.scope?.categories?.length) {
        query.category = request.scope.categories[0];
      }

      const auditResult = await this.queryAuditEntries(query);
      if (!auditResult.success) {
        return {
          success: false,
          error: `Failed to query audit data: ${auditResult.error}`
        };
      }

      // Analyze audit entries for compliance
      const findings = await this.analyzeComplianceFindings(
        auditResult.entries || [],
        request.type
      );

      // Generate report data
      const reportData = {
        summary: {
          totalEntries: auditResult.totalCount || 0,
          period: request.period,
          scope: request.scope,
          findingsCount: findings.length,
          criticalFindings: findings.filter(f => f.severity === 'critical').length,
          highFindings: findings.filter(f => f.severity === 'high').length
        },
        auditEntries: request.includeDetails ? auditResult.entries : undefined,
        statistics: auditResult.statistics,
        complianceMetrics: this.calculateComplianceMetrics(auditResult.entries || [])
      };

      // Create compliance report record
      const reportRecord = {
        type: request.type,
        title: request.title,
        description: request.description,
        period_from: request.period.from.toISOString(),
        period_to: request.period.to.toISOString(),
        generated_at: new Date().toISOString(),
        generated_by: 'system', // Could be passed as parameter
        data: reportData,
        findings: findings,
        status: 'final'
      };

      const createResult = await supabaseService.insert('compliance_reports', reportRecord);
      if (!createResult.success) {
        return {
          success: false,
          error: `Failed to create compliance report: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      const report = this.mapDatabaseRecordToComplianceReport(createResult.data);

      return {
        success: true,
        report
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create security event
   */
  async createSecurityEvent(request: SecurityEventRequest): Promise<SecurityEventResult> {
    try {
      const eventData = {
        type: request.type,
        severity: request.severity,
        user_id: request.userId,
        entity_type: request.entityType,
        entity_id: request.entityId,
        description: request.description,
        details: request.details,
        timestamp: new Date().toISOString(),
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        session_id: request.sessionId,
        resolved: false
      };

      const createResult = await supabaseService.insert('security_events', eventData);
      if (!createResult.success) {
        return {
          success: false,
          error: `Failed to create security event: ${createResult.error?.message || 'Unknown error'}`
        };
      }

      // Create corresponding audit entry
      await this.createAuditEntry(
        'security_event',
        createResult.data.id,
        AuditAction.CREATE,
        {
          reason: 'Security event detected',
          context: request.description,
          riskLevel: this.mapSeverityToRiskLevel(request.severity)
        },
        request.userId,
        {
          severity: this.mapSecuritySeverityToAuditSeverity(request.severity),
          category: AuditCategory.SECURITY,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          sessionId: request.sessionId
        }
      );

      const event = this.mapDatabaseRecordToSecurityEvent(createResult.data);

      return {
        success: true,
        event
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create security event: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  /**
   * Log document access attempt
   */
  async logDocumentAccess(
    documentId: string,
    userId: string,
    action: AuditAction,
    outcome: AuditOutcome,
    details?: {
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      permissions?: string[];
    }
  ): Promise<AuditResult> {
    const auditDetails: Partial<AuditDetails> = {
      reason: details?.reason,
      context: `Document ${action} attempt`,
      metadata: {
        permissions: details?.permissions
      }
    };

    return this.createAuditEntry(
      'document',
      documentId,
      action,
      auditDetails,
      userId,
      {
        ipAddress: details?.ipAddress,
        userAgent: details?.userAgent,
        sessionId: details?.sessionId,
        category: AuditCategory.DOCUMENT_MANAGEMENT,
        outcome,
        severity: outcome === AuditOutcome.DENIED ? AuditSeverity.MEDIUM : AuditSeverity.INFO
      }
    );
  }

  /**
   * General activity logging method for easy use by other services
   * Requirements: 7.3 - Activity logging for all document operations
   */
  async logActivity(params: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    outcome?: 'success' | 'failure' | 'denied';
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }): Promise<AuditResult> {
    // Map string values to enum values
    const auditAction = this.mapStringToAuditAction(params.action);
    const auditOutcome = this.mapStringToAuditOutcome(params.outcome || 'success');
    const auditSeverity = this.mapStringToAuditSeverity(params.severity || 'info');

    const auditDetails: Partial<AuditDetails> = {
      context: `${params.resourceType} ${params.action}`,
      metadata: params.details
    };

    return this.createAuditEntry(
      params.resourceType,
      params.resourceId,
      auditAction,
      auditDetails,
      params.userId,
      {
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        outcome: auditOutcome,
        severity: auditSeverity,
        category: this.determineCategory(params.resourceType, auditAction)
      }
    );
  }

  /**
   * Clean up old audit entries based on retention policy
   */
  async cleanupOldAuditEntries(): Promise<AuditResult> {
    try {
      const retentionDate = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);

      // Archive old entries before deletion (optional)
      const archiveResult = await this.archiveOldEntries(retentionDate);
      if (!archiveResult.success) {
        return {
          success: false,
          error: `Failed to archive old entries: ${archiveResult.error}`
        };
      }

      // Delete old entries
      const deleteResult = await supabaseService.query('audit_entries', {
        filters: {
          timestamp: { lt: retentionDate.toISOString() }
        },
        delete: true
      });

      if (!deleteResult.success) {
        return {
          success: false,
          error: `Failed to delete old audit entries: ${deleteResult.error?.message || 'Unknown error'}`
        };
      }

      return {
        success: true,
        warnings: [`Cleaned up audit entries older than ${retentionDate.toISOString()}`]
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup old audit entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get user information for audit entries
   */
  private async getUserInfo(userId: string): Promise<{ name: string } | null> {
    try {
      // This would integrate with user service
      // For now, return mock data
      return { name: `User ${userId}` };
    } catch (error) {
      return null;
    }
  }

  /**
   * Determine audit category based on entity type and action
   */
  private determineCategory(entityType: string, action: AuditAction): AuditCategory {
    if (entityType === 'document') {
      return AuditCategory.DOCUMENT_MANAGEMENT;
    }
    
    if (entityType === 'user' || action === AuditAction.LOGIN || action === AuditAction.LOGOUT) {
      return AuditCategory.AUTHENTICATION;
    }
    
    if (action === AuditAction.SHARE || action === AuditAction.PERMISSION_GRANT) {
      return AuditCategory.ACCESS_CONTROL;
    }
    
    if (entityType === 'template') {
      return AuditCategory.TEMPLATE;
    }
    
    if (entityType === 'version') {
      return AuditCategory.VERSION_CONTROL;
    }
    
    if (entityType === 'signature' || action === AuditAction.SIGN) {
      return AuditCategory.SIGNATURE;
    }
    
    return AuditCategory.SYSTEM;
  }

  /**
   * Determine audit severity based on action and details
   */
  private determineSeverity(action: AuditAction, details: Partial<AuditDetails>): AuditSeverity {
    // Critical actions
    if ([AuditAction.DELETE, AuditAction.PURGE, AuditAction.ACCESS_DENIED].includes(action)) {
      return AuditSeverity.HIGH;
    }
    
    // Medium risk actions
    if ([AuditAction.SHARE, AuditAction.PERMISSION_GRANT, AuditAction.EXPORT].includes(action)) {
      return AuditSeverity.MEDIUM;
    }
    
    // Check risk level in details
    if (details.riskLevel === 'critical') return AuditSeverity.CRITICAL;
    if (details.riskLevel === 'high') return AuditSeverity.HIGH;
    if (details.riskLevel === 'medium') return AuditSeverity.MEDIUM;
    if (details.riskLevel === 'low') return AuditSeverity.LOW;
    
    return AuditSeverity.INFO;
  }
  /**
   * Sanitize audit details to prevent data leakage and limit size
   */
  private sanitizeDetails(details: Partial<AuditDetails>): AuditDetails {
    const sanitized: AuditDetails = {
      reason: details.reason,
      context: details.context,
      riskLevel: details.riskLevel,
      complianceFlags: details.complianceFlags
    };

    // Sanitize before/after data (remove sensitive fields)
    if (details.before) {
      sanitized.before = this.sanitizeObject(details.before);
    }
    
    if (details.after) {
      sanitized.after = this.sanitizeObject(details.after);
    }

    // Include changes if provided
    if (details.changes) {
      sanitized.changes = details.changes.map(change => ({
        ...change,
        oldValue: this.sanitizeValue(change.oldValue),
        newValue: this.sanitizeValue(change.newValue)
      }));
    }

    // Include related entities
    if (details.relatedEntities) {
      sanitized.relatedEntities = details.relatedEntities;
    }

    // Limit total size
    const serialized = JSON.stringify(sanitized);
    if (serialized.length > this.MAX_DETAIL_SIZE) {
      sanitized.context = `${sanitized.context || ''} [Details truncated due to size]`;
      delete sanitized.before;
      delete sanitized.after;
    }

    return sanitized;
  }

  /**
   * Sanitize object by removing sensitive fields
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveFields = ['password', 'token', 'key', 'secret', 'encryptionKey'];
    const sanitized = { ...obj };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize individual values
   */
  private sanitizeValue(value: any): any {
    if (typeof value === 'string' && value.length > 1000) {
      return value.substring(0, 1000) + '...[truncated]';
    }
    return value;
  }

  /**
   * Check for security events in audit data
   */
  private async checkForSecurityEvents(auditData: any): Promise<void> {
    try {
      // Check for suspicious patterns
      if (auditData.outcome === AuditOutcome.DENIED) {
        // Multiple failed access attempts
        const recentFailures = await this.countRecentFailures(
          auditData.user_id,
          auditData.ip_address
        );
        
        if (recentFailures >= 5) {
          await this.createSecurityEvent({
            type: SecurityEventType.SUSPICIOUS_ACTIVITY,
            severity: SecurityEventSeverity.MEDIUM,
            userId: auditData.user_id,
            description: `Multiple failed access attempts detected`,
            details: {
              failureCount: recentFailures,
              ipAddress: auditData.ip_address,
              timeWindow: '15 minutes'
            },
            ipAddress: auditData.ip_address,
            userAgent: auditData.user_agent,
            sessionId: auditData.session_id
          });
        }
      }

      // Check for privilege escalation
      if (auditData.action === AuditAction.PERMISSION_GRANT && 
          auditData.details?.changes?.some((c: any) => c.field === 'permissions')) {
        
        const permissionChanges = auditData.details.changes.filter((c: any) => c.field === 'permissions');
        const hasElevatedPermissions = permissionChanges.some((c: any) => 
          c.newValue?.includes('admin') || c.newValue?.includes('delete')
        );

        if (hasElevatedPermissions) {
          await this.createSecurityEvent({
            type: SecurityEventType.PRIVILEGE_ESCALATION,
            severity: SecurityEventSeverity.HIGH,
            userId: auditData.user_id,
            entityType: auditData.entity_type,
            entityId: auditData.entity_id,
            description: 'Elevated permissions granted',
            details: {
              permissionChanges,
              grantedBy: auditData.user_id
            },
            ipAddress: auditData.ip_address
          });
        }
      }

    } catch (error) {
      console.error('Failed to check for security events:', error);
    }
  }

  /**
   * Check for compliance violations
   */
  private async checkForComplianceViolations(auditData: any): Promise<void> {
    try {
      // Check for data retention violations
      if (auditData.action === AuditAction.DELETE && 
          auditData.entity_type === 'document') {
        
        // Check if document is within retention period
        const documentAge = await this.getDocumentAge(auditData.entity_id);
        const requiredRetentionDays = 2555; // 7 years for legal documents
        
        if (documentAge < requiredRetentionDays) {
          await this.createSecurityEvent({
            type: SecurityEventType.COMPLIANCE_VIOLATION,
            severity: SecurityEventSeverity.HIGH,
            userId: auditData.user_id,
            entityType: auditData.entity_type,
            entityId: auditData.entity_id,
            description: 'Document deleted before retention period expired',
            details: {
              documentAge,
              requiredRetentionDays,
              violation: 'premature_deletion'
            }
          });
        }
      }

      // Check for unauthorized access patterns
      if (auditData.action === AuditAction.READ && 
          auditData.details?.riskLevel === 'high') {
        
        await this.createSecurityEvent({
          type: SecurityEventType.COMPLIANCE_VIOLATION,
          severity: SecurityEventSeverity.MEDIUM,
          userId: auditData.user_id,
          entityType: auditData.entity_type,
          entityId: auditData.entity_id,
          description: 'Access to high-risk document without proper authorization',
          details: {
            riskLevel: auditData.details.riskLevel,
            violation: 'unauthorized_high_risk_access'
          }
        });
      }

    } catch (error) {
      console.error('Failed to check for compliance violations:', error);
    }
  }
  /**
   * Count recent failures for user/IP
   */
  private async countRecentFailures(userId?: string, ipAddress?: string): Promise<number> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const filters: any = {
        outcome: AuditOutcome.DENIED,
        timestamp: { gte: fifteenMinutesAgo.toISOString() }
      };

      if (userId) filters.user_id = userId;
      if (ipAddress) filters.ip_address = ipAddress;

      const result = await supabaseService.query('audit_entries', {
        filters,
        count: true
      });

      return result.count || 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Get document age in days
   */
  private async getDocumentAge(documentId: string): Promise<number> {
    try {
      const documentResult = await supabaseService.findById('documents', documentId);
      if (documentResult.success && documentResult.data) {
        const createdAt = new Date(documentResult.data.created_at);
        const now = new Date();
        return Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get related audit entries
   */
  private async getRelatedAuditEntries(entries: AuditEntry[]): Promise<AuditEntry[]> {
    const relatedEntries: AuditEntry[] = [];
    
    for (const entry of entries) {
      if (entry.details.relatedEntities) {
        for (const related of entry.details.relatedEntities) {
          const relatedResult = await this.queryAuditEntries({
            entityType: related.type,
            entityId: related.id,
            limit: 10
          });
          
          if (relatedResult.success && relatedResult.entries) {
            relatedEntries.push(...relatedResult.entries);
          }
        }
      }
    }
    
    return relatedEntries;
  }

  /**
   * Generate audit statistics
   */
  private async generateAuditStatistics(query: AuditQuery): Promise<AuditStatistics> {
    // This is a simplified implementation
    // In a real system, this would use database aggregation functions
    
    const stats: AuditStatistics = {
      totalEntries: 0,
      entriesByAction: {} as Record<AuditAction, number>,
      entriesByCategory: {} as Record<AuditCategory, number>,
      entriesBySeverity: {} as Record<AuditSeverity, number>,
      entriesByOutcome: {} as Record<AuditOutcome, number>,
      topUsers: [],
      topEntities: [],
      timeDistribution: [],
      riskDistribution: {}
    };

    // Initialize counters
    Object.values(AuditAction).forEach(action => {
      stats.entriesByAction[action] = 0;
    });
    
    Object.values(AuditCategory).forEach(category => {
      stats.entriesByCategory[category] = 0;
    });
    
    Object.values(AuditSeverity).forEach(severity => {
      stats.entriesBySeverity[severity] = 0;
    });
    
    Object.values(AuditOutcome).forEach(outcome => {
      stats.entriesByOutcome[outcome] = 0;
    });

    return stats;
  }

  /**
   * Analyze compliance findings
   */
  private async analyzeComplianceFindings(
    entries: AuditEntry[],
    reportType: ComplianceReportType
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Analyze based on report type
    switch (reportType) {
      case ComplianceReportType.ACCESS_LOG:
        findings.push(...this.analyzeAccessLogCompliance(entries));
        break;
      
      case ComplianceReportType.PERMISSION_AUDIT:
        findings.push(...this.analyzePermissionCompliance(entries));
        break;
      
      case ComplianceReportType.SECURITY_ASSESSMENT:
        findings.push(...this.analyzeSecurityCompliance(entries));
        break;
      
      default:
        findings.push(...this.analyzeGeneralCompliance(entries));
    }

    return findings;
  }
  /**
   * Analyze access log compliance
   */
  private analyzeAccessLogCompliance(entries: AuditEntry[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    
    // Check for excessive failed access attempts
    const failedAccess = entries.filter(e => e.outcome === AuditOutcome.DENIED);
    if (failedAccess.length > 100) {
      findings.push({
        id: `finding-${Date.now()}-1`,
        type: 'violation',
        severity: 'high',
        title: 'Excessive Failed Access Attempts',
        description: `${failedAccess.length} failed access attempts detected`,
        evidence: failedAccess.slice(0, 10).map(e => e.id),
        recommendation: 'Review access controls and implement account lockout policies',
        status: 'open'
      });
    }

    return findings;
  }

  /**
   * Analyze permission compliance
   */
  private analyzePermissionCompliance(entries: AuditEntry[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    
    // Check for permission grants without proper approval
    const permissionGrants = entries.filter(e => e.action === AuditAction.PERMISSION_GRANT);
    const unapprovedGrants = permissionGrants.filter(e => 
      !e.details.reason || e.details.reason.length < 10
    );
    
    if (unapprovedGrants.length > 0) {
      findings.push({
        id: `finding-${Date.now()}-2`,
        type: 'violation',
        severity: 'medium',
        title: 'Permission Grants Without Proper Documentation',
        description: `${unapprovedGrants.length} permission grants lack proper justification`,
        evidence: unapprovedGrants.map(e => e.id),
        recommendation: 'Require detailed justification for all permission grants',
        status: 'open'
      });
    }

    return findings;
  }

  /**
   * Analyze security compliance
   */
  private analyzeSecurityCompliance(entries: AuditEntry[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    
    // Check for high-risk activities
    const highRiskEntries = entries.filter(e => 
      e.severity === AuditSeverity.HIGH || e.severity === AuditSeverity.CRITICAL
    );
    
    if (highRiskEntries.length > 50) {
      findings.push({
        id: `finding-${Date.now()}-3`,
        type: 'risk',
        severity: 'high',
        title: 'High Volume of High-Risk Activities',
        description: `${highRiskEntries.length} high-risk activities detected`,
        evidence: highRiskEntries.slice(0, 10).map(e => e.id),
        recommendation: 'Review and strengthen security controls',
        status: 'open'
      });
    }

    return findings;
  }

  /**
   * Analyze general compliance
   */
  private analyzeGeneralCompliance(entries: AuditEntry[]): ComplianceFinding[] {
    const findings: ComplianceFinding[] = [];
    
    // Check for missing audit entries (gaps in timeline)
    const sortedEntries = entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let gapCount = 0;
    
    for (let i = 1; i < sortedEntries.length; i++) {
      const timeDiff = sortedEntries[i].timestamp.getTime() - sortedEntries[i-1].timestamp.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 24) { // Gap of more than 24 hours
        gapCount++;
      }
    }
    
    if (gapCount > 5) {
      findings.push({
        id: `finding-${Date.now()}-4`,
        type: 'observation',
        severity: 'low',
        title: 'Gaps in Audit Trail',
        description: `${gapCount} significant gaps detected in audit trail`,
        evidence: [],
        recommendation: 'Investigate potential audit logging issues',
        status: 'open'
      });
    }

    return findings;
  }

  /**
   * Calculate compliance metrics
   */
  private calculateComplianceMetrics(entries: AuditEntry[]): Record<string, any> {
    const total = entries.length;
    if (total === 0) return {};

    return {
      totalActivities: total,
      successRate: entries.filter(e => e.outcome === AuditOutcome.SUCCESS).length / total,
      failureRate: entries.filter(e => e.outcome === AuditOutcome.FAILURE).length / total,
      deniedRate: entries.filter(e => e.outcome === AuditOutcome.DENIED).length / total,
      highRiskActivities: entries.filter(e => 
        e.severity === AuditSeverity.HIGH || e.severity === AuditSeverity.CRITICAL
      ).length,
      complianceScore: this.calculateComplianceScore(entries)
    };
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(entries: AuditEntry[]): number {
    if (entries.length === 0) return 100;

    let score = 100;
    
    // Deduct points for failures and denials
    const failures = entries.filter(e => e.outcome === AuditOutcome.FAILURE).length;
    const denials = entries.filter(e => e.outcome === AuditOutcome.DENIED).length;
    
    score -= (failures / entries.length) * 20; // Max 20 points for failures
    score -= (denials / entries.length) * 30;  // Max 30 points for denials
    
    // Deduct points for high-risk activities
    const highRisk = entries.filter(e => 
      e.severity === AuditSeverity.HIGH || e.severity === AuditSeverity.CRITICAL
    ).length;
    
    score -= (highRisk / entries.length) * 25; // Max 25 points for high-risk
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Archive old audit entries
   */
  private async archiveOldEntries(beforeDate: Date): Promise<AuditResult> {
    try {
      // In a real implementation, this would export entries to long-term storage
      // For now, we'll just log the operation
      console.log(`Archiving audit entries before ${beforeDate.toISOString()}`);
      
      return {
        success: true,
        warnings: ['Archive operation completed (mock implementation)']
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to archive entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  /**
   * Map severity levels
   */
  private mapSeverityToRiskLevel(severity: SecurityEventSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case SecurityEventSeverity.LOW: return 'low';
      case SecurityEventSeverity.MEDIUM: return 'medium';
      case SecurityEventSeverity.HIGH: return 'high';
      case SecurityEventSeverity.CRITICAL: return 'critical';
      default: return 'medium';
    }
  }

  /**
   * Map security severity to audit severity
   */
  private mapSecuritySeverityToAuditSeverity(severity: SecurityEventSeverity): AuditSeverity {
    switch (severity) {
      case SecurityEventSeverity.LOW: return AuditSeverity.LOW;
      case SecurityEventSeverity.MEDIUM: return AuditSeverity.MEDIUM;
      case SecurityEventSeverity.HIGH: return AuditSeverity.HIGH;
      case SecurityEventSeverity.CRITICAL: return AuditSeverity.CRITICAL;
      default: return AuditSeverity.MEDIUM;
    }
  }

  /**
   * Map database record to AuditEntry interface
   */
  private mapDatabaseRecordToAuditEntry(record: any): AuditEntry {
    return {
      id: record.id,
      entityType: record.entity_type,
      entityId: record.entity_id,
      action: record.action,
      userId: record.user_id,
      userName: record.user_name,
      timestamp: new Date(record.timestamp),
      ipAddress: record.ip_address,
      userAgent: record.user_agent,
      sessionId: record.session_id,
      details: record.details,
      severity: record.severity,
      category: record.category,
      outcome: record.outcome,
      duration: record.duration,
      metadata: record.metadata
    };
  }

  /**
   * Map database record to ComplianceReport interface
   */
  private mapDatabaseRecordToComplianceReport(record: any): ComplianceReport {
    return {
      id: record.id,
      type: record.type,
      title: record.title,
      description: record.description,
      period: {
        from: new Date(record.period_from),
        to: new Date(record.period_to)
      },
      generatedAt: new Date(record.generated_at),
      generatedBy: record.generated_by,
      data: record.data,
      findings: record.findings,
      status: record.status
    };
  }

  /**
   * Map database record to SecurityEvent interface
   */
  private mapDatabaseRecordToSecurityEvent(record: any): SecurityEvent {
    return {
      id: record.id,
      type: record.type,
      severity: record.severity,
      userId: record.user_id,
      entityType: record.entity_type,
      entityId: record.entity_id,
      description: record.description,
      details: record.details,
      timestamp: new Date(record.timestamp),
      ipAddress: record.ip_address,
      resolved: record.resolved,
      resolvedAt: record.resolved_at ? new Date(record.resolved_at) : undefined,
      resolvedBy: record.resolved_by
    };
  }

  // =====================================================
  // HELPER METHODS FOR STRING TO ENUM MAPPING
  // =====================================================

  /**
   * Map string action to AuditAction enum
   */
  private mapStringToAuditAction(action: string): AuditAction {
    const actionMap: Record<string, AuditAction> = {
      'create': AuditAction.CREATE,
      'read': AuditAction.READ,
      'update': AuditAction.UPDATE,
      'delete': AuditAction.DELETE,
      'share': AuditAction.SHARE,
      'download': AuditAction.DOWNLOAD,
      'upload': AuditAction.UPLOAD,
      'sign': AuditAction.SIGN,
      'approve': AuditAction.APPROVE,
      'reject': AuditAction.REJECT,
      'comment': AuditAction.COMMENT,
      'version_create': AuditAction.VERSION_CREATE,
      'version_restore': AuditAction.VERSION_RESTORE,
      'permission_granted': AuditAction.PERMISSION_GRANT,
      'permission_revoked': AuditAction.PERMISSION_REVOKE,
      'privilege_granted': AuditAction.PERMISSION_GRANT,
      'bulk_permissions_granted': AuditAction.PERMISSION_GRANT,
      'all_permissions_revoked': AuditAction.PERMISSION_REVOKE,
      'login': AuditAction.LOGIN,
      'logout': AuditAction.LOGOUT,
      'backup': AuditAction.BACKUP,
      'restore_backup': AuditAction.RESTORE_BACKUP
    };

    return actionMap[action.toLowerCase()] || AuditAction.READ;
  }

  /**
   * Map string outcome to AuditOutcome enum
   */
  private mapStringToAuditOutcome(outcome: string): AuditOutcome {
    const outcomeMap: Record<string, AuditOutcome> = {
      'success': AuditOutcome.SUCCESS,
      'failure': AuditOutcome.FAILURE,
      'denied': AuditOutcome.DENIED,
      'error': AuditOutcome.ERROR
    };

    return outcomeMap[outcome.toLowerCase()] || AuditOutcome.SUCCESS;
  }

  /**
   * Map string severity to AuditSeverity enum
   */
  private mapStringToAuditSeverity(severity: string): AuditSeverity {
    const severityMap: Record<string, AuditSeverity> = {
      'info': AuditSeverity.INFO,
      'low': AuditSeverity.LOW,
      'warning': AuditSeverity.MEDIUM,
      'medium': AuditSeverity.MEDIUM,
      'error': AuditSeverity.HIGH,
      'high': AuditSeverity.HIGH,
      'critical': AuditSeverity.CRITICAL
    };

    return severityMap[severity.toLowerCase()] || AuditSeverity.INFO;
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;
