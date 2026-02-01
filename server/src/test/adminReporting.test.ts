import { Pool } from 'pg';
import { AdminService, AdminReportType } from '../services/adminService.js';
import { Profession } from '../types/auth.js';

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

describe('AdminService - Reporting System', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService(mockDb);
    jest.clearAllMocks();
  });

  describe('Platform Statistics', () => {
    it('should get complete platform statistics', async () => {
      // Mock user statistics
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_users: '150',
            active_users: '120',
            recent_registrations: '25',
            locked_users: '2',
            unverified_users: '8'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { role: Profession.AVOCAT, count: '50' },
            { role: Profession.NOTAIRE, count: '30' },
            { role: Profession.HUISSIER, count: '20' }
          ]
        })
        // Mock usage statistics
        .mockResolvedValueOnce({
          rows: [{
            total_sessions: '500',
            active_sessions: '45',
            avg_session_duration: '1800'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            daily_active: '80',
            weekly_active: '120',
            monthly_active: '150',
            total_documents: '300',
            total_searches: '1200',
            total_ai_requests: '450'
          }]
        })
        // Mock performance statistics
        .mockResolvedValueOnce({
          rows: [{
            error_count: '5',
            total_requests: '1000'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '250',
            ai_success_rate: '98.5',
            total_ai_cost: '125.50'
          }]
        })
        // Mock financial statistics
        .mockResolvedValueOnce({
          rows: [{
            total_invoices: '85',
            paid_invoices: '78',
            pending_invoices: '7',
            total_revenue: '15750.00',
            avg_invoice_amount: '201.92'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { subscription_tier: 'basic', tier_count: '60' },
            { subscription_tier: 'premium', tier_count: '40' },
            { subscription_tier: 'enterprise', tier_count: '10' }
          ]
        })
        // Mock content statistics
        .mockResolvedValueOnce({
          rows: [
            { document_type: 'contract', type_count: '150' },
            { document_type: 'legal_brief', type_count: '100' },
            { document_type: 'judgment', type_count: '75' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{ total_templates: '45' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cases: '120' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { search_query: 'droit commercial', query_count: '150' },
            { search_query: 'code civil', query_count: '120' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2024-01-15', count: '25' },
            { date: '2024-01-14', count: '30' }
          ]
        });

      const statistics = await adminService.getPlatformStatistics();

      expect(statistics).toHaveProperty('users');
      expect(statistics).toHaveProperty('usage');
      expect(statistics).toHaveProperty('performance');
      expect(statistics).toHaveProperty('financial');
      expect(statistics).toHaveProperty('content');

      expect(statistics.users.totalUsers).toBe(150);
      expect(statistics.users.activeUsers).toBe(120);
      expect(statistics.users.usersByRole[Profession.AVOCAT]).toBe(50);

      expect(statistics.usage.totalSessions).toBe(500);
      expect(statistics.usage.dailyActiveUsers).toBe(80);

      expect(statistics.performance.errorRate).toBe(0.5);
      expect(statistics.performance.aiPerformance.successRate).toBe(98.5);

      expect(statistics.financial.totalRevenue).toBe(15750);
      expect(statistics.financial.subscriptionsByTier.basic).toBe(60);

      expect(statistics.content.totalDocuments).toBe(325);
      expect(statistics.content.popularSearchTerms).toHaveLength(2);
    });

    it('should handle database errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(adminService.getPlatformStatistics()).rejects.toThrow('Database connection failed');
    });
  });

  describe('System Health Report', () => {
    it('should generate system health report', async () => {
      const healthReport = await adminService.getSystemHealthReport();

      expect(healthReport).toHaveProperty('status');
      expect(healthReport).toHaveProperty('uptime');
      expect(healthReport).toHaveProperty('services');
      expect(healthReport).toHaveProperty('alerts');
      expect(healthReport).toHaveProperty('recommendations');

      expect(healthReport.services).toHaveLength(4);
      expect(healthReport.services[0]).toHaveProperty('name', 'Database');
      expect(healthReport.services[0]).toHaveProperty('status', 'healthy');

      expect(healthReport.alerts).toHaveLength(1);
      expect(healthReport.recommendations).toHaveLength(3);
    });

    it('should determine overall status correctly', async () => {
      const healthReport = await adminService.getSystemHealthReport();

      // Should be 'warning' because email service has warning status
      expect(healthReport.status).toBe('warning');
    });
  });

  describe('Custom Report Generation', () => {
    it('should generate user activity report', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            role: Profession.AVOCAT,
            total_users: '50',
            active_users: '45',
            total_actions: '500',
            users_with_activity: '40'
          },
          {
            role: Profession.NOTAIRE,
            total_users: '30',
            active_users: '25',
            total_actions: '300',
            users_with_activity: '22'
          }
        ]
      });

      const report = await adminService.generateCustomReport(
        AdminReportType.USER_ACTIVITY,
        {
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31')
        }
      );

      expect(report.reportType).toBe('User Activity Report');
      expect(report.data).toHaveLength(2);
      expect(report.summary.totalUsers).toBe(80);
      expect(report.summary.activeUsers).toBe(70);
      expect(report.summary.totalActions).toBe(800);
    });

    it('should generate system performance report', async () => {
      // Mock performance statistics
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            error_count: '10',
            total_requests: '1000'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '300',
            ai_success_rate: '97.5',
            total_ai_cost: '200.00'
          }]
        })
        // Mock hourly breakdown
        .mockResolvedValueOnce({
          rows: [
            {
              hour: '2024-01-15 14:00:00',
              requests: '50',
              avg_response_time: '250',
              successful_requests: '48'
            },
            {
              hour: '2024-01-15 13:00:00',
              requests: '45',
              avg_response_time: '280',
              successful_requests: '44'
            }
          ]
        });

      const report = await adminService.generateCustomReport(
        AdminReportType.SYSTEM_PERFORMANCE,
        {
          dateFrom: new Date('2024-01-15'),
          dateTo: new Date('2024-01-16')
        }
      );

      expect(report.reportType).toBe('System Performance Report');
      expect(report.overview).toHaveProperty('errorRate', 1);
      expect(report.hourlyBreakdown).toHaveLength(2);
      expect(report.recommendations).toHaveLength(3);
    });

    it('should generate financial summary report', async () => {
      // Mock financial statistics
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_invoices: '100',
            paid_invoices: '90',
            pending_invoices: '10',
            total_revenue: '25000.00',
            avg_invoice_amount: '250.00'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { subscription_tier: 'basic', tier_count: '70' },
            { subscription_tier: 'premium', tier_count: '25' },
            { subscription_tier: 'enterprise', tier_count: '5' }
          ]
        });

      const report = await adminService.generateCustomReport(
        AdminReportType.FINANCIAL_SUMMARY,
        {}
      );

      expect(report.reportType).toBe('Financial Summary Report');
      expect(report.data.totalRevenue).toBe(25000);
      expect(report.data.subscriptionsByTier.basic).toBe(70);
      expect(report.trends).toHaveProperty('revenueGrowth');
      expect(report.trends).toHaveProperty('newSubscriptions');
    });

    it('should generate content analytics report', async () => {
      // Mock content statistics
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { document_type: 'contract', type_count: '200' },
            { document_type: 'legal_brief', type_count: '150' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{ total_templates: '50' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cases: '180' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { search_query: 'contrat commercial', query_count: '200' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2024-01-15', count: '35' }
          ]
        });

      const report = await adminService.generateCustomReport(
        AdminReportType.CONTENT_ANALYTICS,
        {}
      );

      expect(report.reportType).toBe('Content Analytics Report');
      expect(report.data.totalDocuments).toBe(350);
      expect(report.data.totalTemplates).toBe(50);
      expect(report.insights).toHaveLength(3);
    });

    it('should generate security audit report', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            action: 'LOGIN_FAILED',
            event_count: '25',
            unique_users: '15',
            unique_ips: '12'
          },
          {
            action: 'ACCOUNT_LOCKED',
            event_count: '3',
            unique_users: '3',
            unique_ips: '3'
          }
        ]
      });

      const report = await adminService.generateCustomReport(
        AdminReportType.SECURITY_AUDIT,
        {}
      );

      expect(report.reportType).toBe('Security Audit Report');
      expect(report.securityEvents).toHaveLength(2);
      expect(report.alerts).toHaveLength(3);
    });

    it('should generate AI usage report', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            model_name: 'GPT-4 Legal',
            domain_juridique: 'DROIT_COMMERCIAL',
            total_requests: '150',
            avg_response_time: '300',
            total_cost: '75.50',
            successful_requests: '148'
          },
          {
            model_name: 'Claude Legal',
            domain_juridique: 'DROIT_CIVIL',
            total_requests: '100',
            avg_response_time: '250',
            total_cost: '45.25',
            successful_requests: '99'
          }
        ]
      });

      const report = await adminService.generateCustomReport(
        AdminReportType.AI_USAGE,
        {}
      );

      expect(report.reportType).toBe('AI Usage Report');
      expect(report.modelUsage).toHaveLength(2);
      expect(report.summary.totalRequests).toBe(250);
      expect(report.summary.totalCost).toBe(120.75);
      expect(report.summary.averageResponseTime).toBe(275);
    });

    it('should throw error for unsupported report type', async () => {
      await expect(
        adminService.generateCustomReport('INVALID_TYPE' as AdminReportType, {})
      ).rejects.toThrow('Type de rapport non supporté');
    });
  });

  describe('Individual Statistics Methods', () => {
    it('should get usage statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_sessions: '300',
            active_sessions: '25',
            avg_session_duration: '2400'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            daily_active: '60',
            weekly_active: '100',
            monthly_active: '130',
            total_documents: '250',
            total_searches: '800',
            total_ai_requests: '350'
          }]
        });

      const stats = await adminService.getUsageStatistics();

      expect(stats.totalSessions).toBe(300);
      expect(stats.activeSessions).toBe(25);
      expect(stats.averageSessionDuration).toBe(2400);
      expect(stats.dailyActiveUsers).toBe(60);
      expect(stats.totalDocumentsGenerated).toBe(250);
    });

    it('should get performance statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            error_count: '8',
            total_requests: '800'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            avg_ai_response_time: '275',
            ai_success_rate: '98.2',
            total_ai_cost: '150.75'
          }]
        });

      const stats = await adminService.getPerformanceStatistics();

      expect(stats.errorRate).toBe(1);
      expect(stats.successRate).toBe(99);
      expect(stats.aiPerformance.averageResponseTime).toBe(275);
      expect(stats.aiPerformance.successRate).toBe(98.2);
    });

    it('should get financial statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_invoices: '120',
            paid_invoices: '110',
            pending_invoices: '10',
            total_revenue: '30000.00',
            avg_invoice_amount: '250.00'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { subscription_tier: 'basic', tier_count: '80' },
            { subscription_tier: 'premium', tier_count: '30' }
          ]
        });

      const stats = await adminService.getFinancialStatistics();

      expect(stats.totalRevenue).toBe(30000);
      expect(stats.totalInvoices).toBe(120);
      expect(stats.paidInvoices).toBe(110);
      expect(stats.subscriptionsByTier.basic).toBe(80);
    });

    it('should get content statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            { document_type: 'contract', type_count: '180' },
            { document_type: 'judgment', type_count: '120' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [{ total_templates: '55' }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cases: '200' }]
        })
        .mockResolvedValueOnce({
          rows: [
            { search_query: 'droit des contrats', query_count: '180' },
            { search_query: 'procédure civile', query_count: '150' }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { date: '2024-01-15', count: '40' },
            { date: '2024-01-14', count: '35' }
          ]
        });

      const stats = await adminService.getContentStatistics();

      expect(stats.totalDocuments).toBe(300);
      expect(stats.documentsByType.contract).toBe(180);
      expect(stats.totalTemplates).toBe(55);
      expect(stats.totalCases).toBe(200);
      expect(stats.popularSearchTerms).toHaveLength(2);
      expect(stats.documentGenerationTrends).toHaveLength(2);
    });
  });
});