import { Pool } from 'pg';
import { 
  BillingCalculation, 
  BillingParameters, 
  CalculateFeeRequest, 
  CalculateFeeResponse,
  CreateInvoiceRequest,
  BillingInvoice,
  FeeBreakdown,
  LegalProfession,
  CalculationType,
  BillingStatus,
  InvoiceStatus,
  PaymentStatus,
  BillingSearchCriteria,
  BillingSearchResult,
  BillingStatistics,
  AlgerianFeeSchedule,
  UpdateFeeScheduleRequest,
  AdditionalFee,
  Expense,
  Discount,
  TaxConfiguration
} from '../types/billing.js';
import { logger } from '../utils/logger.js';

export class BillingService {
  constructor(private db: Pool) {}

  /**
   * Calculate fees for a legal service according to Algerian fee schedules
   */
  async calculateFees(request: CalculateFeeRequest): Promise<CalculateFeeResponse> {
    try {
      logger.info('Calculating fees', { 
        caseId: request.caseId, 
        profession: request.profession,
        calculationType: request.calculationType 
      });

      // Validate request parameters
      this.validateCalculationRequest(request);

      // Calculate base fee according to profession and type
      const breakdown = await this.calculateFeeBreakdown(request);

      // Apply taxes if requested
      if (request.applyTaxes) {
        await this.applyTaxes(breakdown, request.profession);
      }

      // Save calculation if requested
      let calculationId: string | undefined;
      if (request.saveCalculation) {
        calculationId = await this.saveCalculation(request, breakdown);
      }

      const response: CalculateFeeResponse = {
        calculationId,
        breakdown,
        totalAmount: breakdown.subtotal,
        taxAmount: breakdown.taxAmount,
        finalAmount: breakdown.total,
        currency: 'DZD',
        calculationDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      logger.info('Fee calculation completed', { 
        calculationId, 
        totalAmount: response.totalAmount,
        finalAmount: response.finalAmount 
      });

      return response;
    } catch (error) {
      logger.error('Error calculating fees', { error, request });
      throw error;
    }
  }

  /**
   * Calculate fee breakdown based on profession-specific rules
   */
  private async calculateFeeBreakdown(request: CalculateFeeRequest): Promise<FeeBreakdown> {
    const { profession, calculationType, parameters } = request;

    let baseFee = 0;
    let complexityMultiplier = 1.0;
    let urgencyMultiplier = 1.0;
    let courtLevelMultiplier = 1.0;

    // Calculate base fee according to profession
    switch (profession) {
      case LegalProfession.AVOCAT:
        ({ baseFee, complexityMultiplier, urgencyMultiplier, courtLevelMultiplier } = 
          await this.calculateLawyerFees(parameters));
        break;
      
      case LegalProfession.NOTAIRE:
        ({ baseFee } = await this.calculateNotaryFees(parameters));
        break;
      
      case LegalProfession.HUISSIER:
        ({ baseFee, urgencyMultiplier } = await this.calculateBailiffFees(parameters));
        break;
      
      default:
        throw new Error(`Unsupported profession: ${profession}`);
    }

    // Calculate additional fees and expenses
    const additionalFees = this.calculateAdditionalFees(parameters);
    const expenses = this.calculateExpenses(parameters);
    const discounts = this.calculateDiscounts(parameters);

    // Calculate subtotal
    const multipliedBaseFee = baseFee * complexityMultiplier * urgencyMultiplier * courtLevelMultiplier;
    const additionalFeesTotal = additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const discountsTotal = discounts.reduce((sum, discount) => sum + discount.amount, 0);
    
    const subtotal = multipliedBaseFee + additionalFeesTotal + expensesTotal - discountsTotal;

    return {
      baseFee,
      complexityMultiplier,
      urgencyMultiplier,
      courtLevelMultiplier,
      additionalFees,
      expenses,
      discounts,
      subtotal,
      taxRate: 0, // Will be set by applyTaxes if needed
      taxAmount: 0,
      total: subtotal
    };
  }

  /**
   * Calculate lawyer fees using database function
   */
  private async calculateLawyerFees(parameters: BillingParameters): Promise<{
    baseFee: number;
    complexityMultiplier: number;
    urgencyMultiplier: number;
    courtLevelMultiplier: number;
  }> {
    const query = `
      SELECT base_fee, complexity_multiplier, urgency_multiplier, court_multiplier, total_fee
      FROM calculate_lawyer_fees($1, $2, $3, $4, $5, $6)
    `;

    const result = await this.db.query(query, [
      parameters.caseType || 'consultation',
      parameters.courtLevel || 'tribunal_premiere_instance',
      parameters.caseComplexity || 'simple',
      parameters.hours,
      parameters.baseValue,
      parameters.urgency || 'normal'
    ]);

    if (result.rows.length === 0) {
      throw new Error('No fee schedule found for the specified parameters');
    }

    const row = result.rows[0];
    return {
      baseFee: parseFloat(row.base_fee),
      complexityMultiplier: parseFloat(row.complexity_multiplier),
      urgencyMultiplier: parseFloat(row.urgency_multiplier),
      courtLevelMultiplier: parseFloat(row.court_multiplier)
    };
  }

  /**
   * Calculate notary fees using database function
   */
  private async calculateNotaryFees(parameters: BillingParameters): Promise<{
    baseFee: number;
  }> {
    const query = `
      SELECT base_fee, percentage_fee, document_fee, total_fee
      FROM calculate_notary_fees($1, $2, $3, $4)
    `;

    const result = await this.db.query(query, [
      parameters.documentType || 'authentication',
      parameters.propertyValue,
      parameters.propertyType,
      parameters.documentCount || 1
    ]);

    if (result.rows.length === 0) {
      throw new Error('No fee schedule found for the specified parameters');
    }

    const row = result.rows[0];
    return {
      baseFee: parseFloat(row.total_fee)
    };
  }

  /**
   * Calculate bailiff fees using database function
   */
  private async calculateBailiffFees(parameters: BillingParameters): Promise<{
    baseFee: number;
    urgencyMultiplier: number;
  }> {
    const query = `
      SELECT base_fee, distance_fee, urgency_multiplier, total_fee
      FROM calculate_bailiff_fees($1, $2, $3, $4)
    `;

    const result = await this.db.query(query, [
      parameters.executionType || 'notification',
      parameters.executionAmount,
      parameters.distance || 0,
      parameters.urgency || 'normal'
    ]);

    if (result.rows.length === 0) {
      throw new Error('No fee schedule found for the specified parameters');
    }

    const row = result.rows[0];
    return {
      baseFee: parseFloat(row.base_fee) + parseFloat(row.distance_fee),
      urgencyMultiplier: parseFloat(row.urgency_multiplier)
    };
  }

  /**
   * Calculate additional fees based on parameters
   */
  private calculateAdditionalFees(parameters: BillingParameters): AdditionalFee[] {
    const fees: AdditionalFee[] = [];

    // Travel expenses
    if (parameters.travelExpenses) {
      fees.push({
        type: 'travel',
        description: 'Frais de déplacement',
        amount: parameters.travelExpenses,
        isPercentage: false
      });
    }

    // Accommodation expenses
    if (parameters.accommodationExpenses) {
      fees.push({
        type: 'accommodation',
        description: 'Frais d\'hébergement',
        amount: parameters.accommodationExpenses,
        isPercentage: false
      });
    }

    // Expert fees
    if (parameters.expertFees) {
      fees.push({
        type: 'expert',
        description: 'Honoraires d\'expert',
        amount: parameters.expertFees,
        isPercentage: false
      });
    }

    // Court fees
    if (parameters.courtFees) {
      fees.push({
        type: 'court',
        description: 'Frais de justice',
        amount: parameters.courtFees,
        isPercentage: false
      });
    }

    // Registration fees
    if (parameters.registrationFees) {
      fees.push({
        type: 'registration',
        description: 'Frais d\'enregistrement',
        amount: parameters.registrationFees,
        isPercentage: false
      });
    }

    // Translation fees
    if (parameters.translationFees) {
      fees.push({
        type: 'translation',
        description: 'Frais de traduction',
        amount: parameters.translationFees,
        isPercentage: false
      });
    }

    return fees;
  }

  /**
   * Calculate expenses based on parameters
   */
  private calculateExpenses(parameters: BillingParameters): Expense[] {
    const expenses: Expense[] = [];

    // Add expenses based on parameters
    // This is a simplified implementation - in practice, you might have more complex rules

    return expenses;
  }

  /**
   * Calculate discounts based on parameters
   */
  private calculateDiscounts(parameters: BillingParameters): Discount[] {
    const discounts: Discount[] = [];

    // Percentage discount
    if (parameters.discountPercentage && parameters.discountPercentage > 0) {
      discounts.push({
        type: 'volume_discount',
        description: `Remise de ${parameters.discountPercentage}%`,
        amount: 0, // Will be calculated based on base amount
        isPercentage: true,
        reason: 'Remise commerciale'
      });
    }

    // Fixed discount
    if (parameters.discountAmount && parameters.discountAmount > 0) {
      discounts.push({
        type: 'other',
        description: 'Remise forfaitaire',
        amount: parameters.discountAmount,
        isPercentage: false,
        reason: parameters.adjustmentReason || 'Remise accordée'
      });
    }

    return discounts;
  }

  /**
   * Apply taxes to fee breakdown
   */
  private async applyTaxes(breakdown: FeeBreakdown, profession: LegalProfession): Promise<void> {
    const query = `
      SELECT tax_type, tax_rate, tax_amount
      FROM calculate_taxes($1, $2)
    `;

    const result = await this.db.query(query, [profession, breakdown.subtotal]);

    let totalTaxAmount = 0;
    let totalTaxRate = 0;

    for (const row of result.rows) {
      totalTaxAmount += parseFloat(row.tax_amount);
      if (row.tax_type === 'vat') {
        totalTaxRate = parseFloat(row.tax_rate);
      }
    }

    breakdown.taxRate = totalTaxRate;
    breakdown.taxAmount = totalTaxAmount;
    breakdown.total = breakdown.subtotal + totalTaxAmount;
  }

  /**
   * Save calculation to database
   */
  private async saveCalculation(request: CalculateFeeRequest, breakdown: FeeBreakdown): Promise<string> {
    const query = `
      INSERT INTO billing_calculations (
        case_id, client_id, lawyer_id, profession, calculation_type,
        base_amount, total_amount, tax_amount, final_amount, currency,
        parameters, breakdown, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    // Get lawyer_id from case
    const caseQuery = 'SELECT lawyer_id FROM cases WHERE id = $1';
    const caseResult = await this.db.query(caseQuery, [request.caseId]);
    
    if (caseResult.rows.length === 0) {
      throw new Error('Case not found');
    }

    const lawyerId = caseResult.rows[0].lawyer_id;

    const result = await this.db.query(query, [
      request.caseId,
      request.clientId,
      lawyerId,
      request.profession,
      request.calculationType,
      breakdown.baseFee,
      breakdown.subtotal,
      breakdown.taxAmount,
      breakdown.total,
      'DZD',
      JSON.stringify(request.parameters),
      JSON.stringify(breakdown),
      BillingStatus.CALCULATED
    ]);

    return result.rows[0].id;
  }

  /**
   * Create invoice from billing calculation
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<BillingInvoice> {
    try {
      logger.info('Creating invoice', { billingCalculationId: request.billingCalculationId });

      // Get billing calculation
      const calculation = await this.getBillingCalculation(request.billingCalculationId);
      if (!calculation) {
        throw new Error('Billing calculation not found');
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(calculation.lawyerId);

      // Calculate due date
      const paymentTerms = request.paymentTerms || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentTerms);

      // Create invoice
      const query = `
        INSERT INTO billing_invoices (
          invoice_number, billing_calculation_id, case_id, client_id, lawyer_id,
          due_date, payment_terms, subtotal, tax_amount, total_amount,
          remaining_amount, notes, terms_and_conditions, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        invoiceNumber,
        request.billingCalculationId,
        calculation.caseId,
        calculation.clientId,
        calculation.lawyerId,
        dueDate,
        paymentTerms,
        calculation.totalAmount,
        calculation.taxAmount,
        calculation.finalAmount,
        calculation.finalAmount, // Initially, remaining = total
        request.notes,
        request.termsAndConditions,
        InvoiceStatus.DRAFT,
        PaymentStatus.UNPAID
      ]);

      const invoice = this.mapRowToInvoice(result.rows[0]);

      // Update billing calculation status
      await this.updateBillingCalculationStatus(request.billingCalculationId, BillingStatus.INVOICED);

      // Send to client if requested
      if (request.sendToClient) {
        await this.sendInvoiceToClient(invoice);
      }

      logger.info('Invoice created successfully', { 
        invoiceId: invoice.id, 
        invoiceNumber: invoice.invoiceNumber 
      });

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice', { error, request });
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(lawyerId: string): Promise<string> {
    const query = 'SELECT generate_invoice_number($1) as invoice_number';
    const result = await this.db.query(query, [lawyerId]);
    return result.rows[0].invoice_number;
  }

  /**
   * Get billing calculation by ID
   */
  async getBillingCalculation(id: string): Promise<BillingCalculation | null> {
    const query = 'SELECT * FROM billing_calculations WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToBillingCalculation(result.rows[0]);
  }

  /**
   * Update billing calculation status
   */
  private async updateBillingCalculationStatus(id: string, status: BillingStatus): Promise<void> {
    const query = 'UPDATE billing_calculations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await this.db.query(query, [status, id]);
  }

  /**
   * Send invoice to client (placeholder implementation)
   */
  private async sendInvoiceToClient(invoice: BillingInvoice): Promise<void> {
    // This would integrate with email service or notification system
    logger.info('Sending invoice to client', { invoiceId: invoice.id });
    // Implementation would depend on your notification system
  }

  /**
   * Search billing calculations
   */
  async searchBillingCalculations(criteria: BillingSearchCriteria): Promise<BillingSearchResult> {
    const startTime = Date.now();
    
    let query = 'SELECT * FROM billing_calculations WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Add search criteria
    if (criteria.caseId) {
      query += ` AND case_id = $${paramIndex++}`;
      params.push(criteria.caseId);
    }

    if (criteria.clientId) {
      query += ` AND client_id = $${paramIndex++}`;
      params.push(criteria.clientId);
    }

    if (criteria.lawyerId) {
      query += ` AND lawyer_id = $${paramIndex++}`;
      params.push(criteria.lawyerId);
    }

    if (criteria.profession) {
      query += ` AND profession = $${paramIndex++}`;
      params.push(criteria.profession);
    }

    if (criteria.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(criteria.status);
    }

    if (criteria.dateRange?.from) {
      query += ` AND calculation_date >= $${paramIndex++}`;
      params.push(criteria.dateRange.from);
    }

    if (criteria.dateRange?.to) {
      query += ` AND calculation_date <= $${paramIndex++}`;
      params.push(criteria.dateRange.to);
    }

    if (criteria.amountRange?.min) {
      query += ` AND total_amount >= $${paramIndex++}`;
      params.push(criteria.amountRange.min);
    }

    if (criteria.amountRange?.max) {
      query += ` AND total_amount <= $${paramIndex++}`;
      params.push(criteria.amountRange.max);
    }

    // Add sorting
    if (criteria.sortBy) {
      const sortColumn = this.mapSortByToColumn(criteria.sortBy);
      const sortOrder = criteria.sortOrder || 'desc';
      query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    } else {
      query += ' ORDER BY calculation_date DESC';
    }

    // Add pagination
    if (criteria.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(criteria.limit);
    }

    if (criteria.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(criteria.offset);
    }

    // Execute query
    const result = await this.db.query(query, params);
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)').split('ORDER BY')[0].split('LIMIT')[0];
    const countResult = await this.db.query(countQuery, params.slice(0, -2)); // Remove LIMIT and OFFSET params
    
    const calculations = result.rows.map(row => this.mapRowToBillingCalculation(row));
    const totalCount = parseInt(countResult.rows[0].count);
    const searchTime = Date.now() - startTime;

    return {
      calculations,
      totalCount,
      searchTime
    };
  }

  /**
   * Get billing statistics
   */
  async getBillingStatistics(lawyerId?: string): Promise<BillingStatistics> {
    let whereClause = '';
    const params: any[] = [];
    
    if (lawyerId) {
      whereClause = 'WHERE lawyer_id = $1';
      params.push(lawyerId);
    }

    // Get basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_calculations,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as average_amount
      FROM billing_calculations ${whereClause}
    `;

    const statsResult = await this.db.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Get calculations by profession
    const professionQuery = `
      SELECT profession, COUNT(*) as count
      FROM billing_calculations ${whereClause}
      GROUP BY profession
    `;

    const professionResult = await this.db.query(professionQuery, params);
    const calculationsByProfession: Record<LegalProfession, number> = {} as any;
    
    for (const row of professionResult.rows) {
      calculationsByProfession[row.profession as LegalProfession] = parseInt(row.count);
    }

    // Get calculations by type
    const typeQuery = `
      SELECT calculation_type, COUNT(*) as count
      FROM billing_calculations ${whereClause}
      GROUP BY calculation_type
    `;

    const typeResult = await this.db.query(typeQuery, params);
    const calculationsByType: Record<CalculationType, number> = {} as any;
    
    for (const row of typeResult.rows) {
      calculationsByType[row.calculation_type as CalculationType] = parseInt(row.count);
    }

    // Get calculations by status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM billing_calculations ${whereClause}
      GROUP BY status
    `;

    const statusResult = await this.db.query(statusQuery, params);
    const calculationsByStatus: Record<BillingStatus, number> = {} as any;
    
    for (const row of statusResult.rows) {
      calculationsByStatus[row.status as BillingStatus] = parseInt(row.count);
    }

    return {
      totalCalculations: parseInt(stats.total_calculations),
      totalAmount: parseFloat(stats.total_amount),
      averageAmount: parseFloat(stats.average_amount),
      calculationsByProfession,
      calculationsByType,
      calculationsByStatus,
      monthlyTrends: [], // Would implement if needed
      topClients: [], // Would implement if needed
      recentActivity: [] // Would implement if needed
    };
  }

  /**
   * Update fee schedules
   */
  async updateFeeSchedules(request: UpdateFeeScheduleRequest): Promise<void> {
    try {
      logger.info('Updating fee schedules', { 
        profession: request.profession, 
        schedulesCount: request.schedules.length 
      });

      // Start transaction
      const client = await this.db.connect();
      
      try {
        await client.query('BEGIN');

        for (const schedule of request.schedules) {
          // Insert or update fee schedule
          const query = `
            INSERT INTO algerian_fee_schedules (
              profession, category, subcategory, minimum_fee, maximum_fee,
              percentage_rate, fixed_amount, unit_type, effective_date,
              expiry_date, is_active, legal_reference, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (profession, category, subcategory, effective_date)
            DO UPDATE SET
              minimum_fee = EXCLUDED.minimum_fee,
              maximum_fee = EXCLUDED.maximum_fee,
              percentage_rate = EXCLUDED.percentage_rate,
              fixed_amount = EXCLUDED.fixed_amount,
              unit_type = EXCLUDED.unit_type,
              expiry_date = EXCLUDED.expiry_date,
              is_active = EXCLUDED.is_active,
              legal_reference = EXCLUDED.legal_reference,
              notes = EXCLUDED.notes,
              updated_at = CURRENT_TIMESTAMP
          `;

          await client.query(query, [
            request.profession,
            schedule.category,
            schedule.subcategory,
            schedule.minimumFee,
            schedule.maximumFee,
            schedule.percentageRate,
            schedule.fixedAmount,
            schedule.unitType,
            request.effectiveDate,
            schedule.expiryDate,
            schedule.isActive ?? true,
            schedule.legalReference,
            schedule.notes
          ]);
        }

        // Log the update
        const logQuery = `
          INSERT INTO fee_schedule_updates (
            profession, update_type, new_schedule, effective_date, reason, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(logQuery, [
          request.profession,
          'update',
          JSON.stringify(request.schedules),
          request.effectiveDate,
          request.reason,
          'system' // Would be actual user ID in real implementation
        ]);

        await client.query('COMMIT');
        
        logger.info('Fee schedules updated successfully', { 
          profession: request.profession 
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating fee schedules', { error, request });
      throw error;
    }
  }

  /**
   * Validate calculation request
   */
  private validateCalculationRequest(request: CalculateFeeRequest): void {
    if (!request.caseId) {
      throw new Error('Case ID is required');
    }

    if (!request.clientId) {
      throw new Error('Client ID is required');
    }

    if (!request.profession) {
      throw new Error('Profession is required');
    }

    if (!request.calculationType) {
      throw new Error('Calculation type is required');
    }

    if (!request.parameters) {
      throw new Error('Parameters are required');
    }
  }

  /**
   * Map sort by enum to database column
   */
  private mapSortByToColumn(sortBy: string): string {
    const mapping: Record<string, string> = {
      'calculation_date': 'calculation_date',
      'total_amount': 'total_amount',
      'client_name': 'client_id', // Would join with client table in real implementation
      'case_number': 'case_id', // Would join with case table in real implementation
      'status': 'status'
    };

    return mapping[sortBy] || 'calculation_date';
  }

  /**
   * Map database row to BillingCalculation object
   */
  private mapRowToBillingCalculation(row: any): BillingCalculation {
    return {
      id: row.id,
      caseId: row.case_id,
      clientId: row.client_id,
      lawyerId: row.lawyer_id,
      profession: row.profession as LegalProfession,
      calculationType: row.calculation_type as CalculationType,
      baseAmount: parseFloat(row.base_amount),
      currency: row.currency,
      calculationDate: new Date(row.calculation_date),
      parameters: row.parameters || {},
      breakdown: row.breakdown || {},
      totalAmount: parseFloat(row.total_amount),
      taxAmount: parseFloat(row.tax_amount),
      finalAmount: parseFloat(row.final_amount),
      status: row.status as BillingStatus,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to BillingInvoice object
   */
  private mapRowToInvoice(row: any): BillingInvoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      billingCalculationId: row.billing_calculation_id,
      caseId: row.case_id,
      clientId: row.client_id,
      lawyerId: row.lawyer_id,
      organizationId: row.organization_id,
      issueDate: new Date(row.issue_date),
      dueDate: new Date(row.due_date),
      paymentTerms: row.payment_terms,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      remainingAmount: parseFloat(row.remaining_amount),
      status: row.status as InvoiceStatus,
      paymentStatus: row.payment_status as PaymentStatus,
      paymentMethod: row.payment_method,
      paymentDate: row.payment_date ? new Date(row.payment_date) : undefined,
      paymentReference: row.payment_reference,
      notes: row.notes,
      termsAndConditions: row.terms_and_conditions,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
// Create and export instance
import { db } from '@/database/connection';
export const billingService = new BillingService(db);