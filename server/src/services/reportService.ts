import { db } from '@/database/connection';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  Report,
  ReportType,
  ReportFormat,
  ReportStatus,
  CreateReportRequest,
  ReportSearchCriteria,
  ReportSearchResult,
  ReportStatistics,
  CaseActivityReport,
  TimeTrackingReport,
  BillingSummaryReport,
  PerformanceMetricsReport,
  ReportTemplate,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  ReportGenerationJob,
  ExportConfiguration,
  CaseActivityDetail,
  TimeEntryDetail,
  InvoiceSummary,
  LawyerMetrics
} from '@/types/report';
import { caseManagementService } from '@/services/caseManagementService';
import * as fs from 'fs';
import * as path from 'path';

export class ReportService {

  /**
   * Generate a new report
   * Validates: Requirements 5.5 - Report generation
   */
  async generateReport(reportData: CreateReportRequest, userId: string, organizationId?: string): Promise<Report> {
    try {
      const reportId = uuidv4();
      
      const report: Report = {
        id: reportId,
        title: reportData.title,
        description: reportData.description,
        type: reportData.type,
        format: reportData.format,
        status: ReportStatus.PENDING,
        parameters: reportData.parameters,
        generatedBy: userId,
        organizationId,
        downloadCount: 0,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Set expiration date if specified
      if (reportData.expirationDays) {
        report.expiresAt = new Date();
        report.expiresAt.setDate(report.expiresAt.getDate() + reportData.expirationDays);
      }

      await this.saveReportToDatabase(report);

      // Start report generation asynchronously
      if (reportData.scheduleGeneration !== false) {
        this.generateReportAsync(reportId, userId);
      }

      logger.info('Report generation initiated', { reportId, type: report.type, userId });
      return report;

    } catch (error) {
      logger.error('Report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Generate case activity report
   * Validates: Requirements 5.5 - Activity reporting
   */
  async generateCaseActivityReport(parameters: any, userId: string): Promise<CaseActivityReport> {
    try {
      const reportId = uuidv4();

      // Get case statistics
      const caseStats = await caseManagementService.getCaseStatistics(
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      );

      // Get detailed case information
      const caseDetails = await this.getCaseActivityDetails(parameters, userId);

      // Get time distribution
      const timeDistribution = await this.getTimeDistribution(parameters, userId);

      // Get revenue by month
      const revenueByMonth = await this.getMonthlyRevenue(parameters, userId);

      // Get top clients
      const topClients = await this.getTopClients(parameters, userId);

      // Get upcoming deadlines
      const upcomingDeadlines = caseStats.upcomingDeadlines.map(deadline => ({
        deadlineId: deadline.id,
        caseId: deadline.caseId,
        caseTitle: 'Case Title', // Would need to join with cases
        deadlineTitle: deadline.title,
        deadlineDate: deadline.deadlineDate,
        priority: deadline.priority,
        daysRemaining: Math.ceil((deadline.deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        assignedTo: deadline.assignedTo || 'Unassigned'
      }));

      const report: CaseActivityReport = {
        reportId,
        summary: {
          totalCases: caseStats.totalCases,
          activeCases: caseStats.openCases,
          closedCases: caseStats.closedCases,
          totalHours: caseStats.totalBillableHours,
          totalRevenue: caseStats.totalRevenue,
          averageCaseDuration: caseStats.averageCaseDuration
        },
        caseDetails,
        timeDistribution,
        revenueByMonth,
        topClients,
        upcomingDeadlines
      };

      return report;

    } catch (error) {
      logger.error('Case activity report generation error:', error);
      throw new Error('Failed to generate case activity report');
    }
  }

  /**
   * Generate time tracking report
   * Validates: Requirements 5.5 - Time tracking reports
   */
  async generateTimeTrackingReport(parameters: any, userId: string): Promise<TimeTrackingReport> {
    try {
      const reportId = uuidv4();

      // Get time entries
      const timeEntries = await this.getTimeEntries(parameters, userId);

      // Calculate summary
      const totalHours = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
      const billableHours = timeEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0);
      const nonBillableHours = totalHours - billableHours;
      const totalRevenue = timeEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
      const billableRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
      const averageHourlyRate = billableHours > 0 ? totalRevenue / billableHours : 0;

      // Get daily breakdown
      const dailyBreakdown = await this.getDailyTimeBreakdown(parameters, userId);

      // Get activity breakdown
      const activityBreakdown = await this.getActivityTimeBreakdown(parameters, userId);

      // Get lawyer performance
      const lawyerPerformance = await this.getLawyerTimePerformance(parameters, userId);

      const report: TimeTrackingReport = {
        reportId,
        summary: {
          totalHours,
          billableHours,
          nonBillableHours,
          billableRate,
          totalRevenue,
          averageHourlyRate
        },
        timeEntries,
        dailyBreakdown,
        activityBreakdown,
        lawyerPerformance
      };

      return report;

    } catch (error) {
      logger.error('Time tracking report generation error:', error);
      throw new Error('Failed to generate time tracking report');
    }
  }

  /**
   * Generate billing summary report
   * Validates: Requirements 5.5 - Financial reporting
   */
  async generateBillingSummaryReport(parameters: any, userId: string): Promise<BillingSummaryReport> {
    try {
      const reportId = uuidv4();

      // Get invoice data
      const invoices = await this.getInvoiceSummaries(parameters, userId);

      // Calculate summary
      const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
      const totalOutstanding = invoices.filter(inv => inv.status === 'outstanding').reduce((sum, inv) => sum + inv.amount, 0);
      const totalOverdue = invoices.filter(inv => inv.daysOverdue && inv.daysOverdue > 0).reduce((sum, inv) => sum + inv.amount, 0);

      const paidInvoices = invoices.filter(inv => inv.paidDate);
      const averagePaymentTime = paidInvoices.length > 0 ? 
        paidInvoices.reduce((sum, inv) => {
          const paymentTime = inv.paidDate!.getTime() - inv.issueDate.getTime();
          return sum + (paymentTime / (1000 * 60 * 60 * 24));
        }, 0) / paidInvoices.length : 0;

      const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

      // Get payment trends
      const paymentTrends = await this.getPaymentTrends(parameters, userId);

      // Get client payment behavior
      const clientPaymentBehavior = await this.getClientPaymentBehavior(parameters, userId);

      // Get aging report
      const agingReport = await this.getAgingReport(parameters, userId);

      const report: BillingSummaryReport = {
        reportId,
        summary: {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          totalOverdue,
          averagePaymentTime,
          collectionRate
        },
        invoices,
        paymentTrends,
        clientPaymentBehavior,
        agingReport
      };

      return report;

    } catch (error) {
      logger.error('Billing summary report generation error:', error);
      throw new Error('Failed to generate billing summary report');
    }
  }

  /**
   * Generate performance metrics report
   * Validates: Requirements 5.5 - Performance analytics
   */
  async generatePerformanceMetricsReport(parameters: any, userId: string): Promise<PerformanceMetricsReport> {
    try {
      const reportId = uuidv4();

      // Get lawyer metrics
      const lawyerMetrics = await this.getLawyerMetrics(parameters, userId);

      // Get case metrics
      const caseMetrics = await this.getCaseMetrics(parameters, userId);

      // Get client metrics
      const clientMetrics = await this.getClientMetrics(parameters, userId);

      // Get trend analysis
      const trendAnalysis = await this.getTrendAnalysis(parameters, userId);

      // Calculate summary metrics
      const totalCases = caseMetrics.reduce((sum, metric) => sum + metric.totalCases, 0);
      const averageCaseResolutionTime = caseMetrics.length > 0 ? 
        caseMetrics.reduce((sum, metric) => sum + metric.averageResolutionTime, 0) / caseMetrics.length : 0;

      const report: PerformanceMetricsReport = {
        reportId,
        summary: {
          totalCases,
          averageCaseResolutionTime,
          clientSatisfactionScore: 4.2, // Would be calculated from client feedback
          revenueGrowth: 15.5, // Would be calculated from historical data
          productivityIndex: 85.3, // Would be calculated from various metrics
          utilizationRate: 78.2 // Would be calculated from time tracking
        },
        lawyerMetrics,
        caseMetrics,
        clientMetrics,
        trendAnalysis
      };

      return report;

    } catch (error) {
      logger.error('Performance metrics report generation error:', error);
      throw new Error('Failed to generate performance metrics report');
    }
  }

  /**
   * Export report to specified format
   * Validates: Requirements 5.5 - Report export
   */
  async exportReport(reportId: string, format: ReportFormat, config?: ExportConfiguration): Promise<string> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      let filePath: string;

      switch (format) {
        case ReportFormat.PDF:
          filePath = await this.exportToPDF(report, config);
          break;
        case ReportFormat.EXCEL:
          filePath = await this.exportToExcel(report, config);
          break;
        case ReportFormat.CSV:
          filePath = await this.exportToCSV(report, config);
          break;
        case ReportFormat.JSON:
          filePath = await this.exportToJSON(report, config);
          break;
        case ReportFormat.HTML:
          filePath = await this.exportToHTML(report, config);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Update report with file information
      await this.updateReportFile(reportId, filePath);

      logger.info('Report exported successfully', { reportId, format, filePath });
      return filePath;

    } catch (error) {
      logger.error('Report export error:', error);
      throw new Error('Failed to export report');
    }
  }

  /**
   * Search reports
   * Validates: Requirements 5.5 - Report management
   */
  async searchReports(criteria: ReportSearchCriteria, userId: string): Promise<ReportSearchResult> {
    try {
      const startTime = Date.now();

      // Build search query
      let query = `
        SELECT * FROM reports 
        WHERE generated_by = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 1;

      if (criteria.type) {
        query += ` AND type = $${++paramIndex}`;
        params.push(criteria.type);
      }

      if (criteria.format) {
        query += ` AND format = $${++paramIndex}`;
        params.push(criteria.format);
      }

      if (criteria.status) {
        query += ` AND status = $${++paramIndex}`;
        params.push(criteria.status);
      }

      if (criteria.dateRange) {
        if (criteria.dateRange.from) {
          query += ` AND created_at >= $${++paramIndex}`;
          params.push(criteria.dateRange.from);
        }
        if (criteria.dateRange.to) {
          query += ` AND created_at <= $${++paramIndex}`;
          params.push(criteria.dateRange.to);
        }
      }

      // Add sorting
      const sortBy = criteria.sortBy || 'created_at';
      const sortOrder = criteria.sortOrder || 'desc';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = criteria.limit || 50;
      const offset = criteria.offset || 0;
      query += ` LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
      params.push(limit, offset);

      // Execute search
      const result = await db.query(query, params);
      const reports = (result as any).rows.map((row: any) => this.mapRowToReport(row));

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const totalCount = parseInt((countResult as any).rows[0].count);

      const searchTime = Date.now() - startTime;

      return {
        reports,
        totalCount,
        searchTime
      };

    } catch (error) {
      logger.error('Report search error:', error);
      throw new Error('Failed to search reports');
    }
  }

  /**
   * Get report statistics
   * Validates: Requirements 5.5 - Report analytics
   */
  async getReportStatistics(userId?: string, organizationId?: string): Promise<ReportStatistics> {
    try {
      let baseQuery = 'FROM reports WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 0;

      if (userId) {
        baseQuery += ` AND generated_by = $${++paramIndex}`;
        params.push(userId);
      }

      if (organizationId) {
        baseQuery += ` AND organization_id = $${++paramIndex}`;
        params.push(organizationId);
      }

      // Get total reports
      const totalResult = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
      const totalReports = parseInt((totalResult as any).rows[0].total);

      // Get reports by type
      const typeResult = await db.query(`SELECT type, COUNT(*) as count ${baseQuery} GROUP BY type`, params);
      const reportsByType: Record<ReportType, number> = {} as any;
      (typeResult as any).rows.forEach((row: any) => {
        reportsByType[row.type as ReportType] = parseInt(row.count);
      });

      // Get reports by format
      const formatResult = await db.query(`SELECT format, COUNT(*) as count ${baseQuery} GROUP BY format`, params);
      const reportsByFormat: Record<ReportFormat, number> = {} as any;
      (formatResult as any).rows.forEach((row: any) => {
        reportsByFormat[row.format as ReportFormat] = parseInt(row.count);
      });

      // Get reports by status
      const statusResult = await db.query(`SELECT status, COUNT(*) as count ${baseQuery} GROUP BY status`, params);
      const reportsByStatus: Record<ReportStatus, number> = {} as any;
      (statusResult as any).rows.forEach((row: any) => {
        reportsByStatus[row.status as ReportStatus] = parseInt(row.count);
      });

      // Get total downloads
      const downloadResult = await db.query(`SELECT SUM(download_count) as total_downloads ${baseQuery}`, params);
      const totalDownloads = parseInt((downloadResult as any).rows[0].total_downloads || 0);

      // Get most popular reports
      const popularResult = await db.query(
        `SELECT type, title, download_count, generated_at as last_generated ${baseQuery} 
         AND status = 'completed' ORDER BY download_count DESC LIMIT 10`,
        params
      );
      const mostPopularReports = (popularResult as any).rows.map((row: any) => ({
        type: row.type,
        title: row.title,
        downloadCount: row.download_count,
        lastGenerated: new Date(row.last_generated)
      }));

      // Get recent activity
      const activityResult = await db.query(
        `SELECT id, type, title, generated_by, generated_at, download_count, status ${baseQuery} 
         ORDER BY generated_at DESC LIMIT 20`,
        params
      );
      const recentActivity = (activityResult as any).rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        generatedBy: row.generated_by,
        generatedAt: new Date(row.generated_at),
        downloadCount: row.download_count,
        status: row.status
      }));

      return {
        totalReports,
        reportsByType,
        reportsByFormat,
        reportsByStatus,
        averageGenerationTime: 0, // Would need to calculate from generation logs
        totalDownloads,
        mostPopularReports,
        recentActivity
      };

    } catch (error) {
      logger.error('Get report statistics error:', error);
      throw new Error('Failed to retrieve report statistics');
    }
  }

  /**
   * Create report template
   * Validates: Requirements 5.5 - Template management
   */
  async createReportTemplate(templateData: CreateReportTemplateRequest, userId: string, organizationId?: string): Promise<ReportTemplate> {
    try {
      const templateId = uuidv4();

      const template: ReportTemplate = {
        id: templateId,
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        format: templateData.format,
        parameters: templateData.parameters,
        layout: templateData.layout,
        isSystem: false,
        isActive: true,
        organizationId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveReportTemplateToDatabase(template);

      logger.info('Report template created', { templateId, name: template.name, userId });
      return template;

    } catch (error) {
      logger.error('Report template creation error:', error);
      throw new Error('Failed to create report template');
    }
  }

  // Private helper methods

  private async generateReportAsync(reportId: string, userId: string): Promise<void> {
    try {
      // Update status to generating
      await this.updateReportStatus(reportId, ReportStatus.GENERATING);

      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      let reportData: any;

      // Generate report based on type
      switch (report.type) {
        case ReportType.CASE_ACTIVITY:
          reportData = await this.generateCaseActivityReport(report.parameters, userId);
          break;
        case ReportType.TIME_TRACKING:
          reportData = await this.generateTimeTrackingReport(report.parameters, userId);
          break;
        case ReportType.BILLING_SUMMARY:
          reportData = await this.generateBillingSummaryReport(report.parameters, userId);
          break;
        case ReportType.PERFORMANCE_METRICS:
          reportData = await this.generatePerformanceMetricsReport(report.parameters, userId);
          break;
        default:
          throw new Error(`Unsupported report type: ${report.type}`);
      }

      // Export report to file
      const filePath = await this.exportReport(reportId, report.format);

      // Update status to completed
      await this.updateReportStatus(reportId, ReportStatus.COMPLETED);
      await this.updateReportGeneratedAt(reportId);

      logger.info('Report generated successfully', { reportId, filePath });

    } catch (error) {
      logger.error('Async report generation error:', error);
      await this.updateReportStatus(reportId, ReportStatus.FAILED);
    }
  }

  private async getCaseActivityDetails(parameters: any, userId: string): Promise<CaseActivityDetail[]> {
    try {
      const query = `
        SELECT 
          c.id as case_id,
          c.case_number,
          c.title,
          COALESCE(cc.company_name, cp.first_name || ' ' || cp.last_name) as client,
          c.status,
          c.opened_date,
          c.closed_date,
          up.first_name || ' ' || up.last_name as assigned_lawyer,
          SUM(cte.duration_minutes) / 60.0 as total_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) as total_revenue,
          MAX(cte.entry_date) as last_activity,
          COUNT(DISTINCT cd.deadline_date) as upcoming_deadlines,
          COUNT(DISTINCT doc.id) as document_count,
          COUNT(DISTINCT ce.id) as event_count
        FROM cases c
        LEFT JOIN case_clients cc ON c.id = cc.case_id
        LEFT JOIN client_profiles cp ON cc.id = cp.client_id
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id
        LEFT JOIN case_deadlines cd ON c.id = cd.case_id AND cd.deadline_date > CURRENT_DATE
        LEFT JOIN documents doc ON c.id = doc.case_id
        LEFT JOIN case_events ce ON c.id = ce.case_id
        JOIN users u ON c.assigned_lawyer_id = u.id
        JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
        WHERE c.assigned_lawyer_id = $1
        AND c.is_active = true
        AND ($2::date IS NULL OR c.opened_date >= $2)
        AND ($3::date IS NULL OR c.opened_date <= $3)
        GROUP BY c.id, c.case_number, c.title, cc.company_name, cp.first_name, cp.last_name, 
                 c.status, c.opened_date, c.closed_date, up.first_name, up.last_name
        ORDER BY c.opened_date DESC
        LIMIT 100
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        caseId: row.case_id,
        caseNumber: row.case_number,
        title: row.title,
        client: row.client || 'Client Inconnu',
        status: row.status,
        openedDate: new Date(row.opened_date),
        closedDate: row.closed_date ? new Date(row.closed_date) : undefined,
        assignedLawyer: row.assigned_lawyer,
        totalHours: parseFloat(row.total_hours || 0),
        billableHours: parseFloat(row.billable_hours || 0),
        totalRevenue: parseFloat(row.total_revenue || 0),
        lastActivity: row.last_activity ? new Date(row.last_activity) : new Date(row.opened_date),
        upcomingDeadlines: parseInt(row.upcoming_deadlines || 0),
        documentCount: parseInt(row.document_count || 0),
        eventCount: parseInt(row.event_count || 0)
      }));
    } catch (error) {
      logger.error('Get case activity details error:', error);
      return [];
    }
  }

  private async getTimeEntries(parameters: any, userId: string): Promise<TimeEntryDetail[]> {
    try {
      const query = `
        SELECT 
          cte.id,
          cte.case_id,
          c.title as case_title,
          COALESCE(cc.company_name, cp.first_name || ' ' || cp.last_name) as client,
          up.first_name || ' ' || up.last_name as lawyer,
          cte.entry_date as date,
          cte.start_time,
          cte.end_time,
          cte.duration_minutes / 60.0 as duration,
          cte.activity_type,
          cte.description,
          cte.is_billable,
          cte.hourly_rate,
          cte.total_amount as amount,
          cte.status
        FROM case_time_entries cte
        JOIN cases c ON cte.case_id = c.id
        LEFT JOIN case_clients cc ON c.id = cc.case_id
        LEFT JOIN client_profiles cp ON cc.id = cp.client_id
        JOIN users u ON c.assigned_lawyer_id = u.id
        JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        ORDER BY cte.entry_date DESC, cte.start_time DESC
        LIMIT 1000
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        id: row.id,
        caseId: row.case_id,
        caseTitle: row.case_title,
        client: row.client || 'Client Inconnu',
        lawyer: row.lawyer,
        date: new Date(row.date),
        startTime: row.start_time ? new Date(row.start_time) : new Date(row.date),
        endTime: row.end_time ? new Date(row.end_time) : undefined,
        duration: parseFloat(row.duration),
        activityType: row.activity_type,
        description: row.description,
        isBillable: row.is_billable,
        hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : undefined,
        amount: row.amount ? parseFloat(row.amount) : undefined,
        status: row.status
      }));
    } catch (error) {
      logger.error('Get time entries error:', error);
      return [];
    }
  }

  private async getInvoiceSummaries(parameters: any, userId: string): Promise<InvoiceSummary[]> {
    try {
      // Mock implementation - would need actual invoice tables
      // This would typically query an invoices table with case relationships
      const mockInvoices: InvoiceSummary[] = [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'FAC-2024-001',
          caseId: 'case-1',
          caseTitle: 'Litige Commercial ABC Corp',
          clientId: 'client-1',
          clientName: 'ABC Corporation',
          amount: 5500,
          currency: 'DZD',
          issueDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          paidDate: new Date('2024-02-10'),
          status: 'paid',
          paymentMethod: 'virement'
        },
        {
          invoiceId: 'inv-002',
          invoiceNumber: 'FAC-2024-002',
          caseId: 'case-2',
          caseTitle: 'Conseil Juridique XYZ',
          clientId: 'client-2',
          clientName: 'Jean Dupont',
          amount: 3200,
          currency: 'DZD',
          issueDate: new Date('2024-01-20'),
          dueDate: new Date('2024-02-20'),
          status: 'outstanding'
        },
        {
          invoiceId: 'inv-003',
          invoiceNumber: 'FAC-2024-003',
          caseId: 'case-3',
          caseTitle: 'Contentieux Immobilier',
          clientId: 'client-3',
          clientName: 'Société DEF',
          amount: 7800,
          currency: 'DZD',
          issueDate: new Date('2023-12-10'),
          dueDate: new Date('2024-01-10'),
          status: 'overdue',
          daysOverdue: Math.ceil((Date.now() - new Date('2024-01-10').getTime()) / (1000 * 60 * 60 * 24))
        }
      ];

      // Filter by date range if provided
      let filteredInvoices = mockInvoices;
      if (parameters.dateRange?.from) {
        filteredInvoices = filteredInvoices.filter(inv => inv.issueDate >= parameters.dateRange.from);
      }
      if (parameters.dateRange?.to) {
        filteredInvoices = filteredInvoices.filter(inv => inv.issueDate <= parameters.dateRange.to);
      }

      return filteredInvoices;
    } catch (error) {
      logger.error('Get invoice summaries error:', error);
      return [];
    }
  }

  private async getLawyerMetrics(parameters: any, userId: string): Promise<LawyerMetrics[]> {
    try {
      const query = `
        SELECT 
          u.id as lawyer_id,
          up.first_name || ' ' || up.last_name as lawyer_name,
          COUNT(DISTINCT c.id) as case_load,
          AVG(cte.total_amount) as average_case_value,
          AVG(EXTRACT(DAYS FROM (COALESCE(c.closed_date, CURRENT_DATE) - c.opened_date))) as resolution_time,
          SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          CASE 
            WHEN SUM(cte.duration_minutes) > 0 
            THEN (SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / SUM(cte.duration_minutes)) * 100 
            ELSE 0 
          END as utilization_rate,
          4.2 as client_satisfaction, -- Mock value
          SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) as revenue_generated,
          CASE 
            WHEN SUM(cte.duration_minutes) > 0 
            THEN (SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) / (SUM(cte.duration_minutes) / 60.0)) 
            ELSE 0 
          END as efficiency
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
        JOIN cases c ON c.assigned_lawyer_id = u.id
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id
        WHERE u.id = $1
        AND ($2::date IS NULL OR c.opened_date >= $2)
        AND ($3::date IS NULL OR c.opened_date <= $3)
        GROUP BY u.id, up.first_name, up.last_name
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        lawyerId: row.lawyer_id,
        lawyerName: row.lawyer_name,
        caseLoad: parseInt(row.case_load || 0),
        averageCaseValue: parseFloat(row.average_case_value || 0),
        resolutionTime: parseFloat(row.resolution_time || 0),
        billableHours: parseFloat(row.billable_hours || 0),
        utilizationRate: parseFloat(row.utilization_rate || 0),
        clientSatisfaction: parseFloat(row.client_satisfaction),
        revenueGenerated: parseFloat(row.revenue_generated || 0),
        efficiency: parseFloat(row.efficiency || 0)
      }));
    } catch (error) {
      logger.error('Get lawyer metrics error:', error);
      return [];
    }
  }
    // This would query the database for detailed case information
    // For now, return mock data
    return [
      {
        caseId: 'case-1',
        caseNumber: 'CASE-2024-001',
        title: 'Contract Dispute',
        client: 'ABC Corporation',
        status: 'open',
        openedDate: new Date('2024-01-15'),
        assignedLawyer: 'John Doe',
        totalHours: 45.5,
        billableHours: 40.0,
        totalRevenue: 8000,
        lastActivity: new Date('2024-01-25'),
        upcomingDeadlines: 2,
        documentCount: 15,
        eventCount: 8
      }
    ];
  }

  private async getTimeEntries(parameters: any, userId: string): Promise<TimeEntryDetail[]> {
    // This would query the case_time_entries table
    return [];
  }

  private async getInvoiceSummaries(parameters: any, userId: string): Promise<InvoiceSummary[]> {
    // This would query the invoices table
    return [];
  }

  private async getLawyerMetrics(parameters: any, userId: string): Promise<LawyerMetrics[]> {
    // This would calculate lawyer performance metrics
    return [];
  }

  // Helper methods for report data retrieval

  private async getTimeDistribution(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          activity_type,
          SUM(duration_minutes) / 60.0 as hours,
          COUNT(*) as entry_count,
          SUM(CASE WHEN is_billable THEN duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          SUM(CASE WHEN is_billable THEN total_amount ELSE 0 END) as revenue
        FROM case_time_entries cte
        JOIN cases c ON cte.case_id = c.id
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        GROUP BY activity_type
        ORDER BY hours DESC
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      const totalHours = (result as any).rows.reduce((sum: number, row: any) => sum + parseFloat(row.hours), 0);

      return (result as any).rows.map((row: any) => ({
        activityType: row.activity_type,
        hours: parseFloat(row.hours),
        percentage: totalHours > 0 ? (parseFloat(row.hours) / totalHours) * 100 : 0,
        billableHours: parseFloat(row.billable_hours),
        revenue: parseFloat(row.revenue || 0)
      }));
    } catch (error) {
      logger.error('Get time distribution error:', error);
      return [];
    }
  }

  private async getMonthlyRevenue(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          TO_CHAR(cte.entry_date, 'YYYY-MM') as month,
          EXTRACT(YEAR FROM cte.entry_date) as year,
          SUM(cte.total_amount) as revenue,
          SUM(cte.duration_minutes) / 60.0 as hours,
          COUNT(DISTINCT cte.case_id) as case_count
        FROM case_time_entries cte
        JOIN cases c ON cte.case_id = c.id
        WHERE c.assigned_lawyer_id = $1
        AND cte.is_billable = true
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        GROUP BY TO_CHAR(cte.entry_date, 'YYYY-MM'), EXTRACT(YEAR FROM cte.entry_date)
        ORDER BY year, month
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        month: row.month,
        year: parseInt(row.year),
        revenue: parseFloat(row.revenue || 0),
        hours: parseFloat(row.hours),
        caseCount: parseInt(row.case_count)
      }));
    } catch (error) {
      logger.error('Get monthly revenue error:', error);
      return [];
    }
  }

  private async getTopClients(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cc.id as client_id,
          COALESCE(cc.company_name, cp.first_name || ' ' || cp.last_name) as client_name,
          COUNT(c.id) as case_count,
          SUM(cte.total_amount) as total_revenue,
          SUM(cte.duration_minutes) / 60.0 as total_hours,
          AVG(cte.total_amount) as average_case_value,
          MAX(cte.entry_date) as last_activity
        FROM cases c
        LEFT JOIN case_clients cc ON c.id = cc.case_id
        LEFT JOIN client_profiles cp ON cc.id = cp.client_id
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id AND cte.is_billable = true
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR c.opened_date >= $2)
        AND ($3::date IS NULL OR c.opened_date <= $3)
        GROUP BY cc.id, cc.company_name, cp.first_name, cp.last_name
        HAVING COUNT(c.id) > 0
        ORDER BY total_revenue DESC NULLS LAST
        LIMIT 10
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        clientId: row.client_id,
        clientName: row.client_name || 'Client Inconnu',
        caseCount: parseInt(row.case_count),
        totalRevenue: parseFloat(row.total_revenue || 0),
        totalHours: parseFloat(row.total_hours || 0),
        averageCaseValue: parseFloat(row.average_case_value || 0),
        lastActivity: row.last_activity ? new Date(row.last_activity) : new Date()
      }));
    } catch (error) {
      logger.error('Get top clients error:', error);
      return [];
    }
  }

  private async getDailyTimeBreakdown(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cte.entry_date as date,
          SUM(cte.duration_minutes) / 60.0 as total_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          SUM(CASE WHEN NOT cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as non_billable_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) as revenue,
          COUNT(DISTINCT cte.case_id) as case_count
        FROM case_time_entries cte
        JOIN cases c ON cte.case_id = c.id
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        GROUP BY cte.entry_date
        ORDER BY cte.entry_date
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        date: new Date(row.date),
        totalHours: parseFloat(row.total_hours),
        billableHours: parseFloat(row.billable_hours),
        nonBillableHours: parseFloat(row.non_billable_hours),
        revenue: parseFloat(row.revenue || 0),
        caseCount: parseInt(row.case_count)
      }));
    } catch (error) {
      logger.error('Get daily time breakdown error:', error);
      return [];
    }
  }

  private async getActivityTimeBreakdown(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          cte.activity_type,
          SUM(cte.duration_minutes) / 60.0 as total_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          AVG(CASE WHEN cte.is_billable AND cte.duration_minutes > 0 THEN cte.total_amount / (cte.duration_minutes / 60.0) END) as average_hourly_rate,
          SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) as total_revenue
        FROM case_time_entries cte
        JOIN cases c ON cte.case_id = c.id
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        GROUP BY cte.activity_type
        ORDER BY total_hours DESC
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      const totalHours = (result as any).rows.reduce((sum: number, row: any) => sum + parseFloat(row.total_hours), 0);

      return (result as any).rows.map((row: any) => ({
        activityType: row.activity_type,
        totalHours: parseFloat(row.total_hours),
        billableHours: parseFloat(row.billable_hours),
        percentage: totalHours > 0 ? (parseFloat(row.total_hours) / totalHours) * 100 : 0,
        averageHourlyRate: parseFloat(row.average_hourly_rate || 0),
        totalRevenue: parseFloat(row.total_revenue || 0)
      }));
    } catch (error) {
      logger.error('Get activity time breakdown error:', error);
      return [];
    }
  }

  private async getLawyerTimePerformance(parameters: any, userId: string): Promise<any[]> {
    try {
      // For now, return data for the current user only
      // In a multi-lawyer firm, this would query multiple lawyers
      const query = `
        SELECT 
          u.id as lawyer_id,
          up.first_name || ' ' || up.last_name as lawyer_name,
          SUM(cte.duration_minutes) / 60.0 as total_hours,
          SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
          CASE 
            WHEN SUM(cte.duration_minutes) > 0 
            THEN (SUM(CASE WHEN cte.is_billable THEN cte.duration_minutes ELSE 0 END) / SUM(cte.duration_minutes)) * 100 
            ELSE 0 
          END as billable_rate,
          SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN cte.is_billable AND cte.duration_minutes > 0 THEN cte.total_amount / (cte.duration_minutes / 60.0) END) as average_hourly_rate,
          COUNT(DISTINCT cte.case_id) as case_count,
          CASE 
            WHEN SUM(cte.duration_minutes) > 0 
            THEN (SUM(CASE WHEN cte.is_billable THEN cte.total_amount ELSE 0 END) / (SUM(cte.duration_minutes) / 60.0)) * 100 
            ELSE 0 
          END as efficiency
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
        JOIN cases c ON c.assigned_lawyer_id = u.id
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id
        WHERE u.id = $1
        AND ($2::date IS NULL OR cte.entry_date >= $2)
        AND ($3::date IS NULL OR cte.entry_date <= $3)
        GROUP BY u.id, up.first_name, up.last_name
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        lawyerId: row.lawyer_id,
        lawyerName: row.lawyer_name,
        totalHours: parseFloat(row.total_hours || 0),
        billableHours: parseFloat(row.billable_hours || 0),
        billableRate: parseFloat(row.billable_rate || 0),
        totalRevenue: parseFloat(row.total_revenue || 0),
        averageHourlyRate: parseFloat(row.average_hourly_rate || 0),
        caseCount: parseInt(row.case_count || 0),
        efficiency: parseFloat(row.efficiency || 0)
      }));
    } catch (error) {
      logger.error('Get lawyer time performance error:', error);
      return [];
    }
  }

  private async getPaymentTrends(parameters: any, userId: string): Promise<any[]> {
    try {
      // Mock implementation - would need invoice/payment tables
      const months = [];
      const startDate = parameters.dateRange?.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const endDate = parameters.dateRange?.to || new Date();
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        months.push({
          month: currentDate.toISOString().substring(0, 7),
          year: currentDate.getFullYear(),
          invoiced: Math.random() * 10000 + 5000,
          paid: Math.random() * 8000 + 4000,
          outstanding: Math.random() * 2000 + 1000,
          collectionRate: Math.random() * 20 + 80
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      return months;
    } catch (error) {
      logger.error('Get payment trends error:', error);
      return [];
    }
  }

  private async getClientPaymentBehavior(parameters: any, userId: string): Promise<any[]> {
    try {
      // Mock implementation - would need invoice/payment tables
      const clients = await this.getTopClients(parameters, userId);
      
      return clients.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        totalInvoiced: client.totalRevenue,
        totalPaid: client.totalRevenue * (0.8 + Math.random() * 0.2),
        averagePaymentTime: Math.random() * 30 + 15,
        overdueAmount: client.totalRevenue * Math.random() * 0.1,
        paymentReliability: Math.random() * 20 + 80,
        lastPayment: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      }));
    } catch (error) {
      logger.error('Get client payment behavior error:', error);
      return [];
    }
  }

  private async getAgingReport(parameters: any, userId: string): Promise<any[]> {
    try {
      // Mock implementation - would need invoice tables with aging logic
      return [
        { range: '0-30 jours', count: 15, amount: 25000, percentage: 60 },
        { range: '31-60 jours', count: 8, amount: 12000, percentage: 25 },
        { range: '61-90 jours', count: 3, amount: 4500, percentage: 10 },
        { range: '90+ jours', count: 2, amount: 2500, percentage: 5 }
      ];
    } catch (error) {
      logger.error('Get aging report error:', error);
      return [];
    }
  }

  private async getCaseMetrics(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.legal_domain,
          COUNT(c.id) as total_cases,
          AVG(cte.total_amount) as average_value,
          AVG(EXTRACT(DAYS FROM (COALESCE(c.closed_date, CURRENT_DATE) - c.opened_date))) as average_resolution_time,
          COUNT(CASE WHEN c.status = 'closed' AND c.outcome = 'favorable' THEN 1 END)::FLOAT / NULLIF(COUNT(CASE WHEN c.status = 'closed' THEN 1 END), 0) * 100 as success_rate,
          SUM(cte.total_amount) / NULLIF(SUM(cte.duration_minutes / 60.0), 0) as profitability,
          AVG(c.complexity_score) as complexity
        FROM cases c
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id AND cte.is_billable = true
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR c.opened_date >= $2)
        AND ($3::date IS NULL OR c.opened_date <= $3)
        GROUP BY c.legal_domain
        ORDER BY total_cases DESC
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        legalDomain: row.legal_domain || 'Non spécifié',
        totalCases: parseInt(row.total_cases),
        averageValue: parseFloat(row.average_value || 0),
        averageResolutionTime: parseFloat(row.average_resolution_time || 0),
        successRate: parseFloat(row.success_rate || 0),
        profitability: parseFloat(row.profitability || 0),
        complexity: parseFloat(row.complexity || 0)
      }));
    } catch (error) {
      logger.error('Get case metrics error:', error);
      return [];
    }
  }

  private async getClientMetrics(parameters: any, userId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          CASE 
            WHEN cc.company_name IS NOT NULL THEN 'Entreprise'
            ELSE 'Particulier'
          END as client_type,
          COUNT(DISTINCT cc.id) as client_count,
          AVG(cte.total_amount) as average_value,
          COUNT(DISTINCT c.id)::FLOAT / NULLIF(COUNT(DISTINCT cc.id), 0) as retention_rate,
          4.2 as satisfaction_score, -- Mock value
          SUM(cte.total_amount) / NULLIF(SUM(cte.duration_minutes / 60.0), 0) as profitability,
          15.5 as growth_rate -- Mock value
        FROM case_clients cc
        JOIN cases c ON cc.case_id = c.id
        LEFT JOIN case_time_entries cte ON c.id = cte.case_id AND cte.is_billable = true
        WHERE c.assigned_lawyer_id = $1
        AND ($2::date IS NULL OR c.opened_date >= $2)
        AND ($3::date IS NULL OR c.opened_date <= $3)
        GROUP BY 
          CASE 
            WHEN cc.company_name IS NOT NULL THEN 'Entreprise'
            ELSE 'Particulier'
          END
        ORDER BY client_count DESC
      `;
      
      const result = await db.query(query, [
        userId,
        parameters.dateRange?.from,
        parameters.dateRange?.to
      ]);

      return (result as any).rows.map((row: any) => ({
        clientType: row.client_type,
        clientCount: parseInt(row.client_count),
        averageValue: parseFloat(row.average_value || 0),
        retentionRate: parseFloat(row.retention_rate || 0),
        satisfactionScore: parseFloat(row.satisfaction_score),
        profitability: parseFloat(row.profitability || 0),
        growthRate: parseFloat(row.growth_rate)
      }));
    } catch (error) {
      logger.error('Get client metrics error:', error);
      return [];
    }
  }

  private async getTrendAnalysis(parameters: any, userId: string): Promise<any[]> {
    try {
      // Mock implementation - would need historical data comparison
      const metrics = [
        { metric: 'Nombre de dossiers', period: 'Ce mois', value: 25, previousValue: 22, change: 3, changePercentage: 13.6, trend: 'up' as const },
        { metric: 'Chiffre d\'affaires', period: 'Ce mois', value: 45000, previousValue: 42000, change: 3000, changePercentage: 7.1, trend: 'up' as const },
        { metric: 'Heures facturables', period: 'Ce mois', value: 180, previousValue: 175, change: 5, changePercentage: 2.9, trend: 'up' as const },
        { metric: 'Taux de recouvrement', period: 'Ce mois', value: 85.5, previousValue: 88.2, change: -2.7, changePercentage: -3.1, trend: 'down' as const },
        { metric: 'Satisfaction client', period: 'Ce trimestre', value: 4.3, previousValue: 4.1, change: 0.2, changePercentage: 4.9, trend: 'up' as const }
      ];
      
      return metrics;
    } catch (error) {
      logger.error('Get trend analysis error:', error);
      return [];
    }
  }

  private async exportToPDF(report: Report, config?: ExportConfiguration): Promise<string> {
    // PDF export implementation would go here
    const fileName = `${report.id}.pdf`;
    const filePath = path.join('reports', fileName);
    return filePath;
  }

  private async exportToExcel(report: Report, config?: ExportConfiguration): Promise<string> {
    // Excel export implementation would go here
    const fileName = `${report.id}.xlsx`;
    const filePath = path.join('reports', fileName);
    return filePath;
  }

  private async exportToCSV(report: Report, config?: ExportConfiguration): Promise<string> {
    // CSV export implementation would go here
    const fileName = `${report.id}.csv`;
    const filePath = path.join('reports', fileName);
    return filePath;
  }

  private async exportToJSON(report: Report, config?: ExportConfiguration): Promise<string> {
    // JSON export implementation would go here
    const fileName = `${report.id}.json`;
    const filePath = path.join('reports', fileName);
    return filePath;
  }

  private async exportToHTML(report: Report, config?: ExportConfiguration): Promise<string> {
    // HTML export implementation would go here
    const fileName = `${report.id}.html`;
    const filePath = path.join('reports', fileName);
    return filePath;
  }

  private async getReport(reportId: string): Promise<Report | null> {
    try {
      const result = await db.query('SELECT * FROM reports WHERE id = $1', [reportId]);
      if (!result || (result as any).rows.length === 0) {
        return null;
      }
      return this.mapRowToReport((result as any).rows[0]);
    } catch (error) {
      logger.error('Get report error:', error);
      return null;
    }
  }

  private async updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    await db.query(
      'UPDATE reports SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [reportId, status]
    );
  }

  private async updateReportGeneratedAt(reportId: string): Promise<void> {
    await db.query(
      'UPDATE reports SET generated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [reportId]
    );
  }

  private async updateReportFile(reportId: string, filePath: string): Promise<void> {
    const stats = fs.statSync(filePath);
    await db.query(
      'UPDATE reports SET file_path = $2, file_size = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [reportId, filePath, stats.size]
    );
  }

  private async saveReportToDatabase(report: Report): Promise<void> {
    await db.query(
      `INSERT INTO reports (
        id, title, description, type, format, status, parameters, generated_by,
        organization_id, file_path, file_size, generated_at, expires_at,
        download_count, is_public, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        report.id, report.title, report.description, report.type, report.format,
        report.status, JSON.stringify(report.parameters), report.generatedBy,
        report.organizationId, report.filePath, report.fileSize, report.generatedAt,
        report.expiresAt, report.downloadCount, report.isPublic, report.createdAt, report.updatedAt
      ]
    );
  }

  private async saveReportTemplateToDatabase(template: ReportTemplate): Promise<void> {
    await db.query(
      `INSERT INTO report_templates (
        id, name, description, type, format, parameters, layout, is_system,
        is_active, organization_id, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        template.id, template.name, template.description, template.type, template.format,
        JSON.stringify(template.parameters), JSON.stringify(template.layout), template.isSystem,
        template.isActive, template.organizationId, template.createdBy, template.createdAt, template.updatedAt
      ]
    );
  }

  private mapRowToReport(row: any): Report {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      format: row.format,
      status: row.status,
      parameters: JSON.parse(row.parameters || '{}'),
      generatedBy: row.generated_by,
      organizationId: row.organization_id,
      filePath: row.file_path,
      fileSize: row.file_size,
      generatedAt: row.generated_at ? new Date(row.generated_at) : undefined,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      downloadCount: row.download_count,
      isPublic: row.is_public,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export const reportService = new ReportService();