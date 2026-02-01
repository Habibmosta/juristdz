export enum ModerationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
  UNDER_REVIEW = 'under_review'
}

export enum ModerationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  REQUEST_CHANGES = 'request_changes',
  ESCALATE = 'escalate'
}

export enum ContentType {
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  COMMENT = 'comment',
  CASE_NOTE = 'case_note',
  USER_PROFILE = 'user_profile',
  LEGAL_OPINION = 'legal_opinion'
}

export enum ModerationReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  LEGAL_VIOLATION = 'legal_violation',
  SPAM = 'spam',
  PLAGIARISM = 'plagiarism',
  CONFIDENTIALITY_BREACH = 'confidentiality_breach',
  PROFESSIONAL_MISCONDUCT = 'professional_misconduct',
  TECHNICAL_ERROR = 'technical_error',
  OTHER = 'other'
}

export enum AutoModerationRule {
  PROFANITY_FILTER = 'profanity_filter',
  CONFIDENTIAL_DATA_DETECTION = 'confidential_data_detection',
  PLAGIARISM_DETECTION = 'plagiarism_detection',
  LEGAL_COMPLIANCE_CHECK = 'legal_compliance_check',
  SPAM_DETECTION = 'spam_detection'
}

export interface ModerationItem {
  id: string;
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
  contentPreview: string;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: string;
  status: ModerationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoModerationFlags: AutoModerationFlag[];
  manualReports: ModerationReport[];
  assignedModerator?: string;
  assignedModeratorName?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewerName?: string;
  reviewNotes?: string;
  escalatedAt?: Date;
  escalatedBy?: string;
  escalationReason?: string;
}

export interface AutoModerationFlag {
  id: string;
  rule: AutoModerationRule;
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  details: string;
  flaggedContent: string;
  suggestedAction: ModerationAction;
  createdAt: Date;
}

export interface ModerationReport {
  id: string;
  reportedBy: string;
  reporterName: string;
  reporterRole: string;
  reason: ModerationReason;
  description: string;
  evidence?: string[];
  createdAt: Date;
}

export interface ModerationAction {
  id: string;
  moderationItemId: string;
  action: ModerationAction;
  performedBy: string;
  performedByName: string;
  reason: string;
  notes?: string;
  createdAt: Date;
}

export interface ModerationWorkflow {
  id: string;
  name: string;
  description: string;
  contentTypes: ContentType[];
  autoModerationRules: AutoModerationRule[];
  requiresManualReview: boolean;
  escalationThreshold: number;
  approvalRequired: boolean;
  reviewerRoles: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationQueue {
  items: ModerationItem[];
  total: number;
  pending: number;
  underReview: number;
  flagged: number;
  highPriority: number;
}

export interface ModerationStatistics {
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  flaggedItems: number;
  averageReviewTime: number; // in minutes
  autoModerationAccuracy: number; // percentage
  moderatorWorkload: ModeratorWorkload[];
  contentTypeBreakdown: Record<ContentType, number>;
  reasonBreakdown: Record<ModerationReason, number>;
  trendsOverTime: ModerationTrend[];
}

export interface ModeratorWorkload {
  moderatorId: string;
  moderatorName: string;
  assignedItems: number;
  completedItems: number;
  averageReviewTime: number;
  accuracy: number;
}

export interface ModerationTrend {
  date: string;
  totalSubmissions: number;
  autoApproved: number;
  manualReviews: number;
  rejections: number;
  averageReviewTime: number;
}

export interface ModerationSearchCriteria {
  status?: ModerationStatus;
  contentType?: ContentType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedModerator?: string;
  submittedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAutoFlags?: boolean;
  hasManualReports?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ModerationSearchResult {
  items: ModerationItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateModerationItemRequest {
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
  contentPreview: string;
  submittedBy: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  workflowId?: string;
}

export interface UpdateModerationItemRequest {
  status?: ModerationStatus;
  assignedModerator?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  reviewNotes?: string;
}

export interface PerformModerationActionRequest {
  action: ModerationAction;
  reason: string;
  notes?: string;
}

export interface CreateModerationReportRequest {
  contentType: ContentType;
  contentId: string;
  reason: ModerationReason;
  description: string;
  evidence?: string[];
}

export interface CreateModerationWorkflowRequest {
  name: string;
  description: string;
  contentTypes: ContentType[];
  autoModerationRules: AutoModerationRule[];
  requiresManualReview: boolean;
  escalationThreshold: number;
  approvalRequired: boolean;
  reviewerRoles: string[];
}

export interface UpdateModerationWorkflowRequest {
  name?: string;
  description?: string;
  contentTypes?: ContentType[];
  autoModerationRules?: AutoModerationRule[];
  requiresManualReview?: boolean;
  escalationThreshold?: number;
  approvalRequired?: boolean;
  reviewerRoles?: string[];
  isActive?: boolean;
}

export interface AutoModerationResult {
  passed: boolean;
  flags: AutoModerationFlag[];
  suggestedAction: ModerationAction;
  confidence: number;
  requiresManualReview: boolean;
}

export interface ModerationDashboard {
  queue: ModerationQueue;
  statistics: ModerationStatistics;
  myAssignedItems: ModerationItem[];
  recentActions: ModerationAction[];
  alerts: ModerationAlert[];
}

export interface ModerationAlert {
  id: string;
  type: 'high_priority_item' | 'escalation_needed' | 'workflow_issue' | 'system_alert';
  message: string;
  itemId?: string;
  createdAt: Date;
  acknowledged: boolean;
}