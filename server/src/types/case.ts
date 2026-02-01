import { LegalDomain } from './search';

// Client types
export interface Client {
  id: string;
  type: ClientType;
  
  // Individual client fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  nationality?: string;
  idCardNumber?: string;
  
  // Company client fields
  companyName?: string;
  legalForm?: string;
  registrationNumber?: string;
  taxNumber?: string;
  
  // Common contact information
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country: string;
  
  // Professional information
  profession?: string;
  employer?: string;
  
  // Legal information
  maritalStatus?: string;
  legalRepresentativeName?: string;
  legalRepresentativeCapacity?: string;
  
  // System fields
  createdBy: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  notes?: string;
}

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company'
}

// Case types
export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  
  // Case classification
  legalDomain: LegalDomain;
  caseType: string;
  urgencyLevel: UrgencyLevel;
  
  // Parties
  clientId: string;
  client?: Client;
  opposingParty?: string;
  opposingCounsel?: string;
  
  // Court information
  courtId?: string;
  courtName?: string;
  judgeName?: string;
  caseReference?: string;
  
  // Status and dates
  status: CaseStatus;
  openedDate: Date;
  closedDate?: Date;
  nextHearingDate?: Date;
  statuteLimitationsDate?: Date;
  
  // Financial information
  estimatedValue?: number;
  currency: string;
  feeArrangement?: FeeArrangement;
  hourlyRate?: number;
  fixedFee?: number;
  contingencyPercentage?: number;
  
  // Assignment
  assignedLawyerId: string;
  supervisingLawyerId?: string;
  organizationId?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Related data
  documents?: CaseDocument[];
  events?: CaseEvent[];
  notes?: CaseNote[];
  contacts?: CaseContact[];
  deadlines?: CaseDeadline[];
  timeEntries?: CaseTimeEntry[];
  expenses?: CaseExpense[];
}

export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled'
}

export enum UrgencyLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum FeeArrangement {
  HOURLY = 'hourly',
  FIXED = 'fixed',
  CONTINGENCY = 'contingency',
  MIXED = 'mixed'
}

// Case document association
export interface CaseDocument {
  id: string;
  caseId: string;
  documentId: string;
  documentRole?: string;
  addedBy: string;
  addedAt: Date;
  notes?: string;
}

// Case events
export interface CaseEvent {
  id: string;
  caseId: string;
  eventType: EventType;
  title: string;
  description?: string;
  eventDate: Date;
  durationMinutes?: number;
  location?: string;
  participants: EventParticipant[];
  status: EventStatus;
  reminderDate?: Date;
  isBillable: boolean;
  billableHours?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EventType {
  HEARING = 'hearing',
  DEADLINE = 'deadline',
  FILING = 'filing',
  MEETING = 'meeting',
  CALL = 'call',
  EMAIL = 'email',
  PAYMENT = 'payment',
  SETTLEMENT = 'settlement',
  JUDGMENT = 'judgment',
  APPEAL = 'appeal',
  OTHER = 'other'
}

export enum EventStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export interface EventParticipant {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

// Case notes
export interface CaseNote {
  id: string;
  caseId: string;
  title?: string;
  content: string;
  noteType: NoteType;
  isConfidential: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NoteType {
  GENERAL = 'general',
  STRATEGY = 'strategy',
  RESEARCH = 'research',
  CLIENT_COMMUNICATION = 'client_communication',
  INTERNAL = 'internal'
}

// Case contacts
export interface CaseContact {
  id: string;
  caseId: string;
  contactType: ContactType;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContactType {
  WITNESS = 'witness',
  EXPERT = 'expert',
  INTERPRETER = 'interpreter',
  COURT_CLERK = 'court_clerk',
  OPPOSING_COUNSEL = 'opposing_counsel',
  MEDIATOR = 'mediator',
  ARBITRATOR = 'arbitrator',
  OTHER = 'other'
}

// Case deadlines
export interface CaseDeadline {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  deadlineDate: Date;
  deadlineType: DeadlineType;
  priority: Priority;
  status: DeadlineStatus;
  completedDate?: Date;
  notificationDaysBefore: number[];
  lastNotificationSent?: Date;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeadlineType {
  FILING = 'filing',
  RESPONSE = 'response',
  DISCOVERY = 'discovery',
  HEARING = 'hearing',
  APPEAL = 'appeal',
  PAYMENT = 'payment',
  OTHER = 'other'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DeadlineStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  MISSED = 'missed',
  EXTENDED = 'extended'
}

// Time tracking
export interface CaseTimeEntry {
  id: string;
  caseId: string;
  lawyerId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  activityType: ActivityType;
  description: string;
  isBillable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  status: TimeEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum ActivityType {
  RESEARCH = 'research',
  DRAFTING = 'drafting',
  REVIEW = 'review',
  MEETING = 'meeting',
  CALL = 'call',
  HEARING = 'hearing',
  TRAVEL = 'travel',
  CORRESPONDENCE = 'correspondence',
  FILING = 'filing',
  NEGOTIATION = 'negotiation',
  OTHER = 'other'
}

export enum TimeEntryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  BILLED = 'billed'
}

// Expense tracking
export interface CaseExpense {
  id: string;
  caseId: string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  currency: string;
  expenseDate: Date;
  receiptNumber?: string;
  vendor?: string;
  status: ExpenseStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExpenseType {
  COURT_FEES = 'court_fees',
  FILING_FEES = 'filing_fees',
  EXPERT_FEES = 'expert_fees',
  TRAVEL = 'travel',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  COPYING = 'copying',
  POSTAGE = 'postage',
  RESEARCH = 'research',
  OTHER = 'other'
}

export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REIMBURSED = 'reimbursed',
  BILLED_TO_CLIENT = 'billed_to_client'
}

// Search and filtering
export interface CaseSearchCriteria {
  query?: string;
  clientId?: string;
  assignedLawyerId?: string;
  status?: CaseStatus;
  legalDomain?: LegalDomain;
  caseType?: string;
  urgencyLevel?: UrgencyLevel;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  courtId?: string;
  hasUpcomingDeadlines?: boolean;
  sortBy?: CaseSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum CaseSortOption {
  CASE_NUMBER = 'case_number',
  TITLE = 'title',
  OPENED_DATE = 'opened_date',
  NEXT_HEARING = 'next_hearing_date',
  STATUS = 'status',
  CLIENT_NAME = 'client_name',
  URGENCY = 'urgency_level'
}

export interface CaseSearchResult {
  cases: Case[];
  totalCount: number;
  searchTime: number;
}

// Case statistics
export interface CaseStatistics {
  totalCases: number;
  openCases: number;
  closedCases: number;
  totalBillableHours: number;
  totalRevenue: number;
  averageCaseDuration: number;
  casesByStatus: Record<CaseStatus, number>;
  casesByDomain: Record<LegalDomain, number>;
  upcomingDeadlines: CaseDeadline[];
  recentActivity: CaseActivity[];
}

export interface CaseActivity {
  id: string;
  caseId: string;
  caseTitle: string;
  activityType: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

// Case overview for dashboard
export interface CaseOverview {
  id: string;
  caseNumber: string;
  title: string;
  legalDomain: LegalDomain;
  caseType: string;
  status: CaseStatus;
  urgencyLevel: UrgencyLevel;
  openedDate: Date;
  closedDate?: Date;
  nextHearingDate?: Date;
  
  // Client information
  clientFirstName?: string;
  clientLastName?: string;
  clientCompanyName?: string;
  clientType: ClientType;
  
  // Lawyer information
  assignedLawyerEmail: string;
  lawyerFirstName?: string;
  lawyerLastName?: string;
  
  // Court information
  courtName?: string;
  judgeName?: string;
  
  // Statistics
  documentCount: number;
  eventCount: number;
  pendingDeadlines: number;
  billableHours: number;
  totalFees: number;
}

// Request/Response types
export interface CreateClientRequest {
  type: ClientType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  // ... other fields as needed
}

export interface CreateCaseRequest {
  title: string;
  description?: string;
  legalDomain: LegalDomain;
  caseType: string;
  urgencyLevel?: UrgencyLevel;
  clientId: string;
  opposingParty?: string;
  courtId?: string;
  estimatedValue?: number;
  feeArrangement?: FeeArrangement;
  hourlyRate?: number;
  fixedFee?: number;
}

export interface UpdateCaseRequest {
  title?: string;
  description?: string;
  status?: CaseStatus;
  urgencyLevel?: UrgencyLevel;
  opposingParty?: string;
  opposingCounsel?: string;
  courtId?: string;
  judgeName?: string;
  nextHearingDate?: Date;
  estimatedValue?: number;
  feeArrangement?: FeeArrangement;
  hourlyRate?: number;
  fixedFee?: number;
}

export interface CreateCaseEventRequest {
  eventType: EventType;
  title: string;
  description?: string;
  eventDate: Date;
  durationMinutes?: number;
  location?: string;
  participants?: EventParticipant[];
  reminderDate?: Date;
  isBillable?: boolean;
}

export interface CreateCaseNoteRequest {
  title?: string;
  content: string;
  noteType?: NoteType;
  isConfidential?: boolean;
}

export interface CreateCaseDeadlineRequest {
  title: string;
  description?: string;
  deadlineDate: Date;
  deadlineType: DeadlineType;
  priority?: Priority;
  notificationDaysBefore?: number[];
  assignedTo?: string;
}

export interface CreateTimeEntryRequest {
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  activityType: ActivityType;
  description: string;
  isBillable?: boolean;
  hourlyRate?: number;
}

export interface CreateExpenseRequest {
  expenseType: ExpenseType;
  description: string;
  amount: number;
  expenseDate: Date;
  receiptNumber?: string;
  vendor?: string;
}