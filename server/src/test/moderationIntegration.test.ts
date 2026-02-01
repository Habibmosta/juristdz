import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createModerationRoutes } from '../routes/moderation.js';
import { 
  ContentType, 
  ModerationStatus, 
  ModerationReason,
  ModerationAction
} from '../types/moderation.js';
import { Profession } from '../types/auth.js';

// Mock dependencies
jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: Profession.ADMIN
    };
    next();
  }
}));

jest.mock('../middleware/rbacMiddleware.js', () => ({
  checkPermission: (permission: string) => (req: any, res: any, next: any) => next()
}));

// Mock database
const mockDb = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
} as unknown as Pool;

describe('Moderation Routes Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/moderation', createModerationRoutes(mockDb));
    jest.clearAllMocks();
  });

  describe('GET /api/moderation/queue', () => {
    it('should return moderation queue', async () => {
      // Mock moderation queue data
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
        })
        .mockResolvedValueOnce({ rows: [] }) // Auto flags
        .mockResolvedValueOnce({ rows: [] }); // Manual reports

      const response = await request(app)
        .get('/api/moderation/queue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.pending).toBe(1);
      expect(response.body.data.highPriority).toBe(1);
    });

    it('should return queue for specific moderator', async () => {
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
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/moderation/queue?moderatorId=mod-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.underReview).toBe(1);
    });
  });

  describe('GET /api/moderation/dashboard', () => {
    it('should return moderation dashboard', async () => {
      // Mock all dashboard queries
      (mockDb.query as jest.Mock)
        // Queue query
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
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }) // Reports
        // Statistics queries
        .mockResolvedValueOnce({
          rows: [{
            stats: {
              totalItems: 50,
              pendingItems: 10,
              approvedItems: 30,
              rejectedItems: 5,
              flaggedItems: 5,
              averageReviewTime: 30.5
            }
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Moderator workload
        .mockResolvedValueOnce({ rows: [] }) // Content type breakdown
        .mockResolvedValueOnce({ rows: [] }) // Reason breakdown
        .mockResolvedValueOnce({ rows: [] }) // Trends
        // My assigned items (same as queue)
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
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }) // Reports
        // Recent actions
        .mockResolvedValueOnce({
          rows: [{
            id: 'action-123',
            moderation_item_id: 'item-123',
            action: 'approve',
            performed_by: 'user-123',
            performed_by_name: 'Test User',
            reason: 'Content is appropriate',
            notes: 'Approved after review',
            created_at: new Date()
          }]
        })
        // Alerts
        .mockResolvedValueOnce({
          rows: [{
            id: 'alert-123',
            type: 'high_priority_item',
            message: 'High priority item needs attention',
            moderation_item_id: 'item-123',
            created_at: new Date(),
            acknowledged: false
          }]
        });

      const response = await request(app)
        .get('/api/moderation/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('queue');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('myAssignedItems');
      expect(response.body.data).toHaveProperty('recentActions');
      expect(response.body.data).toHaveProperty('alerts');
    });
  });

  describe('GET /api/moderation/items', () => {
    it('should search moderation items', async () => {
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
            created_at: new Date(),
            updated_at: new Date(),
            total_count: '1'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }); // Reports

      const response = await request(app)
        .get('/api/moderation/items?status=pending&contentType=document')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });

    it('should handle search with pagination', async () => {
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
            created_at: new Date(),
            updated_at: new Date(),
            total_count: '25'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/moderation/items?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.totalPages).toBe(3);
    });
  });

  describe('POST /api/moderation/items', () => {
    it('should create moderation item', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock auto-moderation and creation
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Auto-moderation rules
        .mockResolvedValueOnce({ rows: [{ id: 'workflow-123' }] }) // Default workflow
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-123', status: 'approved' }] 
        }) // Insert item
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      // Mock getModerationItemById
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 'item-123',
            content_type: 'document',
            content_id: 'doc-123',
            content_title: 'Test Document',
            content_preview: 'Clean content',
            submitted_by: 'user-123',
            submitted_by_name: 'Test User',
            submitted_by_role: 'AVOCAT',
            status: 'approved',
            priority: 'medium',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }); // Reports

      const response = await request(app)
        .post('/api/moderation/items')
        .send({
          contentType: ContentType.DOCUMENT,
          contentId: 'doc-123',
          contentTitle: 'Test Document',
          contentPreview: 'Clean content',
          submittedBy: 'user-123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('item-123');
      expect(response.body.data.status).toBe('approved');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/moderation/items')
        .send({
          contentType: ContentType.DOCUMENT,
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obligatoires');
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post('/api/moderation/items')
        .send({
          contentType: 'invalid_type',
          contentId: 'doc-123',
          contentTitle: 'Test Document',
          submittedBy: 'user-123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });
  });

  describe('GET /api/moderation/items/:itemId', () => {
    it('should return moderation item by ID', async () => {
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
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }); // Reports

      const response = await request(app)
        .get('/api/moderation/items/item-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('item-123');
    });

    it('should return 404 for non-existent item', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/moderation/items/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non trouvé');
    });
  });

  describe('PUT /api/moderation/items/:itemId', () => {
    it('should update moderation item', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock existing item check
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
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }) // Reports
        // Updated item
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
            priority: 'high',
            assigned_moderator: 'mod-456',
            review_notes: 'Needs attention',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }); // Reports

      // Mock update transaction
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .put('/api/moderation/items/item-123')
        .send({
          status: ModerationStatus.UNDER_REVIEW,
          assignedModerator: 'mod-456',
          priority: 'high',
          reviewNotes: 'Needs attention'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('under_review');
      expect(response.body.data.priority).toBe('high');
    });

    it('should validate status', async () => {
      const response = await request(app)
        .put('/api/moderation/items/item-123')
        .send({
          status: 'invalid_status'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });
  });

  describe('POST /api/moderation/items/:itemId/actions', () => {
    it('should perform moderation action', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock existing item
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
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Flags
        .mockResolvedValueOnce({ rows: [] }); // Reports

      // Mock action transaction
      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE item
        .mockResolvedValueOnce({ rows: [] }) // INSERT action
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/moderation/items/item-123/actions')
        .send({
          action: ModerationAction.APPROVE,
          reason: 'Content is appropriate',
          notes: 'Approved after review'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('succès');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/moderation/items/item-123/actions')
        .send({
          // Missing action and reason
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obligatoires');
    });
  });

  describe('POST /api/moderation/reports', () => {
    it('should create moderation report', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValue(mockClient);

      (mockClient.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ 
          rows: [{ id: 'item-123' }] 
        }) // Check existing item
        .mockResolvedValueOnce({ rows: [] }) // INSERT report
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const response = await request(app)
        .post('/api/moderation/reports')
        .send({
          contentType: ContentType.COMMENT,
          contentId: 'comment-123',
          reason: ModerationReason.INAPPROPRIATE_CONTENT,
          description: 'This comment is inappropriate',
          evidence: ['screenshot.png']
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('succès');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/moderation/reports')
        .send({
          contentType: ContentType.COMMENT,
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('obligatoires');
    });

    it('should validate content type', async () => {
      const response = await request(app)
        .post('/api/moderation/reports')
        .send({
          contentType: 'invalid_type',
          contentId: 'comment-123',
          reason: ModerationReason.SPAM,
          description: 'Test description'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });

    it('should validate reason', async () => {
      const response = await request(app)
        .post('/api/moderation/reports')
        .send({
          contentType: ContentType.COMMENT,
          contentId: 'comment-123',
          reason: 'invalid_reason',
          description: 'Test description'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('invalide');
    });
  });

  describe('GET /api/moderation/statistics', () => {
    it('should return moderation statistics', async () => {
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
        })
        .mockResolvedValueOnce({ rows: [] }) // Moderator workload
        .mockResolvedValueOnce({ rows: [] }) // Content type breakdown
        .mockResolvedValueOnce({ rows: [] }) // Reason breakdown
        .mockResolvedValueOnce({ rows: [] }); // Trends

      const response = await request(app)
        .get('/api/moderation/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalItems).toBe(100);
      expect(response.body.data.pendingItems).toBe(25);
    });

    it('should handle date range parameters', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            stats: {
              totalItems: 50,
              pendingItems: 10,
              approvedItems: 35,
              rejectedItems: 3,
              flaggedItems: 2,
              averageReviewTime: 30.0
            }
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/moderation/statistics?dateFrom=2024-01-01&dateTo=2024-01-31')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalItems).toBe(50);
    });
  });

  describe('GET /api/moderation/content-types', () => {
    it('should return content types', async () => {
      const response = await request(app)
        .get('/api/moderation/content-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(6); // All ContentType values
      
      const contentTypes = response.body.data.map((type: any) => type.value);
      expect(contentTypes).toContain(ContentType.DOCUMENT);
      expect(contentTypes).toContain(ContentType.COMMENT);
      expect(contentTypes).toContain(ContentType.TEMPLATE);
    });
  });

  describe('GET /api/moderation/reasons', () => {
    it('should return moderation reasons', async () => {
      const response = await request(app)
        .get('/api/moderation/reasons')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(8); // All ModerationReason values
      
      const reasons = response.body.data.map((reason: any) => reason.value);
      expect(reasons).toContain(ModerationReason.INAPPROPRIATE_CONTENT);
      expect(reasons).toContain(ModerationReason.SPAM);
      expect(reasons).toContain(ModerationReason.PLAGIARISM);
    });
  });

  describe('GET /api/moderation/statuses', () => {
    it('should return moderation statuses', async () => {
      const response = await request(app)
        .get('/api/moderation/statuses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5); // All ModerationStatus values
      
      const statuses = response.body.data.map((status: any) => status.value);
      expect(statuses).toContain(ModerationStatus.PENDING);
      expect(statuses).toContain(ModerationStatus.APPROVED);
      expect(statuses).toContain(ModerationStatus.REJECTED);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/moderation/queue')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors in dashboard', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/moderation/dashboard')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});