/**
 * Error Recovery Integration Tests
 * 
 * Integration tests for the Error Recovery System with the main Pure Translation System,
 * verifying end-to-end error recovery functionality.
 * 
 * Requirements: 6.4, 6.5
 */

import { PureTranslationSystem } from '../core/PureTranslationSystem';
import { ErrorRecoverySystem } from '../core/ErrorRecoverySystem';
import {
  TranslationRequest,
  Language,
  ContentType,
  TranslationPriority,
  TranslationMethod,
  Severity
} from '../types';

// Mock all dependencies
const mockContentCleaner = {
  cleanMixedContent: jest.fn(),
  removeCorruptedCharacters: jest.fn(),
  eliminateUIElements: jest.fn(),
  normalizeEncoding: jest.fn(),
  detectProblematicPatterns: jest.fn()
};

const mockTranslationEngine = {
  translateWithPrimaryMethod: jest.fn(),
  translateWithSecondaryMethod: jest.fn(),
  detectContentIntent: jest.fn(),
  applyLegalTerminology: jest.fn()
};

const mockPurityValidator = {
  validatePurity: jest.fn(),
  calculatePurityScore: jest.fn(),
  detectMixedContent: jest.fn(),
  enforceZeroTolerance: jest.fn(),
  generatePurityReport: jest.fn()
};

const mockTerminologyManager = {
  translateLegalTerm: jest.fn(),
  validateTerminologyConsistency: jest.fn(),
  getLegalDictionary: jest.fn(),
  updateTerminology: jest.fn(),
  getAlgerianLegalStandards: jest.fn(),
  applyLegalTerminology: jest.fn()
};

const mockQualityMonitor = {
  monitorTranslationQuality: jest.fn(),
  generateQualityReport: jest.fn(),
  trackQualityMetrics: jest.fn(),
  alertOnQualityIssues: jest.fn()
};

const mockErrorReporter = {
  reportSystemError: jest.fn(),
  reportTranslationError: jest.fn(),
  trackErrorRecovery: jest.fn(),
  generateErrorAnalysis: jest.fn(),
  getErrorTrends: jest.fn(),
  configureErrorAlerts: jest.fn(),
  getErrorDashboard: jest.fn(),
  classifyError: jest.fn(),
  generateRecoveryRecommendations: jest.fn(),
  exportErrorData: jest.fn()
};

const mockMetricsCollector = {
  collectTranslationMetrics: jest.fn(),
  getTranslationMetrics: jest.fn(),
  trackPerformanceMetrics: jest.fn(),
  generateMetricsReport: jest.fn()
};

const mockFallbackGenerator = {
  generateFallbackContent: jest.fn(),
  detectContentIntent: jest.fn(),
  generateContextualContent: jest.fn(),
  generateEmergencyContent: jest.fn()
};

const mockConfig = {
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
    maximumProcessingTime: 30000,
    terminologyAccuracyThreshold: 90,
    readabilityThreshold: 80
  },
  cleaningRules: {
    removeUIElements: true,
    removeCyrillicCharacters: true,
    removeEnglishFragments: true,
    normalizeEncoding: true,
    aggressiveCleaning: true,
    customPatterns: []
  },
  terminologySettings: {
    useOfficialDictionary: true,
    allowUserContributions: false,
    validateConsistency: true,
    updateFrequency: 24,
    confidenceThreshold: 0.9
  }
};

describe('Error Recovery Integration Tests', () => {
  let pureTranslationSystem: PureTranslationSystem;
  let errorRecoverySystem: ErrorRecoverySystem;
  let sampleRequest: TranslationRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create error recovery system
    errorRecoverySystem = new ErrorRecoverySystem(
      mockTranslationEngine as any,
      mockFallbackGenerator as any,
      mockPurityValidator as any,
      mockErrorReporter as any
    );

    // Create main translation system
    pureTranslationSystem = new PureTranslationSystem(
      mockContentCleaner as any,
      mockTranslationEngine as any,
      mockPurityValidator as any,
      mockTerminologyManager as any,
      mockQualityMonitor as any,
      mockErrorReporter as any,
      mockMetricsCollector as any,
      errorRecoverySystem as any,
      mockFallbackGenerator as any,
      mockConfig as any
    );

    sampleRequest = {
      text: 'Contenu juridique avec des éléments problématiques AUTO-TRANSLATE Pro процедة',
      sourceLanguage: Language.FRENCH,
      targetLanguage: Language.ARABIC,
      contentType: ContentType.LEGAL_DOCUMENT,
      priority: TranslationPriority.NORMAL,
      userId: 'test-user-123'
    };

    // Setup default successful mocks
    mockContentCleaner.cleanMixedContent.mockResolvedValue({
      cleanedText: 'Contenu juridique propre',
      removedElements: [
        { type: 'ui_elements', content: 'AUTO-TRANSLATE Pro', position: { start: 45, end: 62 }, reason: 'UI artifact removal' }
      ],
      cleaningActions: [
        { type: 'remove', pattern: 'AUTO-TRANSLATE', position: { start: 45, end: 59 }, reason: 'UI element' }
      ],
      originalLength: 75,
      cleanedLength: 25,
      confidence: 0.95,
      processingTime: 150
    });

    mockTranslationEngine.translateWithPrimaryMethod.mockResolvedValue({
      result: 'محتوى قانوني نظيف ومهني',
      method: TranslationMethod.PRIMARY_AI,
      confidence: 0.9,
      processingTime: 2000,
      errors: [],
      warnings: [],
      metadata: {}
    });

    mockPurityValidator.validatePurity.mockResolvedValue({
      isPure: true,
      passesZeroTolerance: true,
      purityScore: {
        overall: 100,
        scriptPurity: 100,
        terminologyConsistency: 95,
        encodingIntegrity: 100,
        contextualCoherence: 90,
        uiElementsRemoved: 100
      },
      violations: [],
      recommendations: []
    });

    mockTerminologyManager.applyLegalTerminology.mockResolvedValue('محتوى قانوني نظيف ومهني مع المصطلحات الصحيحة');
    mockTerminologyManager.validateTerminologyConsistency.mockResolvedValue({
      isValid: true,
      score: 95,
      inconsistencies: [],
      suggestions: []
    });

    mockMetricsCollector.getTranslationMetrics.mockResolvedValue({
      totalTranslations: 100,
      pureTranslations: 98,
      purityRate: 98,
      averageQualityScore: 95,
      failureRate: 2,
      averageProcessingTime: 2500,
      userSatisfactionScore: 92,
      issuesByType: new Map(),
      methodEffectiveness: new Map(),
      timeRange: { start: new Date(), end: new Date() }
    });
  });

  describe('Successful Translation Pipeline', () => {
    test('should complete translation without error recovery when everything works', async () => {
      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toBe('محتوى قانوني نظيف ومهني مع المصطلحات الصحيحة');
      expect(result.purityScore).toBe(100);
      expect(result.method).toBe(TranslationMethod.PRIMARY_AI);
      expect(result.metadata.fallbackUsed).toBe(false);
      
      // Verify pipeline steps were executed
      expect(mockContentCleaner.cleanMixedContent).toHaveBeenCalledTimes(1);
      expect(mockTranslationEngine.translateWithPrimaryMethod).toHaveBeenCalledTimes(1);
      expect(mockPurityValidator.validatePurity).toHaveBeenCalledTimes(1);
      expect(mockTerminologyManager.applyLegalTerminology).toHaveBeenCalledTimes(1);
    });
  });

  describe('Translation Failure Recovery', () => {
    test('should recover from primary translation failure using secondary method', async () => {
      // Arrange - Make primary translation fail
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(
        new Error('Primary translation service failed')
      );

      // Setup secondary method success
      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'محتوى قانوني مترجم بالطريقة الثانوية',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.85,
        processingTime: 2500,
        errors: [],
        warnings: [],
        metadata: {}
      });

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toContain('محتوى قانوني');
      expect(result.method).toBe(TranslationMethod.SECONDARY_AI);
      expect(result.confidence).toBeLessThan(0.9); // Reduced confidence for recovery
      
      // Verify error recovery was used
      expect(mockTranslationEngine.translateWithSecondaryMethod).toHaveBeenCalledTimes(1);
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalled();
    });

    test('should use fallback content when all translation methods fail', async () => {
      // Arrange - Make all translation methods fail
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(
        new Error('Primary translation failed')
      );
      mockTranslationEngine.translateWithSecondaryMethod.mockRejectedValue(
        new Error('Secondary translation failed')
      );

      // Setup fallback generation
      mockTranslationEngine.detectContentIntent.mockResolvedValue({
        category: 'civil_law',
        concepts: [],
        context: { jurisdiction: 'Algeria', lawType: 'civil' },
        complexity: 'moderate',
        audience: 'legal_professional',
        confidence: 0.8
      });

      mockFallbackGenerator.generateFallbackContent.mockResolvedValue({
        content: 'محتوى قانوني مهني وفقاً للقانون الجزائري',
        confidence: 0.7,
        method: 'context_generated',
        context: {
          category: 'civil_law',
          concepts: [],
          context: { jurisdiction: 'Algeria', lawType: 'civil' },
          complexity: 'moderate',
          audience: 'legal_professional',
          confidence: 0.8
        },
        alternatives: []
      });

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toBe('محتوى قانوني مهني وفقاً للقانون الجزائري');
      expect(result.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('FALLBACK_USED');
      
      // Verify fallback was used
      expect(mockFallbackGenerator.generateFallbackContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quality Validation Failure Recovery', () => {
    test('should recover from purity validation failure', async () => {
      // Arrange - Make initial purity validation fail
      mockPurityValidator.validatePurity
        .mockResolvedValueOnce({
          isPure: false,
          passesZeroTolerance: false,
          purityScore: {
            overall: 60,
            scriptPurity: 70,
            terminologyConsistency: 80,
            encodingIntegrity: 90,
            contextualCoherence: 50,
            uiElementsRemoved: 40
          },
          violations: [
            {
              type: 'mixed_scripts',
              position: { start: 10, end: 20 },
              content: 'mixed content',
              severity: Severity.HIGH,
              suggestedFix: 'Remove mixed content',
              confidence: 0.9
            }
          ],
          recommendations: []
        })
        .mockResolvedValueOnce({
          isPure: true,
          passesZeroTolerance: true,
          purityScore: {
            overall: 100,
            scriptPurity: 100,
            terminologyConsistency: 95,
            encodingIntegrity: 100,
            contextualCoherence: 90,
            uiElementsRemoved: 100
          },
          violations: [],
          recommendations: []
        });

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.purityScore).toBe(100);
      
      // Verify recovery was attempted
      expect(mockPurityValidator.validatePurity).toHaveBeenCalledTimes(2);
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalled();
    });

    test('should use fallback when quality validation persistently fails', async () => {
      // Arrange - Make purity validation always fail
      mockPurityValidator.validatePurity.mockResolvedValue({
        isPure: false,
        passesZeroTolerance: false,
        purityScore: {
          overall: 50,
          scriptPurity: 60,
          terminologyConsistency: 70,
          encodingIntegrity: 80,
          contextualCoherence: 40,
          uiElementsRemoved: 30
        },
        violations: [
          {
            type: 'mixed_scripts',
            position: { start: 0, end: 10 },
            content: 'persistent mixed content',
            severity: Severity.CRITICAL,
            suggestedFix: 'Use fallback content',
            confidence: 0.95
          }
        ],
        recommendations: []
      });

      // Setup fallback with successful validation
      mockFallbackGenerator.generateFallbackContent.mockResolvedValue({
        content: 'محتوى قانوني آمن ونظيف',
        confidence: 0.8,
        method: 'emergency_generic',
        context: {
          category: 'civil_law',
          concepts: [],
          context: { jurisdiction: 'Algeria', lawType: 'civil' },
          complexity: 'simple',
          audience: 'general_public',
          confidence: 0.7
        },
        alternatives: []
      });

      mockTranslationEngine.detectContentIntent.mockResolvedValue({
        category: 'civil_law',
        concepts: [],
        context: { jurisdiction: 'Algeria', lawType: 'civil' },
        complexity: 'simple',
        audience: 'general_public',
        confidence: 0.7
      });

      // Make fallback content pass validation
      mockPurityValidator.validatePurity.mockResolvedValueOnce({
        isPure: false,
        passesZeroTolerance: false,
        purityScore: { overall: 50, scriptPurity: 60, terminologyConsistency: 70, encodingIntegrity: 80, contextualCoherence: 40, uiElementsRemoved: 30 },
        violations: [{ type: 'mixed_scripts', position: { start: 0, end: 10 }, content: 'persistent mixed content', severity: Severity.CRITICAL, suggestedFix: 'Use fallback content', confidence: 0.95 }],
        recommendations: []
      }).mockResolvedValueOnce({
        isPure: true,
        passesZeroTolerance: true,
        purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 95, uiElementsRemoved: 100 },
        violations: [],
        recommendations: []
      });

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toBe('محتوى قانوني آمن ونظيف');
      expect(result.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('FALLBACK_USED');
    });
  });

  describe('System Error Graceful Degradation', () => {
    test('should provide emergency content for complete system failure', async () => {
      // Arrange - Make everything fail
      mockContentCleaner.cleanMixedContent.mockRejectedValue(new Error('Content cleaner failed'));
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(new Error('Primary failed'));
      mockTranslationEngine.translateWithSecondaryMethod.mockRejectedValue(new Error('Secondary failed'));
      mockFallbackGenerator.generateFallbackContent.mockRejectedValue(new Error('Fallback failed'));

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toContain('محتوى قانوني مهني');
      expect(result.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.purityScore).toBe(100); // Emergency content is guaranteed pure
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('EMERGENCY_CONTENT');
      
      // Verify error reporting
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalled();
    });

    test('should handle network errors gracefully', async () => {
      // Arrange - Simulate network error
      const networkError = {
        code: 'network_error',
        message: 'Network connectivity lost',
        severity: Severity.HIGH,
        timestamp: new Date(),
        context: { networkStatus: 'disconnected' }
      };

      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(networkError);

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.purityScore).toBeGreaterThanOrEqual(90);
      
      // Should use emergency content for network errors
      expect(result.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.warnings[0].code).toBe('EMERGENCY_CONTENT');
    });
  });

  describe('Concurrent Error Recovery', () => {
    test('should handle multiple concurrent translation failures', async () => {
      // Arrange - Multiple requests with different failure scenarios
      const requests = [
        { ...sampleRequest, text: 'Text 1 with AUTO-TRANSLATE' },
        { ...sampleRequest, text: 'Text 2 with процедة' },
        { ...sampleRequest, text: 'Text 3 with Pro V2' }
      ];

      // Make primary translation fail for all
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(
        new Error('Primary translation failed')
      );

      // Setup successful secondary translation
      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'نص مترجم بنجاح',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.85,
        processingTime: 2000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      // Act
      const results = await pureTranslationSystem.translateBatch(requests);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.translatedText).toBeDefined();
        expect(result.purityScore).toBeGreaterThanOrEqual(90);
        expect(result.method).toBe(TranslationMethod.SECONDARY_AI);
      });

      // Verify error recovery was used for all
      expect(mockTranslationEngine.translateWithSecondaryMethod).toHaveBeenCalledTimes(3);
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery Statistics and Monitoring', () => {
    test('should track error recovery statistics correctly', async () => {
      // Arrange - Make primary translation fail
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(
        new Error('Primary translation failed')
      );

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'نص مترجم بالطريقة الثانوية',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.85,
        processingTime: 2000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      // Act
      await pureTranslationSystem.translateContent(sampleRequest);
      const recoveryStats = pureTranslationSystem.getErrorRecoveryStatistics();
      const systemHealth = await pureTranslationSystem.getErrorRecoveryHealth();

      // Assert
      expect(recoveryStats).toBeDefined();
      expect(recoveryStats.totalRecoveryAttempts).toBeGreaterThan(0);
      expect(recoveryStats.successfulRecoveries).toBeGreaterThan(0);
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth.status).toBeDefined();
      expect(['healthy', 'degraded', 'critical', 'emergency']).toContain(systemHealth.status);
      expect(systemHealth.recoverySuccessRate).toBeGreaterThanOrEqual(0);
    });

    test('should provide comprehensive system health assessment', async () => {
      // Act
      const systemHealth = await pureTranslationSystem.getErrorRecoveryHealth();

      // Assert
      expect(systemHealth).toBeDefined();
      expect(systemHealth).toHaveProperty('status');
      expect(systemHealth).toHaveProperty('recoverySuccessRate');
      expect(systemHealth).toHaveProperty('averageRecoveryTime');
      expect(systemHealth).toHaveProperty('activeStrategies');
      expect(systemHealth).toHaveProperty('recentFailures');
      
      expect(typeof systemHealth.recoverySuccessRate).toBe('number');
      expect(typeof systemHealth.averageRecoveryTime).toBe('number');
      expect(typeof systemHealth.activeStrategies).toBe('number');
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle null or invalid requests gracefully', async () => {
      // Act & Assert - Should not throw, should provide emergency content
      const result = await pureTranslationSystem.translateContent(null as any);
      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.method).toBe(TranslationMethod.FALLBACK_GENERATED);
    });

    test('should handle extremely long processing times', async () => {
      // Arrange - Simulate slow processing
      mockTranslationEngine.translateWithPrimaryMethod.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          result: 'نص مترجم ببطء',
          method: TranslationMethod.PRIMARY_AI,
          confidence: 0.9,
          processingTime: 25000,
          errors: [],
          warnings: [],
          metadata: {}
        }), 100))
      );

      // Act
      const startTime = Date.now();
      const result = await pureTranslationSystem.translateContent(sampleRequest);
      const actualTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(actualTime).toBeLessThan(35000); // Should complete within reasonable time
      expect(result.translatedText).toBeDefined();
    });

    test('should maintain data integrity during recovery', async () => {
      // Arrange - Make primary fail, secondary succeed
      mockTranslationEngine.translateWithPrimaryMethod.mockRejectedValue(
        new Error('Primary failed')
      );

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'محتوى قانوني مترجم بأمان',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.85,
        processingTime: 2000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      // Act
      const result = await pureTranslationSystem.translateContent(sampleRequest);

      // Assert - Data integrity checks
      expect(result).toBeDefined();
      expect(result.translatedText).toBe('محتوى قانوني مترجم بأمان مع المصطلحات الصحيحة');
      expect(result.purityScore).toBe(100);
      expect(result.qualityMetrics).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingSteps).toBeDefined();
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
      
      // Verify no data corruption
      expect(result.translatedText).not.toContain('undefined');
      expect(result.translatedText).not.toContain('null');
      expect(result.translatedText).not.toContain('[object Object]');
    });
  });
});