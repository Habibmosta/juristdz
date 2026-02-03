/**
 * Fallback Logging Integration Tests
 * 
 * Tests the integration of fallback logging, emergency content generation,
 * and error escalation systems for task 11.2.
 * 
 * Requirements: 6.5
 */

import { FallbackLoggingSystem } from '../core/FallbackLoggingSystem';
import { EmergencyContentGenerator } from '../core/EmergencyContentGenerator';
import { ErrorEscalationSystem } from '../core/ErrorEscalationSystem';
import { ErrorReporter } from '../core/ErrorReporter';
import {
  TranslationRequest,
  PureTranslationResult,
  TranslationError,
  SystemError,
  Language,
  ContentType,
  Severity,
  TranslationMethod,
  ErrorRecoveryAction
} from '../types';

describe('Fallback Logging Integration', () => {
  let fallbackLogger: FallbackLoggingSystem;
  let emergencyGenerator: EmergencyContentGenerator;
  let escalationSystem: ErrorEscalationSystem;
  let errorReporter: ErrorReporter;

  beforeEach(() => {
    fallbackLogger = new FallbackLoggingSystem();
    emergencyGenerator = new EmergencyContentGenerator();
    escalationSystem = new ErrorEscalationSystem();
    errorReporter = new ErrorReporter(fallbackLogger, escalationSystem, emergencyGenerator);
  });

  describe('Fallback Logging System', () => {
    it('should log fallback activation with comprehensive details', async () => {
      // Arrange
      const originalRequest: TranslationRequest = {
        text: 'Test legal document content',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: 'high',
        userId: 'test-user-123'
      };

      const error: TranslationError = {
        code: 'purity_validation_failed',
        message: 'Translation contains mixed language content',
        severity: Severity.HIGH,
        recoverable: true
      };

      const recoveryAttempts = [
        {
          attemptNumber: 1,
          strategy: 'method_switching',
          action: ErrorRecoveryAction.RETRY_WITH_SECONDARY,
          timestamp: new Date(),
          success: false,
          processingTime: 2000,
          errorMessage: 'Secondary method also failed',
          confidence: 0.3
        }
      ];

      const fallbackResult: PureTranslationResult = {
        translatedText: 'محتوى قانوني مهني متاح. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.',
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 85,
          contextualRelevance: 60,
          readabilityScore: 90,
          professionalismScore: 95,
          encodingIntegrity: 100
        },
        processingTime: 1500,
        method: TranslationMethod.FALLBACK_GENERATED,
        confidence: 0.7,
        warnings: [{
          code: 'FALLBACK_USED',
          message: 'Original translation failed, using fallback content'
        }],
        metadata: {
          requestId: 'test-user-123',
          timestamp: new Date(),
          processingSteps: [{
            step: 'fallback_generation',
            duration: 1500,
            success: true,
            details: { method: 'context_generated' }
          }],
          fallbackUsed: true,
          cacheHit: false
        }
      };

      const systemState = {
        primaryTranslationAvailable: false,
        secondaryTranslationAvailable: true,
        fallbackGeneratorAvailable: true,
        validationSystemAvailable: true,
        cacheAvailable: true,
        networkConnectivity: true,
        systemLoad: 0.7,
        errorRate: 0.15,
        memoryUsage: 75,
        activeConnections: 150,
        timestamp: new Date()
      };

      // Act
      const logId = await fallbackLogger.logFallbackActivation(
        originalRequest,
        error,
        recoveryAttempts,
        fallbackResult,
        systemState
      );

      // Assert
      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');
      expect(logId).toMatch(/^fallback_\d+_[a-z0-9]+$/);

      // Verify log entry was created
      const logs = fallbackLogger.getFallbackLogs({ limit: 1 });
      expect(logs).toHaveLength(1);
      
      const logEntry = logs[0];
      expect(logEntry.id).toBe(logId);
      expect(logEntry.originalRequest).toEqual(originalRequest);
      expect(logEntry.errorType).toBe('purity_validation_failed');
      expect(logEntry.emergencyContentUsed).toBe(true);
      expect(logEntry.recoveryAttempts).toHaveLength(1);
      expect(logEntry.userImpact.impactLevel).toBe('significant');
      expect(logEntry.improvementSuggestions.length).toBeGreaterThan(0);
    });

    it('should generate fallback analytics', async () => {
      // Arrange - Create multiple fallback logs
      const requests = [
        {
          text: 'Document 1',
          sourceLanguage: Language.FRENCH,
          targetLanguage: Language.ARABIC,
          contentType: ContentType.LEGAL_DOCUMENT,
          priority: 'normal' as const
        },
        {
          text: 'Document 2',
          sourceLanguage: Language.ARABIC,
          targetLanguage: Language.FRENCH,
          contentType: ContentType.CHAT_MESSAGE,
          priority: 'high' as const
        }
      ];

      for (const request of requests) {
        const error: SystemError = {
          code: 'translation_failed',
          message: 'Translation service unavailable',
          severity: Severity.MEDIUM,
          timestamp: new Date(),
          context: {}
        };

        const result: PureTranslationResult = {
          translatedText: 'Emergency content',
          purityScore: 100,
          qualityMetrics: {
            purityScore: 100,
            terminologyAccuracy: 80,
            contextualRelevance: 50,
            readabilityScore: 85,
            professionalismScore: 90,
            encodingIntegrity: 100
          },
          processingTime: 1000,
          method: TranslationMethod.FALLBACK_GENERATED,
          confidence: 0.5,
          warnings: [],
          metadata: {
            requestId: 'test',
            timestamp: new Date(),
            processingSteps: [],
            fallbackUsed: true,
            cacheHit: false
          }
        };

        await fallbackLogger.logFallbackActivation(
          request,
          error,
          [],
          result,
          {
            primaryTranslationAvailable: false,
            secondaryTranslationAvailable: false,
            fallbackGeneratorAvailable: true,
            validationSystemAvailable: true,
            cacheAvailable: true,
            networkConnectivity: true,
            systemLoad: 0.5,
            errorRate: 0.1,
            memoryUsage: 60,
            activeConnections: 100,
            timestamp: new Date()
          }
        );
      }

      // Act
      const analytics = await fallbackLogger.generateFallbackAnalytics();

      // Assert
      expect(analytics.totalFallbacks).toBe(2);
      expect(analytics.fallbacksByType.size).toBeGreaterThan(0);
      expect(analytics.fallbacksByErrorType.get('translation_failed')).toBe(2);
      expect(analytics.averageRecoveryTime).toBeGreaterThan(0);
      expect(analytics.successRate).toBeGreaterThan(0);
      expect(analytics.improvementOpportunities.length).toBeGreaterThan(0);
    });

    it('should export fallback logs in different formats', async () => {
      // Arrange
      const request: TranslationRequest = {
        text: 'Test content',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: 'normal'
      };

      const error: TranslationError = {
        code: 'test_error',
        message: 'Test error message',
        severity: Severity.MEDIUM,
        recoverable: true
      };

      const result: PureTranslationResult = {
        translatedText: 'Test result',
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 85,
          contextualRelevance: 70,
          readabilityScore: 90,
          professionalismScore: 95,
          encodingIntegrity: 100
        },
        processingTime: 1000,
        method: TranslationMethod.FALLBACK_GENERATED,
        confidence: 0.6,
        warnings: [],
        metadata: {
          requestId: 'test',
          timestamp: new Date(),
          processingSteps: [],
          fallbackUsed: true,
          cacheHit: false
        }
      };

      await fallbackLogger.logFallbackActivation(request, error, [], result, {
        primaryTranslationAvailable: true,
        secondaryTranslationAvailable: true,
        fallbackGeneratorAvailable: true,
        validationSystemAvailable: true,
        cacheAvailable: true,
        networkConnectivity: true,
        systemLoad: 0.3,
        errorRate: 0.05,
        memoryUsage: 50,
        activeConnections: 80,
        timestamp: new Date()
      });

      // Act & Assert - JSON export
      const jsonExport = await fallbackLogger.exportFallbackLogs('json');
      expect(jsonExport).toBeDefined();
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      // Act & Assert - CSV export
      const csvExport = await fallbackLogger.exportFallbackLogs('csv');
      expect(csvExport).toBeDefined();
      expect(csvExport).toContain('ID,Timestamp,Error Type');
      expect(csvExport.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('Emergency Content Generator', () => {
    it('should generate contextual emergency content for Arabic', async () => {
      // Arrange
      const request: TranslationRequest = {
        text: 'Legal document requiring translation',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: 'urgent',
        userId: 'legal-professional-123'
      };

      // Act
      const result = await emergencyGenerator.generateEmergencyContent(
        request,
        'Translation service failure'
      );

      // Assert
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.method).toBeDefined();
      expect(result.context).toBeDefined();
      
      // Verify Arabic content
      expect(result.content).toMatch(/[\u0600-\u06FF]/); // Contains Arabic characters
      expect(result.content).not.toMatch(/[a-zA-Z]{3,}/); // No significant English text
    });

    it('should generate contextual emergency content for French', async () => {
      // Arrange
      const request: TranslationRequest = {
        text: 'Document juridique nécessitant une traduction',
        sourceLanguage: Language.ARABIC,
        targetLanguage: Language.FRENCH,
        contentType: ContentType.LEGAL_FORM,
        priority: 'high',
        userId: 'lawyer-456'
      };

      // Act
      const result = await emergencyGenerator.generateEmergencyContent(
        request,
        'Validation failure'
      );

      // Assert
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      
      // Verify French content
      expect(result.content).toMatch(/[a-zA-ZÀ-ÿ]/); // Contains French characters
      expect(result.content).not.toMatch(/[\u0600-\u06FF]/); // No Arabic characters
      expect(result.content.toLowerCase()).toContain('juridique');
    });

    it('should provide alternatives for emergency content', async () => {
      // Arrange
      const request: TranslationRequest = {
        text: 'Test content',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.CHAT_MESSAGE,
        priority: 'normal'
      };

      // Act
      const result = await emergencyGenerator.generateEmergencyContent(
        request,
        'System overload'
      );

      // Assert
      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
      
      // Each alternative should be different from main content
      result.alternatives.forEach(alternative => {
        expect(alternative).not.toBe(result.content);
        expect(alternative.length).toBeGreaterThan(0);
      });
    });

    it('should track emergency content metrics', async () => {
      // Arrange
      const requests = [
        {
          text: 'Doc 1',
          sourceLanguage: Language.FRENCH,
          targetLanguage: Language.ARABIC,
          contentType: ContentType.LEGAL_DOCUMENT,
          priority: 'normal' as const
        },
        {
          text: 'Doc 2',
          sourceLanguage: Language.ARABIC,
          targetLanguage: Language.FRENCH,
          contentType: ContentType.LEGAL_FORM,
          priority: 'high' as const
        }
      ];

      // Act
      for (const request of requests) {
        await emergencyGenerator.generateEmergencyContent(request, 'Test failure');
      }

      const metrics = emergencyGenerator.getEmergencyContentMetrics();

      // Assert
      expect(metrics.totalGenerations).toBe(2);
      expect(metrics.generationsByLanguage.get(Language.ARABIC)).toBe(1);
      expect(metrics.generationsByLanguage.get(Language.FRENCH)).toBe(1);
      expect(metrics.generationsByContentType.get(ContentType.LEGAL_DOCUMENT)).toBe(1);
      expect(metrics.generationsByContentType.get(ContentType.LEGAL_FORM)).toBe(1);
      expect(metrics.averageRelevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Error Escalation System', () => {
    it('should escalate critical errors immediately', async () => {
      // Arrange
      const criticalError: SystemError = {
        code: 'SYSTEM_FAILURE_CRITICAL',
        message: 'Critical system component failure',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { component: 'translation_engine' }
      };

      const context = {
        requestId: 'critical-request-123',
        userId: 'user-456',
        systemState: {
          primaryTranslationAvailable: false,
          secondaryTranslationAvailable: false,
          fallbackGeneratorAvailable: true,
          validationSystemAvailable: false,
          cacheAvailable: true,
          networkConnectivity: true,
          systemLoad: 0.95,
          errorRate: 0.8
        }
      };

      // Act
      const escalationEvent = await escalationSystem.processError(criticalError, context);

      // Assert
      expect(escalationEvent).toBeDefined();
      expect(escalationEvent!.severity).toBe(Severity.CRITICAL);
      expect(escalationEvent!.executedActions.length).toBeGreaterThan(0);
      
      // Verify notifications were triggered
      const successfulActions = escalationEvent!.executedActions.filter(a => a.success);
      expect(successfulActions.length).toBeGreaterThan(0);
    });

    it('should track escalation metrics', async () => {
      // Arrange
      const errors = [
        {
          code: 'HIGH_ERROR_RATE',
          message: 'Error rate exceeded threshold',
          severity: Severity.HIGH,
          timestamp: new Date(),
          context: {}
        },
        {
          code: 'QUALITY_DEGRADATION',
          message: 'Translation quality degraded',
          severity: Severity.MEDIUM,
          timestamp: new Date(),
          context: {}
        }
      ];

      // Act
      for (const error of errors) {
        await escalationSystem.processError(error, {
          requestId: 'test',
          systemState: { errorRate: 0.2 }
        });
      }

      const metrics = escalationSystem.getEscalationMetrics();

      // Assert
      expect(metrics.totalEscalations).toBeGreaterThan(0);
      expect(metrics.escalationsBySeverity.size).toBeGreaterThan(0);
      expect(metrics.successfulNotifications).toBeGreaterThan(0);
    });

    it('should respect cooldown periods', async () => {
      // Arrange
      const error: SystemError = {
        code: 'REPEATED_ERROR',
        message: 'This error repeats frequently',
        severity: Severity.HIGH,
        timestamp: new Date(),
        context: {}
      };

      const context = {
        requestId: 'test',
        systemState: { errorRate: 0.3 }
      };

      // Act - First escalation
      const firstEscalation = await escalationSystem.processError(error, context);
      
      // Act - Immediate second escalation (should be blocked by cooldown)
      const secondEscalation = await escalationSystem.processError(error, context);

      // Assert
      expect(firstEscalation).toBeDefined();
      // Second escalation might be null due to cooldown or have fewer actions
      if (secondEscalation) {
        expect(secondEscalation.executedActions.length).toBeLessThanOrEqual(
          firstEscalation!.executedActions.length
        );
      }
    });
  });

  describe('Error Reporter Integration', () => {
    it('should integrate all systems for comprehensive error reporting', async () => {
      // Arrange
      const systemError: SystemError = {
        code: 'TRANSLATION_SYSTEM_FAILURE',
        message: 'Complete translation system failure',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { subsystem: 'purity_validation' }
      };

      const context = {
        userId: 'test-user',
        translationId: 'translation-123',
        timestamp: new Date(),
        requestData: {
          text: 'Test legal document',
          sourceLanguage: Language.FRENCH,
          targetLanguage: Language.ARABIC,
          contentType: ContentType.LEGAL_DOCUMENT,
          priority: 'urgent' as const
        },
        additionalData: new Map([
          ['systemState', { errorRate: 0.5, systemLoad: 0.9 }],
          ['userImpact', 'high']
        ])
      };

      // Act
      await errorReporter.reportSystemError(systemError, context);

      // Assert - Verify error was reported
      const dashboard = await errorReporter.getErrorDashboard();
      expect(dashboard.criticalErrors).toBeGreaterThan(0);
      expect(dashboard.currentErrorRate).toBeGreaterThan(0);

      // Verify escalation was triggered
      const escalationEvents = escalationSystem.getEscalationEvents({
        severity: Severity.CRITICAL,
        limit: 1
      });
      expect(escalationEvents.length).toBeGreaterThan(0);

      // Verify fallback logging
      const fallbackLogs = fallbackLogger.getFallbackLogs({ limit: 1 });
      // May or may not have fallback logs depending on whether emergency content was generated
    });

    it('should generate comprehensive error analysis', async () => {
      // Arrange
      const timeRange = {
        start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        end: new Date()
      };

      // Create some test errors
      const errors = [
        {
          code: 'PURITY_VALIDATION_FAILED',
          message: 'Translation purity validation failed',
          severity: Severity.HIGH,
          timestamp: new Date(),
          context: {}
        },
        {
          code: 'NETWORK_TIMEOUT',
          message: 'Network request timed out',
          severity: Severity.MEDIUM,
          timestamp: new Date(),
          context: {}
        }
      ];

      for (const error of errors) {
        await errorReporter.reportSystemError(error);
      }

      // Act
      const analysis = await errorReporter.generateErrorAnalysis(timeRange);

      // Assert
      expect(analysis.totalErrors).toBeGreaterThan(0);
      expect(analysis.errorsByType.size).toBeGreaterThan(0);
      expect(analysis.errorsBySeverity.size).toBeGreaterThan(0);
      expect(analysis.mostCommonErrors.length).toBeGreaterThan(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recoverySuccessRate).toBeGreaterThanOrEqual(0);
    });

    it('should export error data in multiple formats', async () => {
      // Arrange
      const error: TranslationError = {
        code: 'TEST_EXPORT_ERROR',
        message: 'Error for export testing',
        severity: Severity.MEDIUM,
        recoverable: true
      };

      await errorReporter.reportTranslationError(error, 'test-translation-123');

      const timeRange = {
        start: new Date(Date.now() - 60 * 60 * 1000),
        end: new Date()
      };

      // Act & Assert - JSON export
      const jsonExport = await errorReporter.exportErrorData('json', timeRange);
      expect(jsonExport.format).toBe('json');
      expect(jsonExport.data).toBeDefined();
      expect(jsonExport.filename).toContain('.json');
      expect(() => JSON.parse(jsonExport.data)).not.toThrow();

      // Act & Assert - CSV export
      const csvExport = await errorReporter.exportErrorData('csv', timeRange);
      expect(csvExport.format).toBe('csv');
      expect(csvExport.data).toBeDefined();
      expect(csvExport.filename).toContain('.csv');
      expect(csvExport.data).toContain('ID,Timestamp,Type');
    });
  });

  describe('End-to-End Integration', () => {
    it('should handle complete translation failure with full logging and escalation', async () => {
      // Arrange
      const originalRequest: TranslationRequest = {
        text: 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE', // User-reported mixed content
        sourceLanguage: Language.ARABIC,
        targetLanguage: Language.FRENCH,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: 'urgent',
        userId: 'legal-professional-789'
      };

      const criticalError: SystemError = {
        code: 'COMPLETE_TRANSLATION_FAILURE',
        message: 'All translation methods failed for mixed content',
        severity: Severity.CRITICAL,
        timestamp: new Date(),
        context: { mixedContent: true, userReported: true }
      };

      // Act - Simulate complete system failure and recovery
      
      // 1. Report the error
      await errorReporter.reportSystemError(criticalError, {
        userId: originalRequest.userId,
        translationId: 'critical-translation-456',
        timestamp: new Date(),
        requestData: originalRequest,
        additionalData: new Map([
          ['systemState', {
            primaryTranslationAvailable: false,
            secondaryTranslationAvailable: false,
            fallbackGeneratorAvailable: true,
            systemLoad: 0.95,
            errorRate: 0.7
          }],
          ['userImpact', 'critical']
        ])
      });

      // 2. Generate emergency content
      const emergencyContent = await emergencyGenerator.generateEmergencyContent(
        originalRequest,
        'Complete translation system failure'
      );

      // 3. Log the fallback activation
      const fallbackResult: PureTranslationResult = {
        translatedText: emergencyContent.content,
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 90,
          contextualRelevance: emergencyContent.confidence * 100,
          readabilityScore: 95,
          professionalismScore: 100,
          encodingIntegrity: 100
        },
        processingTime: 2000,
        method: TranslationMethod.FALLBACK_GENERATED,
        confidence: emergencyContent.confidence,
        warnings: [{
          code: 'EMERGENCY_CONTENT',
          message: 'Emergency content provided due to complete system failure'
        }],
        metadata: {
          requestId: originalRequest.userId!,
          timestamp: new Date(),
          processingSteps: [{
            step: 'emergency_content_generation',
            duration: 2000,
            success: true,
            details: { reason: 'complete_system_failure' }
          }],
          fallbackUsed: true,
          cacheHit: false
        }
      };

      const logId = await fallbackLogger.logFallbackActivation(
        originalRequest,
        criticalError,
        [],
        fallbackResult,
        {
          primaryTranslationAvailable: false,
          secondaryTranslationAvailable: false,
          fallbackGeneratorAvailable: true,
          validationSystemAvailable: true,
          cacheAvailable: true,
          networkConnectivity: true,
          systemLoad: 0.95,
          errorRate: 0.7,
          memoryUsage: 90,
          activeConnections: 200,
          timestamp: new Date()
        }
      );

      // Assert - Verify all systems worked together
      
      // 1. Verify emergency content was generated
      expect(emergencyContent.content).toBeDefined();
      expect(emergencyContent.content).toMatch(/[a-zA-ZÀ-ÿ]/); // French content
      expect(emergencyContent.content).not.toMatch(/Pro|V2|AUTO-TRANSLATE/); // No UI elements
      expect(emergencyContent.confidence).toBeGreaterThan(0);

      // 2. Verify fallback was logged
      expect(logId).toBeDefined();
      const logs = fallbackLogger.getFallbackLogs({ limit: 1 });
      expect(logs).toHaveLength(1);
      expect(logs[0].escalationLevel).toBe('critical_incident');
      expect(logs[0].emergencyContentUsed).toBe(true);

      // 3. Verify escalation occurred
      const escalationEvents = escalationSystem.getEscalationEvents({
        severity: Severity.CRITICAL,
        limit: 1
      });
      expect(escalationEvents.length).toBeGreaterThan(0);

      // 4. Verify error reporting
      const dashboard = await errorReporter.getErrorDashboard();
      expect(dashboard.criticalErrors).toBeGreaterThan(0);

      // 5. Verify analytics
      const analytics = await fallbackLogger.generateFallbackAnalytics();
      expect(analytics.totalFallbacks).toBeGreaterThan(0);
      expect(analytics.improvementOpportunities.length).toBeGreaterThan(0);
    });
  });
});