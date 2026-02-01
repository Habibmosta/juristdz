import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { reportService } from '@/services/reportService';
import { db } from '@/database/connection';
import reportRoutes from '@/routes/reports';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import {
  ReportType,
  ReportFormat,
  ReportStatus,
  CreateReportRequest
} from '@/types/report';

// Mock dependencies
jest.mock('@/database/connection');
jest.mock('@/services/reportService');
jest.mock('@/middleware/auth');
jest.mock('@/middleware/rbacMiddleware');
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockReportService = reportService as jest.Mocked<typeof reportService>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockRbacMiddleware = rbacMiddleware as jest.MockedFunction<typeof rbacMiddleware>;

describe('Report System Integration Tests', () => {
  let app: express.Application;
  const mockUser = {
    id: 'user-123',
    email: 'lawyer@test.com',
    role: 'Avocat',
    organizationId: 'org-456'
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock middleware to pass through with user context
    mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    mockRbacMiddleware.mockImplementation((permissions: string[]) => {
      return (req: any, res: any, next: any) => {
        req.user = mockUser;
        next();
      };
    });

    app.use('/api/reports', reportRoutes);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Integration Test: Report Generation Workflow
   * Validates: Requirements 5.5 - Complete report generation workflow
   */
  describe('Report Generation Workflow', () => {
    it('should create a case activity report successfully', async () => {
      const reportData: CreateReportRequest = {
        title: 'Monthly Case Activity Report',
        description: 'Detailed analysis of case activities for January 2024',
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        parameters: {
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31')
          },
          groupBy: 'month' as any,
          sortBy: 'date' as any,
          sortOrder: 'desc'
        },
        scheduleGeneration: true,
        expirationDays: 30
      };

      const mockReport = {
        id: 'report-123',
        title: reportData.title,
        description: reportData.description,
        type: reportData.type,
        format: reportData.format,
        status: ReportStatus.PENDING,
        parameters: reportData.parameters,
        generatedBy: mockUser.id,
        organizationId: mockUser.organizationId,
        downloadCount: 0,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockReportService.generateReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(mockReport.id);
      expect(response.body.data.title).toBe(reportData.title);
      expect(response.body.data.type).toBe(reportData.type);
      expect(response.body.data.format).toBe(reportData.format);
      expect(response.body.data.status).toBe(ReportStatus.PENDING);

      expect(mockReportService.generateReport).toHaveBeenCalledWith(
        reportData,
        mockUser.id,
        mockUser.organizationId
      );
    });

    it('should generate case activity report data', async () => {
      const parameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const mockCaseActivityReport = {
        reportId: 'report-456',
        summary: {
          totalCases: 15,
          activeCases: 10,
          closedCases: 5,
          totalHours: 120.5,
          totalRevenue: 25000,
          averageCaseDuration: 45.2
        },
        caseDetails: [
          {
            caseId: 'case-1',
            caseNumber: 'CASE-2024-001',
            title: 'Contract Dispute',
            client: 'ABC Corporation',
            status: 'open',
            openedDate: new Date('2024-01-15'),
            assignedLawyer: 'John Doe',
            totalHours: 25.5,
            billableHours: 22.0,
            totalRevenue: 4400,
            lastActivity: new Date('2024-01-25'),
            upcomingDeadlines: 2,
            documentCount: 8,
            eventCount: 5
          }
        ],
        timeDistribution: [
          {
            activityType: 'Research',
            hours: 45.5,
            percentage: 37.8,
            billableHours: 40.0,
            revenue: 8000
          }
        ],
        revenueByMonth: [
          {
            month: '2024-01',
            year: 2024,
            revenue: 25000,
            hours: 120.5,
            caseCount: 15
          }
        ],
        topClients: [
          {
            clientId: 'client-1',
            clientName: 'ABC Corporation',
            caseCount: 3,
            totalRevenue: 12000,
            totalHours: 60.0,
            averageCaseValue: 4000,
            lastActivity: new Date('2024-01-25')
          }
        ],
        upcomingDeadlines: [
          {
            deadlineId: 'deadline-1',
            caseId: 'case-1',
            caseTitle: 'Contract Dispute',
            deadlineTitle: 'File Response',
            deadlineDate: new Date('2024-02-15'),
            priority: 'high',
            daysRemaining: 15,
            assignedTo: 'John Doe'
          }
        ]
      };

      mockReportService.generateCaseActivityReport.mockResolvedValue(mockCaseActivityReport);

      const response = await request(app)
        .post('/api/reports/case-activity')
        .send({ parameters })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reportId).toBe(mockCaseActivityReport.reportId);
      expect(response.body.data.summary.totalCases).toBe(15);
      expect(response.body.data.summary.activeCases).toBe(10);
      expect(response.body.data.summary.closedCases).toBe(5);
      expect(response.body.data.caseDetails).toHaveLength(1);
      expect(response.body.data.timeDistribution).toHaveLength(1);
      expect(response.body.data.revenueByMonth).toHaveLength(1);
      expect(response.body.data.topClients).toHaveLength(1);
      expect(response.body.data.upcomingDeadlines).toHaveLength(1);

      expect(mockReportService.generateCaseActivityReport).toHaveBeenCalledWith(
        parameters,
        mockUser.id
      );
    });

    it('should search reports with filters', async () => {
      const mockSearchResult = {
        reports: [
          {
            id: 'report-1',
            title: 'Case Activity Report',
            type: ReportType.CASE_ACTIVITY,
            format: ReportFormat.PDF,
            status: ReportStatus.COMPLETED,
            parameters: {},
            generatedBy: mockUser.id,
            organizationId: mockUser.organizationId,
            downloadCount: 5,
            isPublic: false,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          },
          {
            id: 'report-2',
            title: 'Time Tracking Report',
            type: ReportType.TIME_TRACKING,
            format: ReportFormat.EXCEL,
            status: ReportStatus.COMPLETED,
            parameters: {},
            generatedBy: mockUser.id,
            organizationId: mockUser.organizationId,
            downloadCount: 3,
            isPublic: false,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20')
          }
        ],
        totalCount: 2,
        searchTime: 45
      };

      mockReportService.searchReports.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/reports/search')
        .query({
          type: ReportType.CASE_ACTIVITY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reports).toHaveLength(2);
      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.searchTime).toBe(45);

      expect(mockReportService.searchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReportType.CASE_ACTIVITY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          limit: 10,
          offset: 0,
          generatedBy: mockUser.id // Non-admin users can only see their own reports
        }),
        mockUser.id
      );
    });

    it('should get user reports', async () => {
      const mockSearchResult = {
        reports: [
          {
            id: 'report-1',
            title: 'My Case Report',
            type: ReportType.CASE_ACTIVITY,
            format: ReportFormat.PDF,
            status: ReportStatus.COMPLETED,
            parameters: {},
            generatedBy: mockUser.id,
            organizationId: mockUser.organizationId,
            downloadCount: 2,
            isPublic: false,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
          }
        ],
        totalCount: 1,
        searchTime: 25
      };

      mockReportService.searchReports.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/reports/my')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reports).toHaveLength(1);
      expect(response.body.data.reports[0].generatedBy).toBe(mockUser.id);

      expect(mockReportService.searchReports).toHaveBeenCalledWith(
        expect.objectContaining({
          generatedBy: mockUser.id,
          limit: 20,
          offset: 0,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }),
        mockUser.id
      );
    });

    it('should get report statistics', async () => {
      const mockStatistics = {
        totalReports: 25,
        reportsByType: {
          [ReportType.CASE_ACTIVITY]: 10,
          [ReportType.TIME_TRACKING]: 8,
          [ReportType.BILLING_SUMMARY]: 5,
          [ReportType.PERFORMANCE_METRICS]: 2
        },
        reportsByFormat: {
          [ReportFormat.PDF]: 15,
          [ReportFormat.EXCEL]: 8,
          [ReportFormat.CSV]: 2
        },
        reportsByStatus: {
          [ReportStatus.COMPLETED]: 20,
          [ReportStatus.PENDING]: 3,
          [ReportStatus.FAILED]: 2
        },
        averageGenerationTime: 45.5,
        totalDownloads: 150,
        mostPopularReports: [
          {
            type: ReportType.CASE_ACTIVITY,
            title: 'Monthly Case Activity',
            downloadCount: 25,
            lastGenerated: new Date('2024-01-25')
          }
        ],
        recentActivity: [
          {
            id: 'report-1',
            type: ReportType.CASE_ACTIVITY,
            title: 'Recent Report',
            generatedBy: mockUser.id,
            generatedAt: new Date('2024-01-25'),
            downloadCount: 5,
            status: ReportStatus.COMPLETED
          }
        ]
      };

      mockReportService.getReportStatistics.mockResolvedValue(mockStatistics);

      const response = await request(app)
        .get('/api/reports/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalReports).toBe(25);
      expect(response.body.data.totalDownloads).toBe(150);
      expect(response.body.data.mostPopularReports).toHaveLength(1);
      expect(response.body.data.recentActivity).toHaveLength(1);

      expect(mockReportService.getReportStatistics).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.organizationId
      );
    });

    it('should export report to different formats', async () => {
      const reportId = 'report-123';
      const format = ReportFormat.EXCEL;
      const mockFilePath = '/reports/report-123.xlsx';

      mockReportService.exportReport.mockResolvedValue(mockFilePath);

      const response = await request(app)
        .post(`/api/reports/${reportId}/export`)
        .send({ format })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filePath).toBe(mockFilePath);

      expect(mockReportService.exportReport).toHaveBeenCalledWith(
        reportId,
        format,
        undefined
      );
    });

    it('should get report metadata', async () => {
      const response = await request(app)
        .get('/api/reports/metadata')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.types)).toBe(true);
      expect(Array.isArray(response.body.data.formats)).toBe(true);
      expect(Array.isArray(response.body.data.statuses)).toBe(true);

      expect(response.body.data.types).toContain(ReportType.CASE_ACTIVITY);
      expect(response.body.data.types).toContain(ReportType.TIME_TRACKING);
      expect(response.body.data.formats).toContain(ReportFormat.PDF);
      expect(response.body.data.formats).toContain(ReportFormat.EXCEL);
      expect(response.body.data.statuses).toContain(ReportStatus.PENDING);
      expect(response.body.data.statuses).toContain(ReportStatus.COMPLETED);
    });
  });

  /**
   * Integration Test: Error Handling
   * Validates: Requirements 5.5 - Proper error handling in report system
   */
  describe('Error Handling', () => {
    it('should handle report generation errors gracefully', async () => {
      const reportData: CreateReportRequest = {
        title: 'Test Report',
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        parameters: {}
      };

      mockReportService.generateReport.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/reports')
        .send(reportData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to generate report');
    });

    it('should handle case activity report generation errors', async () => {
      mockReportService.generateCaseActivityReport.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/reports/case-activity')
        .send({ parameters: {} })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to generate case activity report');
    });

    it('should handle search errors gracefully', async () => {
      mockReportService.searchReports.mockRejectedValue(new Error('Search service down'));

      const response = await request(app)
        .get('/api/reports/search')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to search reports');
    });

    it('should handle statistics errors gracefully', async () => {
      mockReportService.getReportStatistics.mockRejectedValue(new Error('Statistics calculation failed'));

      const response = await request(app)
        .get('/api/reports/statistics')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve report statistics');
    });

    it('should handle export errors gracefully', async () => {
      const reportId = 'report-123';
      mockReportService.exportReport.mockRejectedValue(new Error('Export failed'));

      const response = await request(app)
        .post(`/api/reports/${reportId}/export`)
        .send({ format: ReportFormat.PDF })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to export report');
    });
  });

  /**
   * Integration Test: Authentication and Authorization
   * Validates: Requirements 5.5 - Proper access control for reports
   */
  describe('Authentication and Authorization', () => {
    it('should require authentication for all report endpoints', async () => {
      // Mock auth middleware to reject
      mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      await request(app)
        .post('/api/reports')
        .send({ title: 'Test', type: ReportType.CASE_ACTIVITY, format: ReportFormat.PDF, parameters: {} })
        .expect(401);

      await request(app)
        .get('/api/reports/search')
        .expect(401);

      await request(app)
        .get('/api/reports/my')
        .expect(401);

      await request(app)
        .get('/api/reports/statistics')
        .expect(401);
    });

    it('should require proper permissions for report operations', async () => {
      // Mock RBAC middleware to reject
      mockRbacMiddleware.mockImplementation((permissions: string[]) => {
        return (req: any, res: any, next: any) => {
          res.status(403).json({ success: false, error: 'Insufficient permissions' });
        };
      });

      await request(app)
        .post('/api/reports')
        .send({ title: 'Test', type: ReportType.CASE_ACTIVITY, format: ReportFormat.PDF, parameters: {} })
        .expect(403);

      await request(app)
        .get('/api/reports/search')
        .expect(403);

      await request(app)
        .post('/api/reports/case-activity')
        .send({ parameters: {} })
        .expect(403);
    });
  });
});