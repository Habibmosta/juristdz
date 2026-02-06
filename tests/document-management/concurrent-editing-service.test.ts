/**
 * Tests for Concurrent Editing Service
 * 
 * Tests concurrent editing support with conflict detection and resolution,
 * real-time collaboration features, and document locking mechanisms.
 * 
 * Requirements: 5.3
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { concurrentEditingService, ConcurrentEditingService } from '../../src/document-management/services/concurrentEditingService';
import { supabaseService } from '../../src/document-management/services/supabaseService';
import { LockType, OperationType, ConflictType, ResolutionStrategy } from '../../src/document-management/services/concurrentEditingService';
import type { EditRegion, EditPosition } from '../../src/document-management/services/concurrentEditingService';

// Mock the supabase service
jest.mock('../../src/document-management/services/supabaseService');
const mockSupabaseService = supabaseService as jest.Mocked<typeof supabaseService>;

describe('ConcurrentEditingService', () => {
  const mockUserId = 'user-123';
  const mockUserName = 'Test User';
  const mockDocumentId = 'doc-456';
  const mockSessionId = 'session-789';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    mockSupabaseService.findById.mockResolvedValue({
      success: true,
      data: {
        id: mockDocumentId,
        created_by: mockUserId,
        name: 'Test Document'
      }
    });

    mockSupabaseService.insert.mockResolvedValue({
      success: true,
      data: { id: 'new-id' }
    });

    mockSupabaseService.update.mockResolvedValue({
      success: true,
      data: { id: 'updated-id' }
    });

    mockSupabaseService.query.mockResolvedValue({
      success: true,
      data: [],
      count: 0
    });

    mockSupabaseService.createAuditEntry.mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startEditSession', () => {
    it('should successfully start an optimistic edit session', async () => {
      const sessionData = {
        id: mockSessionId,
        document_id: mockDocumentId,
        user_id: mockUserId,
        user_name: mockUserName,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        lock_type: LockType.OPTIMISTIC,
        client_id: 'client-123'
      };

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: sessionData
      });

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName,
        LockType.OPTIMISTIC
      );

      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session?.documentId).toBe(mockDocumentId);
      expect(result.session?.userId).toBe(mockUserId);
      expect(result.session?.lockType).toBe(LockType.OPTIMISTIC);

      // Verify session was created
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'edit_sessions',
        expect.objectContaining({
          document_id: mockDocumentId,
          user_id: mockUserId,
          user_name: mockUserName,
          lock_type: LockType.OPTIMISTIC
        })
      );

      // Verify audit entry was created
      expect(mockSupabaseService.createAuditEntry).toHaveBeenCalledWith(
        'edit_session',
        mockSessionId,
        'start',
        expect.any(Object),
        mockUserId
      );
    });

    it('should fail when document does not exist', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: false,
        data: null
      });

      const result = await concurrentEditingService.startEditSession(
        'nonexistent-doc',
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Document not found');
    });

    it('should fail when user lacks edit permission', async () => {
      // Mock document owned by different user
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: {
          id: mockDocumentId,
          created_by: 'other-user',
          name: 'Test Document'
        }
      });

      // Mock no explicit permissions
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: insufficient permissions to edit document');
    });

    it('should successfully start exclusive lock session when no conflicts', async () => {
      // Mock no existing locks
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const sessionData = {
        id: mockSessionId,
        document_id: mockDocumentId,
        user_id: mockUserId,
        user_name: mockUserName,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        lock_type: LockType.EXCLUSIVE,
        client_id: 'client-123'
      };

      const lockData = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: mockUserId,
        lock_type: LockType.EXCLUSIVE,
        acquired_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_active: true
      };

      mockSupabaseService.insert
        .mockResolvedValueOnce({ success: true, data: sessionData })
        .mockResolvedValueOnce({ success: true, data: lockData });

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName,
        LockType.EXCLUSIVE
      );

      expect(result.success).toBe(true);
      expect(result.session?.lockType).toBe(LockType.EXCLUSIVE);

      // Verify lock was created
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'document_locks',
        expect.objectContaining({
          document_id: mockDocumentId,
          user_id: mockUserId,
          lock_type: LockType.EXCLUSIVE
        })
      );
    });

    it('should fail to start exclusive lock when document already has exclusive lock', async () => {
      // Mock existing exclusive lock
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          id: 'existing-lock',
          document_id: mockDocumentId,
          user_id: 'other-user',
          lock_type: LockType.EXCLUSIVE,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }],
        count: 1
      });

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName,
        LockType.EXCLUSIVE
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document has an exclusive lock');
    });
  });

  describe('endEditSession', () => {
    it('should successfully end an active session', async () => {
      const sessionData = {
        id: mockSessionId,
        document_id: mockDocumentId,
        user_id: mockUserId,
        started_at: new Date().toISOString(),
        is_active: true
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: sessionData
      });

      const result = await concurrentEditingService.endEditSession(mockSessionId, mockUserId);

      expect(result.success).toBe(true);

      // Verify session was deactivated
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'edit_sessions',
        mockSessionId,
        expect.objectContaining({
          is_active: false,
          ended_at: expect.any(String)
        })
      );

      // Verify audit entry was created
      expect(mockSupabaseService.createAuditEntry).toHaveBeenCalledWith(
        'edit_session',
        mockSessionId,
        'end',
        expect.any(Object),
        mockUserId
      );
    });

    it('should fail when session does not exist', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: false,
        data: null
      });

      const result = await concurrentEditingService.endEditSession('nonexistent-session', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Edit session not found');
    });

    it('should fail when user tries to end another user\'s session', async () => {
      const sessionData = {
        id: mockSessionId,
        document_id: mockDocumentId,
        user_id: 'other-user',
        started_at: new Date().toISOString(),
        is_active: true
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: sessionData
      });

      const result = await concurrentEditingService.endEditSession(mockSessionId, mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: cannot end another user\'s session');
    });
  });

  describe('applyEditOperation', () => {
    const mockOperation = {
      documentId: mockDocumentId,
      type: OperationType.INSERT,
      position: { line: 10, character: 5 } as EditPosition,
      content: 'inserted text',
      userId: mockUserId
    };

    beforeEach(() => {
      // Mock active session
      mockSupabaseService.findById.mockResolvedValue({
        success: true,
        data: {
          id: mockSessionId,
          document_id: mockDocumentId,
          user_id: mockUserId,
          is_active: true,
          lock_type: LockType.OPTIMISTIC
        }
      });

      // Mock operation creation
      mockSupabaseService.insert.mockResolvedValue({
        success: true,
        data: {
          id: 'op-123',
          session_id: mockSessionId,
          document_id: mockDocumentId,
          type: OperationType.INSERT,
          position: mockOperation.position,
          content: mockOperation.content,
          timestamp: new Date().toISOString(),
          user_id: mockUserId,
          sequence_number: 1
        }
      });
    });

    it('should successfully apply operation without conflicts', async () => {
      // Mock no recent operations (no conflicts)
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const result = await concurrentEditingService.applyEditOperation(mockSessionId, mockOperation);

      expect(result.success).toBe(true);
      expect(result.operation).toBeDefined();
      expect(result.conflicts).toBeUndefined();

      // Verify operation was recorded
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'edit_operations',
        expect.objectContaining({
          session_id: mockSessionId,
          document_id: mockDocumentId,
          type: OperationType.INSERT,
          position: mockOperation.position,
          content: mockOperation.content,
          user_id: mockUserId
        })
      );

      // Verify session activity was updated
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'edit_sessions',
        mockSessionId,
        expect.objectContaining({
          last_activity: expect.any(String)
        })
      );
    });

    it('should detect and handle conflicts with concurrent operations', async () => {
      // Mock conflicting recent operation
      const conflictingOp = {
        id: 'conflict-op',
        session_id: 'other-session',
        document_id: mockDocumentId,
        type: OperationType.DELETE,
        position: { line: 10, character: 3 }, // Close to our operation
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        user_id: 'other-user',
        sequence_number: 1
      };

      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [conflictingOp],
        count: 1
      });

      const result = await concurrentEditingService.applyEditOperation(mockSessionId, mockOperation);

      expect(result.success).toBe(true);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts?.length).toBeGreaterThan(0);

      // Verify conflict was detected
      const conflict = result.conflicts?.[0];
      expect(conflict?.type).toBe(ConflictType.CONCURRENT_EDIT);
      expect(conflict?.operations).toHaveLength(2);
    });

    it('should fail when session is inactive', async () => {
      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: {
          id: mockSessionId,
          is_active: false
        }
      });

      const result = await concurrentEditingService.applyEditOperation(mockSessionId, mockOperation);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Edit session not found or inactive');
    });
  });

  describe('getCollaborationState', () => {
    it('should return comprehensive collaboration state', async () => {
      const mockSession = {
        id: mockSessionId,
        document_id: mockDocumentId,
        user_id: mockUserId,
        user_name: mockUserName,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        is_active: true,
        lock_type: LockType.OPTIMISTIC,
        client_id: 'client-123'
      };

      const mockOperation = {
        id: 'op-123',
        session_id: mockSessionId,
        document_id: mockDocumentId,
        type: OperationType.INSERT,
        position: { line: 5, character: 10 },
        content: 'test content',
        timestamp: new Date().toISOString(),
        user_id: mockUserId,
        sequence_number: 1
      };

      const mockLock = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: mockUserId,
        lock_type: LockType.SHARED,
        acquired_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_active: true
      };

      // Mock active sessions
      mockSupabaseService.query
        .mockResolvedValueOnce({
          success: true,
          data: [mockSession],
          count: 1
        })
        // Mock pending operations
        .mockResolvedValueOnce({
          success: true,
          data: [mockOperation],
          count: 1
        })
        // Mock active locks
        .mockResolvedValueOnce({
          success: true,
          data: [mockLock],
          count: 1
        })
        // Mock conflicts count
        .mockResolvedValueOnce({
          success: true,
          data: [],
          count: 2
        });

      const result = await concurrentEditingService.getCollaborationState(mockDocumentId);

      expect(result.success).toBe(true);
      expect(result.state).toBeDefined();
      expect(result.state?.documentId).toBe(mockDocumentId);
      expect(result.state?.activeSessions).toHaveLength(1);
      expect(result.state?.pendingOperations).toHaveLength(1);
      expect(result.state?.documentLocks).toHaveLength(1);
      expect(result.state?.conflictCount).toBe(2);
    });
  });

  describe('acquireDocumentLock', () => {
    it('should successfully acquire exclusive lock when no conflicts', async () => {
      // Mock no existing locks
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [],
        count: 0
      });

      const lockData = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: mockUserId,
        lock_type: LockType.EXCLUSIVE,
        acquired_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_active: true
      };

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: lockData
      });

      const result = await concurrentEditingService.acquireDocumentLock(
        mockDocumentId,
        mockUserId,
        LockType.EXCLUSIVE
      );

      expect(result.success).toBe(true);
      expect(result.lock).toBeDefined();
      expect(result.lock?.lockType).toBe(LockType.EXCLUSIVE);

      // Verify lock was created
      expect(mockSupabaseService.insert).toHaveBeenCalledWith(
        'document_locks',
        expect.objectContaining({
          document_id: mockDocumentId,
          user_id: mockUserId,
          lock_type: LockType.EXCLUSIVE
        })
      );
    });

    it('should fail to acquire lock when conflicts exist', async () => {
      // Mock existing exclusive lock
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          id: 'existing-lock',
          document_id: mockDocumentId,
          user_id: 'other-user',
          lock_type: LockType.EXCLUSIVE,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }],
        count: 1
      });

      const result = await concurrentEditingService.acquireDocumentLock(
        mockDocumentId,
        mockUserId,
        LockType.SHARED
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Document has an exclusive lock');
    });

    it('should successfully acquire region lock when no overlap', async () => {
      const requestedRegion: EditRegion = {
        startLine: 10,
        endLine: 20,
        startChar: 0,
        endChar: 100
      };

      const existingRegion: EditRegion = {
        startLine: 30,
        endLine: 40,
        startChar: 0,
        endChar: 100
      };

      // Mock existing region lock with no overlap
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          id: 'existing-lock',
          document_id: mockDocumentId,
          user_id: 'other-user',
          lock_type: LockType.REGION,
          region: existingRegion,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }],
        count: 1
      });

      const lockData = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: mockUserId,
        lock_type: LockType.REGION,
        region: requestedRegion,
        acquired_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_active: true
      };

      mockSupabaseService.insert.mockResolvedValueOnce({
        success: true,
        data: lockData
      });

      const result = await concurrentEditingService.acquireDocumentLock(
        mockDocumentId,
        mockUserId,
        LockType.REGION,
        requestedRegion
      );

      expect(result.success).toBe(true);
      expect(result.lock?.region).toEqual(requestedRegion);
    });

    it('should fail to acquire region lock when regions overlap', async () => {
      const requestedRegion: EditRegion = {
        startLine: 10,
        endLine: 20,
        startChar: 0,
        endChar: 100
      };

      const overlappingRegion: EditRegion = {
        startLine: 15,
        endLine: 25,
        startChar: 0,
        endChar: 100
      };

      // Mock existing region lock with overlap
      mockSupabaseService.query.mockResolvedValueOnce({
        success: true,
        data: [{
          id: 'existing-lock',
          document_id: mockDocumentId,
          user_id: 'other-user',
          lock_type: LockType.REGION,
          region: overlappingRegion,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }],
        count: 1
      });

      const result = await concurrentEditingService.acquireDocumentLock(
        mockDocumentId,
        mockUserId,
        LockType.REGION,
        requestedRegion
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Requested region overlaps with existing lock');
    });
  });

  describe('releaseDocumentLock', () => {
    it('should successfully release owned lock', async () => {
      const lockData = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: mockUserId,
        lock_type: LockType.EXCLUSIVE,
        acquired_at: new Date().toISOString(),
        is_active: true
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: lockData
      });

      const result = await concurrentEditingService.releaseDocumentLock('lock-123', mockUserId);

      expect(result.success).toBe(true);

      // Verify lock was deactivated
      expect(mockSupabaseService.update).toHaveBeenCalledWith(
        'document_locks',
        'lock-123',
        expect.objectContaining({
          is_active: false,
          released_at: expect.any(String)
        })
      );
    });

    it('should fail to release another user\'s lock', async () => {
      const lockData = {
        id: 'lock-123',
        document_id: mockDocumentId,
        user_id: 'other-user',
        lock_type: LockType.EXCLUSIVE,
        acquired_at: new Date().toISOString(),
        is_active: true
      };

      mockSupabaseService.findById.mockResolvedValueOnce({
        success: true,
        data: lockData
      });

      const result = await concurrentEditingService.releaseDocumentLock('lock-123', mockUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: cannot release another user\'s lock');
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and locks', async () => {
      const result = await concurrentEditingService.cleanupExpiredSessions();

      expect(result.success).toBe(true);

      // Verify expired sessions were deactivated
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'edit_sessions',
        expect.objectContaining({
          filters: expect.objectContaining({
            is_active: true,
            last_activity: expect.objectContaining({
              lt: expect.any(String)
            })
          }),
          update: expect.objectContaining({
            is_active: false,
            ended_at: expect.any(String),
            end_reason: 'timeout'
          })
        })
      );

      // Verify expired locks were deactivated
      expect(mockSupabaseService.query).toHaveBeenCalledWith(
        'document_locks',
        expect.objectContaining({
          filters: expect.objectContaining({
            is_active: true,
            expires_at: expect.objectContaining({
              lt: expect.any(String)
            })
          }),
          update: expect.objectContaining({
            is_active: false,
            released_at: expect.any(String),
            release_reason: 'expired'
          })
        })
      );
    });
  });

  describe('conflict detection', () => {
    it('should detect concurrent edits at same position', async () => {
      const service = new ConcurrentEditingService();
      
      // Create two operations at the same position
      const op1 = {
        id: 'op1',
        sessionId: 'session1',
        documentId: mockDocumentId,
        type: OperationType.INSERT,
        position: { line: 10, character: 5 },
        content: 'text1',
        timestamp: new Date(),
        userId: 'user1',
        sequenceNumber: 1
      };

      const op2 = {
        id: 'op2',
        sessionId: 'session2',
        documentId: mockDocumentId,
        type: OperationType.DELETE,
        position: { line: 10, character: 5 },
        content: 'text2',
        timestamp: new Date(),
        userId: 'user2',
        sequenceNumber: 1
      };

      // Use reflection to access private method for testing
      const analyzeConflict = (service as any).analyzeOperationConflict.bind(service);
      const conflict = analyzeConflict(op1, op2);

      expect(conflict).toBeDefined();
      expect(conflict.type).toBe(ConflictType.CONCURRENT_EDIT);
      expect(conflict.severity).toBe('high');
      expect(conflict.operations).toHaveLength(2);
    });

    it('should detect overlapping regions', async () => {
      const service = new ConcurrentEditingService();
      
      // Create operations in nearby lines
      const op1 = {
        id: 'op1',
        sessionId: 'session1',
        documentId: mockDocumentId,
        type: OperationType.INSERT,
        position: { line: 10, character: 5 },
        content: 'text1',
        timestamp: new Date(),
        userId: 'user1',
        sequenceNumber: 1
      };

      const op2 = {
        id: 'op2',
        sessionId: 'session2',
        documentId: mockDocumentId,
        type: OperationType.REPLACE,
        position: { line: 11, character: 10 },
        content: 'text2',
        timestamp: new Date(),
        userId: 'user2',
        sequenceNumber: 1
      };

      const analyzeConflict = (service as any).analyzeOperationConflict.bind(service);
      const conflict = analyzeConflict(op1, op2);

      expect(conflict).toBeDefined();
      expect(conflict.type).toBe(ConflictType.OVERLAPPING_REGIONS);
      expect(conflict.severity).toBe('medium');
    });

    it('should not detect conflicts for distant operations', async () => {
      const service = new ConcurrentEditingService();
      
      // Create operations far apart
      const op1 = {
        id: 'op1',
        sessionId: 'session1',
        documentId: mockDocumentId,
        type: OperationType.INSERT,
        position: { line: 10, character: 5 },
        content: 'text1',
        timestamp: new Date(),
        userId: 'user1',
        sequenceNumber: 1
      };

      const op2 = {
        id: 'op2',
        sessionId: 'session2',
        documentId: mockDocumentId,
        type: OperationType.INSERT,
        position: { line: 50, character: 20 },
        content: 'text2',
        timestamp: new Date(),
        userId: 'user2',
        sequenceNumber: 1
      };

      const analyzeConflict = (service as any).analyzeOperationConflict.bind(service);
      const conflict = analyzeConflict(op1, op2);

      expect(conflict).toBeNull();
    });
  });

  describe('region overlap detection', () => {
    it('should detect line-based region overlap', async () => {
      const service = new ConcurrentEditingService();
      
      const region1: EditRegion = {
        startLine: 10,
        endLine: 20,
        startChar: 0,
        endChar: 100
      };

      const region2: EditRegion = {
        startLine: 15,
        endLine: 25,
        startChar: 0,
        endChar: 100
      };

      const checkOverlap = (service as any).checkRegionOverlap.bind(service);
      const hasOverlap = checkOverlap(region1, region2);

      expect(hasOverlap).toBe(true);
    });

    it('should detect character-based region overlap', async () => {
      const service = new ConcurrentEditingService();
      
      const region1: EditRegion = {
        startChar: 100,
        endChar: 200
      };

      const region2: EditRegion = {
        startChar: 150,
        endChar: 250
      };

      const checkOverlap = (service as any).checkRegionOverlap.bind(service);
      const hasOverlap = checkOverlap(region1, region2);

      expect(hasOverlap).toBe(true);
    });

    it('should not detect overlap for non-overlapping regions', async () => {
      const service = new ConcurrentEditingService();
      
      const region1: EditRegion = {
        startLine: 10,
        endLine: 20,
        startChar: 0,
        endChar: 100
      };

      const region2: EditRegion = {
        startLine: 30,
        endLine: 40,
        startChar: 0,
        endChar: 100
      };

      const checkOverlap = (service as any).checkRegionOverlap.bind(service);
      const hasOverlap = checkOverlap(region1, region2);

      expect(hasOverlap).toBe(false);
    });

    it('should detect section-based overlap', async () => {
      const service = new ConcurrentEditingService();
      
      const region1: EditRegion = {
        section: 'introduction'
      };

      const region2: EditRegion = {
        section: 'introduction'
      };

      const checkOverlap = (service as any).checkRegionOverlap.bind(service);
      const hasOverlap = checkOverlap(region1, region2);

      expect(hasOverlap).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseService.findById.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to start edit session');
    });

    it('should handle lock acquisition failures', async () => {
      mockSupabaseService.insert
        .mockResolvedValueOnce({ success: true, data: { id: mockSessionId } })
        .mockRejectedValueOnce(new Error('Lock creation failed'));

      const result = await concurrentEditingService.startEditSession(
        mockDocumentId,
        mockUserId,
        mockUserName,
        LockType.EXCLUSIVE
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to start edit session');
    });
  });
});