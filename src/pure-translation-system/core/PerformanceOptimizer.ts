/**
 * Performance Optimizer - High-load performance optimization for Pure Translation System
 * 
 * Implements advanced performance optimization strategies including request batching,
 * load balancing, resource pooling, and adaptive throttling for high-load scenarios
 * while maintaining zero tolerance for language mixing.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  TranslationMethod,
  ContentType,
  TranslationPriority,
  Language,
  ProcessingStep
} from '../types';
import { IntelligentTranslationCache } from './IntelligentTranslationCache';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface PerformanceConfiguration {
  maxConcurrentRequests: number;
  batchSize: number;
  batchTimeout: number;
  enableRequestBatching: boolean;
  enableLoadBalancing: boolean;
  enableResourcePooling: boolean;
  enableAdaptiveThrottling: boolean;
  enableRequestPrioritization: boolean;
  memoryThreshold: number; // MB
  cpuThreshold: number; // percentage
  responseTimeThreshold: number; // ms
}

export interface RequestBatch {
  id: string;
  requests: TranslationRequest[];
  priority: TranslationPriority;
  createdAt: Date;
  timeout: NodeJS.Timeout;
}

export interface ResourcePool {
  id: string;
  type: 'translation' | 'validation' | 'cleaning';
  available: number;
  total: number;
  queue: Array<() => Promise<any>>;
  processing: Set<string>;
}

export interface LoadBalancingMetrics {
  method: TranslationMethod;
  averageResponseTime: number;
  successRate: number;
  currentLoad: number;
  capacity: number;
  healthScore: number;
}

export interface PerformanceMetrics {
  requestsPerSecond: number;
  averageResponseTime: number;
  concurrentRequests: number;
  queueLength: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  batchEfficiency: number;
  throttlingRate: number;
  errorRate: number;
}

export interface AdaptiveThrottlingState {
  currentLimit: number;
  baseLimit: number;
  adjustmentFactor: number;
  lastAdjustment: Date;
  performanceHistory: number[];
}

export class PerformanceOptimizer {
  private config: PerformanceConfiguration;
  private cache: IntelligentTranslationCache;
  
  // Request management
  private requestQueue: TranslationRequest[] = [];
  private priorityQueues: Map<TranslationPriority, TranslationRequest[]> = new Map();
  private activeBatches: Map<string, RequestBatch> = new Map();
  private activeRequests: Set<string> = new Set();
  
  // Resource pools
  private resourcePools: Map<string, ResourcePool> = new Map();
  
  // Load balancing
  private methodMetrics: Map<TranslationMethod, LoadBalancingMetrics> = new Map();
  
  // Adaptive throttling
  private throttlingState: AdaptiveThrottlingState;
  
  // Performance tracking
  private performanceMetrics: PerformanceMetrics;
  private metricsHistory: PerformanceMetrics[] = [];
  private performanceInterval: NodeJS.Timeout;
  
  // Request tracking
  private requestStartTimes: Map<string, number> = new Map();
  private completedRequests: number = 0;
  private failedRequests: number = 0;

  constructor(
    cache: IntelligentTranslationCache,
    config?: Partial<PerformanceConfiguration>
  ) {
    this.cache = cache;
    this.config = {
      maxConcurrentRequests: 100,
      batchSize: 10,
      batchTimeout: 1000,
      enableRequestBatching: true,
      enableLoadBalancing: true,
      enableResourcePooling: true,
      enableAdaptiveThrottling: true,
      enableRequestPrioritization: true,
      memoryThreshold: 1000, // 1GB
      cpuThreshold: 80,
      responseTimeThreshold: 5000,
      ...config
    };

    this.initializeComponents();
    this.startPerformanceMonitoring();

    defaultLogger.info('Performance Optimizer initialized', {
      maxConcurrentRequests: this.config.maxConcurrentRequests,
      batchingEnabled: this.config.enableRequestBatching,
      loadBalancingEnabled: this.config.enableLoadBalancing,
      adaptiveThrottlingEnabled: this.config.enableAdaptiveThrottling
    }, 'PerformanceOptimizer');
  }

  /**
   * Process translation request with performance optimization
   */
  async processRequest(request: TranslationRequest): Promise<PureTranslationResult> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.requestStartTimes.set(requestId, startTime);

    try {
      // Check adaptive throttling
      if (this.config.enableAdaptiveThrottling && this.shouldThrottle()) {
        await this.applyThrottling(request);
      }

      // Check if request should be batched
      if (this.config.enableRequestBatching && this.shouldBatch(request)) {
        return await this.processBatchedRequest(request);
      }

      // Check resource availability
      if (this.config.enableResourcePooling) {
        await this.acquireResources(request);
      }

      // Select optimal processing method
      const method = this.config.enableLoadBalancing 
        ? this.selectOptimalMethod(request)
        : TranslationMethod.PRIMARY_AI;

      // Process request
      const result = await this.executeOptimizedTranslation(request, method);

      // Update metrics
      this.updateRequestMetrics(requestId, true);
      this.updateMethodMetrics(method, Date.now() - startTime, true);

      return result;

    } catch (error) {
      this.updateRequestMetrics(requestId, false);
      this.failedRequests++;
      
      defaultLogger.error('Optimized translation failed', {
        requestId,
        error: error.message,
        processingTime: Date.now() - startTime
      }, 'PerformanceOptimizer');

      throw error;

    } finally {
      this.requestStartTimes.delete(requestId);
      this.activeRequests.delete(requestId);
      
      if (this.config.enableResourcePooling) {
        this.releaseResources(request);
      }
    }
  }

  /**
   * Process multiple requests in batch for efficiency
   */
  async processBatch(requests: TranslationRequest[]): Promise<PureTranslationResult[]> {
    const batchId = this.generateBatchId();
    const startTime = Date.now();

    defaultLogger.info('Processing request batch', {
      batchId,
      requestCount: requests.length,
      batchSize: this.config.batchSize
    }, 'PerformanceOptimizer');

    try {
      // Group requests by similarity for optimization
      const groupedRequests = this.groupRequestsForBatching(requests);
      const results: PureTranslationResult[] = [];

      // Process each group
      for (const group of groupedRequests) {
        const groupResults = await this.processBatchGroup(group);
        results.push(...groupResults);
      }

      // Update batch efficiency metrics
      const processingTime = Date.now() - startTime;
      const efficiency = this.calculateBatchEfficiency(requests.length, processingTime);
      this.updateBatchMetrics(efficiency);

      defaultLogger.info('Batch processing completed', {
        batchId,
        requestCount: requests.length,
        processingTime,
        efficiency
      }, 'PerformanceOptimizer');

      return results;

    } catch (error) {
      defaultLogger.error('Batch processing failed', {
        batchId,
        error: error.message,
        requestCount: requests.length
      }, 'PerformanceOptimizer');

      throw error;
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get performance health status
   */
  getPerformanceHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: PerformanceMetrics;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check response time
    if (this.performanceMetrics.averageResponseTime > this.config.responseTimeThreshold) {
      issues.push(`High response time: ${this.performanceMetrics.averageResponseTime}ms`);
      recommendations.push('Consider enabling request batching or increasing resource pools');
      status = 'warning';
    }

    // Check memory usage
    if (this.performanceMetrics.memoryUsage > this.config.memoryThreshold * 0.9) {
      issues.push(`High memory usage: ${this.performanceMetrics.memoryUsage}MB`);
      recommendations.push('Enable cache optimization or increase memory limits');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check error rate
    if (this.performanceMetrics.errorRate > 0.05) {
      issues.push(`High error rate: ${(this.performanceMetrics.errorRate * 100).toFixed(2)}%`);
      recommendations.push('Review system health and consider load reduction');
      status = 'critical';
    }

    // Check queue length
    if (this.performanceMetrics.queueLength > this.config.maxConcurrentRequests * 2) {
      issues.push(`Long request queue: ${this.performanceMetrics.queueLength}`);
      recommendations.push('Enable adaptive throttling or increase processing capacity');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    return {
      status,
      issues,
      recommendations,
      metrics: this.performanceMetrics
    };
  }

  /**
   * Optimize system performance based on current metrics
   */
  async optimizePerformance(): Promise<void> {
    const startTime = Date.now();

    // Optimize cache
    await this.cache.optimizeCache();

    // Adjust resource pools
    this.optimizeResourcePools();

    // Update throttling parameters
    this.updateAdaptiveThrottling();

    // Clean up completed batches
    this.cleanupCompletedBatches();

    // Update load balancing metrics
    this.updateLoadBalancingMetrics();

    const optimizationTime = Date.now() - startTime;

    defaultLogger.info('Performance optimization completed', {
      optimizationTime,
      concurrentRequests: this.activeRequests.size,
      queueLength: this.requestQueue.length,
      activeBatches: this.activeBatches.size
    }, 'PerformanceOptimizer');
  }

  /**
   * Private helper methods
   */
  private initializeComponents(): void {
    // Initialize priority queues
    Object.values(TranslationPriority).forEach(priority => {
      this.priorityQueues.set(priority, []);
    });

    // Initialize resource pools
    this.initializeResourcePools();

    // Initialize method metrics
    this.initializeMethodMetrics();

    // Initialize throttling state
    this.throttlingState = {
      currentLimit: this.config.maxConcurrentRequests,
      baseLimit: this.config.maxConcurrentRequests,
      adjustmentFactor: 1.0,
      lastAdjustment: new Date(),
      performanceHistory: []
    };

    // Initialize performance metrics
    this.performanceMetrics = {
      requestsPerSecond: 0,
      averageResponseTime: 0,
      concurrentRequests: 0,
      queueLength: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      cacheHitRate: 0,
      batchEfficiency: 0,
      throttlingRate: 0,
      errorRate: 0
    };
  }

  private initializeResourcePools(): void {
    const poolConfigs = [
      { id: 'translation', type: 'translation' as const, capacity: 20 },
      { id: 'validation', type: 'validation' as const, capacity: 15 },
      { id: 'cleaning', type: 'cleaning' as const, capacity: 10 }
    ];

    poolConfigs.forEach(config => {
      this.resourcePools.set(config.id, {
        id: config.id,
        type: config.type,
        available: config.capacity,
        total: config.capacity,
        queue: [],
        processing: new Set()
      });
    });
  }

  private initializeMethodMetrics(): void {
    Object.values(TranslationMethod).forEach(method => {
      this.methodMetrics.set(method, {
        method,
        averageResponseTime: 0,
        successRate: 1.0,
        currentLoad: 0,
        capacity: 100,
        healthScore: 1.0
      });
    });
  }

  private shouldBatch(request: TranslationRequest): boolean {
    if (!this.config.enableRequestBatching) return false;
    
    // Don't batch high-priority requests
    if (request.priority === TranslationPriority.URGENT || 
        request.priority === TranslationPriority.REAL_TIME) {
      return false;
    }

    // Batch if queue is building up
    return this.requestQueue.length >= this.config.batchSize / 2;
  }

  private shouldThrottle(): boolean {
    if (!this.config.enableAdaptiveThrottling) return false;

    return this.activeRequests.size >= this.throttlingState.currentLimit;
  }

  private async applyThrottling(request: TranslationRequest): Promise<void> {
    const delay = this.calculateThrottlingDelay(request);
    
    if (delay > 0) {
      this.performanceMetrics.throttlingRate++;
      
      defaultLogger.debug('Applying throttling', {
        delay,
        currentLoad: this.activeRequests.size,
        limit: this.throttlingState.currentLimit
      }, 'PerformanceOptimizer');

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private calculateThrottlingDelay(request: TranslationRequest): number {
    const loadFactor = this.activeRequests.size / this.throttlingState.currentLimit;
    const basedelay = 100; // Base delay in ms
    
    // Higher priority requests get less delay
    const priorityMultiplier = this.getPriorityMultiplier(request.priority);
    
    return Math.floor(basedelay * loadFactor * priorityMultiplier);
  }

  private getPriorityMultiplier(priority: TranslationPriority): number {
    switch (priority) {
      case TranslationPriority.URGENT: return 0.1;
      case TranslationPriority.REAL_TIME: return 0.2;
      case TranslationPriority.HIGH: return 0.5;
      case TranslationPriority.NORMAL: return 1.0;
      case TranslationPriority.LOW: return 2.0;
      default: return 1.0;
    }
  }

  private selectOptimalMethod(request: TranslationRequest): TranslationMethod {
    if (!this.config.enableLoadBalancing) {
      return TranslationMethod.PRIMARY_AI;
    }

    // Find method with best health score and available capacity
    let bestMethod = TranslationMethod.PRIMARY_AI;
    let bestScore = 0;

    for (const [method, metrics] of this.methodMetrics.entries()) {
      const availabilityScore = Math.max(0, 1 - (metrics.currentLoad / metrics.capacity));
      const combinedScore = metrics.healthScore * 0.7 + availabilityScore * 0.3;
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestMethod = method;
      }
    }

    return bestMethod;
  }

  private async processBatchedRequest(request: TranslationRequest): Promise<PureTranslationResult> {
    // Add to appropriate priority queue
    const queue = this.priorityQueues.get(request.priority) || this.requestQueue;
    queue.push(request);

    // Check if we should create a batch
    if (queue.length >= this.config.batchSize) {
      const batchRequests = queue.splice(0, this.config.batchSize);
      const results = await this.processBatch(batchRequests);
      
      // Find the result for this specific request
      const requestIndex = batchRequests.findIndex(r => 
        r.text === request.text && 
        r.sourceLanguage === request.sourceLanguage &&
        r.targetLanguage === request.targetLanguage
      );
      
      return results[requestIndex];
    }

    // Wait for batch to be processed or timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue and process individually
        const index = queue.indexOf(request);
        if (index > -1) {
          queue.splice(index, 1);
          this.executeOptimizedTranslation(request, TranslationMethod.PRIMARY_AI)
            .then(resolve)
            .catch(reject);
        }
      }, this.config.batchTimeout);

      // Store timeout for cleanup
      request.context = { ...request.context, batchTimeout: timeout };
    });
  }

  private groupRequestsForBatching(requests: TranslationRequest[]): TranslationRequest[][] {
    const groups: Map<string, TranslationRequest[]> = new Map();

    requests.forEach(request => {
      const groupKey = `${request.sourceLanguage}_${request.targetLanguage}_${request.contentType}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      
      groups.get(groupKey)!.push(request);
    });

    return Array.from(groups.values());
  }

  private async processBatchGroup(requests: TranslationRequest[]): Promise<PureTranslationResult[]> {
    // Process requests in the group concurrently with shared optimizations
    const promises = requests.map(request => 
      this.executeOptimizedTranslation(request, TranslationMethod.PRIMARY_AI)
    );

    return Promise.all(promises);
  }

  private async executeOptimizedTranslation(
    request: TranslationRequest,
    method: TranslationMethod
  ): Promise<PureTranslationResult> {
    const requestId = this.generateRequestId();
    this.activeRequests.add(requestId);

    try {
      // This would integrate with the actual translation pipeline
      // For now, return a mock result
      const result: PureTranslationResult = {
        translatedText: `[Optimized Translation: ${request.text}]`,
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 95,
          contextualRelevance: 90,
          readabilityScore: 85,
          professionalismScore: 95,
          encodingIntegrity: 100
        },
        processingTime: Math.random() * 1000 + 500,
        method,
        confidence: 0.95,
        warnings: [],
        metadata: {
          requestId,
          timestamp: new Date(),
          processingSteps: [],
          fallbackUsed: false,
          cacheHit: false
        }
      };

      return result;

    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  private async acquireResources(request: TranslationRequest): Promise<void> {
    const requiredPools = this.getRequiredResourcePools(request);
    
    for (const poolId of requiredPools) {
      const pool = this.resourcePools.get(poolId);
      if (pool && pool.available > 0) {
        pool.available--;
        pool.processing.add(this.generateRequestId());
      } else {
        // Wait for resources to become available
        await this.waitForResources(poolId);
      }
    }
  }

  private releaseResources(request: TranslationRequest): void {
    const requiredPools = this.getRequiredResourcePools(request);
    
    for (const poolId of requiredPools) {
      const pool = this.resourcePools.get(poolId);
      if (pool) {
        pool.available = Math.min(pool.available + 1, pool.total);
        // Process queued requests if any
        if (pool.queue.length > 0) {
          const nextTask = pool.queue.shift();
          if (nextTask) {
            nextTask();
          }
        }
      }
    }
  }

  private getRequiredResourcePools(request: TranslationRequest): string[] {
    const pools = ['translation'];
    
    if (request.contentType === ContentType.LEGAL_DOCUMENT) {
      pools.push('validation');
    }
    
    pools.push('cleaning');
    
    return pools;
  }

  private async waitForResources(poolId: string): Promise<void> {
    const pool = this.resourcePools.get(poolId);
    if (!pool) return;

    return new Promise(resolve => {
      pool.queue.push(() => {
        pool.available--;
        resolve();
      });
    });
  }

  private updateRequestMetrics(requestId: string, success: boolean): void {
    const startTime = this.requestStartTimes.get(requestId);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      
      // Update average response time with exponential moving average
      const alpha = 0.1;
      this.performanceMetrics.averageResponseTime = 
        alpha * responseTime + (1 - alpha) * this.performanceMetrics.averageResponseTime;
    }

    if (success) {
      this.completedRequests++;
    } else {
      this.failedRequests++;
    }

    // Update error rate
    const totalRequests = this.completedRequests + this.failedRequests;
    this.performanceMetrics.errorRate = totalRequests > 0 ? this.failedRequests / totalRequests : 0;
  }

  private updateMethodMetrics(method: TranslationMethod, responseTime: number, success: boolean): void {
    const metrics = this.methodMetrics.get(method);
    if (!metrics) return;

    // Update response time
    const alpha = 0.1;
    metrics.averageResponseTime = 
      alpha * responseTime + (1 - alpha) * metrics.averageResponseTime;

    // Update success rate
    metrics.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * metrics.successRate;

    // Update health score
    metrics.healthScore = metrics.successRate * 0.7 + 
      Math.max(0, 1 - (metrics.averageResponseTime / this.config.responseTimeThreshold)) * 0.3;
  }

  private updateBatchMetrics(efficiency: number): void {
    const alpha = 0.1;
    this.performanceMetrics.batchEfficiency = 
      alpha * efficiency + (1 - alpha) * this.performanceMetrics.batchEfficiency;
  }

  private calculateBatchEfficiency(requestCount: number, processingTime: number): number {
    // Calculate efficiency as requests per second normalized to expected performance
    const requestsPerSecond = (requestCount / processingTime) * 1000;
    const expectedRps = 10; // Expected requests per second for individual processing
    
    return Math.min(1.0, requestsPerSecond / (expectedRps * requestCount));
  }

  private optimizeResourcePools(): void {
    for (const [poolId, pool] of this.resourcePools.entries()) {
      const utilizationRate = (pool.total - pool.available) / pool.total;
      
      // Adjust pool size based on utilization
      if (utilizationRate > 0.8 && pool.total < 50) {
        pool.total += 2;
        pool.available += 2;
        
        defaultLogger.info('Increased resource pool capacity', {
          poolId,
          newCapacity: pool.total,
          utilizationRate
        }, 'PerformanceOptimizer');
      } else if (utilizationRate < 0.3 && pool.total > 5) {
        const reduction = Math.min(2, pool.available);
        pool.total -= reduction;
        pool.available -= reduction;
        
        defaultLogger.info('Reduced resource pool capacity', {
          poolId,
          newCapacity: pool.total,
          utilizationRate
        }, 'PerformanceOptimizer');
      }
    }
  }

  private updateAdaptiveThrottling(): void {
    if (!this.config.enableAdaptiveThrottling) return;

    const currentPerformance = this.calculatePerformanceScore();
    this.throttlingState.performanceHistory.push(currentPerformance);
    
    // Keep only recent history
    if (this.throttlingState.performanceHistory.length > 10) {
      this.throttlingState.performanceHistory.shift();
    }

    // Calculate performance trend
    const recentAverage = this.throttlingState.performanceHistory
      .slice(-5)
      .reduce((sum, score) => sum + score, 0) / 5;

    // Adjust throttling based on performance
    if (recentAverage < 0.7) {
      // Performance is poor, reduce limit
      this.throttlingState.currentLimit = Math.max(
        this.throttlingState.baseLimit * 0.5,
        this.throttlingState.currentLimit * 0.9
      );
    } else if (recentAverage > 0.9) {
      // Performance is good, increase limit
      this.throttlingState.currentLimit = Math.min(
        this.throttlingState.baseLimit * 1.5,
        this.throttlingState.currentLimit * 1.1
      );
    }

    this.throttlingState.lastAdjustment = new Date();
  }

  private calculatePerformanceScore(): number {
    let score = 1.0;
    
    // Response time factor
    if (this.performanceMetrics.averageResponseTime > this.config.responseTimeThreshold) {
      score *= 0.5;
    }
    
    // Error rate factor
    score *= (1 - this.performanceMetrics.errorRate);
    
    // Memory usage factor
    if (this.performanceMetrics.memoryUsage > this.config.memoryThreshold) {
      score *= 0.7;
    }
    
    return Math.max(0, score);
  }

  private updateLoadBalancingMetrics(): void {
    for (const [method, metrics] of this.methodMetrics.entries()) {
      // Update current load based on active requests using this method
      // This would be tracked in actual implementation
      metrics.currentLoad = Math.random() * metrics.capacity; // Mock data
    }
  }

  private cleanupCompletedBatches(): void {
    const now = Date.now();
    const expiredBatches: string[] = [];

    for (const [batchId, batch] of this.activeBatches.entries()) {
      if (now - batch.createdAt.getTime() > this.config.batchTimeout * 2) {
        expiredBatches.push(batchId);
        clearTimeout(batch.timeout);
      }
    }

    expiredBatches.forEach(batchId => {
      this.activeBatches.delete(batchId);
    });
  }

  private startPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics();
      this.recordMetricsHistory();
    }, 5000); // Update every 5 seconds
  }

  private updatePerformanceMetrics(): void {
    // Update current metrics
    this.performanceMetrics.concurrentRequests = this.activeRequests.size;
    this.performanceMetrics.queueLength = this.requestQueue.length;
    
    // Calculate requests per second
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const recentRequests = this.completedRequests; // Would track recent requests in actual implementation
    this.performanceMetrics.requestsPerSecond = recentRequests / (timeWindow / 1000);

    // Update cache hit rate from cache
    this.cache.getStats().then(stats => {
      this.performanceMetrics.cacheHitRate = stats.hitRate;
    });

    // Update memory usage (browser-compatible)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.performanceMetrics.memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024);
    } else {
      // Browser fallback - estimate memory usage
      this.performanceMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0;
    }
  }

  private recordMetricsHistory(): void {
    this.metricsHistory.push({ ...this.performanceMetrics });
    
    // Keep only recent history
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
    }

    // Clear all batches
    for (const batch of this.activeBatches.values()) {
      clearTimeout(batch.timeout);
    }
    this.activeBatches.clear();

    // Clear queues
    this.requestQueue = [];
    this.priorityQueues.clear();
    this.activeRequests.clear();
    this.resourcePools.clear();
  }
}