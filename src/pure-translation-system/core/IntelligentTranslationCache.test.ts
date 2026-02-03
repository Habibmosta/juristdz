/**
 * Unit Tests for Intelligent Translation Cache
 * 
 * Tests the intelligent caching system with quality-based invalidation,
 * performance optimization, and cache maintenance functionality.
 */

import { IntelligentTranslationCache } from './IntelligentTranslationCache';
import {
  PureTranslationResult,
  TranslationRequest,
  Language,
  ContentType,
  TranslationMethod,
  TranslationPriority
} from '../types';

describe('IntelligentTranslationCache', () => {
  let cache: IntelligentTranslationCache;
  
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
    purityScore: 85,
    qualityMetrics: {
      ...mockHighQualityResult.qualityMetrics,
      purityScore: 85,
      terminologyAccuracy: 70
    },
    confidence: 0.6
  };

  const mockRequest: TranslationRequest = {
    text: 'Test text for translation',
    sourceLanguage: Language.FRENCH,
    targetLanguage: Language.ARABIC,
    contentType: ContentType.LEGAL_DOCUMENT,
    priority: TranslationPriority.NORMAL,
    context: {
      legalDomain: 'civil_law' as any
    }
  };

  beforeEach(() => {
    cache = new IntelligentTranslationCache({
      maxSize: 100,
      qualityThreshold: 90,
      enableIntelligentEviction: true,
      enableCacheWarming: false, // Disable for testing
      enableQualityBasedInvalidation: true
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Cache Operations', () => {
    test('should cache and retrieve high-quality translations', async () => {
      const key = 'test-key-1';
      
      await cache.set(key, mockHighQualityResult);
      const result = await cache.get(key);
      
      expect(result).toBeDefined();
      expect(result?.translatedText).toBe(mockHighQualityResult.translatedText);
      expect(result?.purityScore).toBe(100);
    });

    test('should reject low-quality translations when zero tolerance is enabled', async () => {
      const key = 'test-key-2';
      
      // Mock zero tolerance enabled
      jest.spyOn(require('../config/PureTranslationConfig'), 'pureTranslationConfig', 'get')
        .mockReturnValue({
          isZeroToleranceEnabled: () => true
        });
      
      await cache.set(key, mockLowQualityResult);
      const result = await cache.get(key);
      
      expect(result).toBeNull();
    });

    test('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should clear all cache entries', async () => {
      await cache.set('key1', mockHighQualityResult);
      await cache.set('key2', mockHighQualityResult);
      
      await cache.clear();
      
      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Quality-Based Caching', () => {
    test('should reject translations below quality threshold', async () => {
      const lowQualityCache = new IntelligentTranslationCache({
        qualityThreshold: 95,
        enableQualityBasedInvalidation: true
      });

      const key = 'low-quality-key';
      await lowQualityCache.set(key, mockLowQualityResult);
      const result = await lowQualityCache.get(key);
      
      expect(result).toBeNull();
      
      lowQualityCache.destroy();
    });

    test('should cache translations above quality threshold', async () => {
      const key = 'high-quality-key';
      
      await cache.set(key, mockHighQualityResult);
      const result = await cache.get(key);
      
      expect(result).toBeDefined();
      expect(result?.purityScore).toBe(100);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate entries matching pattern', async () => {
      await cache.set('user_123_doc1', mockHighQualityResult);
      await cache.set('user_123_doc2', mockHighQualityResult);
      await cache.set('user_456_doc1', mockHighQualityResult);
      
      await cache.invalidate('user_123_.*');
      
      const result1 = await cache.get('user_123_doc1');
      const result2 = await cache.get('user_123_doc2');
      const result3 = await cache.get('user_456_doc1');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeDefined();
    });

    test('should handle invalid regex patterns gracefully', async () => {
      await cache.set('test-key', mockHighQualityResult);
      
      // This should not throw an error
      await expect(cache.invalidate('[invalid-regex')).resolves.not.toThrow();
      
      // Original entry should still exist
      const result = await cache.get('test-key');
      expect(result).toBeDefined();
    });
  });

  describe('Cache Statistics', () => {
    test('should provide accurate cache statistics', async () => {
      await cache.set('key1', mockHighQualityResult);
      await cache.set('key2', mockHighQualityResult);
      
      // Simulate cache hits
      await cache.get('key1');
      await cache.get('key1');
      await cache.get('key2');
      
      // Simulate cache miss
      await cache.get('non-existent');
      
      const stats = await cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.75);
    });

    test('should track performance metrics', async () => {
      await cache.set('perf-key', mockHighQualityResult);
      await cache.get('perf-key');
      
      const metrics = cache.getPerformanceMetrics();
      
      expect(metrics.hitRate).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Cache Health Assessment', () => {
    test('should provide health status for healthy cache', async () => {
      // Fill cache with high-quality entries
      for (let i = 0; i < 10; i++) {
        await cache.set(`key${i}`, mockHighQualityResult);
      }
      
      const health = cache.getCacheHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.issues).toHaveLength(0);
      expect(health.metrics.hitRate).toBeGreaterThanOrEqual(0);
    });

    test('should detect low hit rate issues', async () => {
      // Simulate low hit rate by making many misses
      for (let i = 0; i < 10; i++) {
        await cache.get(`non-existent-${i}`);
      }
      
      const health = cache.getCacheHealth();
      
      expect(health.status).toBe('warning');
      expect(health.issues.some(issue => issue.includes('hit rate'))).toBe(true);
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize cache performance', async () => {
      // Fill cache with entries
      for (let i = 0; i < 20; i++) {
        await cache.set(`key${i}`, mockHighQualityResult);
      }
      
      await expect(cache.optimizeCache()).resolves.not.toThrow();
      
      const stats = await cache.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle cache warming', async () => {
      const requests: TranslationRequest[] = [
        { ...mockRequest, text: 'Text 1' },
        { ...mockRequest, text: 'Text 2' },
        { ...mockRequest, text: 'Text 3' }
      ];
      
      await expect(cache.warmCache(requests)).resolves.not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should respect memory limits', async () => {
      const smallCache = new IntelligentTranslationCache({
        maxSize: 5,
        maxMemoryUsage: 1, // 1MB limit
        enableIntelligentEviction: true
      });
      
      // Fill cache beyond memory limit
      for (let i = 0; i < 10; i++) {
        await smallCache.set(`key${i}`, mockHighQualityResult);
      }
      
      const stats = await smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(5);
      
      smallCache.destroy();
    });

    test('should perform intelligent eviction', async () => {
      const evictionCache = new IntelligentTranslationCache({
        maxSize: 3,
        enableIntelligentEviction: true
      });
      
      // Add entries with different access patterns
      await evictionCache.set('frequent', mockHighQualityResult);
      await evictionCache.set('infrequent', mockHighQualityResult);
      await evictionCache.set('recent', mockHighQualityResult);
      
      // Access 'frequent' multiple times
      await evictionCache.get('frequent');
      await evictionCache.get('frequent');
      await evictionCache.get('frequent');
      
      // Add one more entry to trigger eviction
      await evictionCache.set('new', mockHighQualityResult);
      
      // 'frequent' should still be there due to high access count
      const frequentResult = await evictionCache.get('frequent');
      expect(frequentResult).toBeDefined();
      
      evictionCache.destroy();
    });
  });

  describe('TTL and Expiration', () => {
    test('should respect TTL settings', async () => {
      const shortTtl = 100; // 100ms
      await cache.set('ttl-key', mockHighQualityResult, shortTtl);
      
      // Should be available immediately
      let result = await cache.get('ttl-key');
      expect(result).toBeDefined();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired now
      result = await cache.get('ttl-key');
      expect(result).toBeNull();
    });

    test('should handle default TTL', async () => {
      await cache.set('default-ttl-key', mockHighQualityResult);
      
      const result = await cache.get('default-ttl-key');
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed cache keys gracefully', async () => {
      const malformedKey = '';
      
      await expect(cache.set(malformedKey, mockHighQualityResult)).resolves.not.toThrow();
      await expect(cache.get(malformedKey)).resolves.not.toThrow();
    });

    test('should handle null/undefined values gracefully', async () => {
      const key = 'null-test';
      
      // These should not crash the cache
      await expect(cache.get(key)).resolves.toBeNull();
      
      // Setting null should be handled gracefully
      const result = await cache.get(key);
      expect(result).toBeNull();
    });
  });
});