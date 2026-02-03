/**
 * Pure Translation System Configuration
 * 
 * Central configuration management for the Pure Translation System
 * with zero tolerance policies and comprehensive quality settings.
 */

import { 
  PureTranslationSystemConfig, 
  QualityThresholds, 
  CleaningRules, 
  TerminologySettings,
  LogLevel 
} from '../types';

export class PureTranslationConfig {
  private static instance: PureTranslationConfig;
  private config: PureTranslationSystemConfig;

  constructor(initialConfig?: Partial<PureTranslationSystemConfig>) {
    this.config = this.getDefaultConfig();
    if (initialConfig) {
      this.updateConfig(initialConfig);
    }
  }

  public static getInstance(): PureTranslationConfig {
    if (!PureTranslationConfig.instance) {
      PureTranslationConfig.instance = new PureTranslationConfig();
    }
    return PureTranslationConfig.instance;
  }

  private getDefaultConfig(): PureTranslationSystemConfig {
    return {
      // Zero tolerance policy - absolutely no mixed content allowed
      zeroToleranceEnabled: true,
      minimumPurityScore: 100, // Must be exactly 100% pure
      maxRetryAttempts: 3,
      fallbackEnabled: true,
      cachingEnabled: true,
      monitoringEnabled: true,
      realTimeProcessing: true,
      concurrentRequestLimit: 10,
      processingTimeout: 30000, // 30 seconds

      qualityThresholds: {
        minimumPurityScore: 100, // Zero tolerance - must be 100%
        minimumConfidence: 0.8,
        maximumProcessingTime: 30000,
        terminologyAccuracyThreshold: 0.95,
        readabilityThreshold: 0.8
      },

      cleaningRules: {
        removeUIElements: true,
        removeCyrillicCharacters: true,
        removeEnglishFragments: true,
        normalizeEncoding: true,
        aggressiveCleaning: true,
        customPatterns: [
          // User-reported problematic patterns
          'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
          'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
          'процедة',
          'Defined',
          'AUTO-TRANSLATE',
          'V2',
          'Pro',
          // Common UI artifacts
          'undefined',
          'null',
          'NaN',
          '[object Object]',
          // Version numbers and system artifacts
          /v\d+\.\d+/i,
          /version\s*\d+/i,
          /build\s*\d+/i,
          // Mixed script patterns
          /[а-яё]+/gi, // Cyrillic characters
          /[a-z]+[أ-ي]+[a-z]+/gi, // Mixed Latin-Arabic
          /[أ-ي]+[a-z]+[أ-ي]+/gi, // Mixed Arabic-Latin
        ]
      },

      terminologySettings: {
        useOfficialDictionary: true,
        allowUserContributions: false, // Strict control for legal accuracy
        validateConsistency: true,
        updateFrequency: 86400000, // 24 hours in milliseconds
        confidenceThreshold: 0.9
      }
    };
  }

  public getConfig(): PureTranslationSystemConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<PureTranslationSystemConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Ensure zero tolerance policy is maintained
    if (updates.zeroToleranceEnabled === false) {
      console.warn('⚠️ Attempting to disable zero tolerance policy - this is not recommended for legal content');
    }
    
    // Ensure minimum purity score is not lowered below 100%
    if (updates.minimumPurityScore && updates.minimumPurityScore < 100) {
      console.warn('⚠️ Minimum purity score set below 100% - zero tolerance policy requires 100% purity');
      this.config.minimumPurityScore = 100;
    }
  }

  public getQualityThresholds(): QualityThresholds {
    return { ...this.config.qualityThresholds };
  }

  public getCleaningRules(): CleaningRules {
    return { ...this.config.cleaningRules };
  }

  public getTerminologySettings(): TerminologySettings {
    return { ...this.config.terminologySettings };
  }

  public isZeroToleranceEnabled(): boolean {
    return this.config.zeroToleranceEnabled;
  }

  public getMinimumPurityScore(): number {
    return this.config.minimumPurityScore;
  }

  public getMaxRetryAttempts(): number {
    return this.config.maxRetryAttempts;
  }

  public isFallbackEnabled(): boolean {
    return this.config.fallbackEnabled;
  }

  public isCachingEnabled(): boolean {
    return this.config.cachingEnabled;
  }

  public isMonitoringEnabled(): boolean {
    return this.config.monitoringEnabled;
  }

  public isRealTimeProcessingEnabled(): boolean {
    return this.config.realTimeProcessing;
  }

  public getConcurrentRequestLimit(): number {
    return this.config.concurrentRequestLimit;
  }

  public getProcessingTimeout(): number {
    return this.config.processingTimeout;
  }

  public getMaxTextLength(): number {
    return 50000; // Default max text length
  }

  public addCustomCleaningPattern(pattern: string | RegExp): void {
    this.config.cleaningRules.customPatterns.push(pattern);
  }

  public removeCustomCleaningPattern(pattern: string | RegExp): void {
    const index = this.config.cleaningRules.customPatterns.indexOf(pattern);
    if (index > -1) {
      this.config.cleaningRules.customPatterns.splice(index, 1);
    }
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.minimumPurityScore < 0 || this.config.minimumPurityScore > 100) {
      errors.push('Minimum purity score must be between 0 and 100');
    }

    if (this.config.maxRetryAttempts < 1) {
      errors.push('Max retry attempts must be at least 1');
    }

    if (this.config.processingTimeout < 1000) {
      errors.push('Processing timeout must be at least 1000ms');
    }

    if (this.config.concurrentRequestLimit < 1) {
      errors.push('Concurrent request limit must be at least 1');
    }

    if (this.config.qualityThresholds.minimumConfidence < 0 || this.config.qualityThresholds.minimumConfidence > 1) {
      errors.push('Minimum confidence must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public resetToDefaults(): void {
    this.config = this.getDefaultConfig();
  }

  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importConfig(configJson: string): { success: boolean; error?: string } {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateConfig();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`
        };
      }

      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse configuration: ${error}`
      };
    }
  }
}

// Export singleton instance
export const pureTranslationConfig = PureTranslationConfig.getInstance();