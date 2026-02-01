// Report generation system types

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters: ReportParameters;
  generatedBy: string;
  organizationId?: string;
  filePath?: string;
  fileSize?: number;
  generatedAt?: Date;
  expiresAt?: Date;
  downloadCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReportType {
  CASE_ACTIVITY = 'case_activity',
  CASE_SUMMARY = 'case_summary',
  TIME_TRACKING = 'time_tracking',
  BILLING_SUMMARY = 'billing_summary',
  DEADLINE_TRACKING = 'deadline_tracking',
  CLIENT_PORTFOLIO = 'client_portfolio',
  PERFORMANCE_METRICS = 'performance_metrics',
  FINANCIAL_OVERVIEW = 'financial_overview',
  CASE_STATISTICS = 'case_statistics',
  NOTIFICATION_ANALYTICS = 'notification_analytics',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface ReportParameters {
  dateRange?: {
    from: Date;
    to: Date;
  };
  caseIds?: string[];
  clientIds?: string[];
  lawyerIds?: string[];
  legalDomains?: string[];
  caseStatuses?: string[];
  includeArchived?: boolean;
  groupBy?: ReportGroupBy;
  sortBy?: ReportSortBy;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  customFields?: string[];
}

export enum ReportGroupBy {
  CASE = 'case',
  CLIENT = 'client',
  LAWYER = 'lawyer',
  LEGAL_DOMAIN = 'legal_domain',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  STATUS = 'status'
}

export enum ReportSortBy {
  DATE = 'date',
  CASE_NUMBER = 'case_number',
  CLIENT_NAME = 'client_name',
  LAWYER_NAME = 'lawyer_name',
  AMOUNT = 'amount',
  HOURS = 'hours',
  STATUS = 'status'
}

// Case Activity Report
export interface CaseActivityReport {
  reportId: string;
  summary: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalHours: number;
    totalRevenue: number;
    averageCaseDuration: number;
  };
  caseDetails: CaseActivityDetail[];
  timeDistribution: TimeDistribution[];
  revenueByMonth: MonthlyRevenue[];
  topClients: ClientSummary[];
  upcomingDeadlines: DeadlineSummary[];
}

export interface CaseActivityDetail {
  caseId: string;
  caseNumber: string;
  title: string;
  client: string;
  status: string;
  openedDate: Date;
  closedDate?: Date;
  assignedLawyer: string;
  totalHours: number;
  billableHours: number;
  totalRevenue: number;
  lastActivity: Date;
  upcomingDeadlines: number;
  documentCount: number;
  eventCount: number;
}

export interface TimeDistribution {
  activityType: string;
  hours: number;
  percentage: number;
  billableHours: number;
  revenue: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  hours: number;
  caseCount: number;
}

export interface ClientSummary {
  clientId: string;
  clientName: string;
  caseCount: number;
  totalRevenue: number;
  totalHours: number;
  averageCaseValue: number;
  lastActivity: Date;
}

export interface DeadlineSummary {
  deadlineId: string;
  caseId: string;
  caseTitle: string;
  deadlineTitle: string;
  deadlineDate: Date;
  priority: string;
  daysRemaining: number;
  assignedTo: string;
}

// Time Tracking Report
export interface TimeTrackingReport {
  reportId: string;
  summary: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    billableRate: number;
    totalRevenue: number;
    averageHourlyRate: number;
  };
  timeEntries: TimeEntryDetail[];
  dailyBreakdown: DailyTimeBreakdown[];
  activityBreakdown: ActivityTimeBreakdown[];
  lawyerPerformance: LawyerTimePerformance[];
}

export interface TimeEntryDetail {
  id: string;
  caseId: string;
  caseTitle: string;
  client: string;
  lawyer: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration: number;
  activityType: string;
  description: string;
  isBillable: boolean;
  hourlyRate?: number;
  amount?: number;
  status: string;
}

export interface DailyTimeBreakdown {
  date: Date;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  revenue: number;
  caseCount: number;
}

export interface ActivityTimeBreakdown {
  activityType: string;
  totalHours: number;
  billableHours: number;
  percentage: number;
  averageHourlyRate: number;
  totalRevenue: number;
}

export interface LawyerTimePerformance {
  lawyerId: string;
  lawyerName: string;
  totalHours: number;
  billableHours: number;
  billableRate: number;
  totalRevenue: number;
  averageHourlyRate: number;
  caseCount: number;
  efficiency: number;
}

// Billing Summary Report
export interface BillingSummaryReport {
  reportId: string;
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    averagePaymentTime: number;
    collectionRate: number;
  };
  invoices: InvoiceSummary[];
  paymentTrends: PaymentTrend[];
  clientPaymentBehavior: ClientPaymentBehavior[];
  agingReport: AgingReportItem[];
}

export interface InvoiceSummary {
  invoiceId: string;
  invoiceNumber: string;
  caseId: string;
  caseTitle: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  status: string;
  daysOverdue?: number;
  paymentMethod?: string;
}

export interface PaymentTrend {
  month: string;
  year: number;
  invoiced: number;
  paid: number;
  outstanding: number;
  collectionRate: number;
}

export interface ClientPaymentBehavior {
  clientId: string;
  clientName: string;
  totalInvoiced: number;
  totalPaid: number;
  averagePaymentTime: number;
  overdueAmount: number;
  paymentReliability: number;
  lastPayment?: Date;
}

export interface AgingReportItem {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

// Performance Metrics Report
export interface PerformanceMetricsReport {
  reportId: string;
  summary: {
    totalCases: number;
    averageCaseResolutionTime: number;
    clientSatisfactionScore: number;
    revenueGrowth: number;
    productivityIndex: number;
    utilizationRate: number;
  };
  lawyerMetrics: LawyerMetrics[];
  caseMetrics: CaseMetrics[];
  clientMetrics: ClientMetrics[];
  trendAnalysis: TrendAnalysis[];
}

export interface LawyerMetrics {
  lawyerId: string;
  lawyerName: string;
  caseLoad: number;
  averageCaseValue: number;
  resolutionTime: number;
  billableHours: number;
  utilizationRate: number;
  clientSatisfaction: number;
  revenueGenerated: number;
  efficiency: number;
}

export interface CaseMetrics {
  legalDomain: string;
  totalCases: number;
  averageValue: number;
  averageResolutionTime: number;
  successRate: number;
  profitability: number;
  complexity: number;
}

export interface ClientMetrics {
  clientType: string;
  clientCount: number;
  averageValue: number;
  retentionRate: number;
  satisfactionScore: number;
  profitability: number;
  growthRate: number;
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  value: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

// Report Templates
export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameters;
  layout: ReportLayout;
  isSystem: boolean;
  isActive: boolean;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportLayout {
  sections: ReportSection[];
  styling: ReportStyling;
  headers: ReportHeader[];
  footers: ReportFooter[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  order: number;
  visible: boolean;
  configuration: Record<string, any>;
}

export enum SectionType {
  SUMMARY = 'summary',
  TABLE = 'table',
  CHART = 'chart',
  TEXT = 'text',
  IMAGE = 'image',
  PAGE_BREAK = 'page_break'
}

export interface ReportStyling {
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  headerHeight: number;
  footerHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ReportHeader {
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  bold: boolean;
}

export interface ReportFooter {
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  includePageNumber: boolean;
}

// Request/Response Types
export interface CreateReportRequest {
  title: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameters;
  templateId?: string;
  scheduleGeneration?: boolean;
  expirationDays?: number;
}

export interface CreateReportTemplateRequest {
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  parameters: ReportParameters;
  layout: ReportLayout;
}

export interface UpdateReportTemplateRequest {
  name?: string;
  description?: string;
  parameters?: ReportParameters;
  layout?: ReportLayout;
  isActive?: boolean;
}

export interface ReportSearchCriteria {
  type?: ReportType;
  format?: ReportFormat;
  status?: ReportStatus;
  generatedBy?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sortBy?: ReportSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum ReportSortOption {
  CREATED_AT = 'created_at',
  GENERATED_AT = 'generated_at',
  TITLE = 'title',
  TYPE = 'type',
  STATUS = 'status',
  FILE_SIZE = 'file_size'
}

export interface ReportSearchResult {
  reports: Report[];
  totalCount: number;
  searchTime: number;
}

// Report Statistics
export interface ReportStatistics {
  totalReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByFormat: Record<ReportFormat, number>;
  reportsByStatus: Record<ReportStatus, number>;
  averageGenerationTime: number;
  totalDownloads: number;
  mostPopularReports: PopularReport[];
  recentActivity: ReportActivity[];
}

export interface PopularReport {
  type: ReportType;
  title: string;
  downloadCount: number;
  lastGenerated: Date;
}

export interface ReportActivity {
  id: string;
  type: ReportType;
  title: string;
  generatedBy: string;
  generatedAt: Date;
  downloadCount: number;
  status: ReportStatus;
}

// Report Generation Job
export interface ReportGenerationJob {
  id: string;
  reportId: string;
  status: ReportStatus;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  estimatedCompletion?: Date;
}

// Export Configuration
export interface ExportConfiguration {
  format: ReportFormat;
  compression: boolean;
  password?: string;
  watermark?: string;
  includeMetadata: boolean;
  customFields?: string[];
}

// Dashboard Report Widget
export interface DashboardReportWidget {
  id: string;
  title: string;
  type: ReportType;
  size: WidgetSize;
  position: WidgetPosition;
  refreshInterval: number;
  parameters: ReportParameters;
  lastUpdated: Date;
  data: any;
}

export enum WidgetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  FULL_WIDTH = 'full_width'
}

export interface WidgetPosition {
  row: number;
  column: number;
  width: number;
  height: number;
}

// Scheduled Reports
export interface ScheduledReport {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  schedule: ReportSchedule;
  recipients: string[];
  isActive: boolean;
  lastGenerated?: Date;
  nextGeneration: Date;
  createdBy: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  interval: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  timezone: string;
}

export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Report Sharing
export interface ReportShare {
  id: string;
  reportId: string;
  sharedBy: string;
  sharedWith: string[];
  permissions: SharePermission[];
  expiresAt?: Date;
  accessCount: number;
  isActive: boolean;
  createdAt: Date;
}

export enum SharePermission {
  VIEW = 'view',
  DOWNLOAD = 'download',
  SHARE = 'share'
}

// Report Audit
export interface ReportAudit {
  id: string;
  reportId: string;
  action: AuditAction;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export enum AuditAction {
  GENERATED = 'generated',
  DOWNLOADED = 'downloaded',
  SHARED = 'shared',
  DELETED = 'deleted',
  VIEWED = 'viewed',
  EXPORTED = 'exported'
}