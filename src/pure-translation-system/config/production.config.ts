/**
 * Production Configuration for Pure Translation System
 * 
 * This configuration enables the Pure Translation System with zero tolerance
 * for language mixing in the JuristDZ application.
 */

import { PureTranslationSystemConfig } from '../types';

export const productionConfig: PureTranslationSystemConfig = {
  // Zero tolerance settings
  zeroToleranceEnabled: true,
  minimumPurityScore: 100,
  maxRetryAttempts: 3,
  
  // System features
  fallbackEnabled: true,
  cachingEnabled: true,
  monitoringEnabled: true,
  realTimeProcessing: true,
  
  // Performance settings
  concurrentRequestLimit: 100,
  processingTimeout: 30000,
  maxTextLength: 10000,
  
  // Quality thresholds
  qualityThresholds: {
    minimumPurityScore: 100,
    minimumConfidence: 0.8,
    maximumProcessingTime: 5000,
    terminologyAccuracyThreshold: 0.9,
    readabilityThreshold: 0.8
  },
  
  // Aggressive cleaning rules to eliminate mixing
  cleaningRules: {
    removeUIElements: true,
    removeCyrillicCharacters: true,
    removeEnglishFragments: true,
    normalizeEncoding: true,
    aggressiveCleaning: true,
    customPatterns: [
      'AUTO-TRANSLATE',
      'Pro',
      'V2',
      'Defined',
      'процедة',
      'JuristDZ',
      'En ligne',
      'متصل',
      'محامي دي زاد',
      'محاميدي',
      'محاميProتحليل',
      'ملفاتV2'
    ]
  },
  
  // Legal terminology settings
  terminologySettings: {
    useOfficialDictionary: true,
    allowUserContributions: false,
    validateConsistency: true,
    updateFrequency: 86400000, // 24 hours
    confidenceThreshold: 0.9
  },
  
  // Error handling
  errorHandling: {
    enableFallbackLogging: true,
    enableErrorReporting: true,
    enableUserFeedback: true,
    maxErrorRetries: 3,
    errorEscalationThreshold: 5
  },
  
  // Monitoring and reporting
  monitoring: {
    enableRealTimeMonitoring: true,
    enableQualityReporting: true,
    enablePerformanceTracking: true,
    reportingInterval: 3600000, // 1 hour
    metricsRetentionPeriod: 2592000000 // 30 days
  }
};

export default productionConfig;