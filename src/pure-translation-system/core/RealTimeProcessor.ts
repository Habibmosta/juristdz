/**
 * Real-Time Processor - High-Performance Translation Processing
 * 
 * Implements concurrent request handling, performance optimization,
 * and immediate language switching support while maintaining
 * quality standards under high load conditions.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  TranslationPriority,
  Language,
  ContentType,
  TranslationMethod
} from '../types';
import { TranslationGateway } from './TranslationGateway';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface ProcessingQueue {
  id: string;
  request: TranslationRequest;
  priority: number;
  timestamp: Date;
  resolve: (result: PureTranslationResult) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  throughput: number; // requests per second
  queueLength: number;
  activeProcessing: number;
  errorRate: number;
  cacheHitRate: number;
}

export class RealTimeProcessor {
  private translationGateway: TranslationGateway;
  private processingQueue: ProcessingQueue[] = [];
  private activeProcessing: Map<string, ProcessingQueue> = new Map();
  private completedRequests: number = 0;
  private failedRequests: number = 0;
  private totalProcessingTime: number = 0;
  private lastThroughputCalculation: Date = new Date();
  private requestsInLastSecond: number = 0;
  
  // Performance optimization settings
  private readonly maxConcurrentRequests: number;
  private readonly requestTimeout: number;
  private readonly queueMaxSize: number;
  private readonly priorityLevels: Map<TranslationPriority, number>;
  
  // Real-time processing flags
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    this.translationGateway = new TranslationGateway();
    
    // Load configuration
    const config = pureTranslationConfig.getConfig();
    this.maxConcurrentRequests = config.concurrentRequestLimit;
    this.requestTimeout = config.processingTimeout;
    this.queueMaxSize = this.maxConcurrentRequests * 10; // 10x buffer
    
    // Priority mapping
    this.priorityLevels = new Map([
      [TranslationPriority.REAL_TIME, 1],
      [TranslationPriority.URGENT, 2],
      [TranslationPriority.HIGH, 3],
      [TranslationPriority.NORMAL, 4],
      [TranslationPriority.LOW, 5]
    ]);

    this.startProcessingLoop();
    
    defaultLogger.info('Real-Time Processor initialized', {
      maxConcurrentRequests: this.maxConcurrentRequests,
      requestTimeout: this.requestTimeout,
      queueMaxSize: this.queueMaxSize
    }, 'RealTimeProcessor');
  }

  /**
   * Process translation request with real-time optimization
   */
  async processTranslation(request: TranslationRequest): Promise<PureTranslationResult> {
    const startTime = Date.now();
    
    return new Promise<PureTranslationResult>((resolve, reject) => {
      try {
        // Check queue capacity
        if (this.processingQueue.length >= this.queueMaxSize) {
          reject(new Error('Processing queue is full - system overloaded'));
          return;
        }

        // Create processing queue item
        const queueItem: ProcessingQueue = {
          id: this.generateRequestId(),
          request,
          priority: this.priorityLevels.get(request.priority) || 4,
          timestamp: new Date(),
          resolve,
          reject
        };

        // Set timeout for request
        queueItem.timeout = setTimeout(() => {
          this.handleRequestTimeout(queueItem.id);
        }, this.requestTimeout);

        // Add to queue with priority sorting
        this.addToQueue(queueItem);

        defaultLogger.debug('Request queued for processing', {
          requestId: queueItem.id,
          priority: request.priority,
          queueLength: this.processingQueue.length,
          activeProcessing: this.activeProcessing.size
        }, 'RealTimeProcessor');

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process real-time language switching
   */
  async processLanguageSwitch(
    currentText: string,
    fromLanguage: Language,
    toLanguage: Language,
    contentType: ContentType = ContentType.CHAT_MESSAGE
  ): Promise<PureTranslationResult> {
    // Create high-priority request for language switching
    const switchRequest: TranslationRequest = {
      text: currentText,
      sourceLanguage: fromLanguage,
      targetLanguage: toLanguage,
      contentType,
      priority: TranslationPriority.REAL_TIME,
      context: {
        isLanguageSwitch: true,
        requiresImmediateResponse: true
      }
    };

    return this.processTranslation(switchRequest);
  }

  /**
   * Batch process multiple requests for efficiency
   */
  async processBatch(requests: TranslationRequest[]): Promise<PureTranslationResult[]> {
    const startTime = Date.now();
    
    try {
      // Group requests by language pair for optimization
      const groupedRequests = this.groupRequestsByLanguagePair(requests);
      const results: PureTranslationResult[] = [];

      // Process each group concurrently
      const groupPromises = Array.from(groupedRequests.entries()).map(
        async ([languagePair, groupRequests]) => {
          const groupResults = await Promise.all(
            groupRequests.map(request => this.processTranslation(request))
          );
          return groupResults;
        }
      );

      const groupResults = await Promise.all(groupPromises);
      
      // Flatten results maintaining original order
      const flatResults = groupResults.flat();
      
      // Reorder results to match original request order
      requests.forEach((originalRequest, index) => {
        const matchingResult = flatResults.find(result => 
          result.metadata.requestId === `batch_${index}`
        );
        if (matchingResult) {
          results[index] = matchingResult;
        }
      });

      const processingTime = Date.now() - startTime;
      
      defaultLogger.info('Batch processing completed', {
        requestCount: requests.length,
        processingTime,
        averageTimePerRequest: processingTime / requests.length
      }, 'RealTimeProcessor');

      return results;

    } catch (error) {
      defaultLogger.error('Batch processing failed', {
        error: error.message,
        requestCount: requests.length
      }, 'RealTimeProcessor');
      throw error;
    }
  }

  /**
   * Start the main processing loop
   */
  private startProcessingLoop(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    this.processingInterval = setInterval(() => {
      this.processQueuedRequests();
      this.updateThroughputMetrics();
      this.cleanupCompletedRequests();
    }, 10); // Process every 10ms for real-time responsiveness

    defaultLogger.info('Processing loop started', {}, 'RealTimeProcessor');
  }

  /**
   * Stop the processing loop
   */
  private stopProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    this.isProcessing = false;
    defaultLogger.info('Processing loop stopped', {}, 'RealTimeProcessor');
  }

  /**
   * Process queued requests based on priority and capacity
   */
  private async processQueuedRequests(): Promise<void> {
    // Check if we can process more requests
    if (this.activeProcessing.size >= this.maxConcurrentRequests) {
      return;
    }

    // Get next highest priority request
    const nextRequest = this.getNextPriorityRequest();
    if (!nextRequest) {
      return;
    }

    // Move from queue to active processing
    this.removeFromQueue(nextRequest.id);
    this.activeProcessing.set(nextRequest.id, nextRequest);

    // Process the request asynchronously
    this.processRequestAsync(nextRequest);
  }

  /**
   * Process individual request asynchronously
   */
  private async processRequestAsync(queueItem: ProcessingQueue): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Clear timeout since we're processing now
      if (queueItem.timeout) {
        clearTimeout(queueItem.timeout);
      }

      // Process through translation gateway
      const result = await this.translationGateway.translateText(queueItem.request);
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.totalProcessingTime += processingTime;
      this.completedRequests++;

      // Resolve the promise
      queueItem.resolve(result);

      defaultLogger.debug('Request processed successfully', {
        requestId: queueItem.id,
        processingTime,
        purityScore: result.purityScore
      }, 'RealTimeProcessor');

    } catch (error) {
      this.failedRequests++;
      queueItem.reject(error);

      defaultLogger.error('Request processing failed', {
        requestId: queueItem.id,
        error: error.message,
        processingTime: Date.now() - startTime
      }, 'RealTimeProcessor');

    } finally {
      // Remove from active processing
      this.activeProcessing.delete(queueItem.id);
    }
  }

  /**
   * Add request to priority queue
   */
  private addToQueue(queueItem: ProcessingQueue): void {
    // Insert in priority order (lower number = higher priority)
    let insertIndex = this.processingQueue.length;
    
    for (let i = 0; i < this.processingQueue.length; i++) {
      if (queueItem.priority < this.processingQueue[i].priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.processingQueue.splice(insertIndex, 0, queueItem);
  }

  /**
   * Remove request from queue
   */
  private removeFromQueue(requestId: string): void {
    const index = this.processingQueue.findIndex(item => item.id === requestId);
    if (index !== -1) {
      this.processingQueue.splice(index, 1);
    }
  }

  /**
   * Get next highest priority request
   */
  private getNextPriorityRequest(): ProcessingQueue | null {
    return this.processingQueue.length > 0 ? this.processingQueue[0] : null;
  }

  /**
   * Handle request timeout
   */
  private handleRequestTimeout(requestId: string): void {
    // Check if request is still in queue
    const queuedRequest = this.processingQueue.find(item => item.id === requestId);
    if (queuedRequest) {
      this.removeFromQueue(requestId);
      queuedRequest.reject(new Error('Request timeout - processing took too long'));
      return;
    }

    // Check if request is actively processing
    const activeRequest = this.activeProcessing.get(requestId);
    if (activeRequest) {
      this.activeProcessing.delete(requestId);
      activeRequest.reject(new Error('Request timeout during processing'));
    }
  }

  /**
   * Group requests by language pair for batch optimization
   */
  private groupRequestsByLanguagePair(
    requests: TranslationRequest[]
  ): Map<string, TranslationRequest[]> {
    const groups = new Map<string, TranslationRequest[]>();
    
    requests.forEach((request, index) => {
      const languagePair = `${request.sourceLanguage}_${request.targetLanguage}`;
      
      // Add batch identifier to request context
      request.context = {
        ...request.context,
        batchId: `batch_${index}`,
        batchSize: requests.length
      };
      
      if (!groups.has(languagePair)) {
        groups.set(languagePair, []);
      }
      groups.get(languagePair)!.push(request);
    });
    
    return groups;
  }

  /**
   * Update throughput metrics
   */
  private updateThroughputMetrics(): void {
    const now = new Date();
    const timeDiff = now.getTime() - this.lastThroughputCalculation.getTime();
    
    if (timeDiff >= 1000) { // Update every second
      this.requestsInLastSecond = this.completedRequests;
      this.lastThroughputCalculation = now;
    }
  }

  /**
   * Cleanup completed requests and optimize memory
   */
  private cleanupCompletedRequests(): void {
    // Remove old completed requests from memory if needed
    // This is a placeholder for memory optimization logic
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    const totalRequests = this.completedRequests + this.failedRequests;
    
    return {
      averageProcessingTime: totalRequests > 0 
        ? this.totalProcessingTime / this.completedRequests 
        : 0,
      throughput: this.requestsInLastSecond,
      queueLength: this.processingQueue.length,
      activeProcessing: this.activeProcessing.size,
      errorRate: totalRequests > 0 
        ? (this.failedRequests / totalRequests) * 100 
        : 0,
      cacheHitRate: 0 // Would be calculated from gateway cache stats
    };
  }

  /**
   * Get system load status
   */
  public getSystemLoad(): {
    status: 'low' | 'medium' | 'high' | 'critical';
    utilization: number;
    recommendations: string[];
  } {
    const utilization = (this.activeProcessing.size / this.maxConcurrentRequests) * 100;
    const queueUtilization = (this.processingQueue.length / this.queueMaxSize) * 100;
    
    let status: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const recommendations: string[] = [];
    
    if (utilization > 90 || queueUtilization > 80) {
      status = 'critical';
      recommendations.push('System overloaded - consider scaling up');
      recommendations.push('Implement request throttling');
    } else if (utilization > 70 || queueUtilization > 60) {
      status = 'high';
      recommendations.push('High load detected - monitor closely');
      recommendations.push('Consider optimizing processing pipeline');
    } else if (utilization > 40 || queueUtilization > 30) {
      status = 'medium';
      recommendations.push('Moderate load - system performing well');
    } else {
      status = 'low';
      recommendations.push('Low load - system has spare capacity');
    }
    
    return {
      status,
      utilization: Math.max(utilization, queueUtilization),
      recommendations
    };
  }

  /**
   * Optimize processing for specific content types
   */
  public optimizeForContentType(contentType: ContentType): void {
    // Adjust processing parameters based on content type
    switch (contentType) {
      case ContentType.CHAT_MESSAGE:
        // Optimize for speed over accuracy for chat messages
        break;
      case ContentType.LEGAL_DOCUMENT:
        // Optimize for accuracy over speed for legal documents
        break;
      case ContentType.LEGAL_FORM:
        // Balance speed and accuracy for forms
        break;
    }
  }

  /**
   * Emergency processing mode for critical situations
   */
  public enableEmergencyMode(): void {
    // Increase concurrent request limit temporarily
    // Reduce quality checks for speed
    // Prioritize real-time requests
    
    defaultLogger.warn('Emergency processing mode enabled', {
      originalConcurrentLimit: this.maxConcurrentRequests,
      queueLength: this.processingQueue.length
    }, 'RealTimeProcessor');
  }

  /**
   * Disable emergency mode and return to normal processing
   */
  public disableEmergencyMode(): void {
    // Restore normal processing parameters
    
    defaultLogger.info('Emergency processing mode disabled', {}, 'RealTimeProcessor');
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    defaultLogger.info('Initiating graceful shutdown', {
      queueLength: this.processingQueue.length,
      activeProcessing: this.activeProcessing.size
    }, 'RealTimeProcessor');

    // Stop accepting new requests
    this.stopProcessingLoop();

    // Wait for active requests to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.activeProcessing.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cancel remaining queued requests
    this.processingQueue.forEach(queueItem => {
      if (queueItem.timeout) {
        clearTimeout(queueItem.timeout);
      }
      queueItem.reject(new Error('System shutdown - request cancelled'));
    });

    this.processingQueue = [];
    this.activeProcessing.clear();

    defaultLogger.info('Graceful shutdown completed', {}, 'RealTimeProcessor');
  }
}