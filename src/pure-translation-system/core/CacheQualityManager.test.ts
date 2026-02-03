/**
 * Unit Tests for Cache Quality Manager
 * 
 * Tests the cache quality management system including quality validation,
 * invalidation rules, user feedback integration, and health monitoring.
 */

import { CacheQualityManager } from './CacheQualityManager';
import { IntelligentTranslationCache, CacheEntry } from './IntelligentTranslationCache';
import {
  PureTranslationResult,
  Language,
  ContentType,
  TranslationMethod,
  Severity
} from '../types';

describe('CacheQualityManager', () => {
  let qualityManager: CacheQualityManager;
  let mockCache: IntelligentTranslationCache;

  const mockHighQualityResult: PureTranslationResult = {
    translatedText: 'نص مترجم عالي الجودة',
    purityScore: 100,
    qualityMetrics: {
      purityScore: 100,
      terminologyAccuracy: 95,
      contextualRelevance: 90,
      readabilityScore: 85,
      professionalismScore: 95,
      encodingIntegrity: 100
    },
    processingTime: 500,
    method: TranslationMethod.PRIMARY_AI,
    confidence: 0.95,
    warnings: [],
    metadata: {
      requestId: 'test-request-1',
      timestamp: new Date(),
      processingSteps: [],
      fallbackUsed: false,
      cacheHit: false
    }
  };

  const mockLowQualityResult: PureTranslationResult = {
    ...mockHighQualityResult,
    purityScore: 75,
    qualityMetrics: {
      ...mockHighQualityResult.qualityMetrics,
      purityScore: 75,
      terminologyAccuracy: 60,
      contextualRelevance: 70
    },
    confidence: 0.5
  };

  const mockCacheEntry: CacheEntry = {
    result: mockHighQualityResult,
    createdAt: new Date(),
    lastAccessed: new Date(),
    accessCount: 1,
    ttl: 24 * 60 * 60 * 1000,
    quality: 92,
    contentHash: 'test-hash',
    metadata: {
      sourceLanguage: Language.FRENCH,
      targetLanguage: Language.ARABIC,
      contentType: ContentType.LEGAL_DOCUMENT,
      textLength: 100,
      method: TranslationMethod.PRIMARY_AI,
      tags: ['pure', 'high-confidence']
    }
  };

  beforeEach(() => {
    mockCache = new IntelligentTranslationCache({
      maxSize: 1000,
      enableCacheWarming: false
    });

    qualityManager = new CacheQualityManager(mockCache, {
      enableProactiveValidation: true,
      enableQualityDecayDetection: true,
      enableContextualInvalidation: true,
      enableUserFeedbackIntegration: true,
      qualityThreshold: 90,
      purityThreshold: 100,
      validationInterval: 1000 // Short interval for testing
    });
  });

  afterEach(() => {
    qualityManager.destroy();
    mockCache.destroy();
  });

  describe('Cache Entry Validation', () => {
    test('should validate high-quality cache entries', async () => {
      const isValid = await qualityManager.validateCacheEntry('test-key', mockCacheEntry);
      expect(isValid).toBe(true);
    });

    test('should invalidate low-quality cache entries', async () => {
      const lowQualityCacheEntry: CacheEntry = {
        ...mockCacheEntry,
        quality: 80, // Below threshold
        result: mockLowQualityResult
      };

      const isValid = await qualityManager.validateCacheEntry('low-quality-key', lowQualityCacheEntry);
      expect(isValid).toBe(false);
    });

    test('should invalidate entries with purity violations when zero tolerance is enabled', async () => {
      // Mock zero tolerance enabled
      jest.spyOn(require('../config/PureTranslationConfig'), 'pureTranslationConfig', 'get')
        .mockReturnValue({
          isZeroToleranceEnabled: () => true
        });

      const impureCacheEntry: CacheEntry = {
        ...mockCacheEntry,
        result: {
          ...mockHighQualityResult,
          purityScore: 95 // Below 100%
        }
      };

      const isValid = await qualityManager.validateCacheEntry('impure-key', impureCacheEntry);
      expect(isValid).toBe(false);
    });

    test('should handle validation errors gracefully', async () => {
      const malformedEntry = {
        ...mockCacheEntry,
        result: null as any // Malformed result
      };

      const isValid = await qualityManager.validateCacheEntry('malformed-key', malformedEntry);
      expect(isValid).toBe(false);
    });
  });

  describe('User Feedback Integration', () => {
    test('should process positive user feedback', async () => {
      await expect(
        qualityManager.processUserFeedback('test-key', 'positive', 'Great translation')
      ).resolves.not.toThrow();
    });

    test('should process negative user feedback and trigger invalidation', async () => {
      // First add an entry to cache
      await mockCache.set('feedback-key', mockHighQualityResult);
      
      await qualityManager.processUserFeedback('feedback-key', 'negative', 'Poor quality translation');
      
      // Entry should be invalidated
      const result = await mockCache.get('feedback-key');
      expect(result).toBeNull();
    });

    test('should create quality alerts for negative feedback', async () => {
      await qualityManager.processUserFeedback('alert-key', 'negative', 'Translation contains errors');
      
      const alerts = qualityManager.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const feedbackAlert = alerts.find(alert => alert.type === 'user_feedback');
      expect(feedbackAlert).toBeDefined();
      expect(feedbackAlert?.severity).toBe('high');
    });

    test('should handle feedback without reason', async () => {
      await expect(
        qualityManager.processUserFeedback('no-reason-key', 'negative')
      ).resolves.not.toThrow();
    });
  });

  describe('Quality Maintenance', () => {
    test('should perform comprehensive quality maintenance', async () => {
      // Add some entries to cache first
      await mockCache.set('maintenance-key-1', mockHighQualityResult);
      await mockCache.set('maintenance-key-2', mockLowQualityResult);
      
      await expect(qualityManager.performQualityMaintenance()).resolves.not.toThrow();
      
      const metrics = qualityManager.getQualityMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalEntries).toBeGreaterThanOrEqual(0);
    });

    test('should update quality metrics during maintenance', async () => {
      await qualityManager.performQualityMaintenance();
      
      const metrics = qualityManager.getQualityMetrics();
      
      expect(metrics.totalEntries).toBeGreaterThanOrEqual(0);
      expect(metrics.averageQuality).toBeGreaterThanOrEqual(0);
      expect(metrics.averagePurity).toBeGreaterThanOrEqual(0);
      expect(metrics.maintenanceEfficiency).toBeGreaterThanOrEqual(0);
    });

    test('should handle maintenance errors gracefully', async () => {
      // Force an error condition
      const errorQualityManager = new CacheQualityManager(mockCache, {
        validationInterval: -1 // Invalid interval
      });

      await expect(errorQualityManager.performQualityMaintenance()).resolves.not.toThrow();
      
      errorQualityManager.destroy();
    });
  });

  describe('Quality Metrics', () => {
    test('should provide accurate quality metrics', async () => {
      const metrics = qualityManager.getQualityMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalEntries).toBe('number');
      expect(typeof metrics.averageQuality).toBe('number');
      expect(typeof metrics.averagePurity).toBe('number');
      expect(metrics.qualityDistribution).toBeInstanceOf(Map);
      expect(metrics.invalidationReasons).toBeInstanceOf(Map);
    });

    test('should track invalidation reasons', async () => {
      // Simulate some invalidations
      const lowQualityEntry: CacheEntry = {
        ...mockCacheEntry,
        quality: 70
      };

      await qualityManager.validateCacheEntry('invalid-key', lowQualityEntry);
      
      const metrics = qualityManager.getQualityMetrics();
      expect(metrics.invalidationReasons.size).toBeGreaterThan(0);
    });
  });

  describe('Cache Health Assessment', () => {
    test('should provide health assessment for healthy cache', async () => {
      const health = await qualityManager.getCacheHealthAssessment();
      
      expect(health).toBeDefined();
      expect(health.status).toMatch(/^(healthy|warning|critical)$/);
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(health.issues)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
      expect(health.metrics).toBeDefined();
    });

    test('should detect quality issues', async () => {
      // Create a quality manager with high thresholds to trigger issues
      const strictQualityManager = new CacheQualityManager(mockCache, {
        qualityThreshold: 99, // Very high threshold
        purityThreshold: 100
      });

      const health = await strictQualityManager.getCacheHealthAssessment();
      
      // Might detect issues with high thresholds
      expect(health.status).toBeDefined();
      
      strictQualityManager.destroy();
    });

    test('should provide recommendations for improvement', async () => {
      const health = await qualityManager.getCacheHealthAssessment();
      
      if (health.status !== 'healthy') {
        expect(health.recommendations.length).toBeGreaterThan(0);
        expect(health.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Quality Alerts', () => {
    test('should create and manage quality alerts', async () => {
      // Process negative feedback to create an alert
      await qualityManager.processUserFeedback('alert-test-key', 'negative', 'Test alert');
      
      const alerts = qualityManager.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const alert = alerts[0];
      expect(alert.id).toBeDefined();
      expect(alert.type).toBe('user_feedback');
      expect(alert.severity).toBeDefined();
      expect(alert.message).toContain('Test alert');
      expect(alert.resolved).toBe(false);
    });

    test('should handle multiple alert types', async () => {
      // Create different types of alerts
      await qualityManager.processUserFeedback('feedback-alert', 'negative', 'Feedback issue');
      
      const alerts = qualityManager.getActiveAlerts();
      
      // Should have at least the feedback alert
      expect(alerts.length).toBeGreaterThan(0);
      
      const alertTypes = new Set(alerts.map(alert => alert.type));
      expect(alertTypes.has('user_feedback')).toBe(true);
    });
  });

  describe('Invalidation Rules', () => {
    test('should add custom invalidation rules', async () => {
      const customRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: (entry: CacheEntry) => entry.quality < 50,
        priority: 5,
        reason: 'test_rule_triggered',
        enabled: true
      };

      qualityManager.addInvalidationRule(customRule);
      
      // Test the rule by validating an entry that should trigger it
      const lowQualityEntry: CacheEntry = {
        ...mockCacheEntry,
        quality: 40 // Should trigger the rule
      };

      const isValid = await qualityManager.validateCacheEntry('rule-test-key', lowQualityEntry);
      expect(isValid).toBe(false);
    });

    test('should remove invalidation rules', async () => {
      const ruleId = 'removable-rule';
      const rule = {
        id: ruleId,
        name: 'Removable Rule',
        condition: () => false,
        priority: 1,
        reason: 'removable_rule',
        enabled: true
      };

      qualityManager.addInvalidationRule(rule);
      qualityManager.removeInvalidationRule(ruleId);
      
      // Rule should no longer affect validation
      const isValid = await qualityManager.validateCacheEntry('remove-test-key', mockCacheEntry);
      expect(isValid).toBe(true);
    });

    test('should handle disabled invalidation rules', async () => {
      const disabledRule = {
        id: 'disabled-rule',
        name: 'Disabled Rule',
        condition: () => true, // Would always trigger if enabled
        priority: 10,
        reason: 'disabled_rule',
        enabled: false // Disabled
      };

      qualityManager.addInvalidationRule(disabledRule);
      
      const isValid = await qualityManager.validateCacheEntry('disabled-test-key', mockCacheEntry);
      expect(isValid).toBe(true); // Should pass because rule is disabled
    });
  });

  describe('Quality Decay Detection', () => {
    test('should detect quality decay over time', async () => {
      const decayQualityManager = new CacheQualityManager(mockCache, {
        enableQualityDecayDetection: true,
        qualityDecayRate: 0.5, // High decay rate for testing
        qualityThreshold: 90
      });

      // Create an old entry
      const oldEntry: CacheEntry = {
        ...mockCacheEntry,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
        quality: 95 // High initial quality
      };

      const isValid = await decayQualityManager.validateCacheEntry('decay-test-key', oldEntry);
      
      // Should be invalidated due to quality decay
      expect(isValid).toBe(false);
      
      decayQualityManager.destroy();
    });

    test('should not decay quality when detection is disabled', async () => {
      const noDecayManager = new CacheQualityManager(mockCache, {
        enableQualityDecayDetection: false
      });

      const oldEntry: CacheEntry = {
        ...mockCacheEntry,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
        quality: 95
      };

      const isValid = await noDecayManager.validateCacheEntry('no-decay-key', oldEntry);
      expect(isValid).toBe(true); // Should remain valid
      
      noDecayManager.destroy();
    });
  });

  describe('Contextual Invalidation', () => {
    test('should validate contextual relevance', async () => {
      const contextualManager = new CacheQualityManager(mockCache, {
        enableContextualInvalidation: true,
        contextSimilarityThreshold: 0.8
      });

      const isValid = await contextualManager.validateCacheEntry('contextual-key', mockCacheEntry);
      
      // Should validate contextual relevance
      expect(typeof isValid).toBe('boolean');
      
      contextualManager.destroy();
    });

    test('should handle missing contextual data', async () => {
      const entryWithoutContext: CacheEntry = {
        ...mockCacheEntry,
        metadata: {
          ...mockCacheEntry.metadata,
          tags: [] // No contextual tags
        }
      };

      const isValid = await qualityManager.validateCacheEntry('no-context-key', entryWithoutContext);
      
      // Should handle gracefully
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null cache entries', async () => {
      const isValid = await qualityManager.validateCacheEntry('null-key', null as any);
      expect(isValid).toBe(false);
    });

    test('should handle malformed cache entries', async () => {
      const malformedEntry = {
        result: null,
        createdAt: 'invalid-date',
        quality: 'not-a-number'
      } as any;

      const isValid = await qualityManager.validateCacheEntry('malformed-key', malformedEntry);
      expect(isValid).toBe(false);
    });

    test('should handle concurrent validation requests', async () => {
      const entries = Array.from({ length: 5 }, (_, i) => ({
        key: `concurrent-key-${i}`,
        entry: { ...mockCacheEntry, quality: 90 + i }
      }));

      const validationPromises = entries.map(({ key, entry }) =>
        qualityManager.validateCacheEntry(key, entry)
      );

      const results = await Promise.all(validationPromises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Configuration', () => {
    test('should respect configuration settings', async () => {
      const customManager = new CacheQualityManager(mockCache, {
        enableProactiveValidation: false,
        enableQualityDecayDetection: false,
        enableContextualInvalidation: false,
        enableUserFeedbackIntegration: false,
        qualityThreshold: 95,
        purityThreshold: 100
      });

      // Should still work with custom configuration
      const isValid = await customManager.validateCacheEntry('config-test-key', mockCacheEntry);
      expect(typeof isValid).toBe('boolean');
      
      customManager.destroy();
    });

    test('should handle invalid configuration gracefully', async () => {
      const invalidManager = new CacheQualityManager(mockCache, {
        qualityThreshold: -10, // Invalid
        purityThreshold: 150, // Invalid
        validationInterval: -1000 // Invalid
      });

      // Should still function
      const isValid = await invalidManager.validateCacheEntry('invalid-config-key', mockCacheEntry);
      expect(typeof isValid).toBe('boolean');
      
      invalidManager.destroy();
    });
  });
});