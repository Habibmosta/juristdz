/**
 * Error Reporter Interface
 * 
 * Comprehensive error reporting and tracking system for the Pure Translation System,
 * providing detailed error analysis, recovery suggestions, and system improvement insights.
 */

import {
  SystemError,
  TranslationError,
  ErrorRecoveryAction,
  Severity
} from '../types';

export interface IErrorReporter {
  /**
   * Report system error with context and recovery suggestions
   * @param error System error to report
   * @param context Additional context information
   */
  reportSystemError(error: SystemError, context?: ErrorContext): Promise<void>;

  /**
   * Report translation-specific error
   * @param error Translation error details
   * @param translationId Associated translation ID
   */
  reportTranslationError(error: TranslationError, translationId: string): Promise<void>;

  /**
   * Track error recovery actions and their effectiveness
   * @param errorId Error ID being recovered
   * @param action Recovery action taken
   * @param success Whether recovery was successful
   */
  trackErrorRecovery(errorId: string, action: ErrorRecoveryAction, success: boolean): Promise<void>;

  /**
   * Generate error analysis report
   * @param timeRange Time range for analysis
   * @returns Comprehensive error analysis
   */
  generateErrorAnalysis(timeRange: TimeRange): Promise<ErrorAnalysis>;

  /**
   * Get error trends and patterns
   * @param period Time period for trend analysis
   * @returns Error trend analysis
   */
  getErrorTrends(period: TimePeriod): Promise<ErrorTrends>;

  /**
   * Configure error alerting and notifications
   * @param config Error alert configuration
   */
  configureErrorAlerts(config: ErrorAlertConfig): Promise<void>;

  /**
   * Get real-time error dashboard
   * @returns Current error dashboard data
   */
  getErrorDashboard(): Promise<ErrorDashboard>;

  /**
   * Classify and categorize errors automatically
   * @param error Error to classify
   * @returns Error classification result
   */
  classifyError(error: SystemError | TranslationError): Promise<ErrorClassification>;

  /**
   * Generate error recovery recommendations
   * @param errorPattern Error pattern to analyze
   * @returns Recovery recommendations
   */
  generateRecoveryRecommendations(errorPattern: ErrorPattern): Promise<RecoveryRecommendation[]>;

  /**
   * Export error data for external analysis
   * @param format Export format
   * @param timeRange Time range for export
   * @returns Exported error data
   */
  exportErrorData(format: ExportFormat, timeRange: TimeRange): Promise<ExportResult>;
}

export interface ErrorContext {
  userId?: string;
  translationId?: string;
  requestData?: any;
  systemState?: any;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  additionalData?: Map<string, any>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export interface ErrorAnalysis {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsBySeverity: Map<Severity, number>;
  errorsByComponent: Map<string, number>;
  recoverySuccessRate: number;
  mostCommonErrors: ErrorSummary[];
  errorImpact: ErrorImpactAnalysis;
  recommendations: string[];
}

export interface ErrorSummary {
  type: string;
  count: number;
  severity: Severity;
  averageRecoveryTime: number;
  successfulRecoveries: number;
  examples: string[];
}

export interface ErrorImpactAnalysis {
  userImpact: ImpactMetrics;
  systemImpact: ImpactMetrics;
  businessImpact: ImpactMetrics;
}

export interface ImpactMetrics {
  affectedUsers: number;
  downtime: number;
  performanceDegradation: number;
  qualityImpact: number;
}

export interface ErrorTrends {
  period: TimePeriod;
  errorRateTrend: TrendData;
  severityTrend: TrendData;
  recoveryTimeTrend: TrendData;
  componentReliabilityTrend: Map<string, TrendData>;
  predictions: ErrorPrediction[];
}

export interface TrendData {
  dataPoints: DataPoint[];
  trend: TrendDirection;
  changePercentage: number;
  significance: number;
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  metadata?: any;
}

export enum TrendDirection {
  IMPROVING = 'improving',
  WORSENING = 'worsening',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export interface ErrorPrediction {
  errorType: string;
  predictedOccurrences: number;
  confidence: number;
  timeframe: Date;
  riskFactors: string[];
}

export interface ErrorAlertConfig {
  errorRateThreshold: number;
  criticalErrorThreshold: number;
  recoveryFailureThreshold: number;
  alertChannels: AlertChannel[];
  escalationRules: EscalationRule[];
  suppressionRules: SuppressionRule[];
}

export interface AlertChannel {
  type: AlertChannelType;
  config: any;
  enabled: boolean;
}

export enum AlertChannelType {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  PAGER = 'pager'
}

export interface EscalationRule {
  condition: string;
  delay: number;
  action: EscalationAction;
  recipients: string[];
}

export enum EscalationAction {
  NOTIFY_TEAM_LEAD = 'notify_team_lead',
  NOTIFY_ADMIN = 'notify_admin',
  CREATE_INCIDENT = 'create_incident',
  TRIGGER_FAILOVER = 'trigger_failover'
}

export interface SuppressionRule {
  errorType: string;
  condition: string;
  duration: number;
  reason: string;
}

export interface ErrorDashboard {
  currentErrorRate: number;
  criticalErrors: number;
  recentErrors: ErrorSummary[];
  systemHealth: ComponentHealth[];
  recoveryMetrics: RecoveryMetrics;
  alertStatus: AlertStatus;
}

export interface ComponentHealth {
  component: string;
  status: HealthStatus;
  errorRate: number;
  lastError?: Date;
  uptime: number;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down'
}

export interface RecoveryMetrics {
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
  averageRecoveryTime: number;
  recoverySuccessRate: number;
}

export interface AlertStatus {
  activeAlerts: number;
  suppressedAlerts: number;
  recentAlerts: Alert[];
}

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface ErrorClassification {
  category: ErrorCategory;
  subcategory: string;
  severity: Severity;
  recoverable: boolean;
  userImpact: UserImpactLevel;
  systemImpact: SystemImpactLevel;
  confidence: number;
}

export enum ErrorCategory {
  TRANSLATION_ERROR = 'translation_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  DATA_ERROR = 'data_error',
  CONFIGURATION_ERROR = 'configuration_error'
}

export enum UserImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SystemImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  conditions: string[];
  commonContext: any;
  recoveryHistory: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  action: ErrorRecoveryAction;
  success: boolean;
  duration: number;
  timestamp: Date;
}

export interface RecoveryRecommendation {
  action: ErrorRecoveryAction;
  priority: Priority;
  description: string;
  expectedSuccessRate: number;
  estimatedTime: number;
  prerequisites: string[];
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel'
}

export interface ExportResult {
  format: ExportFormat;
  data: any;
  filename: string;
  size: number;
  generatedAt: Date;
}