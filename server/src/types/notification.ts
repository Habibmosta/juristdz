// Notification system types

export interface Notification {
  id: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  caseId?: string;
  scheduledAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: NotificationStatus;
  priority: NotificationPriority;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  failureReason?: string;
  metadata: Record<string, any>;
  templateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  DEADLINE_REMINDER = 'deadline_reminder',
  HEARING_REMINDER = 'hearing_reminder',
  CASE_UPDATE = 'case_update',
  DOCUMENT_SHARED = 'document_shared',
  PAYMENT_DUE = 'payment_due',
  TASK_ASSIGNED = 'task_assigned',
  SYSTEM_ALERT = 'system_alert',
  CUSTOM = 'custom'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  PUSH = 'push'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification Templates
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: TemplateVariable[];
  triggerConditions: Record<string, any>;
  isSystem: boolean;
  isActive: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  ARRAY = 'array',
  OBJECT = 'object'
}

// Notification Preferences
export interface NotificationPreferences {
  id: string;
  userId: string;
  notificationType: NotificationType;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  businessHoursOnly: boolean;
  quietHoursStart?: string; // Time format HH:MM
  quietHoursEnd?: string;
  timezone: string;
  immediate: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  digestTime: string;
  createdAt: Date;
  updatedAt: Date;
}

// Deadline Notifications
export interface DeadlineNotification {
  id: string;
  deadlineId: string;
  notificationId: string;
  daysBefore: number;
  notificationDate: Date;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

// Notification Logs
export interface NotificationLog {
  id: string;
  notificationId: string;
  eventType: NotificationEventType;
  eventTimestamp: Date;
  details: Record<string, any>;
  errorMessage?: string;
  externalId?: string;
  externalStatus?: string;
  externalResponse?: Record<string, any>;
  createdAt: Date;
}

export enum NotificationEventType {
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry'
}

// Notification Digests
export interface NotificationDigest {
  id: string;
  userId: string;
  digestType: DigestType;
  digestDate: Date;
  notificationCount: number;
  content: Record<string, any>;
  status: DigestStatus;
  generatedAt?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export enum DigestType {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export enum DigestStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  SENT = 'sent',
  FAILED = 'failed'
}

// Procedural Deadlines
export interface ProceduralDeadline {
  id: string;
  name: string;
  description?: string;
  legalReference?: string;
  baseEvent: string;
  calculationMethod: CalculationMethod;
  calculationValue?: number;
  legalDomain?: string;
  caseType?: string;
  courtType?: string;
  jurisdiction?: string;
  defaultNotificationDays: number[];
  isCritical: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CalculationMethod {
  DAYS_AFTER = 'days_after',
  DAYS_BEFORE = 'days_before',
  BUSINESS_DAYS_AFTER = 'business_days_after',
  BUSINESS_DAYS_BEFORE = 'business_days_before',
  MONTHS_AFTER = 'months_after',
  MONTHS_BEFORE = 'months_before',
  FIXED_DATE = 'fixed_date'
}

// Request/Response Types
export interface CreateNotificationRequest {
  recipientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  caseId?: string;
  scheduledAt?: Date;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  templateId?: string;
}

export interface CreateNotificationTemplateRequest {
  name: string;
  description?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables?: TemplateVariable[];
  triggerConditions?: Record<string, any>;
}

export interface UpdateNotificationPreferencesRequest {
  notificationType: NotificationType;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
  businessHoursOnly?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  immediate?: boolean;
  dailyDigest?: boolean;
  weeklyDigest?: boolean;
  digestTime?: string;
}

export interface NotificationSearchCriteria {
  recipientId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  caseId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sortBy?: NotificationSortOption;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export enum NotificationSortOption {
  CREATED_AT = 'created_at',
  SCHEDULED_AT = 'scheduled_at',
  SENT_AT = 'sent_at',
  PRIORITY = 'priority',
  STATUS = 'status',
  TYPE = 'type'
}

export interface NotificationSearchResult {
  notifications: Notification[];
  totalCount: number;
  searchTime: number;
}

// Notification Statistics
export interface NotificationStatistics {
  totalNotifications: number;
  notificationsByStatus: Record<NotificationStatus, number>;
  notificationsByType: Record<NotificationType, number>;
  notificationsByChannel: Record<NotificationChannel, number>;
  deliveryRate: number;
  averageDeliveryTime: number;
  failureRate: number;
  recentActivity: NotificationActivity[];
}

export interface NotificationActivity {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  recipientId: string;
  recipientName: string;
  timestamp: Date;
  caseTitle?: string;
}

// Deadline Management
export interface DeadlineReminderConfig {
  deadlineId: string;
  notificationDays: number[];
  channels: NotificationChannel[];
  customMessage?: string;
  priority?: NotificationPriority;
}

export interface BulkNotificationRequest {
  recipientIds: string[];
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  scheduledAt?: Date;
  priority?: NotificationPriority;
  templateId?: string;
  templateVariables?: Record<string, any>;
}

export interface BulkNotificationResult {
  successful: string[];
  failed: { recipientId: string; error: string }[];
  totalProcessed: number;
}

// Notification Dashboard
export interface NotificationDashboard {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledAt: Date;
  sentAt?: Date;
  caseId?: string;
  caseTitle?: string;
  caseNumber?: string;
  recipientId: string;
  recipientEmail?: string;
  recipientName?: string;
}

// Email/SMS Service Integration
export interface EmailNotificationData {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SMSNotificationData {
  to: string;
  message: string;
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

// Notification Service Response
export interface NotificationServiceResponse {
  success: boolean;
  externalId?: string;
  status?: string;
  error?: string;
  details?: Record<string, any>;
}

// Template Processing
export interface TemplateContext {
  user?: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  case?: {
    id: string;
    title: string;
    caseNumber: string;
    status: string;
    client?: string;
  };
  deadline?: {
    id: string;
    title: string;
    description?: string;
    deadlineDate: Date;
    priority: string;
    daysBefore?: number;
  };
  hearing?: {
    date: Date;
    time: string;
    location?: string;
    courtName?: string;
    notes?: string;
  };
  document?: {
    id: string;
    title: string;
    type: string;
    sharedBy?: string;
  };
  custom?: Record<string, any>;
}

// Notification Queue
export interface NotificationQueueItem {
  id: string;
  notification: Notification;
  priority: number;
  attempts: number;
  nextRetry?: Date;
  processingStarted?: Date;
}

export interface NotificationQueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  averageProcessingTime: number;
}

// Webhook Events
export interface NotificationWebhookEvent {
  eventType: string;
  notificationId: string;
  externalId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

export enum WebhookEventType {
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  CLICKED = 'clicked',
  OPENED = 'opened',
  UNSUBSCRIBED = 'unsubscribed'
}