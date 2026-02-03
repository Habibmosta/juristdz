/**
 * Metrics Collector Interface
 * 
 * Comprehensive metrics collection system for the Pure Translation System,
 * providing detailed analytics, performance monitoring, and business intelligence.
 */

import {
  TranslationMetrics,
  PerformanceMetrics,
  UserMetrics,
  SystemMetrics
} from '../types';

export interface IMetricsCollector {
  /**
   * Collect translation performance metrics
   * @param translationId Translation ID to collect metrics for
   * @param metrics Translation metrics data
   */
  collectTranslationMetrics(translationId: string, metrics: TranslationMetricsData): Promise<void>;

  /**
   * Collect system performance metrics
   * @param metrics System performance data
   */
  collectSystemMetrics(metrics: SystemPerformanceData): Promise<void>;

  /**
   * Collect user interaction metrics
   * @param userId User ID
   * @param metrics User interaction data
   */
  collectUserMetrics(userId: string, metrics: UserInteractionData): Promise<void>;

  /**
   * Collect business metrics for analytics
   * @param metrics Business metrics data
   */
  collectBusinessMetrics(metrics: BusinessMetricsData): Promise<void>;

  /**
   * Get aggregated metrics for time period
   * @param timeRange Time range for metrics
   * @param aggregationType Type of aggregation
   * @returns Aggregated metrics
   */
  getAggregatedMetrics(
    timeRange: TimeRange, 
    aggregationType: AggregationType
  ): Promise<AggregatedMetrics>;

  /**
   * Generate real-time metrics dashboard
   * @returns Real-time dashboard data
   */
  generateRealTimeDashboard(): Promise<RealTimeDashboard>;

  /**
   * Create custom metrics report
   * @param reportConfig Report configuration
   * @returns Custom metrics report
   */
  generateCustomReport(reportConfig: ReportConfig): Promise<MetricsReport>;

  /**
   * Set up metrics alerts and thresholds
   * @param alertConfig Alert configuration
   */
  configureMetricsAlerts(alertConfig: MetricsAlertConfig): Promise<void>;

  /**
   * Export metrics data for external analysis
   * @param exportConfig Export configuration
   * @returns Exported metrics data
   */
  exportMetrics(exportConfig: ExportConfig): Promise<ExportResult>;

  /**
   * Get metrics statistics and summaries
   * @param period Time period for statistics
   * @returns Metrics statistics
   */
  getMetricsStatistics(period: TimePeriod): Promise<MetricsStatistics>;
}

export interface TranslationMetricsData {
  processingTime: number;
  purityScore: number;
  qualityScore: number;
  method: string;
  sourceLanguage: string;
  targetLanguage: string;
  contentType: string;
  textLength: number;
  confidence: number;
  fallbackUsed: boolean;
  cacheHit: boolean;
  errors: string[];
  warnings: string[];
}

export interface SystemPerformanceData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  activeConnections: number;
  queueSize: number;
}

export interface UserInteractionData {
  sessionDuration: number;
  translationsRequested: number;
  feedbackProvided: boolean;
  satisfactionRating?: number;
  featuresUsed: string[];
  errorEncountered: boolean;
  language: string;
  userAgent: string;
  location?: string;
}

export interface BusinessMetricsData {
  revenue: number;
  userAcquisition: number;
  userRetention: number;
  conversionRate: number;
  churnRate: number;
  averageSessionValue: number;
  costPerTranslation: number;
  profitMargin: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  MEDIAN = 'median',
  PERCENTILE_95 = 'percentile_95',
  PERCENTILE_99 = 'percentile_99'
}

export interface AggregatedMetrics {
  timeRange: TimeRange;
  aggregationType: AggregationType;
  translationMetrics: AggregatedTranslationMetrics;
  systemMetrics: AggregatedSystemMetrics;
  userMetrics: AggregatedUserMetrics;
  businessMetrics: AggregatedBusinessMetrics;
}

export interface AggregatedTranslationMetrics {
  totalTranslations: number;
  averageProcessingTime: number;
  averagePurityScore: number;
  averageQualityScore: number;
  purityRate: number;
  errorRate: number;
  fallbackRate: number;
  cacheHitRate: number;
  methodDistribution: Map<string, number>;
  languageDistribution: Map<string, number>;
}

export interface AggregatedSystemMetrics {
  averageCpuUsage: number;
  averageMemoryUsage: number;
  averageResponseTime: number;
  totalThroughput: number;
  uptime: number;
  errorRate: number;
  peakLoad: number;
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  cpu: UtilizationStats;
  memory: UtilizationStats;
  disk: UtilizationStats;
  network: UtilizationStats;
}

export interface UtilizationStats {
  average: number;
  peak: number;
  minimum: number;
  trend: TrendDirection;
}

export enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

export interface AggregatedUserMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionDuration: number;
  averageTranslationsPerUser: number;
  userSatisfactionScore: number;
  retentionRate: number;
  engagementScore: number;
  geographicDistribution: Map<string, number>;
}

export interface AggregatedBusinessMetrics {
  totalRevenue: number;
  averageRevenuePerUser: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  conversionRate: number;
  churnRate: number;
  profitMargin: number;
  growthRate: number;
}

export interface RealTimeDashboard {
  currentMetrics: CurrentMetrics;
  alerts: MetricsAlert[];
  trends: TrendSummary[];
  topPerformers: PerformanceSummary[];
  systemHealth: SystemHealthSummary;
  lastUpdated: Date;
}

export interface CurrentMetrics {
  translationsPerMinute: number;
  averageResponseTime: number;
  currentPurityRate: number;
  activeUsers: number;
  systemLoad: number;
  errorRate: number;
}

export interface MetricsAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
}

export enum AlertType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  THRESHOLD_BELOW = 'threshold_below',
  ANOMALY_DETECTED = 'anomaly_detected',
  TREND_ALERT = 'trend_alert'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface TrendSummary {
  metric: string;
  direction: TrendDirection;
  changePercentage: number;
  significance: number;
  period: TimePeriod;
}

export enum TimePeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export interface PerformanceSummary {
  category: string;
  metric: string;
  value: number;
  rank: number;
  improvement: number;
}

export interface SystemHealthSummary {
  overall: HealthStatus;
  components: ComponentHealth[];
  issues: HealthIssue[];
}

export enum HealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  metrics: Map<string, number>;
  lastCheck: Date;
}

export interface HealthIssue {
  component: string;
  issue: string;
  severity: AlertSeverity;
  impact: string;
}

export interface ReportConfig {
  name: string;
  timeRange: TimeRange;
  metrics: string[];
  aggregations: AggregationType[];
  filters: ReportFilter[];
  groupBy: string[];
  format: ReportFormat;
}

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not_in'
}

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  HTML = 'html'
}

export interface MetricsReport {
  name: string;
  generatedAt: Date;
  timeRange: TimeRange;
  data: any;
  summary: ReportSummary;
  visualizations: Visualization[];
}

export interface ReportSummary {
  totalRecords: number;
  keyInsights: string[];
  recommendations: string[];
  anomalies: Anomaly[];
}

export interface Visualization {
  type: VisualizationType;
  title: string;
  data: any;
  config: any;
}

export enum VisualizationType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  HEATMAP = 'heatmap',
  SCATTER_PLOT = 'scatter_plot',
  TABLE = 'table'
}

export interface Anomaly {
  metric: string;
  timestamp: Date;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: AlertSeverity;
}

export interface MetricsAlertConfig {
  thresholds: Map<string, ThresholdConfig>;
  anomalyDetection: AnomalyDetectionConfig;
  alertChannels: AlertChannel[];
  suppressionRules: SuppressionRule[];
}

export interface ThresholdConfig {
  metric: string;
  upperThreshold?: number;
  lowerThreshold?: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  sensitivity: number;
  algorithms: AnomalyAlgorithm[];
  minimumDataPoints: number;
}

export enum AnomalyAlgorithm {
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  SEASONAL = 'seasonal',
  TREND_BASED = 'trend_based'
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
  SMS = 'sms'
}

export interface SuppressionRule {
  metric: string;
  condition: string;
  duration: number;
  reason: string;
}

export interface ExportConfig {
  timeRange: TimeRange;
  metrics: string[];
  format: ExportFormat;
  compression: boolean;
  includeMetadata: boolean;
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PARQUET = 'parquet',
  AVRO = 'avro'
}

export interface ExportResult {
  filename: string;
  format: ExportFormat;
  size: number;
  recordCount: number;
  generatedAt: Date;
  downloadUrl: string;
}

export interface MetricsStatistics {
  period: TimePeriod;
  totalDataPoints: number;
  metricsCollected: string[];
  dataQuality: DataQualityMetrics;
  storageUsage: StorageMetrics;
  processingStats: ProcessingStats;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
}

export interface StorageMetrics {
  totalSize: number;
  compressionRatio: number;
  retentionCompliance: number;
  archivalRate: number;
}

export interface ProcessingStats {
  averageIngestionTime: number;
  processingLatency: number;
  throughput: number;
  errorRate: number;
}