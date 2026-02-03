/**
 * Advanced Translation Engine Interface
 * 
 * Multi-method translation engine with legal terminology preservation,
 * intelligent fallback mechanisms, and contextual accuracy optimization.
 */

import {
  CleanedContent,
  TranslationAttempt,
  FallbackContent,
  ContentIntent,
  Language,
  TranslationMethod,
  LegalContext
} from '../types';

export interface IAdvancedTranslationEngine {
  /**
   * Execute primary translation method with legal context awareness
   * @param content Cleaned content ready for translation
   * @param targetLang Target language for translation
   * @returns Primary translation attempt with confidence metrics
   */
  translateWithPrimaryMethod(content: CleanedContent, targetLang: Language): Promise<TranslationAttempt>;

  /**
   * Execute secondary translation method as fallback
   * @param content Cleaned content for translation
   * @param targetLang Target language for translation
   * @returns Secondary translation attempt
   */
  translateWithSecondaryMethod(content: CleanedContent, targetLang: Language): Promise<TranslationAttempt>;

  /**
   * Generate intelligent fallback content based on detected intent
   * @param intent Detected content intent and context
   * @param targetLang Target language for fallback content
   * @returns Professional fallback content
   */
  generateFallbackContent(intent: ContentIntent, targetLang: Language): Promise<FallbackContent>;

  /**
   * Detect content intent for contextual translation
   * @param text Input text to analyze
   * @returns Detected content intent with confidence
   */
  detectContentIntent(text: string): Promise<ContentIntent>;

  /**
   * Apply legal terminology preservation during translation
   * @param text Translated text to enhance with legal terms
   * @param targetLang Target language for terminology
   * @returns Text with proper legal terminology applied
   */
  applyLegalTerminology(text: string, targetLang: Language): Promise<string>;

  /**
   * Execute hybrid translation combining multiple methods
   * @param content Cleaned content for translation
   * @param targetLang Target language
   * @param methods Array of methods to combine
   * @returns Hybrid translation result
   */
  translateWithHybridMethod(
    content: CleanedContent, 
    targetLang: Language, 
    methods: TranslationMethod[]
  ): Promise<TranslationAttempt>;

  /**
   * Validate translation against legal context requirements
   * @param translation Translation to validate
   * @param context Legal context for validation
   * @returns Validation result with recommendations
   */
  validateLegalContext(translation: string, context: LegalContext): Promise<LegalContextValidation>;

  /**
   * Get available translation methods and their capabilities
   * @returns Map of available methods with their characteristics
   */
  getAvailableMethods(): Map<TranslationMethod, MethodCapabilities>;

  /**
   * Configure translation engine parameters
   * @param config Engine configuration parameters
   */
  configure(config: TranslationEngineConfig): Promise<void>;

  /**
   * Get engine performance metrics
   * @returns Performance metrics for monitoring
   */
  getPerformanceMetrics(): Promise<EnginePerformanceMetrics>;
}

export interface LegalContextValidation {
  isValid: boolean;
  contextScore: number;
  missingConcepts: string[];
  incorrectTerminology: string[];
  suggestions: string[];
  confidence: number;
}

export interface MethodCapabilities {
  accuracy: number;
  speed: number;
  legalTerminologySupport: boolean;
  contextAwareness: boolean;
  supportedDomains: string[];
  maxTextLength: number;
  confidenceRange: [number, number];
}

export interface TranslationEngineConfig {
  primaryMethod: TranslationMethod;
  secondaryMethod: TranslationMethod;
  fallbackEnabled: boolean;
  legalTerminologyEnabled: boolean;
  contextAnalysisEnabled: boolean;
  maxRetryAttempts: number;
  timeoutMs: number;
  qualityThreshold: number;
}

export interface EnginePerformanceMetrics {
  totalTranslations: number;
  averageProcessingTime: number;
  successRate: number;
  averageConfidence: number;
  methodUsageStats: Map<TranslationMethod, number>;
  errorRate: number;
  fallbackUsageRate: number;
}