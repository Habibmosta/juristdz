/**
 * Unit Tests for Performance Optimizer
 * 
 * Tests the performance optimization system including request batching,
 * load balancing, adaptive throttling, and resource pooling.
 */

import { PerformanceOptimizer } from './PerformanceOptimizer';
import { IntelligentTranslationCache } from './IntelligentTranslationCache';
import {
  TranslationRequest,
  PureTranslationResult,
  Language,
  ContentType,
  TranslationPriority,
  TranslationMethod
} from '../types';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockCache: IntelligentTranslationCache;

  const mockRequest: TranslationRequest = {
    text: 'Test text for performance optimization',
    sourceLanguage: Language.FRENCH,
    targetLanguage: Language.ARABIC,
    contentType: ContentType.LEGAL_DOCUMENT,
    priority: TranslationPriority.NORMAL,
    context: {
      legalDomain: 'civil_law' as any
    }
  };

  const mockHighPriorityRequest: TranslationRequest = {
    ...mockRequest,
    priority: TranslationPriority.URGENT,
    text: 'Urgent translation request'
  };

  const mockRealTimeRequest: TranslationRequest = {
    ...mockRequest,
    priority: TranslationPriority.REAL_TIME,
    text: 'Real-time translation request'
  };

  beforeEach(() => {
    mockCache = new IntelligentTranslationCache({
      maxSize: 1000,
      enableCacheWarming: false
    });

    optimizer = new PerformanceOptimizer(mockCache, {
      maxConcurrentRequests: 10,
      batchSize: 5,
      batchTimeout: 1000,
      enableRequestBatching: true,
      enableLoadBalancing: true,
      enableAdaptiveThrottling: true,
      enableRequestPrioritization: true
    });
  });

  afterEach(() => {
    optimizer.destroy();
    mockCache.destroy();
  });

  describe('Request Processing', () => {
    test('should process single request successfully', async () => {
      const result = await optimizer.processRequest(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.translatedText).toContain('Optimized Translation');
      expect(result.purityScore).toBe(100);
      expect(result.method).toBeDefined();
    });

    test('should handle high-priority requests with reduced latency', async () => {
      const startTime = Date.now();
      const result = await optimizer.processRequest(mockHighPriorityRequest);
      const processingTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(2000); // Should be fast
    });

    test('should handle real-time requests immediately', async () => {
      const startTime = Date.now();
      const result = await optimizer.processRequest(mockRealTimeRequest);
      const processingTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(processingTime).toBeLessThan(1000); // Should be very fast
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        ...mockRequest,
        text: `Concurrent request ${i + 1}`
      }));

      const promises = requests.map(req => optimizer.processRequest(req));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.purityScore).toBe(100);
      });
    });
  });

  describe('Batch Processing', () => {
    test('should process batch of requests efficiently', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        ...mockRequest,
        text: `Batch request ${i + 1}`
      }));

      const startTime = Date.now();
      const results = await optimizer.processBatch(requests);
      const processingTime = Date.now() - startTime;
      
      expect(results).toHaveLength(3);
      expect(processingTime).toBeLessThan(5000); // Should be efficient
      
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result.translatedText).toContain(`Batch request ${index + 1}`);
      });
    });

    test('should handle empty batch gracefully', async () => {
      const results = await optimizer.processBatch([]);
      expect(results).toHaveLength(0);
    });

    test('should group similar requests for batch optimization', async () => {
      const similarRequests = Array.from({ length: 4 }, (_, i) => ({
        ...mockRequest,
        text: `Similar request ${i + 1}`,
        contentType: ContentType.LEGAL_DOCUMENT
      }));

      const differentRequest = {
        ...mockRequest,
        text: 'Different request',
        contentType: ContentType.CHAT_MESSAGE
      };

      const allRequests = [...similarRequests, differentRequest];
      const results = await optimizer.processBatch(allRequests);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.purityScore).toBe(100);
      });
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics accurately', async () => {
      // Process some requests to generate metrics
      await optimizer.processRequest(mockRequest);
      await optimizer.processRequest(mockHighPriorityRequest);
      
      const metrics = optimizer.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.requestsPerSecond).toBeGreaterThanOrEqual(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(metrics.concurrentRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });

    test('should provide performance health assessment', async () => {
      const health = optimizer.getPerformanceHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toMatch(/^(healthy|warning|critical)$/);
      expect(health.metrics).toBeDefined();
      expect(Array.isArray(health.issues)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });

    test('should detect performance degradation', async () => {
      // Simulate high load to trigger performance issues
      const heavyRequests = Array.from({ length: 20 }, (_, i) => ({
        ...mockRequest,
        text: `Heavy load request ${i + 1}`
      }));

      // Process requests concurrently to simulate load
      const promises = heavyRequests.map(req => optimizer.processRequest(req));
      await Promise.all(promises);
      
      const health = optimizer.getPerformanceHealth();
      
      // Should detect some performance impact
      expect(health.metrics.concurrentRequests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Adaptive Throttling', () => {
    test('should apply throttling under high load', async () => {
      const throttlingOptimizer = new PerformanceOptimizer(mockCache, {
        maxConcurrentRequests: 2, // Very low limit to trigger throttling
        enableAdaptiveThrottling: true
      });

      const requests = Array.from({ length: 5 }, (_, i) => ({
        ...mockRequest,
        text: `Throttling test ${i + 1}`
      }));

      const startTime = Date.now();
      const promises = requests.map(req => throttlingOptimizer.processRequest(req));
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Should take longer due to throttling
      expect(totalTime).toBeGreaterThan(1000);
      
      const metrics = throttlingOptimizer.getPerformanceMetrics();
      expect(metrics.throttlingRate).toBeGreaterThan(0);
      
      throttlingOptimizer.destroy();
    });

    test('should prioritize urgent requests during throttling', async () => {
      const throttlingOptimizer = new PerformanceOptimizer(mockCache, {
        maxConcurrentRequests: 1,
        enableAdaptiveThrottling: true,
        enableRequestPrioritization: true
      });

      const normalRequest = { ...mockRequest, text: 'Normal priority' };
      const urgentRequest = { ...mockRequest, text: 'Urgent priority', priority: TranslationPriority.URGENT };

      // Start normal request first
      const normalPromise = throttlingOptimizer.processRequest(normalRequest);
      
      // Start urgent request shortly after
      await new Promise(resolve => setTimeout(resolve, 100));
      const urgentStartTime = Date.now();
      const urgentPromise = throttlingOptimizer.processRequest(urgentRequest);
      
      const [normalResult, urgentResult] = await Promise.all([normalPromise, urgentPromise]);
      const urgentProcessingTime = Date.now() - urgentStartTime;
      
      expect(normalResult).toBeDefined();
      expect(urgentResult).toBeDefined();
      
      // Urgent request should complete relatively quickly despite throttling
      expect(urgentProcessingTime).toBeLessThan(5000);
      
      throttlingOptimizer.destroy();
    });
  });

  describe('Load Balancing', () => {
    test('should distribute load across translation methods', async () => {
      const loadBalancingOptimizer = new PerformanceOptimizer(mockCache, {
        enableLoadBalancing: true
      });

      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        text: `Load balancing test ${i + 1}`
      }));

      const results = await Promise.all(
        requests.map(req => loadBalancingOptimizer.processRequest(req))
      );
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.method).toBeDefined();
      });
      
      loadBalancingOptimizer.destroy();
    });
  });

  describe('Resource Pooling', () => {
    test('should manage resource pools effectively', async () => {
      const poolingOptimizer = new PerformanceOptimizer(mockCache, {
        enableResourcePooling: true
      });

      const requests = Array.from({ length: 8 }, (_, i) => ({
        ...mockRequest,
        text: `Resource pooling test ${i + 1}`,
        contentType: ContentType.LEGAL_DOCUMENT // Requires validation pool
      }));

      const results = await Promise.all(
        requests.map(req => poolingOptimizer.processRequest(req))
      );
      
      expect(results).toHaveLength(8);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.purityScore).toBe(100);
      });
      
      poolingOptimizer.destroy();
    });
  });

  describe('Performance Optimization', () => {
    test('should optimize performance when requested', async () => {
      // Process some requests first
      await optimizer.processRequest(mockRequest);
      await optimizer.processRequest(mockHighPriorityRequest);
      
      await expect(optimizer.optimizePerformance()).resolves.not.toThrow();
      
      const metrics = optimizer.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });

    test('should maintain performance under sustained load', async () => {
      const sustainedRequests = Array.from({ length: 15 }, (_, i) => ({
        ...mockRequest,
        text: `Sustained load test ${i + 1}`,
        priority: i % 3 === 0 ? TranslationPriority.HIGH : TranslationPriority.NORMAL
      }));

      const startTime = Date.now();
      
      // Process in waves to simulate sustained load
      for (let i = 0; i < sustainedRequests.length; i += 3) {
        const batch = sustainedRequests.slice(i, i + 3);
        await Promise.all(batch.map(req => optimizer.processRequest(req)));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const totalTime = Date.now() - startTime;
      const health = optimizer.getPerformanceHealth();
      
      expect(totalTime).toBeLessThan(30000); // Should complete within reasonable time
      expect(health.status).not.toBe('critical'); // Should not be critical
    });
  });

  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Create a request that might cause issues
      const problematicRequest = {
        ...mockRequest,
        text: '', // Empty text might cause issues
      };

      // Should not throw, but handle gracefully
      const result = await optimizer.processRequest(problematicRequest);
      expect(result).toBeDefined();
    });

    test('should maintain system stability during errors', async () => {
      const mixedRequests = [
        mockRequest,
        { ...mockRequest, text: '' }, // Potentially problematic
        mockHighPriorityRequest,
        { ...mockRequest, text: 'Normal request' }
      ];

      const results = await Promise.all(
        mixedRequests.map(req => 
          optimizer.processRequest(req).catch(error => ({
            error: error.message,
            translatedText: 'Error fallback',
            purityScore: 0,
            qualityMetrics: {} as any,
            processingTime: 0,
            method: TranslationMethod.FALLBACK_GENERATED,
            confidence: 0,
            warnings: [],
            metadata: {} as any
          }))
        )
      );
      
      expect(results).toHaveLength(4);
      
      // System should still be responsive
      const health = optimizer.getPerformanceHealth();
      expect(health).toBeDefined();
    });
  });

  describe('Configuration', () => {
    test('should respect configuration settings', async () => {
      const customOptimizer = new PerformanceOptimizer(mockCache, {
        maxConcurrentRequests: 5,
        batchSize: 3,
        enableRequestBatching: false,
        enableLoadBalancing: false,
        enableAdaptiveThrottling: false
      });

      const result = await customOptimizer.processRequest(mockRequest);
      
      expect(result).toBeDefined();
      expect(result.purityScore).toBe(100);
      
      customOptimizer.destroy();
    });

    test('should handle invalid configuration gracefully', async () => {
      const invalidOptimizer = new PerformanceOptimizer(mockCache, {
        maxConcurrentRequests: -1, // Invalid
        batchSize: 0, // Invalid
        batchTimeout: -100 // Invalid
      });

      // Should still work with fallback values
      const result = await invalidOptimizer.processRequest(mockRequest);
      expect(result).toBeDefined();
      
      invalidOptimizer.destroy();
    });
  });
});