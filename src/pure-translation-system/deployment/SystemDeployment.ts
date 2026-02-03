/**
 * Pure Translation System Deployment Configuration
 * 
 * Handles system deployment, configuration management, and environment setup
 * for the Pure Translation System across different environments.
 */

import {
  PureTranslationSystemConfig,
  QualityThresholds,
  CleaningRules,
  TerminologySettings
} from '../types';
import { PureTranslationSystemIntegration } from '../PureTranslationSystemIntegration';
import { defaultLogger } from '../utils/Logger';

export interface DeploymentEnvironment {
  name: string;
  description: string;
  config: PureTranslationSystemConfig;
  healthCheckInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsRetention: number;
}

export interface DeploymentOptions {
  environment: 'development' | 'staging' | 'production';
  enableHealthChecks: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  customConfig?: Partial<PureTranslationSystemConfig>;
}

/**
 * System Deployment Manager
 * 
 * Manages deployment configurations and system initialization
 * across different environments with appropriate settings.
 */
export class SystemDeployment {
  private static instance: SystemDeployment;
  private deployedSystems: Map<string, PureTranslationSystemIntegration> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): SystemDeployment {
    if (!SystemDeployment.instance) {
      SystemDeployment.instance = new SystemDeployment();
    }
    return SystemDeployment.instance;
  }

  /**
   * Deploy Pure Translation System with specified configuration
   */
  async deploySystem(
    deploymentId: string,
    options: DeploymentOptions
  ): Promise<PureTranslationSystemIntegration> {
    try {
      defaultLogger.info('Starting system deployment', {
        deploymentId,
        environment: options.environment,
        enableHealthChecks: options.enableHealthChecks,
        enableMetrics: options.enableMetrics
      }, 'SystemDeployment');

      // Get environment configuration
      const envConfig = this.getEnvironmentConfiguration(options.environment);
      
      // Merge with custom configuration if provided
      const finalConfig = options.customConfig 
        ? this.mergeConfigurations(envConfig.config, options.customConfig)
        : envConfig.config;

      // Create system instance
      const system = new PureTranslationSystemIntegration(finalConfig);

      // Store deployed system
      this.deployedSystems.set(deploymentId, system);

      // Setup health checks if enabled
      if (options.enableHealthChecks) {
        await this.setupHealthChecks(deploymentId, system, envConfig.healthCheckInterval);
      }

      // Setup metrics collection if enabled
      if (options.enableMetrics) {
        await this.setupMetricsCollection(deploymentId, system, envConfig.metricsRetention);
      }

      // Setup logging if enabled
      if (options.enableLogging) {
        this.setupLogging(deploymentId, envConfig.logLevel);
      }

      defaultLogger.info('System deployment completed successfully', {
        deploymentId,
        environment: options.environment,
        systemHealth: await system.getSystemHealth()
      }, 'SystemDeployment');

      return system;

    } catch (error) {
      defaultLogger.error('System deployment failed', {
        deploymentId,
        error: error.message,
        stack: error.stack
      }, 'SystemDeployment');
      throw new Error(`Deployment failed for ${deploymentId}: ${error.message}`);
    }
  }

  /**
   * Get deployed system instance
   */
  getDeployedSystem(deploymentId: string): PureTranslationSystemIntegration | null {
    return this.deployedSystems.get(deploymentId) || null;
  }

  /**
   * Undeploy system and cleanup resources
   */
  async undeploySystem(deploymentId: string): Promise<void> {
    const system = this.deployedSystems.get(deploymentId);
    if (!system) {
      throw new Error(`No system deployed with ID: ${deploymentId}`);
    }

    try {
      defaultLogger.info('Starting system undeployment', { deploymentId }, 'SystemDeployment');

      // Stop health checks
      const healthCheckInterval = this.healthCheckIntervals.get(deploymentId);
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        this.healthCheckIntervals.delete(deploymentId);
      }

      // Shutdown system gracefully
      await system.shutdown();

      // Remove from deployed systems
      this.deployedSystems.delete(deploymentId);

      defaultLogger.info('System undeployment completed', { deploymentId }, 'SystemDeployment');

    } catch (error) {
      defaultLogger.error('System undeployment failed', {
        deploymentId,
        error: error.message
      }, 'SystemDeployment');
      throw error;
    }
  }

  /**
   * Get all deployed systems status
   */
  async getAllSystemsStatus(): Promise<{
    [deploymentId: string]: {
      health: any;
      uptime: number;
      lastHealthCheck: Date;
    };
  }> {
    const status: any = {};

    for (const [deploymentId, system] of this.deployedSystems.entries()) {
      try {
        const health = await system.getSystemHealth();
        status[deploymentId] = {
          health,
          uptime: Date.now() - health.lastHealthCheck.getTime(),
          lastHealthCheck: health.lastHealthCheck
        };
      } catch (error) {
        status[deploymentId] = {
          health: { status: 'critical', error: error.message },
          uptime: 0,
          lastHealthCheck: new Date()
        };
      }
    }

    return status;
  }

  /**
   * Update system configuration for deployed system
   */
  async updateSystemConfiguration(
    deploymentId: string,
    configUpdate: Partial<PureTranslationSystemConfig>
  ): Promise<void> {
    const system = this.deployedSystems.get(deploymentId);
    if (!system) {
      throw new Error(`No system deployed with ID: ${deploymentId}`);
    }

    try {
      system.updateConfiguration(configUpdate);
      
      defaultLogger.info('System configuration updated', {
        deploymentId,
        configUpdate
      }, 'SystemDeployment');

    } catch (error) {
      defaultLogger.error('Failed to update system configuration', {
        deploymentId,
        error: error.message
      }, 'SystemDeployment');
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private getEnvironmentConfiguration(environment: string): DeploymentEnvironment {
    switch (environment) {
      case 'production':
        return this.getProductionConfiguration();
      case 'staging':
        return this.getStagingConfiguration();
      case 'development':
        return this.getDevelopmentConfiguration();
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }
  }

  private getProductionConfiguration(): DeploymentEnvironment {
    return {
      name: 'production',
      description: 'Production environment with zero tolerance and maximum quality',
      healthCheckInterval: 30000, // 30 seconds
      logLevel: 'warn',
      metricsRetention: 2592000000, // 30 days
      config: {
        zeroToleranceEnabled: true,
        minimumPurityScore: 100,
        maxRetryAttempts: 3,
        fallbackEnabled: true,
        cachingEnabled: true,
        monitoringEnabled: true,
        realTimeProcessing: true,
        concurrentRequestLimit: 1000,
        processingTimeout: 30000,
        qualityThresholds: {
          minimumPurityScore: 100,
          minimumConfidence: 0.9,
          maximumProcessingTime: 5000,
          terminologyAccuracyThreshold: 0.95,
          readabilityThreshold: 0.85
        },
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
            'محامي دي زاد',
            'متصل',
            'تحليل',
            'ملفات'
          ]
        },
        terminologySettings: {
          useOfficialDictionary: true,
          allowUserContributions: false,
          validateConsistency: true,
          updateFrequency: 86400000, // 24 hours
          confidenceThreshold: 0.95
        }
      }
    };
  }

  private getStagingConfiguration(): DeploymentEnvironment {
    return {
      name: 'staging',
      description: 'Staging environment for testing with relaxed constraints',
      healthCheckInterval: 60000, // 1 minute
      logLevel: 'info',
      metricsRetention: 604800000, // 7 days
      config: {
        zeroToleranceEnabled: true,
        minimumPurityScore: 95,
        maxRetryAttempts: 3,
        fallbackEnabled: true,
        cachingEnabled: true,
        monitoringEnabled: true,
        realTimeProcessing: true,
        concurrentRequestLimit: 100,
        processingTimeout: 45000,
        qualityThresholds: {
          minimumPurityScore: 95,
          minimumConfidence: 0.8,
          maximumProcessingTime: 8000,
          terminologyAccuracyThreshold: 0.9,
          readabilityThreshold: 0.8
        },
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
            'процедة'
          ]
        },
        terminologySettings: {
          useOfficialDictionary: true,
          allowUserContributions: true,
          validateConsistency: true,
          updateFrequency: 43200000, // 12 hours
          confidenceThreshold: 0.9
        }
      }
    };
  }

  private getDevelopmentConfiguration(): DeploymentEnvironment {
    return {
      name: 'development',
      description: 'Development environment with debugging enabled',
      healthCheckInterval: 120000, // 2 minutes
      logLevel: 'debug',
      metricsRetention: 86400000, // 1 day
      config: {
        zeroToleranceEnabled: false,
        minimumPurityScore: 80,
        maxRetryAttempts: 2,
        fallbackEnabled: true,
        cachingEnabled: false,
        monitoringEnabled: true,
        realTimeProcessing: false,
        concurrentRequestLimit: 10,
        processingTimeout: 60000,
        qualityThresholds: {
          minimumPurityScore: 80,
          minimumConfidence: 0.6,
          maximumProcessingTime: 15000,
          terminologyAccuracyThreshold: 0.7,
          readabilityThreshold: 0.6
        },
        cleaningRules: {
          removeUIElements: true,
          removeCyrillicCharacters: true,
          removeEnglishFragments: true,
          normalizeEncoding: true,
          aggressiveCleaning: false,
          customPatterns: []
        },
        terminologySettings: {
          useOfficialDictionary: true,
          allowUserContributions: true,
          validateConsistency: false,
          updateFrequency: 3600000, // 1 hour
          confidenceThreshold: 0.7
        }
      }
    };
  }

  private mergeConfigurations(
    baseConfig: PureTranslationSystemConfig,
    customConfig: Partial<PureTranslationSystemConfig>
  ): PureTranslationSystemConfig {
    return {
      ...baseConfig,
      ...customConfig,
      qualityThresholds: {
        ...baseConfig.qualityThresholds,
        ...(customConfig.qualityThresholds || {})
      },
      cleaningRules: {
        ...baseConfig.cleaningRules,
        ...(customConfig.cleaningRules || {})
      },
      terminologySettings: {
        ...baseConfig.terminologySettings,
        ...(customConfig.terminologySettings || {})
      }
    };
  }

  private async setupHealthChecks(
    deploymentId: string,
    system: PureTranslationSystemIntegration,
    interval: number
  ): Promise<void> {
    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await system.getSystemHealth();
        
        if (health.status === 'critical') {
          defaultLogger.error('System health check failed', {
            deploymentId,
            health
          }, 'SystemDeployment');
        } else if (health.status === 'degraded') {
          defaultLogger.warn('System health degraded', {
            deploymentId,
            health
          }, 'SystemDeployment');
        }

      } catch (error) {
        defaultLogger.error('Health check error', {
          deploymentId,
          error: error.message
        }, 'SystemDeployment');
      }
    }, interval);

    this.healthCheckIntervals.set(deploymentId, healthCheckInterval);
  }

  private async setupMetricsCollection(
    deploymentId: string,
    system: PureTranslationSystemIntegration,
    retentionPeriod: number
  ): Promise<void> {
    // Setup periodic metrics collection
    setInterval(async () => {
      try {
        const metrics = await system.getSystemMetrics();
        
        // Log metrics for external collection systems
        defaultLogger.info('System metrics', {
          deploymentId,
          metrics,
          timestamp: new Date()
        }, 'SystemMetrics');

      } catch (error) {
        defaultLogger.error('Metrics collection error', {
          deploymentId,
          error: error.message
        }, 'SystemDeployment');
      }
    }, 60000); // Collect metrics every minute
  }

  private setupLogging(deploymentId: string, logLevel: string): void {
    // Configure logging level for this deployment
    defaultLogger.info('Logging configured', {
      deploymentId,
      logLevel
    }, 'SystemDeployment');
  }
}

/**
 * Deployment utility functions
 */
export class DeploymentUtils {
  /**
   * Quick deployment for production
   */
  static async deployProduction(deploymentId: string = 'production'): Promise<PureTranslationSystemIntegration> {
    const deployment = SystemDeployment.getInstance();
    return await deployment.deploySystem(deploymentId, {
      environment: 'production',
      enableHealthChecks: true,
      enableMetrics: true,
      enableLogging: true
    });
  }

  /**
   * Quick deployment for development
   */
  static async deployDevelopment(deploymentId: string = 'development'): Promise<PureTranslationSystemIntegration> {
    const deployment = SystemDeployment.getInstance();
    return await deployment.deploySystem(deploymentId, {
      environment: 'development',
      enableHealthChecks: true,
      enableMetrics: true,
      enableLogging: true
    });
  }

  /**
   * Quick deployment for staging
   */
  static async deployStaging(deploymentId: string = 'staging'): Promise<PureTranslationSystemIntegration> {
    const deployment = SystemDeployment.getInstance();
    return await deployment.deploySystem(deploymentId, {
      environment: 'staging',
      enableHealthChecks: true,
      enableMetrics: true,
      enableLogging: true
    });
  }

  /**
   * Deploy with custom configuration
   */
  static async deployCustom(
    deploymentId: string,
    environment: 'development' | 'staging' | 'production',
    customConfig: Partial<PureTranslationSystemConfig>
  ): Promise<PureTranslationSystemIntegration> {
    const deployment = SystemDeployment.getInstance();
    return await deployment.deploySystem(deploymentId, {
      environment,
      enableHealthChecks: true,
      enableMetrics: true,
      enableLogging: true,
      customConfig
    });
  }

  /**
   * Get deployment status for all systems
   */
  static async getDeploymentStatus(): Promise<any> {
    const deployment = SystemDeployment.getInstance();
    return await deployment.getAllSystemsStatus();
  }

  /**
   * Shutdown all deployed systems
   */
  static async shutdownAll(): Promise<void> {
    const deployment = SystemDeployment.getInstance();
    const status = await deployment.getAllSystemsStatus();
    
    for (const deploymentId of Object.keys(status)) {
      try {
        await deployment.undeploySystem(deploymentId);
      } catch (error) {
        defaultLogger.error('Failed to shutdown system', {
          deploymentId,
          error: error.message
        }, 'DeploymentUtils');
      }
    }
  }
}

// Export singleton instance
export const systemDeployment = SystemDeployment.getInstance();
export default systemDeployment;