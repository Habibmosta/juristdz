import { logger } from '@/utils/logger';
import { getDb } from '@/database/connection';

/**
 * Service d'optimisation des performances
 * Optimise les requêtes de recherche, la mise en cache et les calculs de facturation
 */

export interface CacheConfig {
  ttl: number; // Time to live en secondes
  maxSize: number; // Taille maximale du cache
  strategy: 'lru' | 'lfu' | 'fifo'; // Stratégie d'éviction
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  estimatedImprovement: number; // Pourcentage d'amélioration estimé
  indexSuggestions: string[];
}

export interface PerformanceProfile {
  operation: string;
  averageTime: number;
  p95Time: number;
  p99Time: number;
  callCount: number;
  errorRate: number;
  lastOptimized: Date;
}

export class PerformanceOptimizationService {
  private queryCache: Map<string, { data: any; expires: number; hits: number }> = new Map();
  private searchCache: Map<string, { results: any; expires: number; hits: number }> = new Map();
  private billingCache: Map<string, { calculation: any; expires: number; hits: number }> = new Map();
  private performanceProfiles: Map<string, PerformanceProfile> = new Map();
  
  private readonly cacheConfigs = {
    query: { ttl: 300, maxSize: 1000, strategy: 'lru' as const },
    search: { ttl: 600, maxSize: 500, strategy: 'lru' as const },
    billing: { ttl: 1800, maxSize: 200, strategy: 'lfu' as const }
  };

  constructor() {
    this.startCacheCleanup();
    this.startPerformanceMonitoring();
  }

  /**
   * Optimise une requête de base de données
   */
  async optimizeQuery(query: string, params: any[] = []): Promise<{
    result: any;
    fromCache: boolean;
    executionTime: number;
    optimization?: QueryOptimization;
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateQueryCacheKey(query, params);
    
    // Vérifier le cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return {
        result: cached.data,
        fromCache: true,
        executionTime: Date.now() - startTime
      };
    }

    try {
      // Analyser et optimiser la requête
      const optimization = await this.analyzeQuery(query);
      const queryToExecute = optimization?.optimizedQuery || query;
      
      // Exécuter la requête
      const db = getDb();
      const result = await db.query(queryToExecute, params);
      
      const executionTime = Date.now() - startTime;
      
      // Mettre en cache le résultat
      this.cacheQueryResult(cacheKey, result, this.cacheConfigs.query);
      
      // Enregistrer les métriques de performance
      this.recordPerformanceMetric('database_query', executionTime);
      
      return {
        result,
        fromCache: false,
        executionTime,
        optimization
      };

    } catch (error) {
      logger.error('Erreur lors de l\'optimisation de requête:', error);
      throw error;
    }
  }

  /**
   * Optimise les recherches jurisprudentielles
   */
  async optimizeSearch(searchQuery: any, options: any = {}): Promise<{
    results: any;
    fromCache: boolean;
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateSearchCacheKey(searchQuery, options);
    const optimizations: string[] = [];
    
    // Vérifier le cache
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return {
        results: cached.results,
        fromCache: true,
        executionTime: Date.now() - startTime,
        optimizations: ['cache_hit']
      };
    }

    try {
      // Optimiser la requête de recherche
      const optimizedQuery = await this.optimizeSearchQuery(searchQuery);
      optimizations.push(...optimizedQuery.optimizations);
      
      // Exécuter la recherche optimisée
      const { legalSearchService } = await import('@/services/legalSearchService');
      const results = await legalSearchService.search(optimizedQuery.query, {
        ...options,
        useOptimizations: true
      });
      
      const executionTime = Date.now() - startTime;
      
      // Mettre en cache les résultats
      this.cacheSearchResult(cacheKey, results, this.cacheConfigs.search);
      
      // Enregistrer les métriques
      this.recordPerformanceMetric('legal_search', executionTime);
      
      return {
        results,
        fromCache: false,
        executionTime,
        optimizations
      };

    } catch (error) {
      logger.error('Erreur lors de l\'optimisation de recherche:', error);
      throw error;
    }
  }

  /**
   * Optimise les calculs de facturation
   */
  async optimizeBillingCalculation(calculationData: any): Promise<{
    calculation: any;
    fromCache: boolean;
    executionTime: number;
    optimizations: string[];
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateBillingCacheKey(calculationData);
    const optimizations: string[] = [];
    
    // Vérifier le cache
    const cached = this.billingCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      cached.hits++;
      return {
        calculation: cached.calculation,
        fromCache: true,
        executionTime: Date.now() - startTime,
        optimizations: ['cache_hit']
      };
    }

    try {
      // Optimiser les calculs
      const optimizedCalculation = await this.optimizeBillingLogic(calculationData);
      optimizations.push(...optimizedCalculation.optimizations);
      
      // Exécuter le calcul optimisé
      const { billingService } = await import('@/services/billingService');
      const calculation = await billingService.calculateFees(optimizedCalculation.data);
      
      const executionTime = Date.now() - startTime;
      
      // Mettre en cache le résultat
      this.cacheBillingResult(cacheKey, calculation, this.cacheConfigs.billing);
      
      // Enregistrer les métriques
      this.recordPerformanceMetric('billing_calculation', executionTime);
      
      return {
        calculation,
        fromCache: false,
        executionTime,
        optimizations
      };

    } catch (error) {
      logger.error('Erreur lors de l\'optimisation de facturation:', error);
      throw error;
    }
  }

  /**
   * Analyse et optimise une requête SQL
   */
  private async analyzeQuery(query: string): Promise<QueryOptimization | null> {
    try {
      const db = getDb();
      
      // Analyser le plan d'exécution
      const explainResult = await db.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
      const plan = explainResult.rows[0]['QUERY PLAN'][0];
      
      const optimization: QueryOptimization = {
        originalQuery: query,
        optimizedQuery: query,
        estimatedImprovement: 0,
        indexSuggestions: []
      };

      // Détecter les scans séquentiels coûteux
      if (this.hasExpensiveSeqScan(plan)) {
        optimization.indexSuggestions.push('Ajouter des index sur les colonnes utilisées dans WHERE');
        optimization.estimatedImprovement += 30;
      }

      // Détecter les jointures coûteuses
      if (this.hasExpensiveJoins(plan)) {
        optimization.optimizedQuery = this.optimizeJoins(query);
        optimization.estimatedImprovement += 20;
      }

      // Détecter les tris coûteux
      if (this.hasExpensiveSort(plan)) {
        optimization.indexSuggestions.push('Ajouter des index sur les colonnes utilisées dans ORDER BY');
        optimization.estimatedImprovement += 15;
      }

      return optimization.estimatedImprovement > 0 ? optimization : null;

    } catch (error) {
      logger.warn('Impossible d\'analyser la requête:', error);
      return null;
    }
  }

  /**
   * Optimise une requête de recherche
   */
  private async optimizeSearchQuery(searchQuery: any): Promise<{
    query: any;
    optimizations: string[];
  }> {
    const optimizations: string[] = [];
    const optimizedQuery = { ...searchQuery };

    // Optimisation 1: Limiter les résultats par défaut
    if (!optimizedQuery.limit || optimizedQuery.limit > 100) {
      optimizedQuery.limit = 50;
      optimizations.push('limited_results');
    }

    // Optimisation 2: Utiliser la recherche full-text quand possible
    if (optimizedQuery.texte && !optimizedQuery.useFullText) {
      optimizedQuery.useFullText = true;
      optimizations.push('fulltext_search');
    }

    // Optimisation 3: Filtrer par date pour réduire l'espace de recherche
    if (!optimizedQuery.dateDebut && !optimizedQuery.dateFin) {
      // Limiter aux 5 dernières années par défaut
      optimizedQuery.dateDebut = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
      optimizations.push('date_filtering');
    }

    // Optimisation 4: Utiliser des index spécialisés
    if (optimizedQuery.domaine) {
      optimizedQuery.useSpecializedIndex = true;
      optimizations.push('specialized_index');
    }

    return {
      query: optimizedQuery,
      optimizations
    };
  }

  /**
   * Optimise la logique de calcul de facturation
   */
  private async optimizeBillingLogic(calculationData: any): Promise<{
    data: any;
    optimizations: string[];
  }> {
    const optimizations: string[] = [];
    const optimizedData = { ...calculationData };

    // Optimisation 1: Pré-calculer les barèmes fréquemment utilisés
    if (optimizedData.barreauId && !optimizedData.precomputedRates) {
      optimizedData.precomputedRates = await this.getPrecomputedRates(optimizedData.barreauId);
      optimizations.push('precomputed_rates');
    }

    // Optimisation 2: Utiliser des calculs vectorisés pour les gros volumes
    if (optimizedData.items && optimizedData.items.length > 10) {
      optimizedData.useVectorizedCalculation = true;
      optimizations.push('vectorized_calculation');
    }

    // Optimisation 3: Éviter les recalculs de TVA
    if (optimizedData.tvaRate && !optimizedData.precomputedTva) {
      optimizedData.precomputedTva = this.precomputeTvaMultipliers(optimizedData.tvaRate);
      optimizations.push('precomputed_tva');
    }

    return {
      data: optimizedData,
      optimizations
    };
  }

  /**
   * Met en cache un résultat de requête
   */
  private cacheQueryResult(key: string, data: any, config: CacheConfig): void {
    this.evictIfNeeded(this.queryCache, config);
    
    this.queryCache.set(key, {
      data,
      expires: Date.now() + (config.ttl * 1000),
      hits: 0
    });
  }

  /**
   * Met en cache un résultat de recherche
   */
  private cacheSearchResult(key: string, results: any, config: CacheConfig): void {
    this.evictIfNeeded(this.searchCache, config);
    
    this.searchCache.set(key, {
      results,
      expires: Date.now() + (config.ttl * 1000),
      hits: 0
    });
  }

  /**
   * Met en cache un résultat de facturation
   */
  private cacheBillingResult(key: string, calculation: any, config: CacheConfig): void {
    this.evictIfNeeded(this.billingCache, config);
    
    this.billingCache.set(key, {
      calculation,
      expires: Date.now() + (config.ttl * 1000),
      hits: 0
    });
  }

  /**
   * Éviction du cache selon la stratégie configurée
   */
  private evictIfNeeded(cache: Map<string, any>, config: CacheConfig): void {
    if (cache.size >= config.maxSize) {
      const keysToEvict = Math.floor(config.maxSize * 0.1); // Éviction de 10%
      
      switch (config.strategy) {
        case 'lru':
          this.evictLRU(cache, keysToEvict);
          break;
        case 'lfu':
          this.evictLFU(cache, keysToEvict);
          break;
        case 'fifo':
          this.evictFIFO(cache, keysToEvict);
          break;
      }
    }
  }

  /**
   * Éviction LRU (Least Recently Used)
   */
  private evictLRU(cache: Map<string, any>, count: number): void {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    for (let i = 0; i < count && i < entries.length; i++) {
      cache.delete(entries[i][0]);
    }
  }

  /**
   * Éviction LFU (Least Frequently Used)
   */
  private evictLFU(cache: Map<string, any>, count: number): void {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits);
    
    for (let i = 0; i < count && i < entries.length; i++) {
      cache.delete(entries[i][0]);
    }
  }

  /**
   * Éviction FIFO (First In, First Out)
   */
  private evictFIFO(cache: Map<string, any>, count: number): void {
    const keys = Array.from(cache.keys());
    
    for (let i = 0; i < count && i < keys.length; i++) {
      cache.delete(keys[i]);
    }
  }

  /**
   * Génère une clé de cache pour les requêtes
   */
  private generateQueryCacheKey(query: string, params: any[]): string {
    return `query:${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;
  }

  /**
   * Génère une clé de cache pour les recherches
   */
  private generateSearchCacheKey(searchQuery: any, options: any): string {
    return `search:${Buffer.from(JSON.stringify({ searchQuery, options })).toString('base64')}`;
  }

  /**
   * Génère une clé de cache pour la facturation
   */
  private generateBillingCacheKey(calculationData: any): string {
    return `billing:${Buffer.from(JSON.stringify(calculationData)).toString('base64')}`;
  }

  /**
   * Enregistre une métrique de performance
   */
  private recordPerformanceMetric(operation: string, executionTime: number): void {
    const profile = this.performanceProfiles.get(operation) || {
      operation,
      averageTime: 0,
      p95Time: 0,
      p99Time: 0,
      callCount: 0,
      errorRate: 0,
      lastOptimized: new Date()
    };

    profile.callCount++;
    profile.averageTime = (profile.averageTime * (profile.callCount - 1) + executionTime) / profile.callCount;
    
    this.performanceProfiles.set(operation, profile);
  }

  /**
   * Obtient les statistiques de performance
   */
  getPerformanceStats(): {
    cacheStats: any;
    operationStats: PerformanceProfile[];
    recommendations: string[];
  } {
    const cacheStats = {
      query: {
        size: this.queryCache.size,
        hitRate: this.calculateHitRate(this.queryCache)
      },
      search: {
        size: this.searchCache.size,
        hitRate: this.calculateHitRate(this.searchCache)
      },
      billing: {
        size: this.billingCache.size,
        hitRate: this.calculateHitRate(this.billingCache)
      }
    };

    const operationStats = Array.from(this.performanceProfiles.values());
    const recommendations = this.generatePerformanceRecommendations(cacheStats, operationStats);

    return {
      cacheStats,
      operationStats,
      recommendations
    };
  }

  /**
   * Vide tous les caches
   */
  clearAllCaches(): void {
    this.queryCache.clear();
    this.searchCache.clear();
    this.billingCache.clear();
    logger.info('Tous les caches de performance ont été vidés');
  }

  // Méthodes utilitaires privées

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Nettoyer toutes les minutes
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.analyzePerformanceTrends();
    }, 300000); // Analyser toutes les 5 minutes
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    [this.queryCache, this.searchCache, this.billingCache].forEach(cache => {
      for (const [key, value] of cache.entries()) {
        if (value.expires <= now) {
          cache.delete(key);
          cleaned++;
        }
      }
    });

    if (cleaned > 0) {
      logger.debug(`Cache nettoyé: ${cleaned} entrées expirées supprimées`);
    }
  }

  private analyzePerformanceTrends(): void {
    // Analyser les tendances de performance et suggérer des optimisations
    for (const [operation, profile] of this.performanceProfiles.entries()) {
      if (profile.averageTime > 1000) { // Plus de 1 seconde
        logger.warn(`Performance dégradée détectée pour ${operation}: ${profile.averageTime}ms en moyenne`);
      }
    }
  }

  private calculateHitRate(cache: Map<string, any>): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const value of cache.values()) {
      totalHits += value.hits;
      totalRequests += value.hits + 1; // +1 pour la requête initiale
    }

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  private generatePerformanceRecommendations(cacheStats: any, operationStats: PerformanceProfile[]): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur le cache
    if (cacheStats.query.hitRate < 50) {
      recommendations.push('Taux de succès du cache de requêtes faible. Considérer augmenter le TTL.');
    }

    if (cacheStats.search.hitRate < 30) {
      recommendations.push('Taux de succès du cache de recherche faible. Optimiser les requêtes de recherche.');
    }

    // Recommandations basées sur les opérations
    const slowOperations = operationStats.filter(op => op.averageTime > 1000);
    if (slowOperations.length > 0) {
      recommendations.push(`Opérations lentes détectées: ${slowOperations.map(op => op.operation).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performances optimales. Aucune recommandation spécifique.');
    }

    return recommendations;
  }

  // Méthodes d'analyse de requêtes SQL

  private hasExpensiveSeqScan(plan: any): boolean {
    return this.findInPlan(plan, node => 
      node['Node Type'] === 'Seq Scan' && node['Total Cost'] > 1000
    );
  }

  private hasExpensiveJoins(plan: any): boolean {
    return this.findInPlan(plan, node => 
      node['Node Type']?.includes('Join') && node['Total Cost'] > 5000
    );
  }

  private hasExpensiveSort(plan: any): boolean {
    return this.findInPlan(plan, node => 
      node['Node Type'] === 'Sort' && node['Total Cost'] > 1000
    );
  }

  private findInPlan(plan: any, predicate: (node: any) => boolean): boolean {
    if (predicate(plan)) return true;
    
    if (plan.Plans) {
      return plan.Plans.some((subPlan: any) => this.findInPlan(subPlan, predicate));
    }
    
    return false;
  }

  private optimizeJoins(query: string): string {
    // Optimisations basiques des jointures
    return query
      .replace(/LEFT JOIN/gi, 'LEFT JOIN /*+ USE_NL */')
      .replace(/INNER JOIN/gi, 'INNER JOIN /*+ USE_HASH */');
  }

  private async getPrecomputedRates(barreauId: string): Promise<any> {
    // Récupérer les barèmes pré-calculés
    return {
      consultationSimple: 5000,
      consultationComplexe: 15000,
      // ... autres barèmes
    };
  }

  private precomputeTvaMultipliers(tvaRate: number): any {
    return {
      multiplier: 1 + (tvaRate / 100),
      divisor: 100 / (100 + tvaRate)
    };
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();