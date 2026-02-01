import { Router, Request, Response } from 'express';
import { BillingService } from '../services/billingService.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbacMiddleware.js';
import { logger } from '../utils/logger.js';
import { 
  CalculateFeeRequest, 
  CreateInvoiceRequest,
  BillingSearchCriteria,
  UpdateFeeScheduleRequest,
  LegalProfession,
  CalculationType,
  BillingStatus
} from '../types/billing.js';

export function createBillingRoutes(billingService: BillingService): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * Calculate fees for a legal service
   * POST /api/billing/calculate
   */
  router.post('/calculate', 
    checkPermission('billing', 'create'),
    async (req: Request, res: Response) => {
      try {
        const request: CalculateFeeRequest = req.body;
        
        // Validate required fields
        if (!request.caseId || !request.clientId || !request.profession || !request.calculationType) {
          return res.status(400).json({
            error: 'Missing required fields: caseId, clientId, profession, calculationType'
          });
        }

        const result = await billingService.calculateFees(request);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Error in calculate fees endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to calculate fees',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Create invoice from billing calculation
   * POST /api/billing/invoices
   */
  router.post('/invoices',
    checkPermission('billing', 'create'),
    async (req: Request, res: Response) => {
      try {
        const request: CreateInvoiceRequest = req.body;
        
        if (!request.billingCalculationId) {
          return res.status(400).json({
            error: 'Missing required field: billingCalculationId'
          });
        }

        const invoice = await billingService.createInvoice(request);
        
        res.status(201).json({
          success: true,
          data: invoice
        });
      } catch (error) {
        logger.error('Error in create invoice endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to create invoice',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get billing calculation by ID
   * GET /api/billing/calculations/:id
   */
  router.get('/calculations/:id',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        const calculation = await billingService.getBillingCalculation(id);
        
        if (!calculation) {
          return res.status(404).json({
            error: 'Billing calculation not found'
          });
        }

        res.json({
          success: true,
          data: calculation
        });
      } catch (error) {
        logger.error('Error in get billing calculation endpoint', { error, id: req.params.id });
        res.status(500).json({
          error: 'Failed to get billing calculation',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Search billing calculations
   * GET /api/billing/calculations
   */
  router.get('/calculations',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const criteria: BillingSearchCriteria = {
          caseId: req.query.caseId as string,
          clientId: req.query.clientId as string,
          lawyerId: req.query.lawyerId as string,
          profession: req.query.profession as LegalProfession,
          status: req.query.status as BillingStatus,
          sortBy: req.query.sortBy as any,
          sortOrder: req.query.sortOrder as 'asc' | 'desc',
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
        };

        // Parse date range
        if (req.query.dateFrom || req.query.dateTo) {
          criteria.dateRange = {
            from: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
            to: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
          };
        }

        // Parse amount range
        if (req.query.amountMin || req.query.amountMax) {
          criteria.amountRange = {
            min: req.query.amountMin ? parseFloat(req.query.amountMin as string) : undefined,
            max: req.query.amountMax ? parseFloat(req.query.amountMax as string) : undefined
          };
        }

        const result = await billingService.searchBillingCalculations(criteria);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('Error in search billing calculations endpoint', { error, query: req.query });
        res.status(500).json({
          error: 'Failed to search billing calculations',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get billing statistics
   * GET /api/billing/statistics
   */
  router.get('/statistics',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const lawyerId = req.query.lawyerId as string;
        
        const statistics = await billingService.getBillingStatistics(lawyerId);
        
        res.json({
          success: true,
          data: statistics
        });
      } catch (error) {
        logger.error('Error in get billing statistics endpoint', { error, query: req.query });
        res.status(500).json({
          error: 'Failed to get billing statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Update fee schedules (Admin only)
   * PUT /api/billing/fee-schedules
   */
  router.put('/fee-schedules',
    checkPermission('billing', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const request: UpdateFeeScheduleRequest = req.body;
        
        if (!request.profession || !request.schedules || !request.effectiveDate || !request.reason) {
          return res.status(400).json({
            error: 'Missing required fields: profession, schedules, effectiveDate, reason'
          });
        }

        await billingService.updateFeeSchedules(request);
        
        res.json({
          success: true,
          message: 'Fee schedules updated successfully'
        });
      } catch (error) {
        logger.error('Error in update fee schedules endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to update fee schedules',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get active fee schedules
   * GET /api/billing/fee-schedules
   */
  router.get('/fee-schedules',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const profession = req.query.profession as LegalProfession;
        const category = req.query.category as string;
        
        let query = 'SELECT * FROM active_fee_schedules WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (profession) {
          query += ` AND profession = $${paramIndex++}`;
          params.push(profession);
        }

        if (category) {
          query += ` AND category = $${paramIndex++}`;
          params.push(category);
        }

        query += ' ORDER BY profession, category, subcategory';

        // This would need to be implemented with proper database access
        // For now, returning a placeholder response
        res.json({
          success: true,
          data: [],
          message: 'Fee schedules endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in get fee schedules endpoint', { error, query: req.query });
        res.status(500).json({
          error: 'Failed to get fee schedules',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get invoice by ID
   * GET /api/billing/invoices/:id
   */
  router.get('/invoices/:id',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        // This would need to be implemented in BillingService
        res.json({
          success: true,
          data: null,
          message: 'Get invoice endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in get invoice endpoint', { error, id: req.params.id });
        res.status(500).json({
          error: 'Failed to get invoice',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Update invoice status
   * PATCH /api/billing/invoices/:id/status
   */
  router.patch('/invoices/:id/status',
    checkPermission('billing', 'update'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { status, paymentStatus, paymentMethod, paymentReference } = req.body;
        
        // This would need to be implemented in BillingService
        res.json({
          success: true,
          message: 'Update invoice status endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in update invoice status endpoint', { error, id: req.params.id, body: req.body });
        res.status(500).json({
          error: 'Failed to update invoice status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Generate invoice PDF
   * GET /api/billing/invoices/:id/pdf
   */
  router.get('/invoices/:id/pdf',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        // This would need to be implemented with PDF generation
        res.json({
          success: true,
          message: 'Generate invoice PDF endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in generate invoice PDF endpoint', { error, id: req.params.id });
        res.status(500).json({
          error: 'Failed to generate invoice PDF',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get lawyer fee calculation preview
   * POST /api/billing/preview/lawyer
   */
  router.post('/preview/lawyer',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { caseType, courtLevel, complexity, hours, baseAmount, urgency } = req.body;
        
        // This would use the database function directly for preview
        res.json({
          success: true,
          message: 'Lawyer fee preview endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in lawyer fee preview endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to preview lawyer fees',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get notary fee calculation preview
   * POST /api/billing/preview/notary
   */
  router.post('/preview/notary',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { actType, propertyValue, propertyType, documentCount } = req.body;
        
        // This would use the database function directly for preview
        res.json({
          success: true,
          message: 'Notary fee preview endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in notary fee preview endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to preview notary fees',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Get bailiff fee calculation preview
   * POST /api/billing/preview/bailiff
   */
  router.post('/preview/bailiff',
    checkPermission('billing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { executionType, executionAmount, distance, urgency } = req.body;
        
        // This would use the database function directly for preview
        res.json({
          success: true,
          message: 'Bailiff fee preview endpoint - implementation needed'
        });
      } catch (error) {
        logger.error('Error in bailiff fee preview endpoint', { error, body: req.body });
        res.status(500).json({
          error: 'Failed to preview bailiff fees',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  return router;
}

// Create and export the billing router with database connection
import { db } from '../database/connection.js';
import { BillingService } from '../services/billingService.js';

const billingService = new BillingService(db);
export const billingRouter = createBillingRoutes(billingService);