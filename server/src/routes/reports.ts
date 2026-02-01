import express from 'express';
import { reportService } from '@/services/reportService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';
import { db } from '@/database/connection';
import {
  CreateReportRequest,
  CreateReportTemplateRequest,
  UpdateReportTemplateRequest,
  ReportSearchCriteria,
  ReportType,
  ReportFormat,
  ReportStatus,
  ExportConfiguration
} from '@/types/report';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/**
 * Generate a new report
 * POST /api/reports
 */
router.post('/', rbacMiddleware(['report:create']), async (req, res) => {
  try {
    const reportData: CreateReportRequest = req.body;
    const userId = (req as any).user.id;
    const organizationId = (req as any).user?.organizationId;

    const report = await reportService.generateReport(reportData, userId, organizationId);

    res.status(201).json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * Generate case activity report
 * POST /api/reports/case-activity
 */
router.post('/case-activity', rbacMiddleware(['case:read', 'report:create']), async (req, res) => {
  try {
    const parameters = req.body.parameters || {};
    const userId = (req as any).user.id;

    const report = await reportService.generateCaseActivityReport(parameters, userId);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate case activity report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate case activity report'
    });
  }
});

/**
 * Generate time tracking report
 * POST /api/reports/time-tracking
 */
router.post('/time-tracking', rbacMiddleware(['case:read', 'report:create']), async (req, res) => {
  try {
    const parameters = req.body.parameters || {};
    const userId = (req as any).user.id;

    const report = await reportService.generateTimeTrackingReport(parameters, userId);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate time tracking report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate time tracking report'
    });
  }
});

/**
 * Generate billing summary report
 * POST /api/reports/billing-summary
 */
router.post('/billing-summary', rbacMiddleware(['billing:read', 'report:create']), async (req, res) => {
  try {
    const parameters = req.body.parameters || {};
    const userId = (req as any).user.id;

    const report = await reportService.generateBillingSummaryReport(parameters, userId);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate billing summary report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate billing summary report'
    });
  }
});

/**
 * Generate performance metrics report
 * POST /api/reports/performance-metrics
 */
router.post('/performance-metrics', rbacMiddleware(['admin:read', 'report:create']), async (req, res) => {
  try {
    const parameters = req.body.parameters || {};
    const userId = (req as any).user.id;

    const report = await reportService.generatePerformanceMetricsReport(parameters, userId);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Generate performance metrics report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance metrics report'
    });
  }
});

/**
 * Search reports
 * GET /api/reports/search
 */
router.get('/search', rbacMiddleware(['report:read']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const criteria: ReportSearchCriteria = {
      type: req.query.type as ReportType,
      format: req.query.format as ReportFormat,
      status: req.query.status as ReportStatus,
      generatedBy: req.query.generatedBy as string,
      dateRange: req.query.from || req.query.to ? {
        from: req.query.from ? new Date(req.query.from as string) : undefined,
        to: req.query.to ? new Date(req.query.to as string) : undefined
      } : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    // Non-admin users can only see their own reports
    if (userRole !== 'Administrateur_Plateforme') {
      criteria.generatedBy = userId;
    }

    const result = await reportService.searchReports(criteria, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Search reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search reports'
    });
  }
});

/**
 * Get user's reports
 * GET /api/reports/my
 */
router.get('/my', async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const criteria: ReportSearchCriteria = {
      generatedBy: userId,
      status: req.query.status as ReportStatus,
      type: req.query.type as ReportType,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: 'created_at',
      sortOrder: 'desc'
    };

    const result = await reportService.searchReports(criteria, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports'
    });
  }
});

/**
 * Get report by ID
 * GET /api/reports/:id
 */
router.get('/:id', rbacMiddleware(['report:read']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Get report from database
    const query = `
      SELECT r.*, up.first_name || ' ' || up.last_name as generated_by_name
      FROM reports r
      LEFT JOIN users u ON r.generated_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
      WHERE r.id = $1
      AND (r.generated_by = $2 OR $3 = 'Administrateur_Plateforme')
    `;

    const result = await db.query(query, [reportId, userId, userRole]);

    if (!result || (result as any).rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const report = (result as any).rows[0];

    res.json({
      success: true,
      data: {
        id: report.id,
        title: report.title,
        description: report.description,
        type: report.type,
        format: report.format,
        status: report.status,
        parameters: JSON.parse(report.parameters || '{}'),
        generatedBy: report.generated_by,
        generatedByName: report.generated_by_name,
        organizationId: report.organization_id,
        filePath: report.file_path,
        fileSize: report.file_size,
        generatedAt: report.generated_at,
        expiresAt: report.expires_at,
        downloadCount: report.download_count,
        isPublic: report.is_public,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      }
    });

  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report'
    });
  }
});

/**
 * Download report file
 * GET /api/reports/:id/download
 */
router.get('/:id/download', rbacMiddleware(['report:read']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Verify user has access to the report
    const query = `
      SELECT r.*, up.first_name || ' ' || up.last_name as generated_by_name
      FROM reports r
      LEFT JOIN users u ON r.generated_by = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id AND up.is_primary = true
      WHERE r.id = $1
      AND (r.generated_by = $2 OR $3 = 'Administrateur_Plateforme')
      AND r.status = 'completed'
      AND r.file_path IS NOT NULL
    `;

    const result = await db.query(query, [reportId, userId, userRole]);

    if (!result || (result as any).rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or not available for download'
      });
    }

    const report = (result as any).rows[0];

    // Check if file exists
    if (!fs.existsSync(report.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found on disk'
      });
    }

    // Update download count
    await db.query(
      'UPDATE reports SET download_count = download_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [reportId]
    );

    // Log the download event
    await db.query(
      `INSERT INTO report_audit (report_id, action, performed_by, details, ip_address, user_agent)
       VALUES ($1, 'downloaded', $2, $3, $4, $5)`,
      [
        reportId,
        userId,
        JSON.stringify({ fileName: path.basename(report.file_path) }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    // Set appropriate headers
    const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.${report.format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', getContentType(report.format));
    res.setHeader('Content-Length', report.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(report.file_path);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Download report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    });
  }
});

// Helper function to get content type
function getContentType(format: string): string {
  switch (format) {
    case 'pdf': return 'application/pdf';
    case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv': return 'text/csv';
    case 'json': return 'application/json';
    case 'html': return 'text/html';
    default: return 'application/octet-stream';
  }
}

/**
 * Export report in different format
 * POST /api/reports/:id/export
 */
router.post('/:id/export', rbacMiddleware(['report:read']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const format = req.body.format as ReportFormat;
    const config = req.body.config as ExportConfiguration;

    const filePath = await reportService.exportReport(reportId, format, config);

    res.json({
      success: true,
      data: { filePath }
    });

  } catch (error) {
    logger.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

/**
 * Delete report
 * DELETE /api/reports/:id
 */
router.delete('/:id', rbacMiddleware(['report:delete']), async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Verify user owns the report or has admin rights
    const query = `
      SELECT r.* FROM reports r
      WHERE r.id = $1
      AND (r.generated_by = $2 OR $3 = 'Administrateur_Plateforme')
    `;

    const result = await db.query(query, [reportId, userId, userRole]);

    if (!result || (result as any).rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }

    const report = (result as any).rows[0];

    // Delete the file from storage if it exists
    if (report.file_path && fs.existsSync(report.file_path)) {
      try {
        fs.unlinkSync(report.file_path);
      } catch (fileError) {
        logger.warn('Failed to delete report file:', fileError);
      }
    }

    // Update database record (soft delete by setting status to expired)
    await db.query(
      'UPDATE reports SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [reportId, 'expired']
    );

    // Log the deletion
    await db.query(
      `INSERT INTO report_audit (report_id, action, performed_by, details, ip_address, user_agent)
       VALUES ($1, 'deleted', $2, $3, $4, $5)`,
      [
        reportId,
        userId,
        JSON.stringify({ reason: 'user_requested' }),
        req.ip,
        req.get('User-Agent')
      ]
    );

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    logger.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

/**
 * Get report statistics
 * GET /api/reports/statistics
 */
router.get('/statistics', rbacMiddleware(['report:read']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const organizationId = (req as any).user?.organizationId;

    // Admin can see all statistics, others only their own
    const targetUserId = userRole === 'Administrateur_Plateforme' ? 
      (req.query.userId as string) : userId;
    const targetOrgId = userRole === 'Administrateur_Plateforme' ? 
      (req.query.organizationId as string) || organizationId : organizationId;

    const statistics = await reportService.getReportStatistics(targetUserId, targetOrgId);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get report statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report statistics'
    });
  }
});

/**
 * Create report template
 * POST /api/reports/templates
 */
router.post('/templates', rbacMiddleware(['report:template:create']), async (req, res) => {
  try {
    const templateData: CreateReportTemplateRequest = req.body;
    const userId = (req as any).user.id;
    const organizationId = (req as any).user?.organizationId;

    const template = await reportService.createReportTemplate(templateData, userId, organizationId);

    res.status(201).json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Create report template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report template'
    });
  }
});

/**
 * Get report templates
 * GET /api/reports/templates
 */
router.get('/templates', rbacMiddleware(['report:template:read']), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user?.organizationId;

    // This would need to be implemented in the service
    res.json({
      success: true,
      data: []
    });

  } catch (error) {
    logger.error('Get report templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report templates'
    });
  }
});

/**
 * Update report template
 * PUT /api/reports/templates/:id
 */
router.put('/templates/:id', rbacMiddleware(['report:template:update']), async (req, res) => {
  try {
    const templateId = req.params.id;
    const updates: UpdateReportTemplateRequest = req.body;
    const userId = (req as any).user.id;

    // This would need to be implemented in the service
    res.json({
      success: false,
      error: 'Template update not yet implemented'
    });

  } catch (error) {
    logger.error('Update report template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report template'
    });
  }
});

/**
 * Delete report template
 * DELETE /api/reports/templates/:id
 */
router.delete('/templates/:id', rbacMiddleware(['report:template:delete']), async (req, res) => {
  try {
    const templateId = req.params.id;
    const userId = (req as any).user.id;

    // This would need to be implemented in the service
    res.json({
      success: false,
      error: 'Template deletion not yet implemented'
    });

  } catch (error) {
    logger.error('Delete report template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report template'
    });
  }
});

/**
 * Get report metadata (types, formats, etc.)
 * GET /api/reports/metadata
 */
router.get('/metadata', async (req, res) => {
  try {
    const metadata = {
      types: Object.values(ReportType),
      formats: Object.values(ReportFormat),
      statuses: Object.values(ReportStatus)
    };

    res.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    logger.error('Get report metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report metadata'
    });
  }
});

export default router;