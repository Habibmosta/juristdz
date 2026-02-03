/**
 * Error Recovery System Interface
 * 
 * Defines the contract for comprehensive error recovery strategies
 * including translation failure recovery, quality validation failure recovery,
 * and system error graceful degradation.
 * 
 * Requirements: 6.4, 6.5
 */

import {
  TranslationRequest,
  PureTranslationResult,
  TranslationError,
  SystemError,
  ErrorRecoveryAction,
  TranslationMethod,
  FallbackContent
} from '../types';

export interface IErrorRecoverySystem {
  /**
   * Recover from translation or system errors using comprehensive strategies
   * @param originalRequest The original translation request that failed
   * @param error The error that occurred
   * @param previousAttempts Previous recovery attempts to avoid loops
   * @returns Recovery result with success status and recovered content
   */
  recoverFromError(
    originalRequest: TranslationRequest,
    error: TranslationError | SystemError,
    previousAttempts?: RecoveryAttempt[]
  ): Promise<RecoveryResult>;

  /**
   * Get recovery system statistics and performance metrics
   * @returns Comprehensive recovery statistics
   */
  getRecoveryStatistics(): RecoveryStatistics;

  /**
   * Get current system health status for recovery capabilities
   * @returns System health assessment
   */
  getSystemHealth(): Promise<SystemHealthStatus>;

  /**
   * Test recovery strategies with simulated errors
   * @param errorType Type of error to simulate
   * @param request Test translation request
   * @returns Test results for recovery strategy
   */
  testRecoveryStrategy(
    errorType: string,
    request: TranslationRequest
  ): Promise<RecoveryTestResult>;

  /**
   * Configure recovery strategy parameters
   * @param strategyId Strategy to configure
   * @param config New configuration parameters
   */
  configureRecoveryStrategy(
    strategyId: string,
    config: RecoveryStrategyConfig
  ): Promise<boolean>;

  /**
   * Enable or disable specific recovery strategies
   * @param strategyId Strategy identifier
   * @param enabled Whether to enable or disable
   */
  setRecoveryStrategyEnabled(
    strategyId: string,
    enabled: boolean
  ): Promise<boolean>;

  /**
   * Get available recovery strategies and their status
   * @returns List of available recovery strategies
   */
  getAvailableStrategies(): Promise<RecoveryStrategyInfo[]>;

  /**
   * Force emergency recovery mode for critical system failures
   * @param request Original translation request
   * @returns Emergency recovery result
   */
  forceEmergencyRecovery(
    request: TranslationRequest
  ): Promise<RecoveryResult>;
}

export interface RecoveryResult {
  success: boolean;
  result?: PureTranslationResult;
  fallbackContent?: FallbackContent;
  action: ErrorRecoveryAction;
  processingTime: number;
  confidence: number;
  metadata: RecoveryMetadata;
  nextRecommendedAction?: ErrorRecoveryAction;
  escalationRequired?: boolean;
}

export interface RecoveryAttempt {
  strategy: string;
  action: ErrorRecoveryAction;
  timestamp: Date;
  success: boolean;
  processingTime: number;
  error?: string;
  confidence?: number;
  metadata?: any;
}

export interface RecoveryMetadata {
  strategyUsed: string;
  methodSwitched: boolean;
  fallbackTriggered: boolean;
  qualityDegraded: boolean;
  userNotified: boolean;
  escalated: boolean;
  systemState?: SystemState;
  recoveryPath?: string[];
  performanceImpact?: PerformanceImpact;
}

export interface SystemState {
  primaryTranslationAvailable: boolean;
  secondaryTranslationAvailable: boolean;
  fallbackGeneratorAvailable: boolean;
  validationSystemAvailable: boolean;
  cacheAvailable: boolean;
  networkConnectivity: boolean;
  systemLoad: number;
  errorRate: number;
  memoryUsage?: number;
  diskSpace?: number;
  activeConnections?: number;
}

export interface PerformanceImpact {
  additionalLatency: number;
  resourceUsage: number;
  qualityReduction: number;
  userExperienceImpact: 'none' | 'minimal' | 'moderate' | 'significant';
}

export interface RecoveryStatistics {
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  strategiesUsed: Map<string, number>;
  errorTypesRecovered: Map<string, number>;
  recoverySuccessRate: number;
  recentRecoveries: RecentRecoveryInfo[];
  performanceMetrics: RecoveryPerformanceMetrics;
}

export interface RecentRecoveryInfo {
  timestamp: Date;
  strategy: string;
  success: boolean;
  errorType: string;
  processingTime: number;
  confidence: number;
}

export interface RecoveryPerformanceMetrics {
  averageLatencyIncrease: number;
  resourceOverhead: number;
  qualityImpactAverage: number;
  userSatisfactionImpact: number;
  systemStabilityImpact: number;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'emergency';
  recoverySuccessRate: number;
  averageRecoveryTime: number;
  activeStrategies: number;
  recentFailures: number;
  systemCapacity: SystemCapacity;
  alertLevel: AlertLevel;
  recommendations: HealthRecommendation[];
}

export interface SystemCapacity {
  translationCapacity: number;
  recoveryCapacity: number;
  fallbackCapacity: number;
  overallCapacity: number;
  bottlenecks: string[];
}

export enum AlertLevel {
  GREEN = 'green',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  RED = 'red',
  CRITICAL = 'critical'
}

export interface HealthRecommendation {
  type: 'performance' | 'reliability' | 'capacity' | 'configuration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  estimatedImpact: string;
}

export interface RecoveryTestResult {
  strategyTested: string;
  errorTypeSimulated: string;
  success: boolean;
  processingTime: number;
  confidence: number;
  qualityMetrics: TestQualityMetrics;
  issues: string[];
  recommendations: string[];
}

export interface TestQualityMetrics {
  purityScore: number;
  accuracyScore: number;
  performanceScore: number;
  reliabilityScore: number;
  overallScore: number;
}

export interface RecoveryStrategyConfig {
  enabled: boolean;
  priority: number;
  maxAttempts: number;
  timeoutMs: number;
  applicableErrors: string[];
  parameters: Map<string, any>;
  conditions: RecoveryCondition[];
}

export interface RecoveryCondition {
  type: 'system_load' | 'error_rate' | 'time_of_day' | 'user_type' | 'content_type';
  operator: 'less_than' | 'greater_than' | 'equals' | 'not_equals' | 'in' | 'not_in';
  value: any;
  description: string;
}

export interface RecoveryStrategyInfo {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  applicableErrors: string[];
  successRate: number;
  averageProcessingTime: number;
  lastUsed?: Date;
  configuration: RecoveryStrategyConfig;
  healthStatus: StrategyHealthStatus;
}

export interface StrategyHealthStatus {
  status: 'healthy' | 'degraded' | 'failing' | 'disabled';
  recentSuccessRate: number;
  performanceMetrics: StrategyPerformanceMetrics;
  issues: StrategyIssue[];
  lastHealthCheck: Date;
}

export interface StrategyPerformanceMetrics {
  averageLatency: number;
  successRate: number;
  errorRate: number;
  resourceUsage: number;
  qualityImpact: number;
}

export interface StrategyIssue {
  type: 'performance' | 'reliability' | 'configuration' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  firstOccurred: Date;
  lastOccurred: Date;
  occurrenceCount: number;
  resolution?: string;
}

// Recovery Strategy Types
export enum RecoveryStrategyType {
  METHOD_SWITCHING = 'method_switching',
  QUALITY_VALIDATION_RECOVERY = 'quality_validation_recovery',
  INTELLIGENT_FALLBACK = 'intelligent_fallback',
  GRACEFUL_DEGRADATION = 'graceful_degradation',
  CACHE_RECOVERY = 'cache_recovery',
  EMERGENCY_RECOVERY = 'emergency_recovery'
}

export enum RecoveryTrigger {
  TRANSLATION_FAILED = 'translation_failed',
  QUALITY_VALIDATION_FAILED = 'quality_validation_failed',
  PURITY_VALIDATION_FAILED = 'purity_validation_failed',
  SYSTEM_ERROR = 'system_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  RESOURCE_EXHAUSTED = 'resource_exhausted'
}

export enum DegradationLevel {
  NONE = 'none',
  MINIMAL = 'minimal',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

// Recovery Context Types
export interface RecoveryContext {
  originalRequest: TranslationRequest;
  error: TranslationError | SystemError;
  previousAttempts: RecoveryAttempt[];
  currentAttempt: number;
  availableMethods: TranslationMethod[];
  systemState: SystemState;
  userContext?: UserContext;
  businessContext?: BusinessContext;
}

export interface UserContext {
  userId?: string;
  userType: 'anonymous' | 'registered' | 'premium' | 'admin';
  preferences: UserPreferences;
  sessionInfo: SessionInfo;
}

export interface UserPreferences {
  qualityOverSpeed: boolean;
  allowFallback: boolean;
  notificationLevel: 'none' | 'errors' | 'warnings' | 'all';
  maxWaitTime: number;
}

export interface SessionInfo {
  sessionId: string;
  startTime: Date;
  requestCount: number;
  errorCount: number;
  lastActivity: Date;
}

export interface BusinessContext {
  priority: 'low' | 'normal' | 'high' | 'critical';
  costConstraints: CostConstraints;
  qualityRequirements: QualityRequirements;
  complianceRequirements: string[];
}

export interface CostConstraints {
  maxProcessingTime: number;
  maxResourceUsage: number;
  budgetLimit?: number;
}

export interface QualityRequirements {
  minimumPurityScore: number;
  minimumConfidence: number;
  allowQualityDegradation: boolean;
  fallbackAcceptable: boolean;
}

// Event Types for Recovery Monitoring
export interface RecoveryEvent {
  type: RecoveryEventType;
  timestamp: Date;
  strategyId: string;
  success: boolean;
  processingTime: number;
  errorType: string;
  metadata: any;
}

export enum RecoveryEventType {
  RECOVERY_STARTED = 'recovery_started',
  RECOVERY_COMPLETED = 'recovery_completed',
  RECOVERY_FAILED = 'recovery_failed',
  STRATEGY_SWITCHED = 'strategy_switched',
  FALLBACK_TRIGGERED = 'fallback_triggered',
  EMERGENCY_MODE_ACTIVATED = 'emergency_mode_activated',
  SYSTEM_DEGRADED = 'system_degraded',
  RECOVERY_ESCALATED = 'recovery_escalated'
}