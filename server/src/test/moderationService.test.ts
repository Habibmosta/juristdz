import { Pool } from 'pg';
import { ModerationService } from '../services/moderationService.js';
import { 
  ContentType, 
  ModerationStatus, 
  ModerationAction, 
  ModerationReason,
  CreateModerationItemRequest,
  UpdateModerationItemRequest,
  PerformModerationActionRequest,
  CreateModerationReportRequest,
  ModerationSearchCriteria
} from '../types/moderation.js';

// Mock database pool
const mockDb = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

// Mock client
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

describe('ModerationService', () => {
  let moderationService: ModerationService;

  beforeEach(() => {
    moderationService = new ModerationService(mockDb);
    jest.clearAllMocks();
    
    // Setup default mock for connect
    (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  describe('createModerationItem', () => {
    it('should create a moderation item with auto-moderation', async () => {
      const request: CreateModerationItemRequest = {
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        contentTitle: 'Test Document',
        contentPreview: 'This is a clean document',
        submittedBy: 'user-123'
      };

      // Mock auto-moderation rules query
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [
            {
              rule_name: 'profanity_filter',
              enabled: true,
              keywords: ['bad', 'inappropriate'],
              patterns: [],
              confidence_threshold: 0.7
            }
          ]
        }) // Auto-moderation rules
        .mockResolvedValueOnce({ rows: [{ id: 'workflow-123' }] }) // Default workflow
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-123', status: 'approved' }] 
        }) // Insert moderation item
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock getModerationItemById
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue({
        id: 'item-123',
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        contentTitle: 'Test Document',
        contentPreview: 'This is a clean document',
        submittedBy: 'user-123',
        submittedByName: 'Test User',
        submittedByRole: 'AVOCAT',
        status: ModerationStatus.APPROVED,
        priority: 'medium',
        autoModerationFlags: [],
        manualReports: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await moderationService.createModerationItem(request, 'admin-123');

      expect(result.id).toBe('item-123');
      expect(result.status).toBe(ModerationStatus.APPROVED);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should flag content that fails auto-moderation', async () => {
      const request: CreateModerationItemRequest = {
        contentType: ContentType.COMMENT,
        contentId: 'comment-123',
        contentTitle: 'Inappropriate Comment',
        contentPreview: 'This contains bad words and inappropriate content',
        submittedBy: 'user-123'
      };

      // Mock auto-moderation rules query
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [
            {
              rule_name: 'profanity_filter',
              enabled: true,
              keywords: ['bad', 'inappropriate'],
              patterns: [],
              confidence_threshold: 0.7
            }
          ]
        }) // Auto-moderation rules
        .mockResolvedValueOnce({ rows: [{ id: 'workflow-123' }] }) // Default workflow
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-123', status: 'pending' }] 
        }) // Insert moderation item
        .mockResolvedValueOnce({ rows: [] }) // Insert auto-moderation flag
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock getModerationItemById
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue({
        id: 'item-123',
        contentType: ContentType.COMMENT,
        contentId: 'comment-123',
        contentTitle: 'Inappropriate Comment',
        contentPreview: 'This contains bad words and inappropriate content',
        submittedBy: 'user-123',
        submittedByName: 'Test User',
        submittedByRole: 'AVOCAT',
        status: ModerationStatus.PENDING,
        priority: 'medium',
        autoModerationFlags: [{
          id: 'flag-123',
          rule: 'profanity_filter',
          severity: 'medium',
          confidence: 0.8,
          details: 'Mot-clé détecté: bad. Mot-clé détecté: inappropriate.',
          flaggedContent: 'bad inappropriate',
          suggestedAction: ModerationAction.FLAG,
          createdAt: new Date()
        }],
        manualReports: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await moderationService.createModerationItem(request, 'admin-123');

      expect(result.status).toBe(ModerationStatus.PENDING);
      expect(result.autoModerationFlags).toHaveLength(1);
      expect(result.autoModerationFlags[0].rule).toBe('profanity_filter');
    });

    it('should handle database errors', async () => {
      const request: CreateModerationItemRequest = {
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        contentTitle: 'Test Document',
        contentPreview: 'Test content',
        submittedBy: 'user-123'
      };

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(moderationService.createModerationItem(request, 'admin-123'))
        .rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getModerationItemById', () => {
    it('should return moderation item with flags and reports', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'item-123',
            content_type: 'document',
            content_id: 'doc-123',
            content_title: 'Test Document',
            content_preview: 'Test content',
            submitted_by: 'user-123',
            submitted_by_name: 'Test User',
            submitted_by_role: 'AVOCAT',
            status: 'pending',
            priority: 'medium',
            assigned_moderator: 'mod-123',
            assigned_moderator_name: 'Moderator',
            created_at: new Date(),
            updated_at: new Date()
          }]
        }) // Main query
        .mockResolvedValueOnce({
          rows: [{
            id: 'flag-123',
            rule: 'profanity_filter',
            severity: 'medium',
            confidence: 0.8,
            details: 'Test flag',
            flagged_content: 'test',
            suggested_action: 'flag',
            created_at: new Date()
          }]
        }) // Flags query
        .mockResolvedValueOnce({
          rows: [{
            id: 'report-123',
            reported_by: 'reporter-123',
            reporter_name: 'Reporter',
            reporter_role: 'AVOCAT',
            reason: 'inappropriate_content',
            description: 'This content is inappropriate',
            evidence: [],
            created_at: new Date()
          }]
        }); // Reports query

      const result = await moderationService.getModerationItemById('item-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('item-123');
      expect(result!.autoModerationFlags).toHaveLength(1);
      expect(result!.manualReports).toHaveLength(1);
    });

    it('should return null for non-existent item', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await moderationService.getModerationItemById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchModerationItems', () => {
    it('should search moderation items with criteria', async () => {
      const criteria: ModerationSearchCriteria = {
        status: ModerationStatus.PENDING,
        contentType: ContentType.DOCUMENT,
        priority: 'high',
        page: 1,
        limit: 10
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'item-123',
            content_type: 'document',
            content_id: 'doc-123',
            content_title: 'Test Document',
            content_preview: 'Test content',
            submitted_by: 'user-123',
            submitted_by_name: 'Test User',
            submitted_by_role: 'AVOCAT',
            status: 'pending',
            priority: 'high',
            created_at: new Date(),
            updated_at: new Date(),
            total_count: '1'
          }]
        }) // Main search query
        .mockResolvedValueOnce({ rows: [] }) // Flags for item
        .mockResolvedValueOnce({ rows: [] }); // Reports for item

      const result = await moderationService.searchModerationItems(criteria);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle empty search results', async () => {
      const criteria: ModerationSearchCriteria = {
        status: ModerationStatus.APPROVED
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await moderationService.searchModerationItems(criteria);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateModerationItem', () => {
    it('should update moderation item', async () => {
      const request: UpdateModerationItemRequest = {
        status: ModerationStatus.UNDER_REVIEW,
        assignedModerator: 'mod-456',
        priority: 'high',
        reviewNotes: 'Needs careful review'
      };

      // Mock existing item
      jest.spyOn(moderationService, 'getModerationItemById')
        .mockResolvedValueOnce({
          id: 'item-123',
          contentType: ContentType.DOCUMENT,
          contentId: 'doc-123',
          contentTitle: 'Test Document',
          contentPreview: 'Test content',
          submittedBy: 'user-123',
          submittedByName: 'Test User',
          submittedByRole: 'AVOCAT',
          status: ModerationStatus.PENDING,
          priority: 'medium',
          autoModerationFlags: [],
          manualReports: [],
          assignedModerator: 'mod-123',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .mockResolvedValueOnce({
          id: 'item-123',
          contentType: ContentType.DOCUMENT,
          contentId: 'doc-123',
          contentTitle: 'Test Document',
          contentPreview: 'Test content',
          submittedBy: 'user-123',
          submittedByName: 'Test User',
          submittedByRole: 'AVOCAT',
          status: ModerationStatus.UNDER_REVIEW,
          priority: 'high',
          autoModerationFlags: [],
          manualReports: [],
          assignedModerator: 'mod-456',
          reviewNotes: 'Needs careful review',
          createdAt: new Date(),
          updatedAt: new Date()
        });

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await moderationService.updateModerationItem('item-123', request, 'admin-123');

      expect(result.status).toBe(ModerationStatus.UNDER_REVIEW);
      expect(result.assignedModerator).toBe('mod-456');
      expect(result.priority).toBe('high');
      expect(result.reviewNotes).toBe('Needs careful review');
    });

    it('should throw error for non-existent item', async () => {
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue(null);

      const request: UpdateModerationItemRequest = {
        status: ModerationStatus.APPROVED
      };

      (mockClient.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // BEGIN

      await expect(moderationService.updateModerationItem('non-existent', request, 'admin-123'))
        .rejects.toThrow('Élément de modération non trouvé');
    });
  });

  describe('performModerationAction', () => {
    it('should perform approve action', async () => {
      const request: PerformModerationActionRequest = {
        action: ModerationAction.APPROVE,
        reason: 'Content is appropriate',
        notes: 'Approved after review'
      };

      // Mock existing item
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue({
        id: 'item-123',
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        contentTitle: 'Test Document',
        contentPreview: 'Test content',
        submittedBy: 'user-123',
        submittedByName: 'Test User',
        submittedByRole: 'AVOCAT',
        status: ModerationStatus.PENDING,
        priority: 'medium',
        autoModerationFlags: [],
        manualReports: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE moderation item
        .mockResolvedValueOnce({ rows: [] }) // INSERT moderation action
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await moderationService.performModerationAction('item-123', request, 'mod-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE moderation_items SET'),
        ['approved', 'mod-123', 'Approved after review', 'item-123']
      );
    });

    it('should perform reject action', async () => {
      const request: PerformModerationActionRequest = {
        action: ModerationAction.REJECT,
        reason: 'Content violates guidelines',
        notes: 'Contains inappropriate material'
      };

      // Mock existing item
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue({
        id: 'item-123',
        contentType: ContentType.COMMENT,
        contentId: 'comment-123',
        contentTitle: 'Test Comment',
        contentPreview: 'Test content',
        submittedBy: 'user-123',
        submittedByName: 'Test User',
        submittedByRole: 'AVOCAT',
        status: ModerationStatus.PENDING,
        priority: 'high',
        autoModerationFlags: [],
        manualReports: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE moderation item
        .mockResolvedValueOnce({ rows: [] }) // INSERT moderation action
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await moderationService.performModerationAction('item-123', request, 'mod-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE moderation_items SET'),
        ['rejected', 'mod-123', 'Contains inappropriate material', 'item-123']
      );
    });

    it('should throw error for invalid action', async () => {
      const request: PerformModerationActionRequest = {
        action: 'invalid_action' as ModerationAction,
        reason: 'Test reason'
      };

      // Mock existing item
      jest.spyOn(moderationService, 'getModerationItemById').mockResolvedValue({
        id: 'item-123',
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        contentTitle: 'Test Document',
        contentPreview: 'Test content',
        submittedBy: 'user-123',
        submittedByName: 'Test User',
        submittedByRole: 'AVOCAT',
        status: ModerationStatus.PENDING,
        priority: 'medium',
        autoModerationFlags: [],
        manualReports: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      (mockClient.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); // BEGIN

      await expect(moderationService.performModerationAction('item-123', request, 'mod-123'))
        .rejects.toThrow('Action de modération invalide');
    });
  });

  describe('createModerationReport', () => {
    it('should create report for existing moderation item', async () => {
      const request: CreateModerationReportRequest = {
        contentType: ContentType.DOCUMENT,
        contentId: 'doc-123',
        reason: ModerationReason.INAPPROPRIATE_CONTENT,
        description: 'This document contains inappropriate content',
        evidence: ['screenshot1.png', 'screenshot2.png']
      };

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-123' }] 
        }) // Check existing moderation item
        .mockResolvedValueOnce({ rows: [] }) // INSERT moderation report
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await moderationService.createModerationReport(request, 'user-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_reports'),
        ['item-123', 'user-123', 'inappropriate_content', 'This document contains inappropriate content', ['screenshot1.png', 'screenshot2.png']]
      );
    });

    it('should create new moderation item if none exists', async () => {
      const request: CreateModerationReportRequest = {
        contentType: ContentType.COMMENT,
        contentId: 'comment-456',
        reason: ModerationReason.SPAM,
        description: 'This is spam content'
      };

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Check existing moderation item (none found)
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-456' }] 
        }) // INSERT new moderation item
        .mockResolvedValueOnce({ rows: [] }) // INSERT moderation report
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await moderationService.createModerationReport(request, 'user-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO moderation_items'),
        ['comment', 'comment-456', 'Contenu signalé', 'Contenu signalé par un utilisateur', 'user-123', 'flagged', 'high']
      );
    });
  });

  describe('getModerationQueue', () => {
    it('should return moderation queue for all moderators', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'item-123',
            content_type: 'document',
            content_id: 'doc-123',
            content_title: 'Test Document',
            content_preview: 'Test content',
            submitted_by: 'user-123',
            submitted_by_name: 'Test User',
            submitted_by_role: 'AVOCAT',
            status: 'pending',
            priority: 'high',
            created_at: new Date(),
            updated_at: new Date()
          }]
        }) // Main queue query
        .mockResolvedValueOnce({ rows: [] }) // Flags for item
        .mockResolvedValueOnce({ rows: [] }); // Reports for item

      const result = await moderationService.getModerationQueue();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.highPriority).toBe(1);
    });

    it('should return moderation queue for specific moderator', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'item-123',
            content_type: 'document',
            content_id: 'doc-123',
            content_title: 'Test Document',
            content_preview: 'Test content',
            submitted_by: 'user-123',
            submitted_by_name: 'Test User',
            submitted_by_role: 'AVOCAT',
            status: 'under_review',
            priority: 'medium',
            assigned_moderator: 'mod-123',
            created_at: new Date(),
            updated_at: new Date()
          }]
        }) // Main queue query
        .mockResolvedValueOnce({ rows: [] }) // Flags for item
        .mockResolvedValueOnce({ rows: [] }); // Reports for item

      const result = await moderationService.getModerationQueue('mod-123');

      expect(result.items).toHaveLength(1);
      expect(result.underReview).toBe(1);
    });
  });

  describe('getModerationStatistics', () => {
    it('should return comprehensive moderation statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            stats: {
              totalItems: 100,
              pendingItems: 25,
              approvedItems: 60,
              rejectedItems: 10,
              flaggedItems: 5,
              averageReviewTime: 45.5
            }
          }]
        }) // Base statistics
        .mockResolvedValueOnce({
          rows: [{
            moderator_id: 'mod-123',
            moderator_name: 'Test Moderator',
            assigned_items: '10',
            completed_items: '8',
            average_review_time: '30.5'
          }]
        }) // Moderator workload
        .mockResolvedValueOnce({
          rows: [
            { content_type: 'document', count: '50' },
            { content_type: 'comment', count: '30' },
            { content_type: 'template', count: '20' }
          ]
        }) // Content type breakdown
        .mockResolvedValueOnce({
          rows: [
            { reason: 'inappropriate_content', count: '15' },
            { reason: 'spam', count: '10' }
          ]
        }) // Reason breakdown
        .mockResolvedValueOnce({
          rows: [{
            date: '2024-01-15',
            total_submissions: '20',
            auto_approved: '15',
            manual_reviews: '5',
            rejections: '2',
            average_review_time: '25.0'
          }]
        }); // Trends

      const result = await moderationService.getModerationStatistics();

      expect(result.totalItems).toBe(100);
      expect(result.pendingItems).toBe(25);
      expect(result.moderatorWorkload).toHaveLength(1);
      expect(result.contentTypeBreakdown.document).toBe(50);
      expect(result.reasonBreakdown.inappropriate_content).toBe(15);
      expect(result.trendsOverTime).toHaveLength(1);
    });
  });

  describe('getModerationDashboard', () => {
    it('should return complete moderation dashboard', async () => {
      // Mock all dashboard components
      jest.spyOn(moderationService, 'getModerationQueue').mockResolvedValue({
        items: [],
        total: 0,
        pending: 0,
        underReview: 0,
        flagged: 0,
        highPriority: 0
      });

      jest.spyOn(moderationService, 'getModerationStatistics').mockResolvedValue({
        totalItems: 100,
        pendingItems: 25,
        approvedItems: 60,
        rejectedItems: 10,
        flaggedItems: 5,
        averageReviewTime: 45.5,
        autoModerationAccuracy: 92,
        moderatorWorkload: [],
        contentTypeBreakdown: {},
        reasonBreakdown: {},
        trendsOverTime: []
      });

      // Mock private methods
      (moderationService as any).getMyAssignedItems = jest.fn().mockResolvedValue([]);
      (moderationService as any).getRecentModerationActions = jest.fn().mockResolvedValue([]);
      (moderationService as any).getModerationAlerts = jest.fn().mockResolvedValue([]);

      const result = await moderationService.getModerationDashboard('mod-123');

      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('statistics');
      expect(result).toHaveProperty('myAssignedItems');
      expect(result).toHaveProperty('recentActions');
      expect(result).toHaveProperty('alerts');
    });
  });
});