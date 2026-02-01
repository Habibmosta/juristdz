// Billing and fee calculation system types for Algerian legal system

export interface BillingCalculation {
  id: string;
  caseId: string;
  clientId: string;
  lawyerId: string;
  profession: LegalProfession;
  calculationType: CalculationType;
  baseAmount: number;
  currency: string;
  calculationDate: Date;
  parameters: BillingParameters;
  breakdown: FeeBreakdown;
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: BillingStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum LegalProfession {
  AVOCAT = 'avocat',
  NOTAIRE = 'notaire',
  HUISSIER = 'huissier',
  COMMISSAIRE_PRISEUR = 'commissaire_priseur',
  EXPERT_JUDICIAIRE = 'expert_judiciaire'
}

export enum CalculationType {
  HOURLY_RATE = 'hourly_rate',
  FIXED_FEE = 'fixed_fee',
  PERCENTAGE_FEE = 'percentage_fee',
  COURT_SCALE = 'court_scale',
  NOTARIAL_SCALE = 'notarial_scale',
  BAILIFF_SCALE = 'bailiff_scale',
  MIXED_CALCULATION = 'mixed_calculation'
}

export enum BillingStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  INVOICED = 'invoiced',
  PAID = 'paid',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

export interface BillingParameters {
  // Common parameters
  hours?: number;
  hourlyRate?: number;
  fixedAmount?: number;
  percentageRate?: number;
  baseValue?: number;
  
  // Case-specific parameters
  caseType?: string;
  caseComplexity?: CaseComplexity;
  courtLevel?: CourtLevel;
  urgency?: UrgencyLevel;
  
  // Document-specific parameters
  documentType?: string;
  documentCount?: number;
  pageCount?: number;
  
  // Property-specific parameters (for notaries)
  propertyValue?: number;
  propertyType?: PropertyType;
  
  // Execution-specific parameters (for bailiffs)
  executionType?: ExecutionType;
  executionAmount?: number;
  distance?: number;
  
  // Additional fees
  travelExpenses?: number;
  accommodationExpenses?: number;
  expertFees?: number;
  courtFees?: number;
  registrationFees?: number;
  translationFees?: number;
  
  // Discounts and adjustments
  discountPercentage?: number;
  discountAmount?: number;
  adjustmentReason?: string;
  adjustmentAmount?: number;
}

export enum CaseComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex'
}

export enum CourtLevel {
  TRIBUNAL_PREMIERE_INSTANCE = 'tribunal_premiere_instance',
  COUR_APPEL = 'cour_appel',
  COUR_SUPREME = 'cour_supreme',
  CONSEIL_ETAT = 'conseil_etat',
  TRIBUNAL_ADMINISTRATIF = 'tribunal_administratif',
  TRIBUNAL_COMMERCE = 'tribunal_commerce'
}

export enum UrgencyLevel {
  NORMAL = 'normal',
  URGENT = 'urgent',
  VERY_URGENT = 'very_urgent',
  EMERGENCY = 'emergency'
}

export enum PropertyType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  AGRICULTURAL = 'agricultural',
  LAND = 'land'
}

export enum ExecutionType {
  SEIZURE = 'seizure',
  EVICTION = 'eviction',
  DELIVERY = 'delivery',
  INVENTORY = 'inventory',
  AUCTION = 'auction',
  NOTIFICATION = 'notification'
}

export interface FeeBreakdown {
  baseFee: number;
  complexityMultiplier: number;
  urgencyMultiplier: number;
  courtLevelMultiplier: number;
  additionalFees: AdditionalFee[];
  expenses: Expense[];
  discounts: Discount[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface AdditionalFee {
  type: string;
  description: string;
  amount: number;
  isPercentage: boolean;
  baseAmount?: number;
}

export interface Expense {
  type: ExpenseType;
  description: string;
  amount: number;
  isReimbursable: boolean;
  receiptRequired: boolean;
}

export enum ExpenseType {
  TRAVEL = 'travel',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  COMMUNICATION = 'communication',
  DOCUMENTATION = 'documentation',
  EXPERT_FEES = 'expert_fees',
  COURT_FEES = 'court_fees',
  REGISTRATION_FEES = 'registration_fees',
  TRANSLATION = 'translation',
  OTHER = 'other'
}

export interface Discount {
  type: DiscountType;
  description: string;
  amount: number;
  isPercentage: boolean;
  reason: string;
}

export enum DiscountType {
  CLIENT_LOYALTY = 'client_loyalty',
  VOLUME_DISCOUNT = 'volume_discount',
  EARLY_PAYMENT = 'early_payment',
  PRO_BONO = 'pro_bono',
  STUDENT_RATE = 'student_rate',
  FAMILY_RATE = 'family_rate',
  OTHER = 'other'
}

// Algerian Legal Fee Schedules
export interface AlgerianFeeSchedule {
  profession: LegalProfession;
  category: string;
  subcategory?: string;
  minimumFee: number;
  maximumFee?: number;
  percentageRate?: number;
  fixedAmount?: number;
  unitType?: FeeUnitType;
  effectiveDate: Date;
  expiryDate?: Date;
  isActive: boolean;
  legalReference: string;
  notes?: string;
}

export enum FeeUnitType {
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
  PER_CASE = 'per_case',
  PER_DOCUMENT = 'per_document',
  PER_PAGE = 'per_page',
  PERCENTAGE_OF_VALUE = 'percentage_of_value',
  FIXED_AMOUNT = 'fixed_amount'
}

// Lawyer Fee Schedules (Avocat)
export interface LawyerFeeSchedule extends AlgerianFeeSchedule {
  caseType: LawyerCaseType;
  courtLevel: CourtLevel;
  complexity: CaseComplexity;
  minimumHours?: number;
  maximumHours?: number;
}

export enum LawyerCaseType {
  CIVIL_LITIGATION = 'civil_litigation',
  CRIMINAL_DEFENSE = 'criminal_defense',
  COMMERCIAL_LAW = 'commercial_law',
  ADMINISTRATIVE_LAW = 'administrative_law',
  FAMILY_LAW = 'family_law',
  LABOR_LAW = 'labor_law',
  REAL_ESTATE_LAW = 'real_estate_law',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  TAX_LAW = 'tax_law',
  CONSULTATION = 'consultation',
  DOCUMENT_DRAFTING = 'document_drafting',
  LEGAL_OPINION = 'legal_opinion'
}

// Notary Fee Schedules (Notaire)
export interface NotaryFeeSchedule extends AlgerianFeeSchedule {
  actType: NotaryActType;
  propertyType?: PropertyType;
  valueThreshold?: number;
  isPercentageBased: boolean;
}

export enum NotaryActType {
  PROPERTY_SALE = 'property_sale',
  PROPERTY_PURCHASE = 'property_purchase',
  MORTGAGE = 'mortgage',
  LEASE_AGREEMENT = 'lease_agreement',
  INHERITANCE = 'inheritance',
  DONATION = 'donation',
  MARRIAGE_CONTRACT = 'marriage_contract',
  COMPANY_FORMATION = 'company_formation',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  AUTHENTICATION = 'authentication',
  CERTIFICATION = 'certification'
}

// Bailiff Fee Schedules (Huissier)
export interface BailiffFeeSchedule extends AlgerianFeeSchedule {
  executionType: ExecutionType;
  amountThreshold?: number;
  distanceThreshold?: number;
  isDistanceBased: boolean;
}

// Tax Configuration
export interface TaxConfiguration {
  id: string;
  profession: LegalProfession;
  taxType: TaxType;
  rate: number;
  isPercentage: boolean;
  minimumAmount?: number;
  maximumAmount?: number;
  exemptionThreshold?: number;
  applicableFrom: Date;
  applicableTo?: Date;
  isActive: boolean;
  legalReference: string;
}

export enum TaxType {
  VAT = 'vat',
  PROFESSIONAL_TAX = 'professional_tax',
  STAMP_DUTY = 'stamp_duty',
  REGISTRATION_TAX = 'registration_tax',
  WITHHOLDING_TAX = 'withholding_tax'
}

// Billing Invoice
export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  billingCalculationId: string;
  caseId: string;
  clientId: string;
  lawyerId: string;
  organizationId?: string;
  
  // Invoice details
  issueDate: Date;
  dueDate: Date;
  paymentTerms: number; // days
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  
  // Status
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  
  // Payment details
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  paymentReference?: string;
  
  // Additional information
  notes?: string;
  termsAndConditions?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  PAID = 'paid'
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  MOBILE_PAYMENT = 'mobile_payment',
  OTHER = 'other'
}

// Request/Response Types
export interface CalculateFeeRequest {
  caseId: string;
  clientId: string;
  profession: LegalProfession;
  calculationType: CalculationType;
  parameters: BillingParameters;
  applyTaxes?: boolean;
  saveCalculation?: boolean;
}

export interface CalculateFeeResponse {
  calculationId?: string;
  breakdown: FeeBreakdown;
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  calculationDate: Date;
  validUntil?: Date;
}

export interface CreateInvoiceRequest {
  billingCalculationId: string;
  paymentTerms?: number;
  notes?: string;
  termsAndConditions?: string;
  sendToClient?: boolean;
}

export interface UpdateFeeScheduleRequest {
  profession: LegalProfession;
  schedules: Partial<AlgerianFeeSchedule>[];
  effectiveDate: Date;
  reason: string;
}

export interface BillingSearchCriteria {
  caseId?: string;
  clientId?: string;
  lawyerId?: string;
  profession?: LegalProfession;
  status?: BillingStatus;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: BillingSortBy;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum BillingSortBy {
  CALCULATION_DATE = 'calculation_date',
  TOTAL_AMOUNT = 'total_amount',
  CLIENT_NAME = 'client_name',
  CASE_NUMBER = 'case_number',
  STATUS = 'status'
}

export interface BillingSearchResult {
  calculations: BillingCalculation[];
  totalCount: number;
  searchTime: number;
}

// Billing Statistics
export interface BillingStatistics {
  totalCalculations: number;
  totalAmount: number;
  averageAmount: number;
  calculationsByProfession: Record<LegalProfession, number>;
  calculationsByType: Record<CalculationType, number>;
  calculationsByStatus: Record<BillingStatus, number>;
  monthlyTrends: MonthlyBillingTrend[];
  topClients: ClientBillingStats[];
  recentActivity: BillingActivity[];
}

export interface MonthlyBillingTrend {
  month: string;
  year: number;
  calculationCount: number;
  totalAmount: number;
  averageAmount: number;
}

export interface ClientBillingStats {
  clientId: string;
  clientName: string;
  calculationCount: number;
  totalAmount: number;
  averageAmount: number;
  lastCalculation: Date;
}

export interface BillingActivity {
  id: string;
  type: 'calculation' | 'invoice' | 'payment';
  description: string;
  amount: number;
  performedBy: string;
  performedAt: Date;
}

// Fee Schedule Update History
export interface FeeScheduleUpdate {
  id: string;
  profession: LegalProfession;
  updateType: 'create' | 'update' | 'delete';
  previousSchedule?: AlgerianFeeSchedule;
  newSchedule: AlgerianFeeSchedule;
  effectiveDate: Date;
  reason: string;
  updatedBy: string;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

// Billing Audit
export interface BillingAudit {
  id: string;
  billingCalculationId: string;
  action: BillingAuditAction;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum BillingAuditAction {
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  MODIFIED = 'modified',
  INVOICED = 'invoiced',
  PAID = 'paid',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}