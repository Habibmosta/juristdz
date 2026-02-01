import { Router } from 'express';
import { performanceOptimizationService } from '@/services/performanceOptimizationService';
import { authMiddleware } from '@/middleware/auth';
import { rbacMiddleware } from '@/middleware/rbacMiddleware';
import { logger } from '@/utils/logger';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/performance/stats
 * Statistiques de performance et recommandations (admin seulement)
 */
router.get('/stats', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const stats = performanceOptimizationService.getPerformanceStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de performance'
    });
  }
});

/**
 * POST /api/performance/optimize-query
 * Optimise une requête de base de données (admin seulement)
 */
router.post('/optimize-query', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { query, params = [] } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Requête SQL requise'
      });
    }

    const result = await performanceOptimizationService.optimizeQuery(query, params);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de l\'optimisation de requête:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'optimisation de requête',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/performance/optimize-search
 * Optimise une recherche jurisprudentielle
 */
router.post('/optimize-search', rbacMiddleware(['avocat', 'notaire', 'huissier', 'magistrat', 'juriste_entreprise', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { searchQuery, options = {} } = req.body;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Requête de recherche requise'
      });
    }

    const result = await performanceOptimizationService.optimizeSearch(searchQuery, options);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de l\'optimisation de recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'optimisation de recherche',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/performance/optimize-billing
 * Optimise un calcul de facturation
 */
router.post('/optimize-billing', rbacMiddleware(['avocat', 'notaire', 'huissier', 'administrateur_plateforme']), async (req, res) => {
  try {
    const { calculationData } = req.body;
    
    if (!calculationData) {
      return res.status(400).json({
        success: false,
        message: 'Données de calcul requises'
      });
    }

    const result = await performanceOptimizationService.optimizeBillingCalculation(calculationData);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de l\'optimisation de facturation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'optimisation de facturation',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/performance/clear-cache
 * Vide tous les caches de performance (admin seulement)
 */
router.post('/clear-cache', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { cacheType } = req.body;
    
    if (cacheType && !['query', 'search', 'billing', 'all'].includes(cacheType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de cache invalide. Valeurs acceptées: query, search, billing, all'
      });
    }

    // Pour cette implémentation, on vide tous les caches
    performanceOptimizationService.clearAllCaches();
    
    logger.info(`Caches de performance vidés par ${(req as any).user.id}`, {
      cacheType: cacheType || 'all',
      clearedBy: (req as any).user.id
    });
    
    res.json({
      success: true,
      message: 'Caches vidés avec succès',
      data: {
        cacheType: cacheType || 'all',
        clearedAt: new Date().toISOString(),
        clearedBy: (req as any).user.id
      }
    });

  } catch (error) {
    logger.error('Erreur lors du vidage des caches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage des caches'
    });
  }
});

/**
 * GET /api/performance/cache-stats
 * Statistiques détaillées des caches
 */
router.get('/cache-stats', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const stats = performanceOptimizationService.getPerformanceStats();
    
    // Calculer des statistiques supplémentaires
    const totalCacheSize = Object.values(stats.cacheStats).reduce((sum: number, cache: any) => sum + cache.size, 0);
    const averageHitRate = Object.values(stats.cacheStats).reduce((sum: number, cache: any) => sum + cache.hitRate, 0) / Object.keys(stats.cacheStats).length;
    
    res.json({
      success: true,
      data: {
        cacheStats: stats.cacheStats,
        summary: {
          totalCacheSize,
          averageHitRate: Math.round(averageHitRate * 100) / 100,
          cacheTypes: Object.keys(stats.cacheStats).length
        },
        recommendations: stats.recommendations.filter(r => r.includes('cache')),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de cache'
    });
  }
});

/**
 * GET /api/performance/operation-stats
 * Statistiques des opérations par type
 */
router.get('/operation-stats', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { operation, sortBy = 'averageTime', order = 'desc' } = req.query;
    
    const stats = performanceOptimizationService.getPerformanceStats();
    let operationStats = stats.operationStats;
    
    // Filtrer par opération si spécifié
    if (operation) {
      operationStats = operationStats.filter(op => op.operation.includes(operation as string));
    }
    
    // Trier les résultats
    operationStats.sort((a, b) => {
      const aValue = (a as any)[sortBy as string] || 0;
      const bValue = (b as any)[sortBy as string] || 0;
      
      return order === 'desc' ? bValue - aValue : aValue - bValue;
    });
    
    // Calculer des métriques agrégées
    const totalCalls = operationStats.reduce((sum, op) => sum + op.callCount, 0);
    const averageTime = operationStats.reduce((sum, op) => sum + op.averageTime, 0) / operationStats.length || 0;
    const slowOperations = operationStats.filter(op => op.averageTime > 1000);
    
    res.json({
      success: true,
      data: {
        operations: operationStats,
        summary: {
          totalOperations: operationStats.length,
          totalCalls,
          averageTime: Math.round(averageTime * 100) / 100,
          slowOperations: slowOperations.length
        },
        filters: {
          operation: operation || null,
          sortBy,
          order
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des statistiques d\'opération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques d\'opération'
    });
  }
});

/**
 * GET /api/performance/recommendations
 * Recommandations d'optimisation personnalisées
 */
router.get('/recommendations', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const stats = performanceOptimizationService.getPerformanceStats();
    
    // Générer des recommandations détaillées
    const detailedRecommendations = stats.recommendations.map(rec => ({
      recommendation: rec,
      priority: this.getRecommendationPriority(rec),
      category: this.getRecommendationCategory(rec),
      estimatedImpact: this.getEstimatedImpact(rec),
      implementationComplexity: this.getImplementationComplexity(rec)
    }));
    
    // Trier par priorité
    detailedRecommendations.sort((a, b) => b.priority - a.priority);
    
    res.json({
      success: true,
      data: {
        recommendations: detailedRecommendations,
        summary: {
          total: detailedRecommendations.length,
          highPriority: detailedRecommendations.filter(r => r.priority >= 8).length,
          mediumPriority: detailedRecommendations.filter(r => r.priority >= 5 && r.priority < 8).length,
          lowPriority: detailedRecommendations.filter(r => r.priority < 5).length
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération des recommandations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération des recommandations'
    });
  }
});

/**
 * POST /api/performance/benchmark
 * Lance un benchmark de performance (admin seulement)
 */
router.post('/benchmark', rbacMiddleware(['administrateur_plateforme']), async (req, res) => {
  try {
    const { operations = ['query', 'search', 'billing'], iterations = 10 } = req.body;
    
    if (iterations > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nombre d\'itérations limité à 100'
      });
    }

    const benchmarkResults = await this.runPerformanceBenchmark(operations, iterations);
    
    res.json({
      success: true,
      data: {
        benchmark: benchmarkResults,
        configuration: {
          operations,
          iterations
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Erreur lors du benchmark de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du benchmark de performance'
    });
  }
});

// Méthodes utilitaires privées (normalement dans une classe)

function getRecommendationPriority(recommendation: string): number {
  if (recommendation.includes('critique') || recommendation.includes('critical')) return 10;
  if (recommendation.includes('lent') || recommendation.includes('slow')) return 8;
  if (recommendation.includes('cache')) return 6;
  if (recommendation.includes('index')) return 7;
  return 5;
}

function getRecommendationCategory(recommendation: string): string {
  if (recommendation.includes('cache')) return 'Cache';
  if (recommendation.includes('requête') || recommendation.includes('query')) return 'Base de données';
  if (recommendation.includes('recherche') || recommendation.includes('search')) return 'Recherche';
  if (recommendation.includes('facturation') || recommendation.includes('billing')) return 'Facturation';
  return 'Général';
}

function getEstimatedImpact(recommendation: string): string {
  if (recommendation.includes('critique') || recommendation.includes('lent')) return 'Élevé';
  if (recommendation.includes('cache') || recommendation.includes('index')) return 'Moyen';
  return 'Faible';
}

function getImplementationComplexity(recommendation: string): string {
  if (recommendation.includes('index')) return 'Faible';
  if (recommendation.includes('cache')) return 'Moyen';
  if (recommendation.includes('requête') || recommendation.includes('optimiser')) return 'Élevé';
  return 'Moyen';
}

async function runPerformanceBenchmark(operations: string[], iterations: number): Promise<any> {
  const results: any = {};
  
  for (const operation of operations) {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        switch (operation) {
          case 'query':
            await performanceOptimizationService.optimizeQuery('SELECT 1');
            break;
          case 'search':
            await performanceOptimizationService.optimizeSearch({ texte: 'test' });
            break;
          case 'billing':
            await performanceOptimizationService.optimizeBillingCalculation({ amount: 1000 });
            break;
        }
      } catch (error) {
        // Ignorer les erreurs de benchmark
      }
      
      times.push(Date.now() - startTime);
    }
    
    results[operation] = {
      iterations,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      medianTime: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    };
  }
  
  return results;
}

export default router;