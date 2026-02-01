import request from 'supertest';
import { Pool } from 'pg';
import express from 'express';
import { BillingService } from '../services/billingService.js';
import { createBillingRoutes } from '../routes/billing.js';
import {
  LegalProfession,
  CalculationType,
  CaseComplexity,
  CourtLevel,
  UrgencyLevel,
  BillingStatus,
  InvoiceStatus,
  PaymentStatus
} from '../types/billing.js';

// Mock database pool
const mockDb = {
  query: jest.fn(),
  connect: jest.fn()
} as unknown as Pool;

// Mock authentication middleware
jest.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', role: 'avocat' };
    next();
  }
}));

// Mock RBAC middleware
jest.mock('../middleware/rbacMiddleware.js', () => ({
  checkPermission: (resource: string, action: string) => (req: any, res: any, next: any) => {
    next();
  }
}));

// Mock logger
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Billing System Integration Tests', () => {
  let app: express.Application;
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService(mockDb);
    app = express();
    app.use(express.json());
    app.use('/api/billing', createBillingRoutes(billingService));
    jest.clearAllMocks();
  });

  describe('POST /api/billing/calculate', () => {
    it('should calculate lawyer fees successfully', async () => {
      // Mock database responses for lawyer fee calculation
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          // Mock calculate_lawyer_fees function
          rows: [{
            base_fee: 15000,
            complexity_multiplier: 1.2,
            urgency_multiplier: 1.0,
            court_multiplier: 1.5,
            total_fee: 27000
          }]
        })
        .mockResolvedValueOnce({
          // Mock calculate_taxes function
          rows: [{
            tax_type: 'vat',
            tax_rate: 0.19,
            tax_amount: 5130
          }]
        })
        .mockResolvedValueOnce({
          // Mock case query for lawyer_id
          rows: [{ lawyer_id: 'lawyer-123' }]
        })
        .mockResolvedValueOnce({
          // Mock save calculation
          rows: [{ id: 'calc-123' }]
        });

      const requestBody = {
        caseId: 'case-123',
        clientId: 'client-123',
        profession: LegalProfession.AVOCAT,
        calculationType: CalculationType.COURT_SCALE,
        parameters: {
          caseType: 'civil_litigation',
          courtLevel: CourtLevel.COUR_APPEL,
          caseComplexity: CaseComplexity.MODERATE,
          hours: 10,
          urgency: UrgencyLevel.NORMAL,
          travelExpenses: 2000,
          expertFees: 5000
        },
        applyTaxes: true,
        saveCalculation: true
      };

      const response = await request(app)
        .post('/api/billing/calculate')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        calculationId: 'calc-123',
        currency: 'DZD',
        totalAmount: expect.any(Number),
        taxAmount: expect.any(Number),
        finalAmount: expect.any(Number)
      });

      expect(response.body.data.breakdown).toMatchObject({
        baseFee: 15000,
        complexityMultiplier: 1.2,
        urgencyMultiplier: 1.0,
        courtLevelMultiplier: 1.5,
        additionalFees: expect.arrayContaining([
          expect.objectContaining({ type: 'travel', amount: 2000 }),
          expect.objectContaining({ type: 'expert', amount: 5000 })
        ])
      });
    });

    it('should calculate notary fees successfully', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          // Mock calculate_notary_fees function
          rows: [{
            base_fee: 50000,
            percentage_fee: 75000,
            document_fee: 0,
            total_fee: 75000
          }]
        });

      const requestBody = {
        caseId: 'case-123',
        clientId: 'client-123',
        profession: LegalProfession.NOTAIRE,
        calculationType: CalculationType.NOTARIAL_SCALE,
        parameters: {
          documentType: 'property_sale',
          propertyValue: 5000000,
          propertyType: 'residential',
          documentCount: 1
        },
        applyTaxes: false,
        saveCalculation: false
      };

      const response = await request(app)
        .post('/api/billing/calculate')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breakdown.baseFee).toBe(75000);
      expect(response.body.data.calculationId).toBeUndefined();
    });

    it('should calculate bailiff fees successfully', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          // Mock calculate_bailiff_fees function
          rows: [{
            base_fee: 8000,
            distance_fee: 1500,
            urgency_multiplier: 1.5,
            total_fee: 14250
          }]
        });

      const requestBody = {
        caseId: 'case-123',
        clientId: 'client-123',
        profession: LegalProfession.HUISSIER,
        calculationType: CalculationType.BAILIFF_SCALE,
        parameters: {
          executionType: 'seizure',
          executionAmount: 100000,
          distance: 40,
          urgency: UrgencyLevel.URGENT
        },
        applyTaxes: false,
        saveCalculation: false
      };

      const response = await request(app)
        .post('/api/billing/calculate')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breakdown.baseFee).toBe(9500); // base + distance
      expect(response.body.data.breakdown.urgencyMultiplier).toBe(1.5);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        caseId: 'case-123',
        // Missing clientId, profession, calculationType
        parameters: {}
      };

      const response = await request(app)
        .post('/api/billing/calculate')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle database errors gracefully', async () => {
      (mockDb.query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

      const requestBody = {
        caseId: 'case-123',
        clientId: 'client-123',
        profession: LegalProfession.AVOCAT,
        calculationType: CalculationType.HOURLY_RATE,
        parameters: { hours: 5 }
      };

      const response = await request(app)
        .post('/api/billing/calculate')
        .send(requestBody)
        .expect(500);

      expect(response.body.error).toBe('Failed to calculate fees');
      expect(response.body.message).toContain('Database connection failed');
    });
  });

  describe('POST /api/billing/invoices', () => {
    it('should create invoice successfully', async () => {
      const mockCalculation = {
        id: 'calc-123',
        case_id: 'case-123',
        client_id: 'client-123',
        lawyer_id: 'lawyer-123',
        profession: 'avocat',
        calculation_type: 'court_scale',
        base_amount: 15000,
        total_amount: 18000,
        tax_amount: 3420,
        final_amount: 21420,
        currency: 'DZD',
        calculation_date: new Date(),
        parameters: {},
        breakdown: {},
        status: 'calculated',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          // Mock getBillingCalculation
          rows: [mockCalculation]
        })
        .mockResolvedValueOnce({
          // Mock generate_invoice_number
          rows: [{ invoice_number: 'FAC-2024-LAW123-0001' }]
        })
        .mockResolvedValueOnce({
          // Mock create invoice
          rows: [{
            id: 'invoice-123',
            invoice_number: 'FAC-2024-LAW123-0001',
            billing_calculation_id: 'calc-123',
            case_id: 'case-123',
            client_id: 'client-123',
            lawyer_id: 'lawyer-123',
            issue_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            payment_terms: 30,
            subtotal: 18000,
            tax_amount: 3420,
            total_amount: 21420,
            paid_amount: 0,
            remaining_amount: 21420,
            status: 'draft',
            payment_status: 'unpaid',
            notes: 'Test invoice',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({
          // Mock update billing calculation status
          rows: []
        });

      const requestBody = {
        billingCalculationId: 'calc-123',
        paymentTerms: 30,
        notes: 'Test invoice',
        sendToClient: false
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .send(requestBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'invoice-123',
        invoiceNumber: 'FAC-2024-LAW123-0001',
        billingCalculationId: 'calc-123',
        status: InvoiceStatus.DRAFT,
        paymentStatus: PaymentStatus.UNPAID,
        notes: 'Test invoice'
      });
    });

    it('should return 400 for missing billing calculation ID', async () => {
      const requestBody = {
        paymentTerms: 30,
        notes: 'Test invoice'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('Missing required field: billingCalculationId');
    });

    it('should handle non-existent billing calculation', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [] // No billing calculation found
      });

      const requestBody = {
        billingCalculationId: 'nonexistent-calc'
      };

      const response = await request(app)
        .post('/api/billing/invoices')
        .send(requestBody)
        .expect(500);

      expect(response.body.error).toBe('Failed to create invoice');
      expect(response.body.message).toContain('Billing calculation not found');
    });
  });

  describe('GET /api/billing/calculations/:id', () => {
    it('should return billing calculation when found', async () => {
      const mockCalculation = {
        id: 'calc-123',
        case_id: 'case-123',
        client_id: 'client-123',
        lawyer_id: 'lawyer-123',
        profession: 'avocat',
        calculation_type: 'court_scale',
        base_amount: 15000,
        total_amount: 18000,
        tax_amount: 3420,
        final_amount: 21420,
        currency: 'DZD',
        calculation_date: new Date(),
        parameters: {},
        breakdown: {},
        status: 'calculated',
        created_at: new Date(),
        updated_at: new Date()
      };

      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockCalculation]
      });

      const response = await request(app)
        .get('/api/billing/calculations/calc-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'calc-123',
        caseId: 'case-123',
        profession: LegalProfession.AVOCAT,
        calculationType: CalculationType.COURT_SCALE
      });
    });

    it('should return 404 when calculation not found', async () => {
      (mockDb.query as jest.Mock).mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .get('/api/billing/calculations/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Billing calculation not found');
    });
  });

  describe('GET /api/billing/calculations', () => {
    it('should search billing calculations with filters', async () => {
      const mockCalculations = [{
        id: 'calc-123',
        case_id: 'case-123',
        client_id: 'client-123',
        lawyer_id: 'lawyer-123',
        profession: 'avocat',
        calculation_type: 'court_scale',
        base_amount: 15000,
        total_amount: 18000,
        tax_amount: 3420,
        final_amount: 21420,
        currency: 'DZD',
        calculation_date: new Date(),
        parameters: {},
        breakdown: {},
        status: 'calculated',
        created_at: new Date(),
        updated_at: new Date()
      }];

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: mockCalculations
        })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }]
        });

      const response = await request(app)
        .get('/api/billing/calculations')
        .query({
          profession: LegalProfession.AVOCAT,
          status: BillingStatus.CALCULATED,
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.calculations).toHaveLength(1);
      expect(response.body.data.totalCount).toBe(1);
      expect(response.body.data.searchTime).toBeGreaterThan(0);
    });

    it('should handle date range filtering', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app)
        .get('/api/billing/calculations')
        .query({
          dateFrom: '2024-01-01',
          dateTo: '2024-12-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.calculations).toHaveLength(0);
    });

    it('should handle amount range filtering', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app)
        .get('/api/billing/calculations')
        .query({
          amountMin: 10000,
          amountMax: 50000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.calculations).toHaveLength(0);
    });
  });

  describe('GET /api/billing/statistics', () => {
    it('should return billing statistics', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          // Basic statistics
          rows: [{
            total_calculations: '10',
            total_amount: '180000',
            average_amount: '18000'
          }]
        })
        .mockResolvedValueOnce({
          // By profession
          rows: [
            { profession: 'avocat', count: '8' },
            { profession: 'notaire', count: '2' }
          ]
        })
        .mockResolvedValueOnce({
          // By type
          rows: [
            { calculation_type: 'court_scale', count: '6' },
            { calculation_type: 'hourly_rate', count: '4' }
          ]
        })
        .mockResolvedValueOnce({
          // By status
          rows: [
            { status: 'calculated', count: '7' },
            { status: 'invoiced', count: '3' }
          ]
        });

      const response = await request(app)
        .get('/api/billing/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalCalculations: 10,
        totalAmount: 180000,
        averageAmount: 18000,
        calculationsByProfession: {
          [LegalProfession.AVOCAT]: 8,
          [LegalProfession.NOTAIRE]: 2
        }
      });
    });

    it('should filter statistics by lawyer', async () => {
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_calculations: '5',
            total_amount: '90000',
            average_amount: '18000'
          }]
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/billing/statistics')
        .query({ lawyerId: 'lawyer-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCalculations).toBe(5);
      expect(response.body.data.totalAmount).toBe(90000);
    });
  });

  describe('PUT /api/billing/fee-schedules', () => {
    it('should update fee schedules successfully', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // INSERT/UPDATE schedule
        .mockResolvedValueOnce({ rows: [] }) // INSERT log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const requestBody = {
        profession: LegalProfession.AVOCAT,
        schedules: [{
          category: 'Consultation juridique',
          minimumFee: 2500,
          unitType: 'per_hour',
          legalReference: 'Updated reference 2024'
        }],
        effectiveDate: '2024-01-01',
        reason: 'Annual fee update'
      };

      const response = await request(app)
        .put('/api/billing/fee-schedules')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Fee schedules updated successfully');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        profession: LegalProfession.AVOCAT,
        // Missing schedules, effectiveDate, reason
      };

      const response = await request(app)
        .put('/api/billing/fee-schedules')
        .send(requestBody)
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle database transaction errors', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      (mockDb.connect as jest.Mock).mockResolvedValueOnce(mockClient);
      
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT fails

      const requestBody = {
        profession: LegalProfession.AVOCAT,
        schedules: [{}],
        effectiveDate: '2024-01-01',
        reason: 'Test update'
      };

      const response = await request(app)
        .put('/api/billing/fee-schedules')
        .send(requestBody)
        .expect(500);

      expect(response.body.error).toBe('Failed to update fee schedules');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('End-to-End Billing Workflow', () => {
    it('should complete full billing workflow: calculate -> invoice -> statistics', async () => {
      // Step 1: Calculate fees
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            base_fee: 15000,
            complexity_multiplier: 1.2,
            urgency_multiplier: 1.0,
            court_multiplier: 1.0,
            total_fee: 18000
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ lawyer_id: 'lawyer-123' }]
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'calc-123' }]
        });

      const calculateResponse = await request(app)
        .post('/api/billing/calculate')
        .send({
          caseId: 'case-123',
          clientId: 'client-123',
          profession: LegalProfession.AVOCAT,
          calculationType: CalculationType.COURT_SCALE,
          parameters: {
            caseType: 'civil_litigation',
            hours: 10
          },
          saveCalculation: true
        })
        .expect(200);

      const calculationId = calculateResponse.body.data.calculationId;
      expect(calculationId).toBe('calc-123');

      // Step 2: Create invoice
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: calculationId,
            case_id: 'case-123',
            client_id: 'client-123',
            lawyer_id: 'lawyer-123',
            total_amount: 18000,
            tax_amount: 0,
            final_amount: 18000,
            profession: 'avocat',
            calculation_type: 'court_scale',
            base_amount: 15000,
            currency: 'DZD',
            calculation_date: new Date(),
            parameters: {},
            breakdown: {},
            status: 'calculated',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ invoice_number: 'FAC-2024-LAW123-0001' }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'invoice-123',
            invoice_number: 'FAC-2024-LAW123-0001',
            billing_calculation_id: calculationId,
            case_id: 'case-123',
            client_id: 'client-123',
            lawyer_id: 'lawyer-123',
            issue_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            payment_terms: 30,
            subtotal: 18000,
            tax_amount: 0,
            total_amount: 18000,
            paid_amount: 0,
            remaining_amount: 18000,
            status: 'draft',
            payment_status: 'unpaid',
            created_at: new Date(),
            updated_at: new Date()
          }]
        })
        .mockResolvedValueOnce({ rows: [] });

      const invoiceResponse = await request(app)
        .post('/api/billing/invoices')
        .send({
          billingCalculationId: calculationId,
          paymentTerms: 30
        })
        .expect(201);

      expect(invoiceResponse.body.data.invoiceNumber).toBe('FAC-2024-LAW123-0001');

      // Step 3: Get statistics
      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            total_calculations: '1',
            total_amount: '18000',
            average_amount: '18000'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ profession: 'avocat', count: '1' }]
        })
        .mockResolvedValueOnce({
          rows: [{ calculation_type: 'court_scale', count: '1' }]
        })
        .mockResolvedValueOnce({
          rows: [{ status: 'invoiced', count: '1' }]
        });

      const statsResponse = await request(app)
        .get('/api/billing/statistics')
        .expect(200);

      expect(statsResponse.body.data.totalCalculations).toBe(1);
      expect(statsResponse.body.data.totalAmount).toBe(18000);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});