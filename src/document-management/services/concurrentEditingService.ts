/**
 * Document Management System - Concurrent Editing Service
 * 
 * Provides concurrent editing support with conflict detection and resolution,
 * real-time collaboration features, and document locking mechanisms.
 * 
 * Requirements: 5.3
 */

import { supabaseService } from './supabaseService';
import { versionControlService } from './versionControlService';
import type { 
  Document,
  DocumentVersion,
  AuditTrail
} from '../../../types/document-management';

// Concurrent editing interfaces
export interface EditSession {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  startedAt: Date;
  lastActivity: Date;
  isActive: boolean;
  lockType: LockType;
  lockRegion?: EditRegion;
  clientId: string; // unique client identifier for real-time sync
}

export interface EditRegion {
  startLine?: number;
  endLine?: number;
  startChar?: number;
  endChar?: number;
  section?: string; // named section identifier
}

export interface EditOperation {
  id: string;
  sessionId: string;
  documentId: string;
  type: OperationType;
  position: EditPosition;
  content?: string;
  length?: number;
  timestamp: Date;
  userId: string;
  sequenceNumber: number; // for operation ordering
}

export interface EditPosition {
  line: number;
  character: number;
  offset?: number; // absolute character offset
}

export interface ConflictDetection {
  hasConflicts: boolean;
  conflicts: EditConflict[];
  resolutionSuggestions: ConflictResolution[];
}

export interface EditConflict {
  id: string;
  type: ConflictType;
  operations: EditOperation[];
  affectedRegion: EditRegion;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  autoResolvable: boolean;
}

export interface ConflictResolution {
  conflictId: string;
  strategy: ResolutionStrategy;
  resultingContent: string;
  confidence: number; // 0-1 confidence in resolution
  requiresUserInput: boolean;
  description: string;
}

export interface DocumentLock {
  id: string;
  documentId: string;
  userId: string;
  lockType: LockType;
  region?: EditRegion;
  acquiredAt: Date;
  expiresAt: Date;
  isActive: boolean;
  reason?: string;
}

export interface CollaborationState {
  documentId: string;
  activeSessions: EditSession[];
  pendingOperations: EditOperation[];
  documentLocks: DocumentLock[];
  lastSyncAt: Date;
  conflictCount: number;
}

export enum LockType {
  EXCLUSIVE = 'exclusive', // Full document lock
  SHARED = 'shared', // Multiple readers, single writer
  REGION = 'region', // Lock specific region/section
  OPTIMISTIC = 'optimistic' // No lock, detect conflicts on save
}

export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  REPLACE = 'replace',
  MOVE = 'move',
  FORMAT = 'format'
}

export enum ConflictType {
  CONCURRENT_EDIT = 'concurrent_edit',
  OVERLAPPING_REGIONS = 'overlapping_regions',
  SEQUENCE_VIOLATION = 'sequence_violation',
  LOCK_VIOLATION = 'lock_violation'
}

export enum ResolutionStrategy {
  LAST_WRITER_WINS = 'last_writer_wins',
  FIRST_WRITER_WINS = 'first_writer_wins',
  MERGE_CHANGES = 'merge_changes',
  USER_DECISION = 'user_decision',
  CREATE_BRANCH = 'create_branch'
}

// Service operation results
export interface ConcurrentEditingResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

export interface SessionResult extends ConcurrentEditingResult {
  session?: EditSession;
}

export interface OperationResult extends ConcurrentEditingResult {
  operation?: EditOperation;
  conflicts?: EditConflict[];
}

export interface LockResult extends ConcurrentEditingResult {
  lock?: DocumentLock;
}

export interface CollaborationStateResult extends ConcurrentEditingResult {
  state?: CollaborationState;
}

export class ConcurrentEditingService {
  private readonly LOCK_TIMEOUT_MINUTES = 30;
  private readonly SESSION_TIMEOUT_MINUTES = 60;
  private readonly MAX_PENDING_OPERATIONS = 1000;

  /**
   * Start an editing session for a document
   */
  async startEditSession(
    documentId: string,
    userId: string,
    userName: string,
    lockType: LockType = LockType.OPTIMISTIC,
    lockRegion?: EditRegion
  ): Promise<SessionResult> {
    try {
      // Validate document exists and user has edit permission
      const documentResult = await supabaseService.findById('documents', documentId);
      if (!documentResult.success || !documentResult.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      // Check if user has edit permission
      const hasEditPermission = await this.checkEditPermission(documentId, userId);
      if (!hasEditPermission) {
        return {
          success: false,
          error: 'Access denied: insufficient permissions to edit document'
        };
      }

      // Check for conflicting locks if requesting exclusive or region lock
      if (lockType !== LockType.OPTIMISTIC) {
        const lockConflict = await this.checkLockConflicts(documentId, lockType, lockRegion);
        if (lockConflict) {
          return {
            success: false,
            error: `Cannot acquire lock: ${lockConflict}`
          };
        }
      }

      // Generate unique client ID for this session
      const clientId = await this.generateClientId();

      // Create edit session
      const sessionData = {
        document_id: documentId,
        user_id: userId,
        user_name: userName,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        lock_type: lockType,
        lock_region: lockRegion,
        client_id: clientId
      };

      const sessionResult = await supabaseService.insert('edit_sessions', sessionData);
      if (!sessionResult.success) {
        return {
          success: false,
          error: `Failed to create edit session: ${sessionResult.error?.message || 'Unknown error'}`
        };
      }

      // Create document lock if required
      let documentLock: DocumentLock | undefined;
      if (lockType !== LockType.OPTIMISTIC) {
        const lockResult = await this.acquireDocumentLock(
          documentId,
          userId,
          lockType,
          lockRegion,
          sessionResult.data.id
        );
        
        if (!lockResult.success) {
          // Clean up session if lock acquisition failed
          await supabaseService.delete('edit_sessions', sessionResult.data.id);
          return {
            success: false,
            error: lockResult.error
          };
        }
        
        documentLock = lockResult.lock;
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'edit_session',
        sessionResult.data.id,
        'start',
        {
          documentId,
          lockType,
          lockRegion,
          clientId
        },
        userId
      );

      const session = this.mapDatabaseRecordToEditSession(sessionResult.data);

      return {
        success: true,
        session
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to start edit session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * End an editing session and release locks
   */
  async endEditSession(sessionId: string, userId: string): Promise<ConcurrentEditingResult> {
    try {
      // Get session details
      const sessionResult = await supabaseService.findById('edit_sessions', sessionId);
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: 'Edit session not found'
        };
      }

      const session = sessionResult.data;

      // Verify user owns the session
      if (session.user_id !== userId) {
        return {
          success: false,
          error: 'Access denied: cannot end another user\'s session'
        };
      }

      // Deactivate session
      await supabaseService.update('edit_sessions', sessionId, {
        is_active: false,
        ended_at: new Date().toISOString()
      });

      // Release any document locks for this session
      await this.releaseSessionLocks(sessionId);

      // Create audit entry
      await supabaseService.createAuditEntry(
        'edit_session',
        sessionId,
        'end',
        {
          documentId: session.document_id,
          duration: Date.now() - new Date(session.started_at).getTime()
        },
        userId
      );

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to end edit session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Apply an edit operation with conflict detection
   */
  async applyEditOperation(
    sessionId: string,
    operation: Omit<EditOperation, 'id' | 'timestamp' | 'sequenceNumber'>
  ): Promise<OperationResult> {
    try {
      // Validate session is active
      const sessionResult = await supabaseService.findById('edit_sessions', sessionId);
      if (!sessionResult.success || !sessionResult.data || !sessionResult.data.is_active) {
        return {
          success: false,
          error: 'Edit session not found or inactive'
        };
      }

      const session = sessionResult.data;

      // Update session activity
      await supabaseService.update('edit_sessions', sessionId, {
        last_activity: new Date().toISOString()
      });

      // Get next sequence number for this session
      const sequenceNumber = await this.getNextSequenceNumber(sessionId);

      // Create operation record
      const operationData = {
        session_id: sessionId,
        document_id: operation.documentId,
        type: operation.type,
        position: operation.position,
        content: operation.content,
        length: operation.length,
        timestamp: new Date().toISOString(),
        user_id: operation.userId,
        sequence_number: sequenceNumber
      };

      const operationResult = await supabaseService.insert('edit_operations', operationData);
      if (!operationResult.success) {
        return {
          success: false,
          error: `Failed to record edit operation: ${operationResult.error?.message || 'Unknown error'}`
        };
      }

      const editOperation = this.mapDatabaseRecordToEditOperation(operationResult.data);

      // Detect conflicts with other concurrent operations
      const conflictDetection = await this.detectConflicts(editOperation);

      // If conflicts detected, handle based on lock type
      if (conflictDetection.hasConflicts) {
        const resolutionResult = await this.handleConflicts(
          editOperation,
          conflictDetection.conflicts,
          session.lock_type
        );

        if (!resolutionResult.success) {
          return {
            success: false,
            error: resolutionResult.error,
            conflicts: conflictDetection.conflicts
          };
        }
      }

      // Create audit entry for the operation
      await supabaseService.createAuditEntry(
        'edit_operation',
        operationResult.data.id,
        'apply',
        {
          documentId: operation.documentId,
          operationType: operation.type,
          position: operation.position,
          hasConflicts: conflictDetection.hasConflicts,
          conflictCount: conflictDetection.conflicts.length
        },
        operation.userId
      );

      return {
        success: true,
        operation: editOperation,
        conflicts: conflictDetection.hasConflicts ? conflictDetection.conflicts : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to apply edit operation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get current collaboration state for a document
   */
  async getCollaborationState(documentId: string): Promise<CollaborationStateResult> {
    try {
      // Get active sessions
      const sessionsResult = await supabaseService.query('edit_sessions', {
        filters: {
          document_id: documentId,
          is_active: true
        },
        sortBy: 'started_at',
        sortOrder: 'desc'
      });

      // Get pending operations (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const operationsResult = await supabaseService.query('edit_operations', {
        filters: {
          document_id: documentId,
          timestamp: { gte: oneDayAgo.toISOString() }
        },
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit: this.MAX_PENDING_OPERATIONS
      });

      // Get active document locks
      const locksResult = await supabaseService.query('document_locks', {
        filters: {
          document_id: documentId,
          is_active: true,
          expires_at: { gte: new Date().toISOString() }
        }
      });

      // Count conflicts in recent operations
      const conflictsResult = await supabaseService.query('edit_conflicts', {
        filters: {
          document_id: documentId,
          created_at: { gte: oneDayAgo.toISOString() }
        }
      });

      const activeSessions = (sessionsResult.data || []).map(record => 
        this.mapDatabaseRecordToEditSession(record)
      );

      const pendingOperations = (operationsResult.data || []).map(record => 
        this.mapDatabaseRecordToEditOperation(record)
      );

      const documentLocks = (locksResult.data || []).map(record => 
        this.mapDatabaseRecordToDocumentLock(record)
      );

      const state: CollaborationState = {
        documentId,
        activeSessions,
        pendingOperations,
        documentLocks,
        lastSyncAt: new Date(),
        conflictCount: conflictsResult.count || 0
      };

      return {
        success: true,
        state
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get collaboration state: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Acquire a document lock
   */
  async acquireDocumentLock(
    documentId: string,
    userId: string,
    lockType: LockType,
    region?: EditRegion,
    sessionId?: string
  ): Promise<LockResult> {
    try {
      // Check for conflicting locks
      const conflictCheck = await this.checkLockConflicts(documentId, lockType, region);
      if (conflictCheck) {
        return {
          success: false,
          error: conflictCheck
        };
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + this.LOCK_TIMEOUT_MINUTES * 60 * 1000);

      // Create lock record
      const lockData = {
        document_id: documentId,
        user_id: userId,
        lock_type: lockType,
        region: region,
        acquired_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        session_id: sessionId
      };

      const lockResult = await supabaseService.insert('document_locks', lockData);
      if (!lockResult.success) {
        return {
          success: false,
          error: `Failed to acquire lock: ${lockResult.error?.message || 'Unknown error'}`
        };
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document_lock',
        lockResult.data.id,
        'acquire',
        {
          documentId,
          lockType,
          region,
          expiresAt: expiresAt.toISOString()
        },
        userId
      );

      const lock = this.mapDatabaseRecordToDocumentLock(lockResult.data);

      return {
        success: true,
        lock
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to acquire document lock: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Release a document lock
   */
  async releaseDocumentLock(lockId: string, userId: string): Promise<ConcurrentEditingResult> {
    try {
      // Get lock details
      const lockResult = await supabaseService.findById('document_locks', lockId);
      if (!lockResult.success || !lockResult.data) {
        return {
          success: false,
          error: 'Document lock not found'
        };
      }

      const lock = lockResult.data;

      // Verify user owns the lock
      if (lock.user_id !== userId) {
        return {
          success: false,
          error: 'Access denied: cannot release another user\'s lock'
        };
      }

      // Deactivate lock
      await supabaseService.update('document_locks', lockId, {
        is_active: false,
        released_at: new Date().toISOString()
      });

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document_lock',
        lockId,
        'release',
        {
          documentId: lock.document_id,
          lockType: lock.lock_type,
          duration: Date.now() - new Date(lock.acquired_at).getTime()
        },
        userId
      );

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to release document lock: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean up expired sessions and locks
   */
  async cleanupExpiredSessions(): Promise<ConcurrentEditingResult> {
    try {
      const now = new Date();
      const sessionTimeout = new Date(now.getTime() - this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
      const lockTimeout = new Date(now.getTime() - this.LOCK_TIMEOUT_MINUTES * 60 * 1000);

      // Deactivate expired sessions
      await supabaseService.query('edit_sessions', {
        filters: {
          is_active: true,
          last_activity: { lt: sessionTimeout.toISOString() }
        },
        update: {
          is_active: false,
          ended_at: now.toISOString(),
          end_reason: 'timeout'
        }
      });

      // Deactivate expired locks
      await supabaseService.query('document_locks', {
        filters: {
          is_active: true,
          expires_at: { lt: now.toISOString() }
        },
        update: {
          is_active: false,
          released_at: now.toISOString(),
          release_reason: 'expired'
        }
      });

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user has edit permission for document
   */
  private async checkEditPermission(documentId: string, userId: string): Promise<boolean> {
    try {
      // Check document ownership
      const documentResult = await supabaseService.findById('documents', documentId);
      if (documentResult.success && documentResult.data) {
        if (documentResult.data.created_by === userId) {
          return true;
        }
      }

      // Check explicit permissions
      const permissionResult = await supabaseService.query('document_permissions', {
        filters: {
          document_id: documentId,
          user_id: userId,
          permissions: { contains: ['edit'] },
          is_active: true
        },
        limit: 1
      });

      if (permissionResult.success && permissionResult.data?.length) {
        const permission = permissionResult.data[0];
        // Check if permission hasn't expired
        return !permission.expires_at || new Date(permission.expires_at) > new Date();
      }

      return false;

    } catch (error) {
      console.error('Failed to check edit permission:', error);
      return false;
    }
  }

  /**
   * Check for conflicting document locks
   */
  private async checkLockConflicts(
    documentId: string,
    requestedLockType: LockType,
    requestedRegion?: EditRegion
  ): Promise<string | null> {
    try {
      // Get active locks for the document
      const locksResult = await supabaseService.query('document_locks', {
        filters: {
          document_id: documentId,
          is_active: true,
          expires_at: { gte: new Date().toISOString() }
        }
      });

      if (!locksResult.success || !locksResult.data?.length) {
        return null; // No conflicts
      }

      for (const existingLock of locksResult.data) {
        // Check for exclusive lock conflicts
        if (existingLock.lock_type === LockType.EXCLUSIVE) {
          return 'Document has an exclusive lock';
        }

        if (requestedLockType === LockType.EXCLUSIVE) {
          return 'Cannot acquire exclusive lock: document has active locks';
        }

        // Check for region conflicts
        if (existingLock.lock_type === LockType.REGION && 
            requestedLockType === LockType.REGION &&
            requestedRegion && existingLock.region) {
          
          const hasOverlap = this.checkRegionOverlap(requestedRegion, existingLock.region);
          if (hasOverlap) {
            return 'Requested region overlaps with existing lock';
          }
        }
      }

      return null; // No conflicts found

    } catch (error) {
      console.error('Failed to check lock conflicts:', error);
      return 'Failed to check lock conflicts';
    }
  }

  /**
   * Check if two edit regions overlap
   */
  private checkRegionOverlap(region1: EditRegion, region2: EditRegion): boolean {
    // If both regions have line numbers, check line overlap
    if (region1.startLine !== undefined && region1.endLine !== undefined &&
        region2.startLine !== undefined && region2.endLine !== undefined) {
      
      return !(region1.endLine < region2.startLine || region2.endLine < region1.startLine);
    }

    // If both regions have character positions, check character overlap
    if (region1.startChar !== undefined && region1.endChar !== undefined &&
        region2.startChar !== undefined && region2.endChar !== undefined) {
      
      return !(region1.endChar < region2.startChar || region2.endChar < region1.startChar);
    }

    // If regions have section names, check for exact match
    if (region1.section && region2.section) {
      return region1.section === region2.section;
    }

    // If we can't determine overlap precisely, assume there is overlap for safety
    return true;
  }

  /**
   * Detect conflicts between edit operations
   */
  private async detectConflicts(operation: EditOperation): Promise<ConflictDetection> {
    try {
      // Get recent operations on the same document (last 5 minutes)
      const recentTime = new Date(Date.now() - 5 * 60 * 1000);
      
      const recentOpsResult = await supabaseService.query('edit_operations', {
        filters: {
          document_id: operation.documentId,
          timestamp: { gte: recentTime.toISOString() },
          user_id: { neq: operation.userId } // Exclude operations by the same user
        },
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });

      if (!recentOpsResult.success || !recentOpsResult.data?.length) {
        return {
          hasConflicts: false,
          conflicts: [],
          resolutionSuggestions: []
        };
      }

      const conflicts: EditConflict[] = [];
      const recentOperations = recentOpsResult.data.map(record => 
        this.mapDatabaseRecordToEditOperation(record)
      );

      // Check for position-based conflicts
      for (const recentOp of recentOperations) {
        const conflict = this.analyzeOperationConflict(operation, recentOp);
        if (conflict) {
          conflicts.push(conflict);
        }
      }

      // Generate resolution suggestions
      const resolutionSuggestions = conflicts.map(conflict => 
        this.generateResolutionSuggestion(conflict)
      );

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        resolutionSuggestions
      };

    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        resolutionSuggestions: []
      };
    }
  }

  /**
   * Analyze conflict between two operations
   */
  private analyzeOperationConflict(op1: EditOperation, op2: EditOperation): EditConflict | null {
    // Check if operations affect overlapping regions
    const positionDistance = Math.abs(
      (op1.position.line * 1000 + op1.position.character) -
      (op2.position.line * 1000 + op2.position.character)
    );

    // Consider operations within 100 characters as potentially conflicting
    if (positionDistance > 100) {
      return null;
    }

    // Determine conflict type and severity
    let conflictType: ConflictType;
    let severity: 'low' | 'medium' | 'high' | 'critical';

    if (op1.position.line === op2.position.line) {
      conflictType = ConflictType.CONCURRENT_EDIT;
      severity = 'high';
    } else if (Math.abs(op1.position.line - op2.position.line) <= 2) {
      conflictType = ConflictType.OVERLAPPING_REGIONS;
      severity = 'medium';
    } else {
      conflictType = ConflictType.OVERLAPPING_REGIONS;
      severity = 'low';
    }

    const affectedRegion: EditRegion = {
      startLine: Math.min(op1.position.line, op2.position.line),
      endLine: Math.max(op1.position.line, op2.position.line),
      startChar: Math.min(op1.position.character, op2.position.character),
      endChar: Math.max(op1.position.character, op2.position.character)
    };

    return {
      id: `conflict_${op1.id}_${op2.id}`,
      type: conflictType,
      operations: [op1, op2],
      affectedRegion,
      severity,
      description: `Concurrent ${op1.type} and ${op2.type} operations at similar positions`,
      autoResolvable: severity === 'low'
    };
  }

  /**
   * Generate resolution suggestion for a conflict
   */
  private generateResolutionSuggestion(conflict: EditConflict): ConflictResolution {
    let strategy: ResolutionStrategy;
    let confidence: number;
    let requiresUserInput: boolean;

    // Determine resolution strategy based on conflict characteristics
    if (conflict.autoResolvable && conflict.severity === 'low') {
      strategy = ResolutionStrategy.MERGE_CHANGES;
      confidence = 0.8;
      requiresUserInput = false;
    } else if (conflict.operations.length === 2) {
      // For two-way conflicts, prefer last writer wins for simplicity
      strategy = ResolutionStrategy.LAST_WRITER_WINS;
      confidence = 0.6;
      requiresUserInput = conflict.severity === 'critical';
    } else {
      // Complex conflicts require user decision
      strategy = ResolutionStrategy.USER_DECISION;
      confidence = 0.3;
      requiresUserInput = true;
    }

    return {
      conflictId: conflict.id,
      strategy,
      resultingContent: this.generateResolvedContent(conflict, strategy),
      confidence,
      requiresUserInput,
      description: `Resolve using ${strategy.replace('_', ' ')} strategy`
    };
  }

  /**
   * Generate resolved content based on resolution strategy
   */
  private generateResolvedContent(conflict: EditConflict, strategy: ResolutionStrategy): string {
    // This is a simplified implementation
    // In a real system, this would involve sophisticated text merging algorithms
    
    const operations = conflict.operations.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    switch (strategy) {
      case ResolutionStrategy.LAST_WRITER_WINS:
        return operations[operations.length - 1].content || '';
      
      case ResolutionStrategy.FIRST_WRITER_WINS:
        return operations[0].content || '';
      
      case ResolutionStrategy.MERGE_CHANGES:
        // Simple merge - concatenate changes
        return operations.map(op => op.content || '').join(' ');
      
      default:
        return '[CONFLICT: User decision required]';
    }
  }

  /**
   * Handle conflicts based on lock type and resolution strategy
   */
  private async handleConflicts(
    operation: EditOperation,
    conflicts: EditConflict[],
    lockType: LockType
  ): Promise<ConcurrentEditingResult> {
    try {
      // For exclusive locks, conflicts should not occur
      if (lockType === LockType.EXCLUSIVE) {
        return {
          success: false,
          error: 'Conflict detected despite exclusive lock'
        };
      }

      // Store conflicts for user resolution if needed
      for (const conflict of conflicts) {
        if (!conflict.autoResolvable) {
          await supabaseService.insert('edit_conflicts', {
            id: conflict.id,
            document_id: operation.documentId,
            type: conflict.type,
            operations: conflict.operations.map(op => op.id),
            affected_region: conflict.affectedRegion,
            severity: conflict.severity,
            description: conflict.description,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }
      }

      // For optimistic locking, allow operation but flag conflicts
      if (lockType === LockType.OPTIMISTIC) {
        return {
          success: true,
          warnings: [`${conflicts.length} conflicts detected and flagged for resolution`]
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to handle conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Release all locks for a session
   */
  private async releaseSessionLocks(sessionId: string): Promise<void> {
    try {
      await supabaseService.query('document_locks', {
        filters: {
          session_id: sessionId,
          is_active: true
        },
        update: {
          is_active: false,
          released_at: new Date().toISOString(),
          release_reason: 'session_ended'
        }
      });
    } catch (error) {
      console.error('Failed to release session locks:', error);
    }
  }

  /**
   * Get next sequence number for operations in a session
   */
  private async getNextSequenceNumber(sessionId: string): Promise<number> {
    try {
      const result = await supabaseService.query('edit_operations', {
        filters: { session_id: sessionId },
        sortBy: 'sequence_number',
        sortOrder: 'desc',
        limit: 1
      });

      if (result.success && result.data?.length) {
        return result.data[0].sequence_number + 1;
      }

      return 1; // First operation in session

    } catch (error) {
      console.error('Failed to get next sequence number:', error);
      return Date.now(); // Fallback to timestamp
    }
  }

  /**
   * Generate unique client ID for session
   */
  private async generateClientId(): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Map database record to EditSession interface
   */
  private mapDatabaseRecordToEditSession(record: any): EditSession {
    return {
      id: record.id,
      documentId: record.document_id,
      userId: record.user_id,
      userName: record.user_name,
      startedAt: new Date(record.started_at),
      lastActivity: new Date(record.last_activity),
      isActive: record.is_active,
      lockType: record.lock_type,
      lockRegion: record.lock_region,
      clientId: record.client_id
    };
  }

  /**
   * Map database record to EditOperation interface
   */
  private mapDatabaseRecordToEditOperation(record: any): EditOperation {
    return {
      id: record.id,
      sessionId: record.session_id,
      documentId: record.document_id,
      type: record.type,
      position: record.position,
      content: record.content,
      length: record.length,
      timestamp: new Date(record.timestamp),
      userId: record.user_id,
      sequenceNumber: record.sequence_number
    };
  }

  /**
   * Map database record to DocumentLock interface
   */
  private mapDatabaseRecordToDocumentLock(record: any): DocumentLock {
    return {
      id: record.id,
      documentId: record.document_id,
      userId: record.user_id,
      lockType: record.lock_type,
      region: record.region,
      acquiredAt: new Date(record.acquired_at),
      expiresAt: new Date(record.expires_at),
      isActive: record.is_active,
      reason: record.reason
    };
  }
}

// Export singleton instance
export const concurrentEditingService = new ConcurrentEditingService();
export default concurrentEditingService;
