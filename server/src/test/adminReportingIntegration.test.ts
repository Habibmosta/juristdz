import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { createAdminRoutes } from '../routes/admin.js';
import { AdminReportType } from '../services/adminService.js';
import { Profession } from '../types/auth.js';

// Mock dependencies
jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      id: 'admin-user-id',
      email: 'admin@test.com',
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

describe('Admin Reporting Routes Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', createAdminRoutes(mockDb));
    jest.clearAllMocks();
  });

  describe('GET /api/admin/statistics/platform', () => {
    it('should return complete platform statistics', async () => {
      // Mock all the database queries for platform statistics
      (mockDb.query as jest.Mock)
        // User statistics
        .mockResolvedValueOnce({
          rows: [{
            total_users: '100',
            active_users: '85',
            recent_registrations: '15',
            locked_users: '1',
            unverified_users: '5'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { role: Profession.AVOCAT, count: '40' },
            { role: Profession.NOTAIRE, count: '25' }
          ]
        })
        // Usage statistics
        .mockResolvedValueOnce({
          rows: [{
            total_sessions: '400',
            active_sessions: '30',
            avg_session_duration: '1500'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            daily_active: '50',
            weekly_active: '80',
            monthly_active: '100',
            total_documents: '200',
            total_searches: '600',
            total_ai_requests: '300'
          }]
        })
        // Performance statistics
        .mockResolvedValueOnce({
          rows: [{
            error_count: '3',
            total_requests: '500'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '200',
            ai_success_rate: '99.0',
            total_ai_cost: '100.00'
          }]
        })
        // Financial statistics
        .mockResolvedValueOnce({
          rows: [{
            total_invoices: '60',
            paid_invoices: '55',
            pending_invoices: '5',
            total_revenue: '12000.00',
            avg_invoice_amount: '200.00'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { subscription_tier: 'basic', tier_count: '50' },
            { subscription_tier: 'premium', tier_count: '30' }
          ]
        })
        // Content statistics
        .mockResolvedValueOnce({
          rows: [
            { document_type: 'contract', type_count: '100' },
            { document_type: 'legal_brief', type_count: '80' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{ total_templates: '40' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cases: '90' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { search_query: 'droit commercial', query_count: '100' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2024-01-15', count: '20' }
          ]
        });

      const response = await request(app)
        .get('/api/admin/statistics/platform')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('usage');
      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data).toHaveProperty('financial');
      expect(response.body.data).toHaveProperty('content');

      expect(response.body.data.users.totalUsers).toBe(100);
      expect(response.body.data.usage.totalSessions).toBe(400);
      expect(response.body.data.performance.errorRate).toBe(0.6);
      expect(response.body.data.financial.totalRevenue).toBe(12000);
      expect(response.body.data.content.totalDocuments).toBe(180);
    });

    it('should handle database errors', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/statistics/platform')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/statistics/usage', () => {
    it('should return usage statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_sessions: '250',
            active_sessions: '20',
            avg_session_duration: '1800'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            daily_active: '40',
            weekly_active: '70',
            monthly_active: '90',
            total_documents: '150',
            total_searches: '500',
            total_ai_requests: '200'
          }]
        });

      const response = await request(app)
        .get('/api/admin/statistics/usage')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSessions).toBe(250);
      expect(response.body.data.dailyActiveUsers).toBe(40);
      expect(response.body.data.totalDocumentsGenerated).toBe(150);
    });
  });

  describe('GET /api/admin/statistics/performance', () => {
    it('should return performance statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            error_count: '5',
            total_requests: '1000'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '300',
            ai_success_rate: '98.5',
            total_ai_cost: '175.25'
          }]
        });

      const response = await request(app)
        .get('/api/admin/statistics/performance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.errorRate).toBe(0.5);
      expect(response.body.data.successRate).toBe(99.5);
      expect(response.body.data.aiPerformance.averageResponseTime).toBe(300);
    });
  });

  describe('GET /api/admin/statistics/financial', () => {
    it('should return financial statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_invoices: '80',
            paid_invoices: '75',
            pending_invoices: '5',
            total_revenue: '20000.00',
            avg_invoice_amount: '250.00'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { subscription_tier: 'basic', tier_count: '60' },
            { subscription_tier: 'premium', tier_count: '20' }
          ]
        });

      const response = await request(app)
        .get('/api/admin/statistics/financial')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRevenue).toBe(20000);
      expect(response.body.data.subscriptionsByTier.basic).toBe(60);
    });
  });

  describe('GET /api/admin/statistics/content', () => {
    it('should return content statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { document_type: 'contract', type_count: '120' },
            { document_type: 'judgment', type_count: '80' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{ total_templates: '45' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cases: '150' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { search_query: 'contrat commercial', query_count: '150' },
            { search_query: 'droit civil', query_count: '120' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2024-01-15', count: '30' },
            { date: '2024-01-14', count: '25' }
          ]
        });

      const response = await request(app)
        .get('/api/admin/statistics/content')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDocuments).toBe(200);
      expect(response.body.data.totalTemplates).toBe(45);
      expect(response.body.data.popularSearchTerms).toHaveLength(2);
    });
  });

  describe('GET /api/admin/system/health', () => {
    it('should return system health report', async () => {
      const response = await request(app)
        .get('/api/admin/system/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('recommendations');

      expect(response.body.data.services).toHaveLength(4);
      expect(response.body.data.services[0].name).toBe('Database');
    });
  });

  describe('POST /api/admin/reports/generate', () => {
    it('should generate user activity report', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            role: Profession.AVOCAT,
            total_users: '30',
            active_users: '25',
            total_actions: '300',
            users_with_activity: '20'
          }
        ]
      });

      const response = await request(app)
        .post('/api/admin/reports/generate')
        .send({
          reportType: AdminReportType.USER_ACTIVITY,
          parameters: {
            dateFrom: '2024-01-01',
            dateTo: '2024-01-31'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportType).toBe('User Activity Report');
      expect(response.body.data.data).toHaveLength(1);
    });

    it('should generate system performance report', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            error_count: '2',
            total_requests: '400'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '250',
            ai_success_rate: '99.5',
            total_ai_cost: '125.00'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              hour: '2024-01-15 15:00:00',
              requests: '40',
              avg_response_time: '240',
              successful_requests: '39'
            }
          ]
        });

      const response = await request(app)
        .post('/api/admin/reports/generate')
        .send({
          reportType: AdminReportType.SYSTEM_PERFORMANCE,
          parameters: {
            dateFrom: '2024-01-15',
            dateTo: '2024-01-16'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reportType).toBe('System Performance Report');
      expect(response.body.data.hourlyBreakdown).toHaveLength(1);
    });

    it('should return error for missing report type', async () => {
      const response = await request(app)
        .post('/api/admin/reports/generate')
        .send({
          parameters: {}
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Type de rapport requis');
    });

    it('should return error for invalid report type', async () => {
      const response = await request(app)
        .post('/api/admin/reports/generate')
        .send({
          reportType: 'INVALID_TYPE',
          parameters: {}
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Type de rapport invalide');
    });
  });

  describe('GET /api/admin/reports/types', () => {
    it('should return available report types', async () => {
      const response = await request(app)
        .get('/api/admin/reports/types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(7); // All AdminReportType values
      
      const reportTypes = response.body.data.map((type: any) => type.value);
      expect(reportTypes).toContain(AdminReportType.USER_ACTIVITY);
      expect(reportTypes).toContain(AdminReportType.SYSTEM_PERFORMANCE);
      expect(reportTypes).toContain(AdminReportType.FINANCIAL_SUMMARY);
      expect(reportTypes).toContain(AdminReportType.CONTENT_ANALYTICS);
      expect(reportTypes).toContain(AdminReportType.SECURITY_AUDIT);
      expect(reportTypes).toContain(AdminReportType.AI_USAGE);
      expect(reportTypes).toContain(AdminReportType.CUSTOM);

      // Check that each type has proper formatting
      const userActivityType = response.body.data.find((type: any) => type.value === AdminReportType.USER_ACTIVITY);
      expect(userActivityType.label).toBe('User Activity');
      expect(userActivityType.description).toContain('activité des utilisateurs');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/admin/statistics/usage')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid parameters in report generation', async () => {
      const response = await request(app)
        .post('/api/admin/reports/generate')
        .send({
          reportType: AdminReportType.USER_ACTIVITY,
          parameters: {
            invalidParam: 'invalid'
          }
        })
        .expect(200); // Should still work, just ignore invalid params

      expect(response.body.success).toBe(true);
    });
  });
});