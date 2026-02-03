/**
 * Pure Translation System Integration
 * 
 * Unified system integration that connects all translation pipeline components
 * and provides end-to-end translation workflow with zero tolerance for language mixing.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  QualityReport,
  TranslationIssue,
  TranslationMetrics,
  PureTranslationSystemConfig,
  Language,
  ContentType,
  TranslationPriority
} from './types';

// Core Components
import { PureTranslationSystem } from './core/PureTranslationSystem';
import { TranslationGateway } from './core/TranslationGateway';
import { ContentCleaner } from './core/ContentCleaner';
import { AdvancedTranslationEngine } from './core/AdvancedTranslationEngine';
import { PurityValidationSystem } from './core/PurityValidationSystem';
import { LegalTerminologyManager } from './core/LegalTerminologyManager';
import { ErrorRecoverySystem } from './core/ErrorRecoverySystem';
import { FallbackContentGenerator } from './core/FallbackContentGenerator';

// Monitoring and Reporting
import { QualityMonitor } from './monitoring/QualityMonitor';
import { MetricsCollector } from './monitoring/MetricsCollector';
import { ErrorReporter } from './core/ErrorReporter';

// Feedback System
import { UserFeedbackSystem } from './feedback/UserFeedbackSystem';
import { FeedbackDrivenImprovementSystem } from './feedback/FeedbackDrivenImprovementSystem';

// Configuration
import { PureTranslationConfig } from './config/PureTranslationConfig';
import { defaultLogger } from './utils/Logger';

/**
 * Unified Pure Translation System Integration
 * 
 * This class orchestrates all components of the Pure Translation System
 * to provide a complete, zero-tolerance translation service.
 */
export class PureTranslationSystemIntegration {
  private pureTranslationSystem: PureTranslationSystem;
  private translationGateway: TranslationGateway;
  private userFeedbackSystem: UserFeedbackSystem;
  private feedbackImprovementSystem: FeedbackDrivenImprovementSystem;
  private config: PureTranslationConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<PureTranslationSystemConfig>) {
    this.config = new PureTranslationConfig();
    if (config) {
      this.config.updateConfig(config);
    }
    this.initializeSystem();
  }

  /**
   * Initialize the complete translation system
   */
  private initializeSystem(): void {
    try {
      defaultLogger.info('Initializing Pure Translation System Integration', {
        zeroTolerance: this.config.isZeroToleranceEnabled(),
        realTimeProcessing: this.config.isRealTimeProcessingEnabled(),
        monitoringEnabled: this.config.isMonitoringEnabled()
      }, 'PureTranslationSystemIntegration');

      // Initialize core components
      const contentCleaner = new ContentCleaner();
      const translationEngine = new AdvancedTranslationEngine();
      const purityValidator = new PurityValidationSystem();
      const terminologyManager = new LegalTerminologyManager();
      const qualityMonitor = new QualityMonitor();
      const errorReporter = new ErrorReporter();
      const metricsCollector = new MetricsCollector();
      const errorRecoverySystem = new ErrorRecoverySystem();
      const fallbackGenerator = new FallbackContentGenerator();

      // Initialize main system
      this.pureTranslationSystem = new PureTranslationSystem(
        contentCleaner,
        translationEngine,
        purityValidator,
        terminologyManager,
        qualityMonitor,
        errorReporter,
        metricsCollector,
        errorRecoverySystem,
        fallbackGenerator,
        this.config.getConfig()
      );

      // Initialize gateway
      this.translationGateway = new TranslationGateway();

      // Initialize feedback systems
      this.userFeedbackSystem = new UserFeedbackSystem();
      this.feedbackImprovementSystem = new FeedbackDrivenImprovementSystem();

      this.isInitialized = true;

      defaultLogger.info('Pure Translation System Integration initialized successfully', {
        components: [
          'PureTranslationSystem',
          'TranslationGateway',
          'UserFeedbackSystem',
          'FeedbackImprovementSystem'
        ]
      }, 'PureTranslationSystemIntegration');

    } catch (error) {
      defaultLogger.error('Failed to initialize Pure Translation System Integration', {
        error: error.message,
        stack: error.stack
      }, 'PureTranslationSystemIntegration');
      throw new Error(`System initialization failed: ${error.message}`);
    }
  }

  /**
   * Main translation method - unified entry point
   */
  async translateContent(request: TranslationRequest): Promise<PureTranslationResult> {
    this.ensureInitialized();

    try {
      // Validate request
      this.validateTranslationRequest(request);

      // Use the translation gateway for comprehensive processing
      const result = await this.translationGateway.translateText(request);

      // Validate result meets zero tolerance requirements
      if (this.config.isZeroToleranceEnabled() && result.purityScore < 100) {
        defaultLogger.warn('Translation result failed zero tolerance validation', {
          requestId: result.metadata.requestId,
          purityScore: result.purityScore,
          violations: result.warnings.length
        }, 'PureTranslationSystemIntegration');

        // Attempt recovery through main system
        return await this.pureTranslationSystem.translateContent(request);
      }

      return result;

    } catch (error) {
      defaultLogger.error('Translation failed in integration layer', {
        error: error.message,
        request: {
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          contentType: request.contentType,
          textLength: request.text.length
        }
      }, 'PureTranslationSystemIntegration');

      // Fallback to main system for error recovery
      return await this.pureTranslationSystem.translateContent(request);
    }
  }

  /**
   * Batch translation processing
   */
  async translateBatch(requests: TranslationRequest[]): Promise<PureTranslationResult[]> {
    this.ensureInitialized();

    const results: PureTranslationResult[] = [];
    const concurrentLimit = this.config.getConcurrentRequestLimit();

    // Process in batches to respect concurrent limits
    for (let i = 0; i < requests.length; i += concurrentLimit) {
      const batch = requests.slice(i, i + concurrentLimit);
      const batchResults = await Promise.all(
        batch.map(request => this.translateContent(request))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Real-time translation for immediate responses
   */
  async translateRealTime(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    userId?: string
  ): Promise<PureTranslationResult> {
    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
      contentType: ContentType.CHAT_MESSAGE,
      priority: TranslationPriority.REAL_TIME,
      userId,
      context: {
        userRole: 'user',
        previousTranslations: []
      }
    };

    return await this.translateContent(request);
  }

  /**
   * Legal document translation with enhanced terminology
   */
  async translateLegalDocument(
    text: string,
    sourceLanguage: Language,
    targetLanguage: Language,
    documentType: string,
    userId?: string
  ): Promise<PureTranslationResult> {
    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
      contentType: ContentType.LEGAL_DOCUMENT,
      priority: TranslationPriority.HIGH,
      userId,
      context: {
        documentType,
        jurisdiction: 'Algeria',
        userRole: 'legal_professional'
      }
    };

    return await this.translateContent(request);
  }

  /**
   * Validate translation quality
   */
  async validateTranslationQuality(
    text: string,
    targetLanguage: Language
  ): Promise<QualityReport> {
    this.ensureInitialized();
    return await this.pureTranslationSystem.validateTranslationQuality(text, targetLanguage);
  }

  /**
   * Report translation issues
   */
  async reportTranslationIssue(issue: TranslationIssue): Promise<void> {
    this.ensureInitialized();
    
    // Report to main system
    await this.pureTranslationSystem.reportTranslationIssue(issue);
    
    // Report to feedback system for improvement
    await this.userFeedbackSystem.reportIssue(issue);
    
    // Trigger improvement analysis
    await this.feedbackImprovementSystem.processUserFeedback({
      issueId: issue.id,
      userId: issue.userId,
      translationId: issue.translationId,
      feedbackType: 'issue_report',
      content: issue.description,
      severity: issue.severity,
      timestamp: issue.timestamp,
      metadata: {
        issueType: issue.issueType,
        originalText: issue.originalText,
        translatedText: issue.translatedText,
        expectedResult: issue.expectedResult
      }
    });
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(): Promise<TranslationMetrics> {
    this.ensureInitialized();
    return await this.pureTranslationSystem.getTranslationMetrics();
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    components: { [key: string]: boolean };
    metrics: {
      activeRequests: number;
      cacheSize: number;
      errorRate: number;
      averageResponseTime: number;
    };
    lastHealthCheck: Date;
  }> {
    this.ensureInitialized();

    try {
      const gatewayStatus = this.translationGateway.getSystemStatus();
      const errorRecoveryHealth = await this.pureTranslationSystem.getErrorRecoveryHealth();
      const metrics = await this.getSystemMetrics();

      return {
        status: gatewayStatus.status,
        components: {
          ...gatewayStatus.components,
          errorRecovery: errorRecoveryHealth.isHealthy,
          feedbackSystem: true,
          improvementSystem: true
        },
        metrics: {
          activeRequests: gatewayStatus.activeRequests,
          cacheSize: gatewayStatus.cacheSize,
          errorRate: (1 - metrics.purityRate) * 100,
          averageResponseTime: metrics.averageProcessingTime
        },
        lastHealthCheck: new Date()
      };

    } catch (error) {
      defaultLogger.error('Health check failed', { error: error.message }, 'PureTranslationSystemIntegration');
      
      return {
        status: 'critical',
        components: {},
        metrics: {
          activeRequests: 0,
          cacheSize: 0,
          errorRate: 100,
          averageResponseTime: 0
        },
        lastHealthCheck: new Date()
      };
    }
  }

  /**
   * Clear system cache
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized();
    this.translationGateway.clearCache();
    defaultLogger.info('System cache cleared', {}, 'PureTranslationSystemIntegration');
  }

  /**
   * Update system configuration
   */
  updateConfiguration(config: Partial<PureTranslationSystemConfig>): void {
    this.config.updateConfig(config);
    defaultLogger.info('System configuration updated', { config }, 'PureTranslationSystemIntegration');
  }

  /**
   * Shutdown system gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      defaultLogger.info('Shutting down Pure Translation System Integration', {}, 'PureTranslationSystemIntegration');

      // Wait for active requests to complete (with timeout)
      const shutdownTimeout = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (this.translationGateway.getActiveRequestsCount() > 0 && 
             (Date.now() - startTime) < shutdownTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Clear cache
      await this.clearCache();

      this.isInitialized = false;
      
      defaultLogger.info('Pure Translation System Integration shutdown complete', {}, 'PureTranslationSystemIntegration');

    } catch (error) {
      defaultLogger.error('Error during system shutdown', { error: error.message }, 'PureTranslationSystemIntegration');
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Pure Translation System Integration is not initialized');
    }
  }

  private validateTranslationRequest(request: TranslationRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Translation text cannot be empty');
    }

    if (!request.sourceLanguage || !request.targetLanguage) {
      throw new Error('Source and target languages must be specified');
    }

    if (request.sourceLanguage === request.targetLanguage) {
      throw new Error('Source and target languages cannot be the same');
    }

    if (request.text.length > this.config.getMaxTextLength()) {
      throw new Error(`Text length exceeds maximum limit of ${this.config.getMaxTextLength()} characters`);
    }
  }

  /**
   * Static factory method for easy instantiation
   */
  static create(config?: Partial<PureTranslationSystemConfig>): PureTranslationSystemIntegration {
    return new PureTranslationSystemIntegration(config);
  }

  /**
   * Static method to create with default configuration for production
   */
  static createProduction(): PureTranslationSystemIntegration {
    return new PureTranslationSystemIntegration({
      zeroToleranceEnabled: true,
      minimumPurityScore: 100,
      maxRetryAttempts: 3,
      fallbackEnabled: true,
      cachingEnabled: true,
      monitoringEnabled: true,
      realTimeProcessing: true,
      concurrentRequestLimit: 100,
      processingTimeout: 30000,
      qualityThresholds: {
        minimumPurityScore: 100,
        minimumConfidence: 0.8,
        maximumProcessingTime: 5000,
        terminologyAccuracyThreshold: 0.9,
        readabilityThreshold: 0.8
      },
      cleaningRules: {
        removeUIElements: true,
        removeCyrillicCharacters: true,
        removeEnglishFragments: true,
        normalizeEncoding: true,
        aggressiveCleaning: true,
        customPatterns: [
          'AUTO-TRANSLATE',
          'Pro',
          'V2',
          'Defined',
          'процедة'
        ]
      },
      terminologySettings: {
        useOfficialDictionary: true,
        allowUserContributions: false,
        validateConsistency: true,
        updateFrequency: 86400000, // 24 hours
        confidenceThreshold: 0.9
      }
    });
  }

  /**
   * Static method to create with development configuration
   */
  static createDevelopment(): PureTranslationSystemIntegration {
    return new PureTranslationSystemIntegration({
      zeroToleranceEnabled: false,
      minimumPurityScore: 80,
      maxRetryAttempts: 2,
      fallbackEnabled: true,
      cachingEnabled: false,
      monitoringEnabled: true,
      realTimeProcessing: false,
      concurrentRequestLimit: 10,
      processingTimeout: 10000,
      qualityThresholds: {
        minimumPurityScore: 80,
        minimumConfidence: 0.6,
        maximumProcessingTime: 10000,
        terminologyAccuracyThreshold: 0.7,
        readabilityThreshold: 0.6
      },
      cleaningRules: {
        removeUIElements: true,
        removeCyrillicCharacters: true,
        removeEnglishFragments: true,
        normalizeEncoding: true,
        aggressiveCleaning: false,
        customPatterns: []
      },
      terminologySettings: {
        useOfficialDictionary: true,
        allowUserContributions: true,
        validateConsistency: false,
        updateFrequency: 3600000, // 1 hour
        confidenceThreshold: 0.7
      }
    });
  }
}

// Export singleton instance for global use
export const pureTranslationSystemIntegration = PureTranslationSystemIntegration.createProduction();

// Export default instance
export default pureTranslationSystemIntegration;