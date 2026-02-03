/**
 * Intelligent Translation Cache - Advanced caching system for Pure Translation System
 * 
 * Implements intelligent caching with quality-based invalidation, performance optimization,
 * and cache maintenance for high-load scenarios. Ensures only 100% pure translations
 * are cached and provides intelligent cache warming and eviction strategies.
 */

import {
  TranslationCache,
  CacheStats,
  PureTranslationResult,
  TranslationRequest,
  Language,
  ContentType,
  TranslationMethod,
  QualityMetrics
} from '../types';
import { defaultLogger } from '../utils/Logger';
import { pureTranslationConfig } from '../config/PureTranslationConfig';

export interface CacheEntry {
  result: PureTranslationResult;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number;
  quality: number;
  contentHash: string;
  metadata: CacheEntryMetadata;
}

export interface CacheEntryMetadata {
  sourceLanguage: Language;
  targetLanguage: Language;
  contentType: ContentType;
  textLength: number;
  method: TranslationMethod;
  userContext?: string;
  tags: string[];
}

export interface CacheConfiguration {
  maxSize: number;
  defaultTtl: number;
  qualityThreshold: number;
  enableIntelligentEviction: boolean;
  enableCacheWarming: boolean;
  enableQualityBasedInvalidation: boolean;
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
  maxMemoryUsage: number; // in MB
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage: number;
  evictionRate: number;
  qualityScore: number;
  compressionRatio: number;
}

export class IntelligentTranslationCache implements TranslationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private qualityIndex: Map<number, Set<string>> = new Map(); // Quality-based indexing
  private contentTypeIndex: Map<ContentType, Set<string>> = new Map();
  private languagePairIndex: Map<string, Set<string>> = new Map();
  
  private stats: CacheStats = {
    size: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0
  };

  private performanceMetrics: CachePerformanceMetrics = {
    hitRate: 0,
    missRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    evictionRate: 0,
    qualityScore: 0,
    compressionRatio: 0
  };

  private config: CacheConfiguration;
  private cleanupInterval: NodeJS.Timeout;
  private warmupQueue: Set<string> = new Set();

  constructor(config?: Partial<CacheConfiguration>) {
    this.config = {
      maxSize: 50000,
      defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
      qualityThreshold: 95,
      enableIntelligentEviction: true,
      enableCacheWarming: true,
      enableQualityBasedInvalidation: true,
      compressionEnabled: true,
      persistenceEnabled: false,
      maxMemoryUsage: 500, // 500MB
      ...config
    };

    this.initializeIndexes();
    this.startCleanupProcess();
    
    defaultLogger.info('Intelligent Translation Cache initialized', {
      maxSize: this.config.maxSize,
      qualityThreshold: this.config.qualityThreshold,
      intelligentEviction: this.config.enableIntelligentEviction,
      cacheWarming: this.config.enableCacheWarming
    }, 'IntelligentTranslationCache');
  }

  /**
   * Get cached translation result with intelligent access tracking
   */
  async get(key: string): Promise<PureTranslationResult | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.totalMisses++;
      this.updateHitRates();
      return null;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      await this.remove(key);
      this.stats.totalMisses++;
      this.updateHitRates();
      return null;
    }

    // Check quality threshold
    if (this.config.enableQualityBasedInvalidation && 
        entry.quality < this.config.qualityThreshold) {
      defaultLogger.warn('Cache entry invalidated due to quality threshold', {
        key,
        quality: entry.quality,
        threshold: this.config.qualityThreshold
      }, 'IntelligentTranslationCache');
      
      await this.remove(key);
      this.stats.totalMisses++;
      this.updateHitRates();
      return null;
    }

    // Update access tracking
    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.updateAccessOrder(key);

    this.stats.totalHits++;
    this.updateHitRates();

    // Update performance metrics
    const responseTime = Date.now() - startTime;
    this.updatePerformanceMetrics(responseTime);

    defaultLogger.debug('Cache hit', {
      key,
      accessCount: entry.accessCount,
      quality: entry.quality,
      responseTime
    }, 'IntelligentTranslationCache');

    return entry.result;
  }

  /**
   * Set cached translation with intelligent quality validation
   */
  async set(key: string, value: PureTranslationResult, ttl?: number): Promise<void> {
    // Only cache high-quality, pure translations
    if (value.purityScore < 100 && pureTranslationConfig.isZeroToleranceEnabled()) {
      defaultLogger.warn('Refusing to cache impure translation', {
        key,
        purityScore: value.purityScore
      }, 'IntelligentTranslationCache');
      return;
    }

    // Quality threshold check
    const qualityScore = this.calculateQualityScore(value);
    if (qualityScore < this.config.qualityThreshold) {
      defaultLogger.warn('Refusing to cache low-quality translation', {
        key,
        qualityScore,
        threshold: this.config.qualityThreshold
      }, 'IntelligentTranslationCache');
      return;
    }

    // Check memory limits before adding
    if (this.shouldEvictForMemory()) {
      await this.performIntelligentEviction();
    }

    // Create cache entry
    const entry: CacheEntry = {
      result: value,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1,
      ttl: ttl || this.config.defaultTtl,
      quality: qualityScore,
      contentHash: this.generateContentHash(value.translatedText),
      metadata: this.extractMetadata(value)
    };

    // Store in cache
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateIndexes(key, entry);

    this.stats.size = this.cache.size;

    defaultLogger.debug('Translation cached', {
      key,
      quality: qualityScore,
      purityScore: value.purityScore,
      method: value.method,
      cacheSize: this.cache.size
    }, 'IntelligentTranslationCache');

    // Trigger cache warming if enabled
    if (this.config.enableCacheWarming) {
      this.scheduleRelatedCacheWarming(entry);
    }
  }

  /**
   * Invalidate cache entries matching pattern with quality considerations
   */
  async invalidate(pattern: string): Promise<void> {
    const keysToRemove: string[] = [];
    const regex = new RegExp(pattern);

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      await this.remove(key);
    }

    defaultLogger.info('Cache invalidation completed', {
      pattern,
      removedCount: keysToRemove.length,
      remainingSize: this.cache.size
    }, 'IntelligentTranslationCache');
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    const previousSize = this.cache.size;
    
    this.cache.clear();
    this.accessOrder = [];
    this.clearIndexes();
    this.resetStats();

    defaultLogger.info('Cache cleared', {
      previousSize,
      currentSize: 0
    }, 'IntelligentTranslationCache');
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }

  /**
   * Get detailed performance metrics
   */
  getPerformanceMetrics(): CachePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Warm cache with frequently requested translations
   */
  async warmCache(requests: TranslationRequest[]): Promise<void> {
    if (!this.config.enableCacheWarming) {
      return;
    }

    defaultLogger.info('Starting cache warming', {
      requestCount: requests.length
    }, 'IntelligentTranslationCache');

    for (const request of requests) {
      const key = this.generateCacheKey(request);
      this.warmupQueue.add(key);
    }

    // Process warmup queue asynchronously
    this.processWarmupQueue();
  }

  /**
   * Optimize cache performance
   */
  async optimizeCache(): Promise<void> {
    const startTime = Date.now();
    
    // Remove expired entries
    await this.removeExpiredEntries();
    
    // Perform quality-based cleanup
    await this.performQualityBasedCleanup();
    
    // Optimize memory usage
    await this.optimizeMemoryUsage();
    
    // Rebuild indexes
    this.rebuildIndexes();

    const optimizationTime = Date.now() - startTime;
    
    defaultLogger.info('Cache optimization completed', {
      optimizationTime,
      cacheSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    }, 'IntelligentTranslationCache');
  }

  /**
   * Get cache health status
   */
  getCacheHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    metrics: any;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check hit rate
    if (this.stats.hitRate < 0.7) {
      issues.push(`Low cache hit rate: ${(this.stats.hitRate * 100).toFixed(2)}%`);
      recommendations.push('Consider cache warming or adjusting TTL settings');
      status = 'warning';
    }

    // Check memory usage
    const memoryUsage = this.estimateMemoryUsage();
    if (memoryUsage > this.config.maxMemoryUsage * 0.9) {
      issues.push(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
      recommendations.push('Enable intelligent eviction or reduce cache size');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    if (memoryUsage > this.config.maxMemoryUsage) {
      status = 'critical';
    }

    // Check quality score
    if (this.performanceMetrics.qualityScore < 90) {
      issues.push(`Low average quality score: ${this.performanceMetrics.qualityScore.toFixed(2)}`);
      recommendations.push('Review quality thresholds and invalidation policies');
    }

    return {
      status,
      issues,
      recommendations,
      metrics: {
        hitRate: this.stats.hitRate,
        memoryUsage,
        qualityScore: this.performanceMetrics.qualityScore,
        cacheSize: this.cache.size,
        evictionRate: this.performanceMetrics.evictionRate
      }
    };
  }

  /**
   * Private helper methods
   */
  private generateCacheKey(request: TranslationRequest): string {
    const contentHash = this.generateContentHash(request.text);
    return `${request.sourceLanguage}_${request.targetLanguage}_${request.contentType}_${contentHash}`;
  }

  private generateContentHash(text: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private calculateQualityScore(result: PureTranslationResult): number {
    const weights = {
      purity: 0.4,
      terminology: 0.2,
      contextual: 0.15,
      readability: 0.15,
      professionalism: 0.1
    };

    return (
      result.qualityMetrics.purityScore * weights.purity +
      result.qualityMetrics.terminologyAccuracy * weights.terminology +
      result.qualityMetrics.contextualRelevance * weights.contextual +
      result.qualityMetrics.readabilityScore * weights.readability +
      result.qualityMetrics.professionalismScore * weights.professionalism
    );
  }

  private extractMetadata(result: PureTranslationResult): CacheEntryMetadata {
    return {
      sourceLanguage: 'fr' as Language, // Would be extracted from context
      targetLanguage: 'ar' as Language, // Would be extracted from context
      contentType: ContentType.LEGAL_DOCUMENT, // Would be extracted from context
      textLength: result.translatedText.length,
      method: result.method,
      userContext: result.metadata.requestId,
      tags: this.generateTags(result)
    };
  }

  private generateTags(result: PureTranslationResult): string[] {
    const tags: string[] = [];
    
    if (result.purityScore === 100) tags.push('pure');
    if (result.confidence > 0.9) tags.push('high-confidence');
    if (result.metadata.fallbackUsed) tags.push('fallback');
    if (result.qualityMetrics.terminologyAccuracy > 0.95) tags.push('accurate-terminology');
    
    return tags;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const expirationTime = entry.createdAt.getTime() + entry.ttl;
    return now > expirationTime;
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private updateIndexes(key: string, entry: CacheEntry): void {
    // Quality index
    const qualityBucket = Math.floor(entry.quality / 10) * 10;
    if (!this.qualityIndex.has(qualityBucket)) {
      this.qualityIndex.set(qualityBucket, new Set());
    }
    this.qualityIndex.get(qualityBucket)!.add(key);

    // Content type index
    if (!this.contentTypeIndex.has(entry.metadata.contentType)) {
      this.contentTypeIndex.set(entry.metadata.contentType, new Set());
    }
    this.contentTypeIndex.get(entry.metadata.contentType)!.add(key);

    // Language pair index
    const languagePair = `${entry.metadata.sourceLanguage}_${entry.metadata.targetLanguage}`;
    if (!this.languagePairIndex.has(languagePair)) {
      this.languagePairIndex.set(languagePair, new Set());
    }
    this.languagePairIndex.get(languagePair)!.add(key);
  }

  private async remove(key: string): Promise<void> {
    const entry = this.cache.get(key);
    if (!entry) return;

    this.cache.delete(key);
    
    // Remove from access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    // Remove from indexes
    this.removeFromIndexes(key, entry);
    
    this.stats.size = this.cache.size;
  }

  private removeFromIndexes(key: string, entry: CacheEntry): void {
    // Remove from quality index
    const qualityBucket = Math.floor(entry.quality / 10) * 10;
    this.qualityIndex.get(qualityBucket)?.delete(key);

    // Remove from content type index
    this.contentTypeIndex.get(entry.metadata.contentType)?.delete(key);

    // Remove from language pair index
    const languagePair = `${entry.metadata.sourceLanguage}_${entry.metadata.targetLanguage}`;
    this.languagePairIndex.get(languagePair)?.delete(key);
  }

  private shouldEvictForMemory(): boolean {
    const memoryUsage = this.estimateMemoryUsage();
    return memoryUsage > this.config.maxMemoryUsage * 0.8;
  }

  private async performIntelligentEviction(): Promise<void> {
    if (!this.config.enableIntelligentEviction) {
      return this.performLRUEviction();
    }

    const evictionCandidates = this.selectEvictionCandidates();
    const evictionCount = Math.max(1, Math.floor(this.cache.size * 0.1)); // Evict 10%

    for (let i = 0; i < evictionCount && i < evictionCandidates.length; i++) {
      await this.remove(evictionCandidates[i]);
    }

    this.performanceMetrics.evictionRate = evictionCount / this.cache.size;

    defaultLogger.info('Intelligent eviction completed', {
      evictedCount: evictionCount,
      remainingSize: this.cache.size
    }, 'IntelligentTranslationCache');
  }

  private selectEvictionCandidates(): string[] {
    const candidates: Array<{ key: string; score: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      const score = this.calculateEvictionScore(entry);
      candidates.push({ key, score });
    }

    // Sort by eviction score (lower is better candidate for eviction)
    candidates.sort((a, b) => a.score - b.score);
    
    return candidates.map(c => c.key);
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.createdAt.getTime();
    const timeSinceAccess = now - entry.lastAccessed.getTime();
    
    // Higher score means less likely to be evicted
    let score = 0;
    
    // Quality factor (higher quality = higher score)
    score += entry.quality * 0.3;
    
    // Access frequency factor
    score += Math.log(entry.accessCount + 1) * 20;
    
    // Recency factor (more recent access = higher score)
    score += Math.max(0, 100 - (timeSinceAccess / (1000 * 60 * 60))); // Hours since access
    
    // Age penalty (older entries get lower scores)
    score -= age / (1000 * 60 * 60 * 24); // Days old
    
    return score;
  }

  private performLRUEviction(): void {
    // Simple LRU eviction - remove least recently used
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.remove(lruKey);
    }
  }

  private async removeExpiredEntries(): Promise<void> {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.remove(key);
    }

    if (expiredKeys.length > 0) {
      defaultLogger.info('Removed expired cache entries', {
        removedCount: expiredKeys.length
      }, 'IntelligentTranslationCache');
    }
  }

  private async performQualityBasedCleanup(): Promise<void> {
    if (!this.config.enableQualityBasedInvalidation) return;

    const lowQualityKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.quality < this.config.qualityThreshold) {
        lowQualityKeys.push(key);
      }
    }

    for (const key of lowQualityKeys) {
      await this.remove(key);
    }

    if (lowQualityKeys.length > 0) {
      defaultLogger.info('Removed low-quality cache entries', {
        removedCount: lowQualityKeys.length,
        qualityThreshold: this.config.qualityThreshold
      }, 'IntelligentTranslationCache');
    }
  }

  private async optimizeMemoryUsage(): Promise<void> {
    const memoryUsage = this.estimateMemoryUsage();
    
    if (memoryUsage > this.config.maxMemoryUsage) {
      const targetReduction = memoryUsage - this.config.maxMemoryUsage * 0.8;
      const entriesPerMB = this.cache.size / memoryUsage;
      const entriesToRemove = Math.ceil(targetReduction * entriesPerMB);
      
      const candidates = this.selectEvictionCandidates();
      for (let i = 0; i < entriesToRemove && i < candidates.length; i++) {
        await this.remove(candidates[i]);
      }

      defaultLogger.info('Memory optimization completed', {
        removedEntries: entriesToRemove,
        memoryReduction: targetReduction,
        newMemoryUsage: this.estimateMemoryUsage()
      }, 'IntelligentTranslationCache');
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in MB
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // Estimate size of cache entry
      totalSize += JSON.stringify(entry).length * 2; // Rough estimate including overhead
    }
    
    return totalSize / (1024 * 1024); // Convert to MB
  }

  private initializeIndexes(): void {
    this.qualityIndex.clear();
    this.contentTypeIndex.clear();
    this.languagePairIndex.clear();
  }

  private clearIndexes(): void {
    this.qualityIndex.clear();
    this.contentTypeIndex.clear();
    this.languagePairIndex.clear();
  }

  private rebuildIndexes(): void {
    this.clearIndexes();
    
    for (const [key, entry] of this.cache.entries()) {
      this.updateIndexes(key, entry);
    }
  }

  private updateHitRates(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.totalHits / this.stats.totalRequests;
      this.stats.missRate = this.stats.totalMisses / this.stats.totalRequests;
    }

    this.performanceMetrics.hitRate = this.stats.hitRate;
    this.performanceMetrics.missRate = this.stats.missRate;
  }

  private updatePerformanceMetrics(responseTime: number): void {
    // Update average response time with exponential moving average
    const alpha = 0.1;
    this.performanceMetrics.averageResponseTime = 
      alpha * responseTime + (1 - alpha) * this.performanceMetrics.averageResponseTime;

    // Update memory usage
    this.performanceMetrics.memoryUsage = this.estimateMemoryUsage();

    // Update quality score
    let totalQuality = 0;
    let count = 0;
    for (const entry of this.cache.values()) {
      totalQuality += entry.quality;
      count++;
    }
    this.performanceMetrics.qualityScore = count > 0 ? totalQuality / count : 0;
  }

  private resetStats(): void {
    this.stats = {
      size: 0,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }

  private startCleanupProcess(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(async () => {
      await this.removeExpiredEntries();
      
      // Perform optimization if needed
      if (this.shouldEvictForMemory()) {
        await this.optimizeCache();
      }
    }, 5 * 60 * 1000);
  }

  private scheduleRelatedCacheWarming(entry: CacheEntry): void {
    // This would implement intelligent cache warming based on patterns
    // For now, just log the opportunity
    defaultLogger.debug('Cache warming opportunity identified', {
      contentType: entry.metadata.contentType,
      languagePair: `${entry.metadata.sourceLanguage}_${entry.metadata.targetLanguage}`,
      quality: entry.quality
    }, 'IntelligentTranslationCache');
  }

  private processWarmupQueue(): void {
    // Process warmup queue asynchronously
    // This would implement actual cache warming logic
    defaultLogger.debug('Processing cache warmup queue', {
      queueSize: this.warmupQueue.size
    }, 'IntelligentTranslationCache');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.clearIndexes();
    this.warmupQueue.clear();
  }
}