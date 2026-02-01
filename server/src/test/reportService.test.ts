import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { reportService } from '@/services/reportService';
import { db } from '@/database/connection';
import {
  ReportType,
  ReportFormat,
  ReportStatus,
  CreateReportRequest,
  CreateReportTemplateRequest,
  ReportSearchCriteria
} from '@/types/report';

// Mock database
jest.mock('@/database/connection');
const mockDb = db as jest.Mocked<typeof db>;

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock case management service
jest.mock('@/services/caseManagementService', () => ({
  caseManagementService: {
    getCaseStatistics: jest.fn().mockResolvedValue({
      totalCases: 10,
      openCases: 7,
      closedCases: 3,
      totalBillableHours: 150.5,
      totalRevenue: 15000,
      averageCaseDuration: 45.2,
      upcomingDeadlines: []
    })
  }
}));

// Mock file system
jest.mock('fs', () => ({
  statSync: jest.fn().mockReturnValue({ size: 1024 })
}));

describe('ReportService', () => {
  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a report successfully', async () => {
      const reportData: CreateReportRequest = {
        title: 'Monthly Case Activity Report',
        description: 'Detailed monthly case activity analysis',
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
        scheduleGeneration: false,
        expirationDays: 30
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await reportService.generateReport(reportData, mockUserId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result.title).toBe('Monthly Case Activity Report');
      expect(result.type).toBe(ReportType.CASE_ACTIVITY);
      expect(result.format).toBe(ReportFormat.PDF);
      expect(result.status).toBe(ReportStatus.PENDING);
      expect(result.generatedBy).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('should handle report generation errors', async () => {
      const reportData: CreateReportRequest = {
        title: 'Test Report',
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        parameters: {}
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(reportService.generateReport(reportData, mockUserId))
        .rejects.toThrow('Failed to generate report');
    });
  });

  describe('generateCaseActivityReport', () => {
    it('should generate case activity report with correct structure', async () => {
      const parameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const result = await reportService.generateCaseActivityReport(parameters, mockUserId);

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalCases).toBe(10);
      expect(result.summary.activeCases).toBe(7);
      expect(result.summary.closedCases).toBe(3);
      expect(result.summary.totalHours).toBe(150.5);
      expect(result.summary.totalRevenue).toBe(15000);
      expect(result.caseDetails).toBeInstanceOf(Array);
      expect(result.timeDistribution).toBeInstanceOf(Array);
      expect(result.revenueByMonth).toBeInstanceOf(Array);
      expect(result.topClients).toBeInstanceOf(Array);
      expect(result.upcomingDeadlines).toBeInstanceOf(Array);
    });

    it('should handle case activity report generation errors', async () => {
      // Mock case management service to throw error
      const { caseManagementService } = require('@/services/caseManagementService');
      caseManagementService.getCaseStatistics.mockRejectedValueOnce(new Error('Service error'));

      await expect(reportService.generateCaseActivityReport({}, mockUserId))
        .rejects.toThrow('Failed to generate case activity report');
    });
  });

  describe('generateTimeTrackingReport', () => {
    it('should generate time tracking report with correct calculations', async () => {
      const parameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const result = await reportService.generateTimeTrackingReport(parameters, mockUserId);

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('totalHours');
      expect(result.summary).toHaveProperty('billableHours');
      expect(result.summary).toHaveProperty('nonBillableHours');
      expect(result.summary).toHaveProperty('billableRate');
      expect(result.summary).toHaveProperty('totalRevenue');
      expect(result.summary).toHaveProperty('averageHourlyRate');
      expect(result.timeEntries).toBeInstanceOf(Array);
      expect(result.dailyBreakdown).toBeInstanceOf(Array);
      expect(result.activityBreakdown).toBeInstanceOf(Array);
      expect(result.lawyerPerformance).toBeInstanceOf(Array);
    });
  });

  describe('generateBillingSummaryReport', () => {
    it('should generate billing summary report with financial calculations', async () => {
      const parameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const result = await reportService.generateBillingSummaryReport(parameters, mockUserId);

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('totalInvoiced');
      expect(result.summary).toHaveProperty('totalPaid');
      expect(result.summary).toHaveProperty('totalOutstanding');
      expect(result.summary).toHaveProperty('totalOverdue');
      expect(result.summary).toHaveProperty('averagePaymentTime');
      expect(result.summary).toHaveProperty('collectionRate');
      expect(result.invoices).toBeInstanceOf(Array);
      expect(result.paymentTrends).toBeInstanceOf(Array);
      expect(result.clientPaymentBehavior).toBeInstanceOf(Array);
      expect(result.agingReport).toBeInstanceOf(Array);
    });
  });

  describe('generatePerformanceMetricsReport', () => {
    it('should generate performance metrics report with KPIs', async () => {
      const parameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        }
      };

      const result = await reportService.generatePerformanceMetricsReport(parameters, mockUserId);

      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary).toHaveProperty('totalCases');
      expect(result.summary).toHaveProperty('averageCaseResolutionTime');
      expect(result.summary).toHaveProperty('clientSatisfactionScore');
      expect(result.summary).toHaveProperty('revenueGrowth');
      expect(result.summary).toHaveProperty('productivityIndex');
      expect(result.summary).toHaveProperty('utilizationRate');
      expect(result.lawyerMetrics).toBeInstanceOf(Array);
      expect(result.caseMetrics).toBeInstanceOf(Array);
      expect(result.clientMetrics).toBeInstanceOf(Array);
      expect(result.trendAnalysis).toBeInstanceOf(Array);
    });
  });

  describe('exportReport', () => {
    it('should export report to PDF format', async () => {
      const reportId = 'report-123';
      const format = ReportFormat.PDF;

      // Mock report retrieval
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: reportId,
          title: 'Test Report',
          type: ReportType.CASE_ACTIVITY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          parameters: '{}',
          generated_by: mockUserId,
          created_at: new Date(),
          updated_at: new Date()
        }]
      } as any);

      // Mock file update
      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await reportService.exportReport(reportId, format);

      expect(result).toBeDefined();
      expect(result).toContain('.pdf');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should handle unsupported export formats', async () => {
      const reportId = 'report-123';
      const format = 'unsupported' as any;

      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: reportId,
          title: 'Test Report',
          type: ReportType.CASE_ACTIVITY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          parameters: '{}',
          generated_by: mockUserId,
          created_at: new Date(),
          updated_at: new Date()
        }]
      } as any);

      await expect(reportService.exportReport(reportId, format))
        .rejects.toThrow('Unsupported export format');
    });

    it('should handle report not found', async () => {
      const reportId = 'nonexistent-report';
      const format = ReportFormat.PDF;

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      await expect(reportService.exportReport(reportId, format))
        .rejects.toThrow('Report not found');
    });
  });

  describe('searchReports', () => {
    it('should search reports with criteria', async () => {
      const criteria: ReportSearchCriteria = {
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        status: ReportStatus.COMPLETED,
        limit: 10,
        offset: 0
      };

      const mockReports = [
        {
          id: 'report-1',
          title: 'Report 1',
          type: ReportType.CASE_ACTIVITY,
          format: ReportFormat.PDF,
          status: ReportStatus.COMPLETED,
          parameters: '{}',
          generated_by: mockUserId,
          download_count: 5,
          is_public: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockReports } as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any);

      const result = await reportService.searchReports(criteria, mockUserId);

      expect(result.reports).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
      expect(result.reports[0].id).toBe('report-1');
      expect(result.reports[0].type).toBe(ReportType.CASE_ACTIVITY);
    });

    it('should handle search with date range', async () => {
      const criteria: ReportSearchCriteria = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        },
        limit: 5
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ count: '0' }] } as any);

      const result = await reportService.searchReports(criteria, mockUserId);

      expect(result.reports).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getReportStatistics', () => {
    it('should return comprehensive report statistics', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '25' }] } as any) // Total reports
        .mockResolvedValueOnce({ rows: [{ type: 'case_activity', count: '10' }, { type: 'billing_summary', count: '8' }] } as any) // By type
        .mockResolvedValueOnce({ rows: [{ format: 'pdf', count: '15' }, { format: 'excel', count: '10' }] } as any) // By format
        .mockResolvedValueOnce({ rows: [{ status: 'completed', count: '20' }, { status: 'failed', count: '5' }] } as any) // By status
        .mockResolvedValueOnce({ rows: [{ total_downloads: '150' }] } as any) // Total downloads
        .mockResolvedValueOnce({ rows: [] } as any) // Popular reports
        .mockResolvedValueOnce({ rows: [] } as any); // Recent activity

      const result = await reportService.getReportStatistics(mockUserId, mockOrganizationId);

      expect(result.totalReports).toBe(25);
      expect(result.reportsByType).toBeDefined();
      expect(result.reportsByFormat).toBeDefined();
      expect(result.reportsByStatus).toBeDefined();
      expect(result.totalDownloads).toBe(150);
      expect(result.mostPopularReports).toBeInstanceOf(Array);
      expect(result.recentActivity).toBeInstanceOf(Array);
    });

    it('should handle statistics for organization', async () => {
      mockDb.query
        .mockResolvedValue({ rows: [{ total: '0' }] } as any);

      const result = await reportService.getReportStatistics(undefined, mockOrganizationId);

      expect(result.totalReports).toBe(0);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('organization_id'),
        expect.arrayContaining([mockOrganizationId])
      );
    });
  });

  describe('createReportTemplate', () => {
    it('should create report template successfully', async () => {
      const templateData: CreateReportTemplateRequest = {
        name: 'Monthly Activity Template',
        description: 'Template for monthly case activity reports',
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        parameters: {
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31')
          },
          groupBy: 'month' as any
        },
        layout: {
          sections: [
            {
              id: 'summary',
              title: 'Executive Summary',
              type: 'summary' as any,
              order: 1,
              visible: true,
              configuration: {}
            }
          ],
          styling: {
            fontFamily: 'Arial',
            fontSize: 12,
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            headerHeight: 50,
            footerHeight: 30,
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
          },
          headers: [],
          footers: []
        }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await reportService.createReportTemplate(templateData, mockUserId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Monthly Activity Template');
      expect(result.type).toBe(ReportType.CASE_ACTIVITY);
      expect(result.format).toBe(ReportFormat.PDF);
      expect(result.isSystem).toBe(false);
      expect(result.isActive).toBe(true);
      expect(result.createdBy).toBe(mockUserId);
      expect(result.organizationId).toBe(mockOrganizationId);
    });

    it('should handle template creation errors', async () => {
      const templateData: CreateReportTemplateRequest = {
        name: 'Test Template',
        type: ReportType.CASE_ACTIVITY,
        format: ReportFormat.PDF,
        parameters: {},
        layout: {
          sections: [],
          styling: {
            fontFamily: 'Arial',
            fontSize: 12,
            primaryColor: '#000',
            secondaryColor: '#666',
            headerHeight: 50,
            footerHeight: 30,
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
          },
          headers: [],
          footers: []
        }
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(reportService.createReportTemplate(templateData, mockUserId))
        .rejects.toThrow('Failed to create report template');
    });
  });

  describe('Report Data Validation', () => {
    it('should validate report parameters structure', () => {
      const validParameters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        },
        caseIds: ['case-1', 'case-2'],
        clientIds: ['client-1'],
        lawyerIds: [mockUserId],
        legalDomains: ['civil', 'commercial'],
        caseStatuses: ['open', 'closed'],
        includeArchived: false,
        groupBy: 'month' as any,
        sortBy: 'date' as any,
        sortOrder: 'desc' as const,
        filters: { priority: 'high' },
        customFields: ['custom1', 'custom2']
      };

      // Validate that all expected properties exist
      expect(validParameters.dateRange).toBeDefined();
      expect(validParameters.dateRange.from).toBeInstanceOf(Date);
      expect(validParameters.dateRange.to).toBeInstanceOf(Date);
      expect(Array.isArray(validParameters.caseIds)).toBe(true);
      expect(Array.isArray(validParameters.clientIds)).toBe(true);
      expect(Array.isArray(validParameters.lawyerIds)).toBe(true);
      expect(Array.isArray(validParameters.legalDomains)).toBe(true);
      expect(Array.isArray(validParameters.caseStatuses)).toBe(true);
      expect(typeof validParameters.includeArchived).toBe('boolean');
      expect(validParameters.sortOrder).toMatch(/^(asc|desc)$/);
    });

    it('should validate report layout structure', () => {
      const validLayout = {
        sections: [
          {
            id: 'summary',
            title: 'Summary',
            type: 'summary' as any,
            order: 1,
            visible: true,
            configuration: { showTotals: true }
          }
        ],
        styling: {
          fontFamily: 'Arial',
          fontSize: 12,
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          headerHeight: 50,
          footerHeight: 30,
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        headers: [
          {
            content: 'Company Report',
            alignment: 'center' as const,
            fontSize: 16,
            bold: true
          }
        ],
        footers: [
          {
            content: 'Page {{page}}',
            alignment: 'right' as const,
            fontSize: 10,
            includePageNumber: true
          }
        ]
      };

      expect(Array.isArray(validLayout.sections)).toBe(true);
      expect(validLayout.sections[0]).toHaveProperty('id');
      expect(validLayout.sections[0]).toHaveProperty('title');
      expect(validLayout.sections[0]).toHaveProperty('type');
      expect(validLayout.sections[0]).toHaveProperty('order');
      expect(validLayout.sections[0]).toHaveProperty('visible');
      expect(validLayout.styling).toHaveProperty('fontFamily');
      expect(validLayout.styling).toHaveProperty('fontSize');
      expect(validLayout.styling).toHaveProperty('primaryColor');
      expect(validLayout.styling.margins).toHaveProperty('top');
      expect(validLayout.styling.margins).toHaveProperty('right');
      expect(validLayout.styling.margins).toHaveProperty('bottom');
      expect(validLayout.styling.margins).toHaveProperty('left');
    });
  });
});