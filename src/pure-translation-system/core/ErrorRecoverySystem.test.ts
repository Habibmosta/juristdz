/**
 * Error Recovery System Tests
 * 
 * Comprehensive unit tests for the Error Recovery System,
 * testing translation failure recovery, quality validation failure recovery,
 * and system error graceful degradation.
 * 
 * Requirements: 6.4, 6.5
 */

import { ErrorRecoverySystem } from './ErrorRecoverySystem';
import {
  TranslationRequest,
  TranslationError,
  SystemError,
  ErrorRecoveryAction,
  TranslationMethod,
  Language,
  ContentType,
  TranslationPriority,
  Severity
} from '../types';

// Mock dependencies
const mockTranslationEngine = {
  translateWithPrimaryMethod: jest.fn(),
  translateWithSecondaryMethod: jest.fn(),
  detectContentIntent: jest.fn(),
  applyLegalTerminology: jest.fn()
};

const mockFallbackGenerator = {
  generateFallbackContent: jest.fn(),
  detectContentIntent: jest.fn(),
  generateContextualContent: jest.fn(),
  generateEmergencyContent: jest.fn()
};

const mockPurityValidator = {
  validatePurity: jest.fn(),
  calculatePurityScore: jest.fn(),
  detectMixedContent: jest.fn(),
  enforceZeroTolerance: jest.fn(),
  generatePurityReport: jest.fn()
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

describe('ErrorRecoverySystem', () => {
  let errorRecoverySystem: ErrorRecoverySystem;
  let sampleRequest: TranslationRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    errorRecoverySystem = new ErrorRecoverySystem(
      mockTranslationEngine as any,
      mockFallbackGenerator as any,
      mockPurityValidator as any,
      mockErrorReporter as any
    );

    sampleRequest = {
      text: 'Sample legal text for translation',
      sourceLanguage: Language.FRENCH,
      targetLanguage: Language.ARABIC,
      contentType: ContentType.LEGAL_DOCUMENT,
      priority: TranslationPriority.NORMAL,
      userId: 'test-user-123'
    };
  });

  describe('Translation Failure Recovery', () => {
    test('should recover from primary translation failure by switching to secondary method', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Primary translation service failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      const secondaryTranslationResult = {
        result: 'النص القانوني المترجم',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.85,
        processingTime: 1500,
        errors: [],
        warnings: [],
        metadata: {}
      };

      const purityValidationResult = {
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
      };

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue(secondaryTranslationResult);
      mockPurityValidator.validatePurity.mockResolvedValue(purityValidationResult);

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, translationError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.RETRY_WITH_SECONDARY);
      expect(result.result).toBeDefined();
      expect(result.result!.translatedText).toBe('النص القانوني المترجم');
      expect(result.result!.method).toBe(TranslationMethod.SECONDARY_AI);
      expect(result.metadata.strategyUsed).toBe('method_switching');
      expect(result.metadata.methodSwitched).toBe(true);
      expect(mockTranslationEngine.translateWithSecondaryMethod).toHaveBeenCalledTimes(1);
      expect(mockPurityValidator.validatePurity).toHaveBeenCalledTimes(1);
    });

    test('should try multiple translation methods before falling back', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'All translation methods failed',
        severity: Severity.CRITICAL,
        recoverable: true
      };

      // Mock secondary method failure
      mockTranslationEngine.translateWithSecondaryMethod.mockRejectedValue(
        new Error('Secondary translation also failed')
      );

      // Mock fallback content generation
      const fallbackContent = {
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
      };

      const contentIntent = {
        category: 'civil_law',
        concepts: [],
        context: { jurisdiction: 'Algeria', lawType: 'civil' },
        complexity: 'moderate',
        audience: 'legal_professional',
        confidence: 0.8
      };

      const purityValidationResult = {
        isPure: true,
        passesZeroTolerance: true,
        purityScore: {
          overall: 100,
          scriptPurity: 100,
          terminologyConsistency: 100,
          encodingIntegrity: 100,
          contextualCoherence: 95,
          uiElementsRemoved: 100
        },
        violations: [],
        recommendations: []
      };

      mockTranslationEngine.detectContentIntent.mockResolvedValue(contentIntent);
      mockFallbackGenerator.generateFallbackContent.mockResolvedValue(fallbackContent);
      mockPurityValidator.validatePurity.mockResolvedValue(purityValidationResult);

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, translationError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.GENERATE_FALLBACK);
      expect(result.result).toBeDefined();
      expect(result.result!.translatedText).toBe('محتوى قانوني مهني وفقاً للقانون الجزائري');
      expect(result.result!.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.metadata.fallbackTriggered).toBe(true);
      expect(result.fallbackContent).toBeDefined();
    });
  });

  describe('Quality Validation Failure Recovery', () => {
    test('should recover from purity validation failure through content enhancement', async () => {
      // Arrange
      const qualityError: TranslationError = {
        code: 'purity_validation_failed',
        message: 'Translation contains mixed language content',
        severity: Severity.HIGH,
        recoverable: true
      };

      const enhancedTranslationResult = {
        result: 'النص القانوني المحسن والنظيف',
        method: TranslationMethod.PRIMARY_AI,
        confidence: 0.9,
        processingTime: 2000,
        errors: [],
        warnings: [],
        metadata: {}
      };

      const purityValidationResult = {
        isPure: true,
        passesZeroTolerance: true,
        purityScore: {
          overall: 100,
          scriptPurity: 100,
          terminologyConsistency: 98,
          encodingIntegrity: 100,
          contextualCoherence: 95,
          uiElementsRemoved: 100
        },
        violations: [],
        recommendations: []
      };

      mockTranslationEngine.translateWithPrimaryMethod.mockResolvedValue(enhancedTranslationResult);
      mockPurityValidator.validatePurity.mockResolvedValue(purityValidationResult);

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, qualityError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.RETRY_WITH_SECONDARY);
      expect(result.result).toBeDefined();
      expect(result.result!.purityScore).toBe(100);
      expect(result.metadata.strategyUsed).toBe('quality_validation_recovery');
      expect(mockTranslationEngine.translateWithPrimaryMethod).toHaveBeenCalledTimes(1);
    });

    test('should handle persistent quality validation failures', async () => {
      // Arrange
      const qualityError: TranslationError = {
        code: 'purity_validation_failed',
        message: 'Persistent quality validation failure',
        severity: Severity.CRITICAL,
        recoverable: true
      };

      // Mock persistent validation failure
      const purityValidationResult = {
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
      };

      mockTranslationEngine.translateWithPrimaryMethod.mockResolvedValue({
        result: 'Mixed content النص',
        method: TranslationMethod.PRIMARY_AI,
        confidence: 0.7,
        processingTime: 1000,
        errors: [],
        warnings: [],
        metadata: {}
      });
      mockPurityValidator.validatePurity.mockResolvedValue(purityValidationResult);

      // Mock fallback generation
      const fallbackContent = {
        content: 'محتوى قانوني مهني بديل',
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
      };

      mockTranslationEngine.detectContentIntent.mockResolvedValue(fallbackContent.context);
      mockFallbackGenerator.generateFallbackContent.mockResolvedValue(fallbackContent);

      // Mock successful validation for fallback
      mockPurityValidator.validatePurity.mockResolvedValueOnce(purityValidationResult)
        .mockResolvedValueOnce({
          isPure: true,
          passesZeroTolerance: true,
          purityScore: {
            overall: 100,
            scriptPurity: 100,
            terminologyConsistency: 100,
            encodingIntegrity: 100,
            contextualCoherence: 95,
            uiElementsRemoved: 100
          },
          violations: [],
          recommendations: []
        });

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, qualityError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.GENERATE_FALLBACK);
      expect(result.metadata.fallbackTriggered).toBe(true);
      expect(result.result!.method).toBe(TranslationMethod.FALLBACK_GENERATED);
    });
  });

  describe('System Error Graceful Degradation', () => {
    test('should handle network errors with graceful degradation', async () => {
      // Arrange
      const systemError: SystemError = {
        code: 'network_error',
        message: 'Network connectivity lost',
        severity: Severity.HIGH,
        timestamp: new Date(),
        context: { networkStatus: 'disconnected' }
      };

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, systemError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.APPLY_EMERGENCY_CONTENT);
      expect(result.result).toBeDefined();
      expect(result.result!.translatedText).toContain('محتوى قانوني مهني');
      expect(result.metadata.strategyUsed).toBe('emergency_content');
      expect(result.metadata.qualityDegraded).toBe(true);
      expect(result.metadata.userNotified).toBe(true);
    });

    test('should handle service unavailable errors', async () => {
      // Arrange
      const systemError: SystemError = {
        code: 'service_unavailable',
        message: 'Translation service temporarily unavailable',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { serviceStatus: 'down' }
      };

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, systemError);

      // Assert
      expect(result.success).toBe(true);
      expect(result.action).toBe(ErrorRecoveryAction.APPLY_EMERGENCY_CONTENT);
      expect(result.result).toBeDefined();
      expect(result.result!.method).toBe(TranslationMethod.FALLBACK_GENERATED);
      expect(result.result!.warnings).toHaveLength(1);
      expect(result.result!.warnings[0].code).toBe('EMERGENCY_CONTENT');
      expect(result.metadata.escalated).toBe(false);
    });

    test('should escalate critical system failures', async () => {
      // Arrange
      const criticalError: SystemError = {
        code: 'critical_system_failure',
        message: 'Complete system failure',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { systemStatus: 'critical' }
      };

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, criticalError);

      // Assert
      expect(result.success).toBe(true); // Emergency content should still be provided
      expect(result.action).toBe(ErrorRecoveryAction.APPLY_EMERGENCY_CONTENT);
      expect(mockErrorReporter.reportSystemError).toHaveBeenCalledTimes(1);
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Strategy Selection', () => {
    test('should select appropriate strategy based on error type', async () => {
      // Test different error types and verify correct strategy selection
      const testCases = [
        {
          error: { code: 'translation_failed', message: 'Translation failed', severity: Severity.HIGH, recoverable: true },
          expectedStrategy: 'method_switching'
        },
        {
          error: { code: 'purity_validation_failed', message: 'Purity failed', severity: Severity.HIGH, recoverable: true },
          expectedStrategy: 'quality_validation_recovery'
        },
        {
          error: { code: 'network_error', message: 'Network error', severity: Severity.HIGH, timestamp: new Date(), context: {} },
          expectedStrategy: 'graceful_degradation'
        }
      ];

      for (const testCase of testCases) {
        // Mock successful recovery for each strategy
        if (testCase.expectedStrategy === 'method_switching') {
          mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
            result: 'النص المترجم',
            method: TranslationMethod.SECONDARY_AI,
            confidence: 0.8,
            processingTime: 1000,
            errors: [],
            warnings: [],
            metadata: {}
          });
          mockPurityValidator.validatePurity.mockResolvedValue({
            isPure: true,
            passesZeroTolerance: true,
            purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 100, uiElementsRemoved: 100 },
            violations: [],
            recommendations: []
          });
        }

        const result = await errorRecoverySystem.recoverFromError(sampleRequest, testCase.error as any);
        
        if (testCase.expectedStrategy !== 'graceful_degradation') {
          expect(result.metadata.strategyUsed).toBe(testCase.expectedStrategy);
        }
      }
    });

    test('should avoid using previously failed strategies', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Translation failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      const previousAttempts = [
        {
          strategy: 'method_switching',
          action: ErrorRecoveryAction.RETRY_WITH_SECONDARY,
          timestamp: new Date(),
          success: false,
          processingTime: 1000,
          error: 'Method switching failed'
        }
      ];

      // Mock fallback generation for quality validation recovery
      mockTranslationEngine.translateWithPrimaryMethod.mockResolvedValue({
        result: 'النص المحسن',
        method: TranslationMethod.PRIMARY_AI,
        confidence: 0.85,
        processingTime: 1500,
        errors: [],
        warnings: [],
        metadata: {}
      });

      mockPurityValidator.validatePurity.mockResolvedValue({
        isPure: true,
        passesZeroTolerance: true,
        purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 100, uiElementsRemoved: 100 },
        violations: [],
        recommendations: []
      });

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, translationError, previousAttempts);

      // Assert
      expect(result.metadata.strategyUsed).toBe('quality_validation_recovery');
      expect(result.metadata.strategyUsed).not.toBe('method_switching');
    });
  });

  describe('Recovery Statistics and Monitoring', () => {
    test('should track recovery statistics correctly', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Translation failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'النص المترجم',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.8,
        processingTime: 1000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      mockPurityValidator.validatePurity.mockResolvedValue({
        isPure: true,
        passesZeroTolerance: true,
        purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 100, uiElementsRemoved: 100 },
        violations: [],
        recommendations: []
      });

      // Act
      await errorRecoverySystem.recoverFromError(sampleRequest, translationError);
      const stats = errorRecoverySystem.getRecoveryStatistics();

      // Assert
      expect(stats.totalRecoveryAttempts).toBe(1);
      expect(stats.successfulRecoveries).toBe(1);
      expect(stats.failedRecoveries).toBe(0);
      expect(stats.strategiesUsed.get('method_switching')).toBe(1);
      expect(stats.errorTypesRecovered.get('translation_failed')).toBe(1);
    });

    test('should provide system health status', async () => {
      // Act
      const health = await errorRecoverySystem.getSystemHealth();

      // Assert
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('recoverySuccessRate');
      expect(health).toHaveProperty('averageRecoveryTime');
      expect(health).toHaveProperty('activeStrategies');
      expect(health).toHaveProperty('recentFailures');
      expect(['healthy', 'degraded', 'critical']).toContain(health.status);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null or undefined inputs gracefully', async () => {
      // Test with null request
      const error: TranslationError = {
        code: 'translation_failed',
        message: 'Test error',
        severity: Severity.HIGH,
        recoverable: true
      };

      const result = await errorRecoverySystem.recoverFromError(null as any, error);
      expect(result.success).toBe(true); // Should provide emergency content
      expect(result.action).toBe(ErrorRecoveryAction.APPLY_EMERGENCY_CONTENT);
    });

    test('should handle recovery strategy timeouts', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Translation failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      // Mock timeout scenario
      mockTranslationEngine.translateWithSecondaryMethod.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 35000)) // Longer than timeout
      );

      // Act
      const result = await errorRecoverySystem.recoverFromError(sampleRequest, translationError);

      // Assert
      expect(result.success).toBe(true); // Should fallback to emergency content
      expect(result.action).toBe(ErrorRecoveryAction.APPLY_EMERGENCY_CONTENT);
    });

    test('should handle multiple concurrent recovery requests', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Translation failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'النص المترجم',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.8,
        processingTime: 1000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      mockPurityValidator.validatePurity.mockResolvedValue({
        isPure: true,
        passesZeroTolerance: true,
        purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 100, uiElementsRemoved: 100 },
        violations: [],
        recommendations: []
      });

      // Act - Execute multiple concurrent recoveries
      const promises = Array(5).fill(null).map(() => 
        errorRecoverySystem.recoverFromError(sampleRequest, translationError)
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      const stats = errorRecoverySystem.getRecoveryStatistics();
      expect(stats.totalRecoveryAttempts).toBe(5);
      expect(stats.successfulRecoveries).toBe(5);
    });
  });

  describe('Integration with Error Reporting', () => {
    test('should report recovery attempts to error reporter', async () => {
      // Arrange
      const translationError: TranslationError = {
        code: 'translation_failed',
        message: 'Translation failed',
        severity: Severity.HIGH,
        recoverable: true
      };

      mockTranslationEngine.translateWithSecondaryMethod.mockResolvedValue({
        result: 'النص المترجم',
        method: TranslationMethod.SECONDARY_AI,
        confidence: 0.8,
        processingTime: 1000,
        errors: [],
        warnings: [],
        metadata: {}
      });

      mockPurityValidator.validatePurity.mockResolvedValue({
        isPure: true,
        passesZeroTolerance: true,
        purityScore: { overall: 100, scriptPurity: 100, terminologyConsistency: 100, encodingIntegrity: 100, contextualCoherence: 100, uiElementsRemoved: 100 },
        violations: [],
        recommendations: []
      });

      // Act
      await errorRecoverySystem.recoverFromError(sampleRequest, translationError);

      // Assert
      expect(mockErrorReporter.trackErrorRecovery).toHaveBeenCalledWith(
        'translation_failed',
        ErrorRecoveryAction.RETRY_WITH_SECONDARY,
        true
      );
    });

    test('should escalate critical failures to error reporter', async () => {
      // Arrange
      const criticalError: SystemError = {
        code: 'critical_system_failure',
        message: 'Critical system failure',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { systemStatus: 'critical' }
      };

      // Act
      await errorRecoverySystem.recoverFromError(sampleRequest, criticalError);

      // Assert
      expect(mockErrorReporter.reportSystemError).toHaveBeenCalledWith(
        criticalError,
        expect.objectContaining({
          userId: sampleRequest.userId,
          translationId: 'failed',
          requestData: sampleRequest
        })
      );
    });
  });
});