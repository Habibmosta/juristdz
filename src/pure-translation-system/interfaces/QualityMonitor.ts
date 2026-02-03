/**
 * Quality Monitor Interface
 * 
 * Real-time quality monitoring system for comprehensive translation
 * quality tracking, alerting, and continuous improvement.
 */

import {
  TranslationMetrics,
  QualityReport,
  TranslationEvent,
  QualityAlert,
  PerformanceMetrics,
  Language
} from '../types';

export interface IQualityMonitor {
  /**
   * Monitor translation quality in real-time
   * @param translationId Translation to monitor
   * @param result Translation result to analyze
   */
  monitorTranslationQuality(translationId: string, result: any): Promise<void>;

  /**
   * Generate comprehensive quality metrics
   * @param timeRange Time range for metrics calculation
   * @returns Detailed translation metrics
   */
  generateQualityMetrics(timeRange?: TimeRange): Promise<TranslationMetrics>;

  /**
   * Create detailed quality report for specific translation
   * @param translationId Translation ID to report on
   * @returns Comprehensive quality report
   */
  generateQualityReport(translationId: string): Promise<QualityReport>;

  /**
   * Track quality trends over time
   * @param period Time period for trend analysis
   * @returns Quality trend analysis
   */
  trackQualityTrends(period: TimePeriod): Promise<QualityTrends>;

  /**
   * Set up quality alerts and thresholds
   * @param alertConfig Alert configuration
   */
  configureQualityAlerts(alertConfig: QualityAlertConfig): Promise<void>;

  /**
   * Get real-time quality dashboard data
   * @returns Current quality dashboard metrics
   */
  getQualityDashboard(): Promise<QualityDashboard>;

  /**
   * Monitor system performance metrics
   * @returns Current system performance metrics
   */
  getPerformanceMetrics(): Promise<PerformanceMetrics>;

  /**
   * Track user satisfaction and feedback
   * @param feedback User feedback data
   */
  trackUserSatisfaction(feedback: UserFeedback): Promise<void>;

  /**
   * Generate quality improvement recommendations
   * @returns Array of improvement recommendations
   */
  generateImprovementRecommendations(): Promise<QualityRecommendation[]>;

  /**
   * Export quality data for analysis
   * @param format Export format
   * @param timeRange Time range for export
   * @returns Exported quality data
   */
  exportQualityData(format: ExportFormat, timeRange: TimeRange): Promise<ExportResult>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export interface QualityTrends {
  period: TimePeriod;
  purityTrend: TrendData;
  performanceTrend: TrendData;
  userSatisfactionTrend: TrendData;
  errorRateTrend: TrendData;
  predictions: QualityPrediction[];
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
  DECLINING = 'declining',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export interface QualityPrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: Date;
  factors: string[];
}

export interface QualityAlertConfig {
  purityThreshold: number;
  performanceThreshold: number;
  errorRateThreshold: number;
  userSatisfactionThreshold: number;
  alertChannels: AlertChannel[];
  escalationRules: EscalationRule[];
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
  DASHBOARD = 'dashboard'
}

export interface EscalationRule {
  condition: string;
  delay: number;
  action: EscalationAction;
  recipients: string[];
}

export enum EscalationAction {
  NOTIFY_ADMIN = 'notify_admin',
  DISABLE_FEATURE = 'disable_feature',
  SWITCH_TO_FALLBACK = 'switch_to_fallback',
  INCREASE_MONITORING = 'increase_monitoring'
}

export interface QualityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  data: any;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export enum AlertType {
  PURITY_VIOLATION = 'purity_violation',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  HIGH_ERROR_RATE = 'high_error_rate',
  LOW_USER_SATISFACTION = 'low_user_satisfaction',
  SYSTEM_FAILURE = 'system_failure'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface QualityDashboard {
  currentPurityRate: number;
  averageProcessingTime: number;
  errorRate: number;
  userSatisfactionScore: number;
  activeAlerts: QualityAlert[];
  recentTrends: QualityTrends;
  systemHealth: SystemHealth;
  topIssues: IssuesSummary[];
}

export interface SystemHealth {
  overall: HealthStatus;
  components: Map<string, ComponentHealth>;
  lastHealthCheck: Date;
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down'
}

export interface ComponentHealth {
  status: HealthStatus;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  issues: string[];
}

export interface IssuesSummary {
  type: string;
  count: number;
  severity: AlertSeverity;
  trend: TrendDirection;
  examples: string[];
}

export interface UserFeedback {
  translationId: string;
  userId: string;
  rating: number;
  comment?: string;
  issueType?: string;
  timestamp: Date;
}

export interface QualityRecommendation {
  type: RecommendationType;
  priority: Priority;
  description: string;
  expectedImpact: number;
  implementationEffort: EffortLevel;
  timeline: string;
}

export enum RecommendationType {
  ALGORITHM_IMPROVEMENT = 'algorithm_improvement',
  TRAINING_DATA_UPDATE = 'training_data_update',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  USER_EXPERIENCE_ENHANCEMENT = 'user_experience_enhancement',
  MONITORING_ENHANCEMENT = 'monitoring_enhancement'
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum EffortLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf'
}

export interface ExportResult {
  format: ExportFormat;
  data: any;
  filename: string;
  size: number;
  generatedAt: Date;
}