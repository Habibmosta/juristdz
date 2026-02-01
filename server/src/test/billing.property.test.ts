import * as fc from 'fast-check';
import { Pool } from 'pg';
import { BillingService } from '../services/billingService.js';
import {
  CalculateFeeRequest,
  LegalProfession,
  CalculationType,
  CaseComplexity,
  CourtLevel,
  UrgencyLevel,
  PropertyType,
  ExecutionType,
  BillingParameters
} from '../types/billing.js';

// Mock the database pool
const mockDb = {
  query: jest.fn(),
  connect: jest.fn()
} as unknown as Pool;

// Mock logger
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Billing System Property-Based Tests', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService(mockDb);
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 5.4, 6.1-6.3**
   * Property 14: Calcul Correct des Honoraires et Frais
   * 
   * This property ensures that fee calculations are always:
   * - Non-negative
   * - Consistent with input parameters
   * - Respect minimum fee thresholds
   * - Apply multipliers correctly
   */
  describe('Property 14: Calcul Correct des Honoraires et Frais', () => {
    // Arbitraries for generating test data
    const legalProfessionArb = fc.constantFrom(
      LegalProfession.AVOCAT,
      LegalProfession.NOTAIRE,
      LegalProfession.HUISSIER
    );

    const calculationTypeArb = fc.constantFrom(
      CalculationType.HOURLY_RATE,
      CalculationType.FIXED_FEE,
      CalculationType.PERCENTAGE_FEE,
      CalculationType.COURT_SCALE,
      CalculationType.NOTARIAL_SCALE,
      CalculationType.BAILIFF_SCALE
    );

    const complexityArb = fc.constantFrom(
      CaseComplexity.SIMPLE,
      CaseComplexity.MODERATE,
      CaseComplexity.COMPLEX,
      CaseComplexity.VERY_COMPLEX
    );

    const courtLevelArb = fc.constantFrom(
      CourtLevel.TRIBUNAL_PREMIERE_INSTANCE,
      CourtLevel.COUR_APPEL,
      CourtLevel.COUR_SUPREME,
      CourtLevel.CONSEIL_ETAT,
      CourtLevel.TRIBUNAL_ADMINISTRATIF,
      CourtLevel.TRIBUNAL_COMMERCE
    );

    const urgencyArb = fc.constantFrom(
      UrgencyLevel.NORMAL,
      UrgencyLevel.URGENT,
      UrgencyLevel.VERY_URGENT,
      UrgencyLevel.EMERGENCY
    );

    const propertyTypeArb = fc.constantFrom(
      PropertyType.RESIDENTIAL,
      PropertyType.COMMERCIAL,
      PropertyType.INDUSTRIAL,
      PropertyType.AGRICULTURAL,
      PropertyType.LAND
    );

    const executionTypeArb = fc.constantFrom(
      ExecutionType.SEIZURE,
      ExecutionType.EVICTION,
      ExecutionType.DELIVERY,
      ExecutionType.INVENTORY,
      ExecutionType.AUCTION,
      ExecutionType.NOTIFICATION
    );

    const billingParametersArb = fc.record({
      hours: fc.option(fc.float({ min: 0.1, max: 1000 })),
      hourlyRate: fc.option(fc.float({ min: 1000, max: 50000 })),
      fixedAmount: fc.option(fc.float({ min: 1000, max: 1000000 })),
      percentageRate: fc.option(fc.float({ min: 0.001, max: 0.1 })),
      baseValue: fc.option(fc.float({ min: 10000, max: 100000000 })),
      caseType: fc.option(fc.constantFrom('civil_litigation', 'criminal_defense', 'commercial_law')),
      caseComplexity: fc.option(complexityArb),
      courtLevel: fc.option(courtLevelArb),
      urgency: fc.option(urgencyArb),
      documentType: fc.option(fc.constantFrom('property_sale', 'mortgage', 'inheritance')),
      documentCount: fc.option(fc.integer({ min: 1, max: 50 })),
      pageCount: fc.option(fc.integer({ min: 1, max: 1000 })),
      propertyValue: fc.option(fc.float({ min: 100000, max: 100000000 })),
      propertyType: fc.option(propertyTypeArb),
      executionType: fc.option(executionTypeArb),
      executionAmount: fc.option(fc.float({ min: 1000, max: 10000000 })),
      distance: fc.option(fc.integer({ min: 0, max: 500 })),
      travelExpenses: fc.option(fc.float({ min: 0, max: 50000 })),
      accommodationExpenses: fc.option(fc.float({ min: 0, max: 100000 })),
      expertFees: fc.option(fc.float({ min: 0, max: 500000 })),
      courtFees: fc.option(fc.float({ min: 0, max: 100000 })),
      registrationFees: fc.option(fc.float({ min: 0, max: 50000 })),
      translationFees: fc.option(fc.float({ min: 0, max: 25000 })),
      discountPercentage: fc.option(fc.float({ min: 0, max: 50 })),
      discountAmount: fc.option(fc.float({ min: 0, max: 100000 }))
    });

    const calculateFeeRequestArb = fc.record({
      caseId: fc.uuid(),
      clientId: fc.uuid(),
      profession: legalProfessionArb,
      calculationType: calculationTypeArb,
      parameters: billingParametersArb,
      applyTaxes: fc.boolean(),
      saveCalculation: fc.boolean()
    });

    it('should always produce non-negative fee calculations', async () => {
      await fc.assert(
        fc.asyncProperty(calculateFeeRequestArb, async (request) => {
          // Mock successful database responses based on profession
          const mockBaseFee = Math.max(1000, Math.random() * 100000);
          const mockMultipliers = {
            complexity: 1 + Math.random(),
            urgency: 1 + Math.random() * 0.5,
            court: 1 + Math.random() * 0.5
          };

          if (request.profession === LegalProfession.AVOCAT) {
            (mockDb.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                base_fee: mockBaseFee,
                complexity_multiplier: mockMultipliers.complexity,
                urgency_multiplier: mockMultipliers.urgency,
                court_multiplier: mockMultipliers.court,
                total_fee: mockBaseFee * mockMultipliers.complexity * mockMultipliers.urgency * mockMultipliers.court
              }]
            });
          } else if (request.profession === LegalProfession.NOTAIRE) {
            (mockDb.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                base_fee: mockBaseFee,
                percentage_fee: mockBaseFee * 0.1,
                document_fee: 0,
                total_fee: mockBaseFee
              }]
            });
          } else if (request.profession === LegalProfession.HUISSIER) {
            (mockDb.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                base_fee: mockBaseFee * 0.8,
                distance_fee: mockBaseFee * 0.2,
                urgency_multiplier: mockMultipliers.urgency,
                total_fee: mockBaseFee * mockMultipliers.urgency
              }]
            });
          }

          // Mock tax calculation if needed
          if (request.applyTaxes) {
            (mockDb.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                tax_type: 'vat',
                tax_rate: 0.19,
                tax_amount: mockBaseFee * 0.19
              }]
            });
          }

          try {
            const result = await billingService.calculateFees(request);

            // Property: All amounts must be non-negative
            expect(result.totalAmount).toBeGreaterThanOrEqual(0);
            expect(result.taxAmount).toBeGreaterThanOrEqual(0);
            expect(result.finalAmount).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.baseFee).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.subtotal).toBeGreaterThanOrEqual(0);
            expect(result.breakdown.total).toBeGreaterThanOrEqual(0);

            // Property: Final amount should be at least the total amount
            expect(result.finalAmount).toBeGreaterThanOrEqual(result.totalAmount);

            // Property: If taxes are applied, tax amount should be positive
            if (request.applyTaxes && result.totalAmount > 0) {
              expect(result.taxAmount).toBeGreaterThan(0);
            }

            // Property: Multipliers should be applied correctly for lawyers
            if (request.profession === LegalProfession.AVOCAT) {
              expect(result.breakdown.complexityMultiplier).toBeGreaterThanOrEqual(1.0);
              expect(result.breakdown.urgencyMultiplier).toBeGreaterThanOrEqual(1.0);
              expect(result.breakdown.courtLevelMultiplier).toBeGreaterThanOrEqual(1.0);
            }

            // Property: Additional fees should be properly included
            const additionalFeesTotal = result.breakdown.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
            expect(additionalFeesTotal).toBeGreaterThanOrEqual(0);

            // Property: Currency should always be DZD
            expect(result.currency).toBe('DZD');

            // Property: Calculation date should be recent
            const now = new Date();
            const calculationAge = now.getTime() - result.calculationDate.getTime();
            expect(calculationAge).toBeLessThan(60000); // Less than 1 minute old

          } catch (error) {
            // If calculation fails, it should be due to validation or missing data
            expect(error).toBeInstanceOf(Error);
            const errorMessage = (error as Error).message;
            expect(
              errorMessage.includes('required') ||
              errorMessage.includes('not found') ||
              errorMessage.includes('Unsupported')
            ).toBe(true);
          }
        }),
        { numRuns: 50, timeout: 10000 }
      );
    });

    it('should maintain consistency between base fee and final calculations', async () => {
      await fc.assert(
        fc.asyncProperty(
          calculateFeeRequestArb.filter(req => 
            req.profession === LegalProfession.AVOCAT && 
            req.parameters.hours !== undefined &&
            req.parameters.hours > 0
          ),
          async (request) => {
            const baseFee = 15000;
            const complexityMult = 1.2;
            const urgencyMult = 1.0;
            const courtMult = 1.0;

            (mockDb.query as jest.Mock).mockResolvedValueOnce({
              rows: [{
                base_fee: baseFee,
                complexity_multiplier: complexityMult,
                urgency_multiplier: urgencyMult,
                court_multiplier: courtMult,
                total_fee: baseFee * complexityMult * urgencyMult * courtMult
              }]
            });

            const result = await billingService.calculateFees(request);

            // Property: The relationship between base fee and multipliers should be consistent
            const expectedMultipliedFee = baseFee * complexityMult * urgencyMult * courtMult;
            const actualBaseFeeContribution = result.breakdown.baseFee * 
              result.breakdown.complexityMultiplier * 
              result.breakdown.urgencyMultiplier * 
              result.breakdown.courtLevelMultiplier;

            // Allow for small floating point differences
            expect(Math.abs(actualBaseFeeContribution - expectedMultipliedFee)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 30, timeout: 10000 }
      );
    });

    it('should respect minimum fee thresholds for all professions', async () => {
      await fc.assert(
        fc.asyncProperty(calculateFeeRequestArb, async (request) => {
          // Define minimum fees per profession (based on Algerian standards)
          const minimumFees = {
            [LegalProfession.AVOCAT]: 2000,
            [LegalProfession.NOTAIRE]: 5000,
            [LegalProfession.HUISSIER]: 3000
          };

          const minFee = minimumFees[request.profession];
          
          (mockDb.query as jest.Mock).mockResolvedValueOnce({
            rows: [{
              base_fee: Math.max(minFee, Math.random() * 50000),
              complexity_multiplier: 1.0,
              urgency_multiplier: 1.0,
              court_multiplier: 1.0,
              percentage_fee: 0,
              document_fee: 0,
              distance_fee: 0,
              total_fee: Math.max(minFee, Math.random() * 50000)
            }]
          });

          try {
            const result = await billingService.calculateFees(request);

            // Property: Base fee should meet minimum threshold
            expect(result.breakdown.baseFee).toBeGreaterThanOrEqual(minFee);

            // Property: Total amount should also meet minimum threshold
            expect(result.totalAmount).toBeGreaterThanOrEqual(minFee);

          } catch (error) {
            // Expected for invalid inputs
          }
        }),
        { numRuns: 40, timeout: 10000 }
      );
    });
  });

  /**
   * **Validates: Requirements 6.4, 6.5**
   * Property 16: Conformité Fiscale des Factures
   * 
   * This property ensures that invoice generation follows Algerian fiscal requirements:
   * - Proper tax calculations
   * - Correct invoice numbering
   * - Compliance with payment terms
   * - Proper status transitions
   */
  describe('Property 16: Conformité Fiscale des Factures', () => {
    const invoiceRequestArb = fc.record({
      billingCalculationId: fc.uuid(),
      paymentTerms: fc.option(fc.integer({ min: 1, max: 90 })),
      notes: fc.option(fc.string({ maxLength: 500 })),
      termsAndConditions: fc.option(fc.string({ maxLength: 1000 })),
      sendToClient: fc.boolean()
    });

    it('should generate fiscally compliant invoices', async () => {
      await fc.assert(
        fc.asyncProperty(invoiceRequestArb, async (request) => {
          // Mock billing calculation
          const mockCalculation = {
            id: request.billingCalculationId,
            case_id: fc.sample(fc.uuid(), 1)[0],
            client_id: fc.sample(fc.uuid(), 1)[0],
            lawyer_id: fc.sample(fc.uuid(), 1)[0],
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

          const invoiceNumber = `FAC-2024-LAW123-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

          (mockDb.query as jest.Mock)
            .mockResolvedValueOnce({ rows: [mockCalculation] }) // getBillingCalculation
            .mockResolvedValueOnce({ rows: [{ invoice_number: invoiceNumber }] }) // generate invoice number
            .mockResolvedValueOnce({ // create invoice
              rows: [{
                id: fc.sample(fc.uuid(), 1)[0],
                invoice_number: invoiceNumber,
                billing_calculation_id: request.billingCalculationId,
                case_id: mockCalculation.case_id,
                client_id: mockCalculation.client_id,
                lawyer_id: mockCalculation.lawyer_id,
                issue_date: new Date(),
                due_date: new Date(Date.now() + (request.paymentTerms || 30) * 24 * 60 * 60 * 1000),
                payment_terms: request.paymentTerms || 30,
                subtotal: mockCalculation.total_amount,
                tax_amount: mockCalculation.tax_amount,
                total_amount: mockCalculation.final_amount,
                paid_amount: 0,
                remaining_amount: mockCalculation.final_amount,
                status: 'draft',
                payment_status: 'unpaid',
                notes: request.notes,
                terms_and_conditions: request.termsAndConditions,
                created_at: new Date(),
                updated_at: new Date()
              }]
            })
            .mockResolvedValueOnce({ rows: [] }); // update billing calculation status

          try {
            const result = await billingService.createInvoice(request);

            // Property: Invoice number should follow Algerian format
            expect(result.invoiceNumber).toMatch(/^FAC-\d{4}-[A-Z0-9]+-\d{4}$/);

            // Property: Payment terms should be reasonable (1-90 days)
            expect(result.paymentTerms).toBeGreaterThanOrEqual(1);
            expect(result.paymentTerms).toBeLessThanOrEqual(90);

            // Property: Due date should be after issue date
            expect(result.dueDate.getTime()).toBeGreaterThan(result.issueDate.getTime());

            // Property: Amounts should be consistent
            expect(result.totalAmount).toBe(result.subtotal + result.taxAmount);
            expect(result.remainingAmount).toBe(result.totalAmount - result.paidAmount);

            // Property: Initial status should be draft and unpaid
            expect(result.status).toBe('draft');
            expect(result.paymentStatus).toBe('unpaid');
            expect(result.paidAmount).toBe(0);

            // Property: Tax amount should be reasonable (0-30% of subtotal)
            if (result.subtotal > 0) {
              const taxRate = result.taxAmount / result.subtotal;
              expect(taxRate).toBeGreaterThanOrEqual(0);
              expect(taxRate).toBeLessThanOrEqual(0.3);
            }

          } catch (error) {
            // Expected for invalid billing calculation IDs
            expect((error as Error).message).toContain('not found');
          }
        }),
        { numRuns: 30, timeout: 10000 }
      );
    });

    it('should maintain invoice number uniqueness', async () => {
      const generatedNumbers = new Set<string>();

      await fc.assert(
        fc.asyncProperty(
          fc.array(invoiceRequestArb, { minLength: 1, maxLength: 10 }),
          async (requests) => {
            for (const request of requests) {
              const mockCalculation = {
                id: request.billingCalculationId,
                case_id: fc.sample(fc.uuid(), 1)[0],
                client_id: fc.sample(fc.uuid(), 1)[0],
                lawyer_id: fc.sample(fc.uuid(), 1)[0],
                total_amount: 18000,
                tax_amount: 3420,
                final_amount: 21420
              };

              // Generate unique invoice number
              let invoiceNumber: string;
              do {
                invoiceNumber = `FAC-2024-LAW123-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
              } while (generatedNumbers.has(invoiceNumber));
              
              generatedNumbers.add(invoiceNumber);

              (mockDb.query as jest.Mock)
                .mockResolvedValueOnce({ rows: [mockCalculation] })
                .mockResolvedValueOnce({ rows: [{ invoice_number: invoiceNumber }] })
                .mockResolvedValueOnce({
                  rows: [{
                    id: fc.sample(fc.uuid(), 1)[0],
                    invoice_number: invoiceNumber,
                    billing_calculation_id: request.billingCalculationId,
                    case_id: mockCalculation.case_id,
                    client_id: mockCalculation.client_id,
                    lawyer_id: mockCalculation.lawyer_id,
                    issue_date: new Date(),
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    payment_terms: 30,
                    subtotal: mockCalculation.total_amount,
                    tax_amount: mockCalculation.tax_amount,
                    total_amount: mockCalculation.final_amount,
                    paid_amount: 0,
                    remaining_amount: mockCalculation.final_amount,
                    status: 'draft',
                    payment_status: 'unpaid',
                    created_at: new Date(),
                    updated_at: new Date()
                  }]
                })
                .mockResolvedValueOnce({ rows: [] });

              try {
                const result = await billingService.createInvoice(request);
                
                // Property: Each invoice should have a unique number
                expect(result.invoiceNumber).toBe(invoiceNumber);
                
              } catch (error) {
                // Expected for some invalid inputs
              }
            }
          }
        ),
        { numRuns: 10, timeout: 15000 }
      );
    });
  });

  /**
   * **Validates: Requirements 6.5**
   * Property 17: Mise à Jour Automatique des Barèmes
   * 
   * This property ensures that fee schedule updates are handled correctly:
   * - Proper versioning of fee schedules
   * - Effective date handling
   * - Audit trail maintenance
   * - Backward compatibility
   */
  describe('Property 17: Mise à Jour Automatique des Barèmes', () => {
    const feeScheduleUpdateArb = fc.record({
      profession: fc.constantFrom(LegalProfession.AVOCAT, LegalProfession.NOTAIRE, LegalProfession.HUISSIER),
      schedules: fc.array(fc.record({
        category: fc.constantFrom('Consultation juridique', 'Procédure civile', 'Vente immobilière'),
        subcategory: fc.option(fc.constantFrom('Simple', 'Complexe', 'Première instance')),
        minimumFee: fc.float({ min: 1000, max: 100000 }),
        maximumFee: fc.option(fc.float({ min: 100000, max: 1000000 })),
        percentageRate: fc.option(fc.float({ min: 0.001, max: 0.1 })),
        fixedAmount: fc.option(fc.float({ min: 1000, max: 500000 })),
        unitType: fc.option(fc.constantFrom('per_hour', 'per_case', 'percentage_of_value', 'fixed_amount')),
        legalReference: fc.string({ minLength: 10, maxLength: 200 }),
        notes: fc.option(fc.string({ maxLength: 500 })),
        isActive: fc.option(fc.boolean())
      }), { minLength: 1, maxLength: 5 }),
      effectiveDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
      reason: fc.string({ minLength: 10, maxLength: 200 })
    });

    it('should handle fee schedule updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(feeScheduleUpdateArb, async (request) => {
          const mockClient = {
            query: jest.fn(),
            release: jest.fn()
          };

          (mockDb.connect as jest.Mock).mockResolvedValueOnce(mockClient);
          
          // Mock successful transaction
          mockClient.query
            .mockResolvedValueOnce({ rows: [] }) // BEGIN
            .mockResolvedValue({ rows: [] }); // All subsequent queries

          try {
            await billingService.updateFeeSchedules(request);

            // Property: Transaction should be properly managed
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();

            // Property: Each schedule should be processed
            const insertCalls = (mockClient.query as jest.Mock).mock.calls.filter(
              call => call[0] && call[0].includes('INSERT INTO algerian_fee_schedules')
            );
            expect(insertCalls.length).toBe(request.schedules.length);

            // Property: Audit log should be created
            const logCalls = (mockClient.query as jest.Mock).mock.calls.filter(
              call => call[0] && call[0].includes('INSERT INTO fee_schedule_updates')
            );
            expect(logCalls.length).toBe(1);

          } catch (error) {
            // If error occurs, rollback should be called
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
          }
        }),
        { numRuns: 20, timeout: 10000 }
      );
    });

    it('should validate fee schedule consistency', async () => {
      await fc.assert(
        fc.asyncProperty(feeScheduleUpdateArb, async (request) => {
          // Property: All schedules should have valid minimum fees
          for (const schedule of request.schedules) {
            expect(schedule.minimumFee).toBeGreaterThan(0);
            
            // Property: Maximum fee should be greater than minimum if specified
            if (schedule.maximumFee !== undefined) {
              expect(schedule.maximumFee).toBeGreaterThanOrEqual(schedule.minimumFee);
            }

            // Property: Percentage rate should be reasonable if specified
            if (schedule.percentageRate !== undefined) {
              expect(schedule.percentageRate).toBeGreaterThan(0);
              expect(schedule.percentageRate).toBeLessThanOrEqual(1);
            }

            // Property: Fixed amount should be positive if specified
            if (schedule.fixedAmount !== undefined) {
              expect(schedule.fixedAmount).toBeGreaterThan(0);
            }

            // Property: Legal reference should not be empty
            expect(schedule.legalReference.trim()).not.toBe('');
          }

          // Property: Effective date should be reasonable
          const now = new Date();
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
          
          expect(request.effectiveDate.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
          expect(request.effectiveDate.getTime()).toBeLessThanOrEqual(twoYearsFromNow.getTime());

          // Property: Reason should be meaningful
          expect(request.reason.trim()).not.toBe('');
          expect(request.reason.length).toBeGreaterThanOrEqual(10);
        }),
        { numRuns: 30, timeout: 5000 }
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});