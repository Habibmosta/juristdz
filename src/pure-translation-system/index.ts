/**
 * Pure Translation System - Main Entry Point
 * 
 * A comprehensive translation system with zero tolerance for language mixing,
 * designed for the JuristDZ legal platform to ensure 100% pure translations.
 */

export * from './interfaces';
export * from './types';
export * from './utils';

// Main system components
export { PureTranslationSystem } from './core/PureTranslationSystem';
export { TranslationGateway } from './core/TranslationGateway';
export { ContentCleaner } from './core/ContentCleaner';
export { AdvancedTranslationEngine } from './core/AdvancedTranslationEngine';
export { PurityValidationSystem } from './core/PurityValidationSystem';
export { LegalTerminologyManager } from './core/LegalTerminologyManager';

// Monitoring and reporting
export { QualityMonitor } from './monitoring/QualityMonitor';
export { ErrorReporter } from './core/ErrorReporter';
export { MetricsCollector } from './monitoring/MetricsCollector';

// Configuration
export { PureTranslationConfig } from './config/PureTranslationConfig';

// Unified System Integration
export { 
  PureTranslationSystemIntegration,
  pureTranslationSystemIntegration
} from './PureTranslationSystemIntegration';

// End-to-End Workflow
export { EndToEndWorkflow } from './workflow/EndToEndWorkflow';

// Deployment and System Management
export { 
  SystemDeployment,
  DeploymentUtils,
  systemDeployment
} from './deployment/SystemDeployment';

// Feedback Systems
export { UserFeedbackSystem } from './feedback/UserFeedbackSystem';
export { FeedbackDrivenImprovementSystem } from './feedback/FeedbackDrivenImprovementSystem';

// Testing and Examples
export { runIntegrationTests } from './test/IntegrationTests';
export { 
  SystemIntegrationDemo,
  runSystemIntegrationDemo
} from './examples/SystemIntegrationDemo';

// Default export - ready-to-use production system
export default pureTranslationSystemIntegration;