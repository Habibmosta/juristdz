import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fc from 'fast-check';
import { reportService } from '@/services/reportService';
import { db } from '@/database/connection';
import {
  ReportType,
  ReportFormat,
  ReportStatus,
  CreateReportRequest,
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
  statSync: jest.fn().mockReturnValue({ size: 1024 }),
  existsSync: jest.fn().mockReturnValue(true),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn()
  }),
  unlinkSync: jest.fn()
}));

describe('ReportService Property-Based Tests', () => {
  const mockUserId = 'user-123';
  const mockOrganizationId = 'org-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 26: Génération de Rapports Précis
   * Validates: Requirements 5.5 - Report generation and activity tracking
   */
  describe('Property 26: Génération de Rapports Précis', () => {
    it('should generate reports with consistent structure and valid data', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 255 }),
          description: fc.option(fc.string({ maxLength: 1000 })),
          type: fc.constantFrom(...Object.values(ReportType)),
          format: fc.constantFrom(...Object.values(ReportFormat)),
          parameters: fc.record({
            dateRange: fc.option(fc.record({
              from: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              to: fc.date({ min: new Date('2020-01-01'), max: new Date() })
            })),
            caseIds: fc.option(fc.array(fc.uuid(), { maxLength: 10 })),
            clientIds: fc.option(fc.array(fc.uuid(), { maxLength: 10 })),
            lawyerIds: fc.option(fc.array(fc.uuid(), { maxLength: 5 })),
            legalDomains: fc.option(fc.array(fc.string(), { maxLength: 5 })),
            includeArchived: fc.option(fc.boolean()),
            sortOrder: fc.option(fc.constantFrom('asc', 'desc'))
          }),
          scheduleGeneration: fc.option(fc.boolean()),
          expirationDays: fc.option(fc.integer({ min: 1, max: 365 }))
        }),
        async (reportData: CreateReportRequest) => {
          // Ensure date range is valid
          if (reportData.parameters.dateRange) {
            const { from, to } = reportData.parameters.dateRange;
            if (from && to && from > to) {
              reportData.parameters.dateRange.to = from;
              reportData.parameters.dateRange.from = to;
            }
          }

          mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

          const result = await reportService.generateReport(reportData, mockUserId, mockOrganizationId);

          // Property: Generated report must have consistent structure
          expect(result).toBeDefined();
          expect(result.id).toBeDefined();
          expect(typeof result.id).toBe('string');
          expect(result.title).toBe(reportData.title);
          expect(result.type).toBe(reportData.type);
          expect(result.format).toBe(reportData.format);
          expect(result.status).toBe(ReportStatus.PENDING);
          expect(result.generatedBy).toBe(mockUserId);
          expect(result.organizationId).toBe(mockOrganizationId);
          expect(result.downloadCount).toBe(0);
          expect(result.isPublic).toBe(false);
          expect(result.createdAt).toBeInstanceOf(Date);
          expect(result.updatedAt).toBeInstanceOf(Date);

          // Property: Parameters must be preserved
          expect(result.parameters).toEqual(reportData.parameters);

          // Property: Expiration date must be set correctly if specified
          if (reportData.expirationDays) {
            expect(result.expiresAt).toBeInstanceOf(Date);
            const expectedExpiration = new Date();
            expectedExpiration.setDate(expectedExpiration.getDate() + reportData.expirationDays);
            const timeDiff = Math.abs(result.expiresAt!.getTime() - expectedExpiration.getTime());
            expect(timeDiff).toBeLessThan(60000); // Within 1 minute
          } else {
            expect(result.expiresAt).toBeUndefined();
          }
        }
      ), { numRuns: 50 });
    });

    it('should generate case activity reports with valid numerical data', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          dateRange: fc.option(fc.record({
            from: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            to: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          })),
          caseIds: fc.option(fc.array(fc.uuid(), { maxLength: 5 })),
          groupBy: fc.option(fc.constantFrom('case', 'client', 'month')),
          sortOrder: fc.option(fc.constantFrom('asc', 'desc'))
        }),
        async (parameters) => {
          // Ensure date range is valid
          if (parameters.dateRange) {
            const { from, to } = parameters.dateRange;
            if (from && to && from > to) {
              parameters.dateRange.to = from;
              parameters.dateRange.from = to;
            }
          }

          const result = await reportService.generateCaseActivityReport(parameters, mockUserId);

          // Property: Report must have valid structure
          expect(result).toBeDefined();
          expect(result.reportId).toBeDefined();
          expect(typeof result.reportId).toBe('string');

          // Property: Summary must contain valid numerical data
          expect(result.summary).toBeDefined();
          expect(typeof result.summary.totalCases).toBe('number');
          expect(result.summary.totalCases).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.activeCases).toBe('number');
          expect(result.summary.activeCases).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.closedCases).toBe('number');
          expect(result.summary.closedCases).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.totalHours).toBe('number');
          expect(result.summary.totalHours).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.totalRevenue).toBe('number');
          expect(result.summary.totalRevenue).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.averageCaseDuration).toBe('number');
          expect(result.summary.averageCaseDuration).toBeGreaterThanOrEqual(0);

          // Property: Active + Closed cases should equal total cases
          expect(result.summary.activeCases + result.summary.closedCases).toBe(result.summary.totalCases);

          // Property: Arrays must be defined
          expect(Array.isArray(result.caseDetails)).toBe(true);
          expect(Array.isArray(result.timeDistribution)).toBe(true);
          expect(Array.isArray(result.revenueByMonth)).toBe(true);
          expect(Array.isArray(result.topClients)).toBe(true);
          expect(Array.isArray(result.upcomingDeadlines)).toBe(true);
        }
      ), { numRuns: 30 });
    });

    it('should generate time tracking reports with consistent time calculations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          dateRange: fc.option(fc.record({
            from: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            to: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          })),
          lawyerIds: fc.option(fc.array(fc.uuid(), { maxLength: 3 }))
        }),
        async (parameters) => {
          // Ensure date range is valid
          if (parameters.dateRange) {
            const { from, to } = parameters.dateRange;
            if (from && to && from > to) {
              parameters.dateRange.to = from;
              parameters.dateRange.from = to;
            }
          }

          const result = await reportService.generateTimeTrackingReport(parameters, mockUserId);

          // Property: Report must have valid structure
          expect(result).toBeDefined();
          expect(result.reportId).toBeDefined();

          // Property: Time calculations must be consistent
          expect(result.summary).toBeDefined();
          expect(typeof result.summary.totalHours).toBe('number');
          expect(result.summary.totalHours).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.billableHours).toBe('number');
          expect(result.summary.billableHours).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.nonBillableHours).toBe('number');
          expect(result.summary.nonBillableHours).toBeGreaterThanOrEqual(0);

          // Property: Total hours = Billable hours + Non-billable hours
          const calculatedTotal = result.summary.billableHours + result.summary.nonBillableHours;
          expect(Math.abs(result.summary.totalHours - calculatedTotal)).toBeLessThan(0.01);

          // Property: Billable rate must be between 0 and 100
          expect(result.summary.billableRate).toBeGreaterThanOrEqual(0);
          expect(result.summary.billableRate).toBeLessThanOrEqual(100);

          // Property: Revenue and rates must be non-negative
          expect(result.summary.totalRevenue).toBeGreaterThanOrEqual(0);
          expect(result.summary.averageHourlyRate).toBeGreaterThanOrEqual(0);

          // Property: Arrays must be defined
          expect(Array.isArray(result.timeEntries)).toBe(true);
          expect(Array.isArray(result.dailyBreakdown)).toBe(true);
          expect(Array.isArray(result.activityBreakdown)).toBe(true);
          expect(Array.isArray(result.lawyerPerformance)).toBe(true);
        }
      ), { numRuns: 30 });
    });

    it('should generate billing reports with valid financial calculations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          dateRange: fc.option(fc.record({
            from: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            to: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          })),
          clientIds: fc.option(fc.array(fc.uuid(), { maxLength: 5 })),
          includeUnpaid: fc.option(fc.boolean())
        }),
        async (parameters) => {
          // Ensure date range is valid
          if (parameters.dateRange) {
            const { from, to } = parameters.dateRange;
            if (from && to && from > to) {
              parameters.dateRange.to = from;
              parameters.dateRange.from = to;
            }
          }

          const result = await reportService.generateBillingSummaryReport(parameters, mockUserId);

          // Property: Report must have valid structure
          expect(result).toBeDefined();
          expect(result.reportId).toBeDefined();

          // Property: Financial calculations must be consistent
          expect(result.summary).toBeDefined();
          expect(typeof result.summary.totalInvoiced).toBe('number');
          expect(result.summary.totalInvoiced).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.totalPaid).toBe('number');
          expect(result.summary.totalPaid).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.totalOutstanding).toBe('number');
          expect(result.summary.totalOutstanding).toBeGreaterThanOrEqual(0);
          expect(typeof result.summary.totalOverdue).toBe('number');
          expect(result.summary.totalOverdue).toBeGreaterThanOrEqual(0);

          // Property: Total paid + outstanding should not exceed total invoiced
          expect(result.summary.totalPaid + result.summary.totalOutstanding).toBeLessThanOrEqual(
            result.summary.totalInvoiced + 0.01 // Allow for small rounding errors
          );

          // Property: Collection rate must be between 0 and 100
          expect(result.summary.collectionRate).toBeGreaterThanOrEqual(0);
          expect(result.summary.collectionRate).toBeLessThanOrEqual(100);

          // Property: Average payment time must be non-negative
          expect(result.summary.averagePaymentTime).toBeGreaterThanOrEqual(0);

          // Property: Arrays must be defined
          expect(Array.isArray(result.invoices)).toBe(true);
          expect(Array.isArray(result.paymentTrends)).toBe(true);
          expect(Array.isArray(result.clientPaymentBehavior)).toBe(true);
          expect(Array.isArray(result.agingReport)).toBe(true);
        }
      ), { numRuns: 30 });
    });
  });

  /**
   * Property: Report Search Consistency
   * Validates: Requirements 5.5 - Report management and search
   */
  describe('Property: Report Search Consistency', () => {
    it('should return consistent search results with valid pagination', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          type: fc.option(fc.constantFrom(...Object.values(ReportType))),
          format: fc.option(fc.constantFrom(...Object.values(ReportFormat))),
          status: fc.option(fc.constantFrom(...Object.values(ReportStatus))),
          limit: fc.option(fc.integer({ min: 1, max: 100 })),
          offset: fc.option(fc.integer({ min: 0, max: 1000 })),
          sortOrder: fc.option(fc.constantFrom('asc', 'desc'))
        }),
        async (criteria: ReportSearchCriteria) => {
          const mockReports = Array.from({ length: criteria.limit || 10 }, (_, i) => ({
            id: `report-${i}`,
            title: `Report ${i}`,
            type: criteria.type || ReportType.CASE_ACTIVITY,
            format: criteria.format || ReportFormat.PDF,
            status: criteria.status || ReportStatus.COMPLETED,
            parameters: '{}',
            generated_by: mockUserId,
            download_count: i,
            is_public: false,
            created_at: new Date(),
            updated_at: new Date()
          }));

          mockDb.query
            .mockResolvedValueOnce({ rows: mockReports } as any)
            .mockResolvedValueOnce({ rows: [{ count: mockReports.length.toString() }] } as any);

          const result = await reportService.searchReports(criteria, mockUserId);

          // Property: Search result must have valid structure
          expect(result).toBeDefined();
          expect(Array.isArray(result.reports)).toBe(true);
          expect(typeof result.totalCount).toBe('number');
          expect(result.totalCount).toBeGreaterThanOrEqual(0);
          expect(typeof result.searchTime).toBe('number');
          expect(result.searchTime).toBeGreaterThanOrEqual(0);

          // Property: Returned reports count should not exceed limit
          const limit = criteria.limit || 50;
          expect(result.reports.length).toBeLessThanOrEqual(limit);

          // Property: Each report should have required fields
          result.reports.forEach(report => {
            expect(report.id).toBeDefined();
            expect(typeof report.id).toBe('string');
            expect(report.title).toBeDefined();
            expect(typeof report.title).toBe('string');
            expect(Object.values(ReportType)).toContain(report.type);
            expect(Object.values(ReportFormat)).toContain(report.format);
            expect(Object.values(ReportStatus)).toContain(report.status);
            expect(report.createdAt).toBeInstanceOf(Date);
            expect(report.updatedAt).toBeInstanceOf(Date);
          });

          // Property: If type filter is specified, all results should match
          if (criteria.type) {
            result.reports.forEach(report => {
              expect(report.type).toBe(criteria.type);
            });
          }

          // Property: If format filter is specified, all results should match
          if (criteria.format) {
            result.reports.forEach(report => {
              expect(report.format).toBe(criteria.format);
            });
          }

          // Property: If status filter is specified, all results should match
          if (criteria.status) {
            result.reports.forEach(report => {
              expect(report.status).toBe(criteria.status);
            });
          }
        }
      ), { numRuns: 25 });
    });
  });

  /**
   * Property: Report Statistics Accuracy
   * Validates: Requirements 5.5 - Report analytics and statistics
   */
  describe('Property: Report Statistics Accuracy', () => {
    it('should generate accurate statistics with consistent totals', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          totalReports: fc.integer({ min: 0, max: 1000 }),
          reportsByType: fc.dictionary(
            fc.constantFrom(...Object.values(ReportType)),
            fc.integer({ min: 0, max: 100 })
          ),
          reportsByFormat: fc.dictionary(
            fc.constantFrom(...Object.values(ReportFormat)),
            fc.integer({ min: 0, max: 100 })
          ),
          reportsByStatus: fc.dictionary(
            fc.constantFrom(...Object.values(ReportStatus)),
            fc.integer({ min: 0, max: 100 })
          ),
          totalDownloads: fc.integer({ min: 0, max: 10000 })
        }),
        async (mockStats) => {
          // Mock database responses
          mockDb.query
            .mockResolvedValueOnce({ rows: [{ total: mockStats.totalReports.toString() }] } as any)
            .mockResolvedValueOnce({ 
              rows: Object.entries(mockStats.reportsByType).map(([type, count]) => ({ type, count: count.toString() }))
            } as any)
            .mockResolvedValueOnce({ 
              rows: Object.entries(mockStats.reportsByFormat).map(([format, count]) => ({ format, count: count.toString() }))
            } as any)
            .mockResolvedValueOnce({ 
              rows: Object.entries(mockStats.reportsByStatus).map(([status, count]) => ({ status, count: count.toString() }))
            } as any)
            .mockResolvedValueOnce({ rows: [{ total_downloads: mockStats.totalDownloads.toString() }] } as any)
            .mockResolvedValueOnce({ rows: [] } as any) // Popular reports
            .mockResolvedValueOnce({ rows: [] } as any); // Recent activity

          const result = await reportService.getReportStatistics(mockUserId, mockOrganizationId);

          // Property: Statistics must have valid structure
          expect(result).toBeDefined();
          expect(typeof result.totalReports).toBe('number');
          expect(result.totalReports).toBeGreaterThanOrEqual(0);
          expect(typeof result.totalDownloads).toBe('number');
          expect(result.totalDownloads).toBeGreaterThanOrEqual(0);
          expect(Array.isArray(result.mostPopularReports)).toBe(true);
          expect(Array.isArray(result.recentActivity)).toBe(true);

          // Property: Total reports should match sum of reports by type
          const sumByType = Object.values(result.reportsByType).reduce((sum, count) => sum + count, 0);
          if (sumByType > 0) {
            expect(result.totalReports).toBeGreaterThanOrEqual(sumByType);
          }

          // Property: Total reports should match sum of reports by format
          const sumByFormat = Object.values(result.reportsByFormat).reduce((sum, count) => sum + count, 0);
          if (sumByFormat > 0) {
            expect(result.totalReports).toBeGreaterThanOrEqual(sumByFormat);
          }

          // Property: Total reports should match sum of reports by status
          const sumByStatus = Object.values(result.reportsByStatus).reduce((sum, count) => sum + count, 0);
          if (sumByStatus > 0) {
            expect(result.totalReports).toBeGreaterThanOrEqual(sumByStatus);
          }

          // Property: All counts must be non-negative
          Object.values(result.reportsByType).forEach(count => {
            expect(count).toBeGreaterThanOrEqual(0);
          });
          Object.values(result.reportsByFormat).forEach(count => {
            expect(count).toBeGreaterThanOrEqual(0);
          });
          Object.values(result.reportsByStatus).forEach(count => {
            expect(count).toBeGreaterThanOrEqual(0);
          });
        }
      ), { numRuns: 20 });
    });
  });
});