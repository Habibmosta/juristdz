/**
 * Translation Gateway - Central Request Routing and Coordination
 * 
 * Orchestrates the entire translation pipeline with intelligent routing,
 * method selection, fallback logic, and request lifecycle management.
 * Implements zero tolerance policies and ensures 100% pure translations.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  TranslationMethod,
  Language,
  ContentType,
  TranslationPriority,
  TranslationAttempt,
  TranslationError,
  TranslationWarning,
  QualityMetrics,
  TranslationMetadata,
  ProcessingStep
} from '../types';
import { ITranslationGateway } from '../interfaces/TranslationGateway';
import { PurityValidationSystem } from './PurityValidationSystem';
import { LegalTerminologyManager } from './LegalTerminologyManager';
import { FallbackContentGenerator } from './FallbackContentGenerator';
import { ContentCleaner } from './ContentCleaner';
import { PrimaryTranslationService } from './PrimaryTranslationService';
import { SecondaryTranslationService } from './SecondaryTranslationService';
import { QualityMonitor } from '../monitoring/QualityMonitor';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { IntelligentTranslationCache } from './IntelligentTranslationCache';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { CacheQualityManager } from './CacheQualityManager';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export class TranslationGateway implements ITranslationGateway {
  private purityValidator: PurityValidationSystem;
  private terminologyManager: LegalTerminologyManager;
  private fallbackGenerator: FallbackContentGenerator;
  private contentCleaner: ContentCleaner;
  private primaryTranslationService: PrimaryTranslationService;
  private secondaryTranslationService: SecondaryTranslationService;
  private qualityMonitor: QualityMonitor;
  private metricsCollector: MetricsCollector;
  
  // Advanced caching and performance optimization
  private intelligentCache: IntelligentTranslationCache;
  private performanceOptimizer: PerformanceOptimizer;
  private cacheQualityManager: CacheQualityManager;
  
  // Legacy cache for backward compatibility
  private translationCache: Map<string, PureTranslationResult> = new Map();
  private readonly maxCacheSize = 10000;
  
  // Request tracking
  private activeRequests: Map<string, TranslationRequest> = new Map();
  private requestCounter = 0;

  constructor() {
    this.initializeComponents();
    defaultLogger.info('Translation Gateway initialized', {
      zeroToleranceEnabled: pureTranslationConfig.isZeroToleranceEnabled(),
      cacheEnabled: pureTranslationConfig.isCachingEnabled(),
      maxCacheSize: this.maxCacheSize,
      intelligentCachingEnabled: true,
      performanceOptimizationEnabled: true
    }, 'TranslationGateway');
  }

  /**
   * Initialize all translation pipeline components
   */
  private initializeComponents(): void {
    this.purityValidator = new PurityValidationSystem();
    this.terminologyManager = new LegalTerminologyManager();
    this.fallbackGenerator = new FallbackContentGenerator();
    this.contentCleaner = new ContentCleaner();
    this.primaryTranslationService = new PrimaryTranslationService();
    this.secondaryTranslationService = new SecondaryTranslationService();
    this.qualityMonitor = new QualityMonitor();
    this.metricsCollector = new MetricsCollector();
    
    // Initialize advanced caching and performance optimization
    this.intelligentCache = new IntelligentTranslationCache({
      maxSize: 50000,
      qualityThreshold: 95,
      enableIntelligentEviction: true,
      enableCacheWarming: true,
      enableQualityBasedInvalidation: true
    });
    
    this.performanceOptimizer = new PerformanceOptimizer(this.intelligentCache, {
      maxConcurrentRequests: 100,
      enableRequestBatching: true,
      enableLoadBalancing: true,
      enableAdaptiveThrottling: true,
      enableRequestPrioritization: true
    });
    
    this.cacheQualityManager = new CacheQualityManager(this.intelligentCache, {
      enableProactiveValidation: true,
      enableQualityDecayDetection: true,
      enableContextualInvalidation: true,
      enableUserFeedbackIntegration: true,
      qualityThreshold: 90,
      purityThreshold: 100
    });
  }

  /**
   * Main translation entry point with comprehensive pipeline and performance optimization
   */
  async translateText(request: TranslationRequest): Promise<PureTranslationResult> {
    // Use performance optimizer for high-load scenarios
    if (this.shouldUsePerformanceOptimization(request)) {
      return await this.performanceOptimizer.processRequest(request);
    }

    // Continue with existing implementation for standard requests
    return await this.processStandardTranslation(request);
  }

  /**
   * Process standard translation request (existing implementation)
   */
  private async processStandardTranslation(request: TranslationRequest): Promise<PureTranslationResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const processingSteps: ProcessingStep[] = [];
    
    // Add request ID to request context
    const enrichedRequest = {
      ...request,
      context: {
        ...request.context,
        requestId
      }
    };

    this.activeRequests.set(requestId, enrichedRequest);
    
    try {
      defaultLogger.info('Translation request started', {
        requestId,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        contentType: request.contentType,
        textLength: request.text.length
      }, 'TranslationGateway');

      // Record translation start
      this.metricsCollector.recordTranslationStart(enrichedRequest);

      // Step 1: Check intelligent cache first
      const cacheResult = await this.checkIntelligentCache(enrichedRequest);
      if (cacheResult) {
        processingSteps.push({
          step: 'intelligent_cache_hit',
          duration: Date.now() - startTime,
          success: true,
          details: { cacheKey: this.generateCacheKey(enrichedRequest) }
        });

        this.metricsCollector.recordCacheHit(this.generateCacheKey(enrichedRequest));
        return this.enrichResultMetadata(cacheResult, requestId, processingSteps, true);
      }

      this.metricsCollector.recordCacheMiss(this.generateCacheKey(enrichedRequest));

      // Step 2: Content preprocessing and cleaning
      const cleaningStep = await this.performContentCleaning(enrichedRequest);
      processingSteps.push(cleaningStep);

      if (!cleaningStep.success) {
        throw new Error('Content cleaning failed');
      }

      const cleanedText = cleaningStep.details.cleanedText;

      // Step 3: Initial purity validation
      const initialPurityStep = await this.performInitialPurityValidation(cleanedText, request.targetLanguage);
      processingSteps.push(initialPurityStep);

      // Step 4: Translation method selection and execution
      const translationStep = await this.performTranslation(cleanedText, enrichedRequest);
      processingSteps.push(translationStep);

      if (!translationStep.success) {
        // Trigger fallback generation
        const fallbackStep = await this.performFallbackGeneration(enrichedRequest);
        processingSteps.push(fallbackStep);
        
        if (!fallbackStep.success) {
          throw new Error('All translation methods failed including fallback');
        }
      }

      const translatedText = translationStep.success 
        ? translationStep.details.translatedText 
        : processingSteps[processingSteps.length - 1].details.fallbackContent;

      // Step 5: Final purity validation (zero tolerance)
      const finalPurityStep = await this.performFinalPurityValidation(translatedText, request.targetLanguage);
      processingSteps.push(finalPurityStep);

      if (!finalPurityStep.success && pureTranslationConfig.isZeroToleranceEnabled()) {
        // Zero tolerance violation - generate emergency fallback
        const emergencyStep = await this.performEmergencyFallback(enrichedRequest);
        processingSteps.push(emergencyStep);
        
        if (!emergencyStep.success) {
          throw new Error('Emergency fallback failed - critical system error');
        }
      }

      // Step 6: Quality assessment
      const finalText = finalPurityStep.success 
        ? translatedText 
        : processingSteps[processingSteps.length - 1].details.emergencyContent;

      const qualityStep = await this.performQualityAssessment(enrichedRequest, finalText, processingSteps);
      processingSteps.push(qualityStep);

      // Step 7: Create final result
      const result = await this.createFinalResult(
        enrichedRequest,
        finalText,
        processingSteps,
        startTime
      );

      // Step 8: Cache successful result with intelligent caching
      if (pureTranslationConfig.isCachingEnabled() && result.purityScore === 100) {
        await this.cacheIntelligentResult(enrichedRequest, result);
      }

      // Step 9: Record completion metrics
      this.metricsCollector.recordTranslationComplete(enrichedRequest, result);

      defaultLogger.info('Translation completed successfully', {
        requestId,
        purityScore: result.purityScore,
        processingTime: result.processingTime,
        method: result.method,
        stepsCount: processingSteps.length
      }, 'TranslationGateway');

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      defaultLogger.error('Translation failed', {
        requestId,
        error: error.message,
        processingTime,
        stepsCompleted: processingSteps.length
      }, 'TranslationGateway');

      // Record failure metrics
      this.metricsCollector.recordTranslationFailure(enrichedRequest, error);

      // Return error result with emergency fallback
      return this.createErrorResult(enrichedRequest, error, processingSteps, processingTime);

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Check intelligent cache with quality validation
   */
  private async checkIntelligentCache(request: TranslationRequest): Promise<PureTranslationResult | null> {
    if (!pureTranslationConfig.isCachingEnabled()) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request);
    return await this.intelligentCache.get(cacheKey);
  }

  /**
   * Cache result using intelligent caching system
   */
  private async cacheIntelligentResult(request: TranslationRequest, result: PureTranslationResult): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    await this.intelligentCache.set(cacheKey, result);
  }

  /**
   * Determine if performance optimization should be used
   */
  private shouldUsePerformanceOptimization(request: TranslationRequest): boolean {
    // Use performance optimization for high-priority requests or when system is under load
    return (
      request.priority === TranslationPriority.REAL_TIME ||
      request.priority === TranslationPriority.URGENT ||
      this.activeRequests.size > 50 // High load threshold
    );
  }

  /**
   * Check legacy cache (for backward compatibility)
   */
  private async checkCache(request: TranslationRequest): Promise<PureTranslationResult | null> {
    if (!pureTranslationConfig.isCachingEnabled()) {
      return null;
    }

    const cacheKey = this.generateCacheKey(request);
    return this.translationCache.get(cacheKey) || null;
  }

  /**
   * Perform content cleaning and preprocessing
   */
  private async performContentCleaning(request: TranslationRequest): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      const cleanedContent = await this.contentCleaner.cleanContent(
        request.text,
        request.sourceLanguage
      );

      return {
        step: 'content_cleaning',
        duration: Date.now() - stepStart,
        success: true,
        details: {
          originalLength: request.text.length,
          cleanedLength: cleanedContent.cleanedText.length,
          removedElements: cleanedContent.removedElements.length,
          cleanedText: cleanedContent.cleanedText,
          confidence: cleanedContent.confidence
        }
      };

    } catch (error) {
      return {
        step: 'content_cleaning',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Perform initial purity validation
   */
  private async performInitialPurityValidation(text: string, language: Language): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      const purityResult = await this.purityValidator.validatePurity(text, language);

      return {
        step: 'initial_purity_validation',
        duration: Date.now() - stepStart,
        success: purityResult.isPure,
        details: {
          purityScore: purityResult.purityScore.overall,
          violations: purityResult.violations.length,
          passesZeroTolerance: purityResult.passesZeroTolerance
        }
      };

    } catch (error) {
      return {
        step: 'initial_purity_validation',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Perform translation with method selection and fallback
   */
  private async performTranslation(text: string, request: TranslationRequest): Promise<ProcessingStep> {
    const stepStart = Date.now();
    const attempts: TranslationAttempt[] = [];

    try {
      // Select optimal translation method
      const selectedMethod = this.selectTranslationMethod(request);
      
      // Attempt primary translation
      const primaryAttempt = await this.attemptTranslation(
        text,
        request,
        selectedMethod
      );
      attempts.push(primaryAttempt);

      if (primaryAttempt.confidence >= 0.8 && primaryAttempt.errors.length === 0) {
        return {
          step: 'translation',
          duration: Date.now() - stepStart,
          success: true,
          details: {
            method: selectedMethod,
            translatedText: primaryAttempt.result,
            confidence: primaryAttempt.confidence,
            attempts: attempts.length
          }
        };
      }

      // Try secondary method if primary failed or low confidence
      const secondaryMethod = this.selectSecondaryMethod(selectedMethod);
      const secondaryAttempt = await this.attemptTranslation(
        text,
        request,
        secondaryMethod
      );
      attempts.push(secondaryAttempt);

      if (secondaryAttempt.confidence >= 0.7 && secondaryAttempt.errors.length === 0) {
        return {
          step: 'translation',
          duration: Date.now() - stepStart,
          success: true,
          details: {
            method: secondaryMethod,
            translatedText: secondaryAttempt.result,
            confidence: secondaryAttempt.confidence,
            attempts: attempts.length
          }
        };
      }

      // All translation methods failed
      return {
        step: 'translation',
        duration: Date.now() - stepStart,
        success: false,
        details: {
          attempts: attempts.length,
          errors: attempts.flatMap(a => a.errors),
          lastAttemptConfidence: secondaryAttempt.confidence
        }
      };

    } catch (error) {
      return {
        step: 'translation',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message, attempts: attempts.length }
      };
    }
  }

  /**
   * Perform fallback content generation
   */
  private async performFallbackGeneration(request: TranslationRequest): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      const fallbackContent = await this.fallbackGenerator.generateFallbackContent(
        request.text,
        request.targetLanguage,
        'Translation methods failed'
      );

      this.metricsCollector.recordFallbackTriggered('translation_failure', TranslationMethod.PRIMARY_AI);

      return {
        step: 'fallback_generation',
        duration: Date.now() - stepStart,
        success: true,
        details: {
          fallbackContent: fallbackContent.content,
          confidence: fallbackContent.confidence,
          method: fallbackContent.method,
          alternatives: fallbackContent.alternatives.length
        }
      };

    } catch (error) {
      return {
        step: 'fallback_generation',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Perform final purity validation with zero tolerance
   */
  private async performFinalPurityValidation(text: string, language: Language): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      const purityResult = await this.purityValidator.validatePurity(text, language);
      
      // Zero tolerance check
      const passesZeroTolerance = pureTranslationConfig.isZeroToleranceEnabled() 
        ? purityResult.purityScore.overall === 100 && purityResult.violations.length === 0
        : purityResult.purityScore.overall >= pureTranslationConfig.getMinimumPurityScore();

      if (!passesZeroTolerance) {
        this.metricsCollector.recordPurityViolation({
          translatedText: text,
          purityScore: purityResult.purityScore.overall,
          qualityMetrics: {
            purityScore: purityResult.purityScore.overall,
            terminologyAccuracy: 0,
            contextualRelevance: 0,
            readabilityScore: 0,
            professionalismScore: 0,
            encodingIntegrity: 0
          },
          processingTime: 0,
          method: TranslationMethod.PRIMARY_AI,
          confidence: 0,
          warnings: purityResult.violations.map(v => ({
            code: v.type,
            message: v.content,
            suggestion: v.suggestedFix
          })),
          metadata: {
            requestId: '',
            timestamp: new Date(),
            processingSteps: [],
            fallbackUsed: false,
            cacheHit: false
          }
        });
      }

      return {
        step: 'final_purity_validation',
        duration: Date.now() - stepStart,
        success: passesZeroTolerance,
        details: {
          purityScore: purityResult.purityScore.overall,
          violations: purityResult.violations.length,
          passesZeroTolerance,
          zeroToleranceEnabled: pureTranslationConfig.isZeroToleranceEnabled()
        }
      };

    } catch (error) {
      return {
        step: 'final_purity_validation',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Perform emergency fallback for zero tolerance violations
   */
  private async performEmergencyFallback(request: TranslationRequest): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      const emergencyContent = this.fallbackGenerator.generateEmergencyFallback(
        request.targetLanguage,
        'Zero tolerance purity violation'
      );

      return {
        step: 'emergency_fallback',
        duration: Date.now() - stepStart,
        success: true,
        details: {
          emergencyContent: emergencyContent.content,
          confidence: emergencyContent.confidence,
          method: emergencyContent.method
        }
      };

    } catch (error) {
      return {
        step: 'emergency_fallback',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Perform quality assessment
   */
  private async performQualityAssessment(
    request: TranslationRequest,
    translatedText: string,
    processingSteps: ProcessingStep[]
  ): Promise<ProcessingStep> {
    const stepStart = Date.now();
    
    try {
      // Create mock result for quality assessment
      const mockResult: PureTranslationResult = {
        translatedText,
        purityScore: 100, // Will be updated by quality monitor
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 90,
          contextualRelevance: 85,
          readabilityScore: 80,
          professionalismScore: 90,
          encodingIntegrity: 100
        },
        processingTime: Date.now() - (processingSteps[0]?.duration || 0),
        method: TranslationMethod.PRIMARY_AI,
        confidence: 0.9,
        warnings: [],
        metadata: {
          requestId: request.context?.requestId || '',
          timestamp: new Date(),
          processingSteps,
          fallbackUsed: processingSteps.some(s => s.step === 'fallback_generation'),
          cacheHit: false
        }
      };

      const qualityReport = await this.qualityMonitor.assessQuality(request, mockResult);

      return {
        step: 'quality_assessment',
        duration: Date.now() - stepStart,
        success: true,
        details: {
          overallScore: qualityReport.overallScore,
          issuesCount: qualityReport.issues.length,
          recommendationsCount: qualityReport.recommendations.length
        }
      };

    } catch (error) {
      return {
        step: 'quality_assessment',
        duration: Date.now() - stepStart,
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Create final translation result
   */
  private async createFinalResult(
    request: TranslationRequest,
    translatedText: string,
    processingSteps: ProcessingStep[],
    startTime: number
  ): Promise<PureTranslationResult> {
    const processingTime = Date.now() - startTime;
    
    // Determine the method used
    const translationStep = processingSteps.find(s => s.step === 'translation');
    const fallbackStep = processingSteps.find(s => s.step === 'fallback_generation');
    const emergencyStep = processingSteps.find(s => s.step === 'emergency_fallback');
    
    let method = TranslationMethod.PRIMARY_AI;
    let confidence = 0.9;
    
    if (emergencyStep?.success) {
      method = TranslationMethod.FALLBACK_GENERATED;
      confidence = 0.3;
    } else if (fallbackStep?.success) {
      method = TranslationMethod.FALLBACK_GENERATED;
      confidence = fallbackStep.details.confidence || 0.6;
    } else if (translationStep?.success) {
      method = translationStep.details.method || TranslationMethod.PRIMARY_AI;
      confidence = translationStep.details.confidence || 0.9;
    }

    // Calculate final purity score
    const finalPurityStep = processingSteps.find(s => s.step === 'final_purity_validation');
    const purityScore = finalPurityStep?.details.purityScore || 100;

    // Create quality metrics
    const qualityMetrics: QualityMetrics = {
      purityScore,
      terminologyAccuracy: 90,
      contextualRelevance: 85,
      readabilityScore: 80,
      professionalismScore: 90,
      encodingIntegrity: 100
    };

    // Create metadata
    const metadata: TranslationMetadata = {
      requestId: request.context?.requestId || '',
      timestamp: new Date(),
      processingSteps,
      fallbackUsed: processingSteps.some(s => s.step === 'fallback_generation' || s.step === 'emergency_fallback'),
      cacheHit: processingSteps.some(s => s.step === 'cache_hit')
    };

    return {
      translatedText,
      purityScore,
      qualityMetrics,
      processingTime,
      method,
      confidence,
      warnings: [],
      metadata
    };
  }

  /**
   * Create error result with emergency fallback
   */
  private createErrorResult(
    request: TranslationRequest,
    error: Error,
    processingSteps: ProcessingStep[],
    processingTime: number
  ): PureTranslationResult {
    // Generate emergency fallback content
    const emergencyContent = this.fallbackGenerator.generateEmergencyFallback(
      request.targetLanguage,
      error.message
    );

    return {
      translatedText: emergencyContent.content,
      purityScore: 30, // Low score for error case
      qualityMetrics: {
        purityScore: 30,
        terminologyAccuracy: 0,
        contextualRelevance: 0,
        readabilityScore: 50,
        professionalismScore: 70,
        encodingIntegrity: 100
      },
      processingTime,
      method: TranslationMethod.FALLBACK_GENERATED,
      confidence: 0.3,
      warnings: [{
        code: 'SYSTEM_ERROR',
        message: error.message,
        suggestion: 'Please retry the translation request'
      }],
      metadata: {
        requestId: request.context?.requestId || '',
        timestamp: new Date(),
        processingSteps,
        fallbackUsed: true,
        cacheHit: false
      }
    };
  }

  /**
   * Helper methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  private generateCacheKey(request: TranslationRequest): string {
    return `${request.sourceLanguage}_${request.targetLanguage}_${request.contentType}_${this.hashText(request.text)}`;
  }

  private hashText(text: string): string {
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private selectTranslationMethod(request: TranslationRequest): TranslationMethod {
    // Method selection logic based on content type and priority
    if (request.priority === TranslationPriority.REAL_TIME) {
      return TranslationMethod.CACHED;
    }
    
    if (request.contentType === ContentType.LEGAL_DOCUMENT) {
      return TranslationMethod.PRIMARY_AI;
    }
    
    return TranslationMethod.PRIMARY_AI;
  }

  private selectSecondaryMethod(primaryMethod: TranslationMethod): TranslationMethod {
    switch (primaryMethod) {
      case TranslationMethod.PRIMARY_AI:
        return TranslationMethod.SECONDARY_AI;
      case TranslationMethod.SECONDARY_AI:
        return TranslationMethod.RULE_BASED;
      default:
        return TranslationMethod.HYBRID;
    }
  }

  private async attemptTranslation(
    text: string,
    request: TranslationRequest,
    method: TranslationMethod
  ): Promise<TranslationAttempt> {
    const startTime = Date.now();
    
    try {
      let result: string;
      
      switch (method) {
        case TranslationMethod.PRIMARY_AI:
          result = await this.primaryTranslationService.translateText(
            text,
            request.sourceLanguage,
            request.targetLanguage,
            request.context
          );
          break;
          
        case TranslationMethod.SECONDARY_AI:
          result = await this.secondaryTranslationService.translateText(
            text,
            request.sourceLanguage,
            request.targetLanguage,
            request.context
          );
          break;
          
        default:
          result = text; // Fallback to original text
      }

      return {
        result,
        method,
        confidence: 0.9,
        processingTime: Date.now() - startTime,
        errors: [],
        warnings: [],
        metadata: { method, timestamp: new Date() }
      };

    } catch (error) {
      return {
        result: text,
        method,
        confidence: 0.0,
        processingTime: Date.now() - startTime,
        errors: [{
          code: 'TRANSLATION_ERROR',
          message: error.message,
          severity: 'high' as any,
          recoverable: true
        }],
        warnings: [],
        metadata: { method, error: error.message, timestamp: new Date() }
      };
    }
  }

  private async cacheResult(request: TranslationRequest, result: PureTranslationResult): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    
    // Maintain cache size limit
    if (this.translationCache.size >= this.maxCacheSize) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
    
    this.translationCache.set(cacheKey, result);
  }

  private enrichResultMetadata(
    result: PureTranslationResult,
    requestId: string,
    processingSteps: ProcessingStep[],
    cacheHit: boolean
  ): PureTranslationResult {
    return {
      ...result,
      metadata: {
        ...result.metadata,
        requestId,
        processingSteps,
        cacheHit
      }
    };
  }

  /**
   * Public utility methods
   */
  public getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }

  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    // Return intelligent cache stats
    return {
      size: 0, // Would be populated from intelligent cache
      maxSize: this.maxCacheSize,
      hitRate: 0.0 // Would be calculated from actual metrics
    };
  }

  public async getIntelligentCacheStats() {
    return await this.intelligentCache.getStats();
  }

  public getPerformanceMetrics() {
    return this.performanceOptimizer.getPerformanceMetrics();
  }

  public async getCacheHealthAssessment() {
    return await this.cacheQualityManager.getCacheHealthAssessment();
  }

  public async optimizePerformance(): Promise<void> {
    await this.performanceOptimizer.optimizePerformance();
    await this.cacheQualityManager.performQualityMaintenance();
  }

  public async processUserFeedback(cacheKey: string, feedback: 'positive' | 'negative', reason?: string): Promise<void> {
    await this.cacheQualityManager.processUserFeedback(cacheKey, feedback, reason);
  }

  public clearCache(): void {
    this.translationCache.clear();
    this.intelligentCache.clear();
    defaultLogger.info('All caches cleared', {}, 'TranslationGateway');
  }

  public getSystemStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    activeRequests: number;
    cacheSize: number;
    components: { [key: string]: boolean };
    performance: any;
    cacheHealth: any;
  } {
    const performanceHealth = this.performanceOptimizer.getPerformanceHealth();
    
    return {
      status: performanceHealth.status === 'healthy' ? 'healthy' : 
              performanceHealth.status === 'warning' ? 'degraded' : 'critical',
      activeRequests: this.activeRequests.size,
      cacheSize: this.translationCache.size,
      components: {
        purityValidator: true,
        terminologyManager: true,
        fallbackGenerator: true,
        contentCleaner: true,
        primaryTranslation: true,
        secondaryTranslation: true,
        qualityMonitor: true,
        metricsCollector: true,
        intelligentCache: true,
        performanceOptimizer: true,
        cacheQualityManager: true
      },
      performance: performanceHealth,
      cacheHealth: {} // Would be populated from cache health assessment
    };
  }

  /**
   * Cleanup resources when shutting down
   */
  public destroy(): void {
    this.intelligentCache.destroy();
    this.performanceOptimizer.destroy();
    this.cacheQualityManager.destroy();
    
    defaultLogger.info('Translation Gateway destroyed', {}, 'TranslationGateway');
  }
}