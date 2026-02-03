/**
 * Core Pipeline Test - Validation of core translation pipeline components
 * 
 * Tests the integration and functionality of core Pure Translation System components
 * to ensure they work together correctly before proceeding with advanced features.
 */

import { PurityValidationSystem } from '../core/PurityValidationSystem';
import { LegalTerminologyManager } from '../core/LegalTerminologyManager';
import { FallbackContentGenerator } from '../core/FallbackContentGenerator';
import { QualityMonitor } from '../monitoring/QualityMonitor';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { Language, ContentType, TranslationPriority, LegalDomain } from '../types';

/**
 * Core Pipeline Validation Test
 */
export class CorePipelineTest {
  private purityValidator: PurityValidationSystem;
  private terminologyManager: LegalTerminologyManager;
  private fallbackGenerator: FallbackContentGenerator;
  private qualityMonitor: QualityMonitor;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.purityValidator = new PurityValidationSystem();
    this.terminologyManager = new LegalTerminologyManager();
    this.fallbackGenerator = new FallbackContentGenerator();
    this.qualityMonitor = new QualityMonitor();
    this.metricsCollector = new MetricsCollector();
  }

  /**
   * Run comprehensive core pipeline validation
   */
  async runValidation(): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    console.log('🔧 Starting Core Pipeline Validation...\n');

    try {
      // Test 1: Purity Validation System
      console.log('1. Testing Purity Validation System...');
      const purityTest = await this.testPurityValidation();
      results.push({ test: 'PurityValidation', ...purityTest });
      if (!purityTest.success) {
        errors.push('Purity Validation System failed');
      }

      // Test 2: Legal Terminology Manager
      console.log('2. Testing Legal Terminology Manager...');
      const terminologyTest = await this.testTerminologyManager();
      results.push({ test: 'TerminologyManager', ...terminologyTest });
      if (!terminologyTest.success) {
        errors.push('Legal Terminology Manager failed');
      }

      // Test 3: Fallback Content Generator
      console.log('3. Testing Fallback Content Generator...');
      const fallbackTest = await this.testFallbackGenerator();
      results.push({ test: 'FallbackGenerator', ...fallbackTest });
      if (!fallbackTest.success) {
        errors.push('Fallback Content Generator failed');
      }

      // Test 4: Quality Monitor
      console.log('4. Testing Quality Monitor...');
      const qualityTest = await this.testQualityMonitor();
      results.push({ test: 'QualityMonitor', ...qualityTest });
      if (!qualityTest.success) {
        errors.push('Quality Monitor failed');
      }

      // Test 5: Metrics Collector
      console.log('5. Testing Metrics Collector...');
      const metricsTest = await this.testMetricsCollector();
      results.push({ test: 'MetricsCollector', ...metricsTest });
      if (!metricsTest.success) {
        errors.push('Metrics Collector failed');
      }

      // Test 6: Integration Test
      console.log('6. Testing Component Integration...');
      const integrationTest = await this.testComponentIntegration();
      results.push({ test: 'Integration', ...integrationTest });
      if (!integrationTest.success) {
        errors.push('Component Integration failed');
      }

      const success = errors.length === 0;
      
      console.log('\n🔧 Core Pipeline Validation Results:');
      console.log(`✅ Success: ${success}`);
      console.log(`📊 Tests Passed: ${results.filter(r => r.success).length}/${results.length}`);
      
      if (errors.length > 0) {
        console.log('❌ Errors:');
        errors.forEach(error => console.log(`  - ${error}`));
      }

      return { success, results, errors };

    } catch (error) {
      console.error('❌ Core Pipeline Validation failed with error:', error);
      return {
        success: false,
        results,
        errors: [...errors, `System error: ${error}`]
      };
    }
  }

  /**
   * Test Purity Validation System
   */
  private async testPurityValidation(): Promise<{ success: boolean; details: any }> {
    try {
      // Test 1: Pure Arabic text
      const pureArabicResult = await this.purityValidator.validatePurity(
        'هذا نص قانوني باللغة العربية',
        Language.ARABIC
      );

      // Test 2: Pure French text
      const pureFrenchResult = await this.purityValidator.validatePurity(
        'Ceci est un texte juridique en français',
        Language.FRENCH
      );

      // Test 3: Mixed content (should fail)
      const mixedContentResult = await this.purityValidator.validatePurity(
        'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
        Language.ARABIC
      );

      // Test 4: Cyrillic characters (should fail)
      const cyrillicResult = await this.purityValidator.validatePurity(
        'محامي процедة تاجر',
        Language.ARABIC
      );

      const success = 
        pureArabicResult.isPure &&
        pureFrenchResult.isPure &&
        !mixedContentResult.isPure &&
        !cyrillicResult.isPure;

      return {
        success,
        details: {
          pureArabic: pureArabicResult.purityScore.overall,
          pureFrench: pureFrenchResult.purityScore.overall,
          mixedContent: mixedContentResult.purityScore.overall,
          cyrillic: cyrillicResult.purityScore.overall,
          violationsDetected: mixedContentResult.violations.length + cyrillicResult.violations.length
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test Legal Terminology Manager
   */
  private async testTerminologyManager(): Promise<{ success: boolean; details: any }> {
    try {
      // Test 1: Translate legal term from French to Arabic
      const frenchToArabic = await this.terminologyManager.translateLegalTerm(
        'contrat',
        Language.FRENCH,
        Language.ARABIC
      );

      // Test 2: Translate legal term from Arabic to French
      const arabicToFrench = await this.terminologyManager.translateLegalTerm(
        'عقد',
        Language.ARABIC,
        Language.FRENCH
      );

      // Test 3: Search for terms
      const searchResults = this.terminologyManager.searchTerms('contrat');

      // Test 4: Get dictionary stats
      const stats = this.terminologyManager.getDictionaryStats();

      const success = 
        frenchToArabic !== null &&
        arabicToFrench !== null &&
        searchResults.length > 0 &&
        Object.keys(stats).length > 0;

      return {
        success,
        details: {
          frenchToArabicFound: frenchToArabic !== null,
          arabicToFrenchFound: arabicToFrench !== null,
          searchResultsCount: searchResults.length,
          totalDomains: Object.keys(stats).length,
          totalTerms: this.terminologyManager.getTotalTermsCount()
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test Fallback Content Generator
   */
  private async testFallbackGenerator(): Promise<{ success: boolean; details: any }> {
    try {
      // Test 1: Generate fallback for Arabic
      const arabicFallback = await this.fallbackGenerator.generateFallbackContent(
        'محتوى قانوني معقد',
        Language.ARABIC,
        'Translation failed'
      );

      // Test 2: Generate fallback for French
      const frenchFallback = await this.fallbackGenerator.generateFallbackContent(
        'contenu juridique complexe',
        Language.FRENCH,
        'Translation failed'
      );

      // Test 3: Generate professional content
      const professionalContent = this.fallbackGenerator.generateProfessionalContent(
        LegalDomain.CIVIL_LAW,
        Language.ARABIC
      );

      // Test 4: Generate emergency fallback
      const emergencyFallback = this.fallbackGenerator.generateEmergencyFallback(
        Language.FRENCH,
        'Critical system error'
      );

      const success = 
        arabicFallback.content.length > 0 &&
        frenchFallback.content.length > 0 &&
        professionalContent.length > 0 &&
        emergencyFallback.content.length > 0;

      return {
        success,
        details: {
          arabicFallbackGenerated: arabicFallback.content.length > 0,
          frenchFallbackGenerated: frenchFallback.content.length > 0,
          professionalContentGenerated: professionalContent.length > 0,
          emergencyFallbackGenerated: emergencyFallback.content.length > 0,
          arabicConfidence: arabicFallback.confidence,
          frenchConfidence: frenchFallback.confidence
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test Quality Monitor
   */
  private async testQualityMonitor(): Promise<{ success: boolean; details: any }> {
    try {
      // Create mock translation request and result
      const mockRequest = {
        text: 'Test legal content',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: TranslationPriority.NORMAL
      };

      const mockResult = {
        translatedText: 'محتوى قانوني للاختبار',
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 95,
          contextualRelevance: 90,
          readabilityScore: 85,
          professionalismScore: 90,
          encodingIntegrity: 100
        },
        processingTime: 1500,
        method: 'primary_ai' as any,
        confidence: 0.9,
        warnings: [],
        metadata: {
          requestId: 'test-123',
          timestamp: new Date(),
          processingSteps: [],
          fallbackUsed: false,
          cacheHit: false
        }
      };

      // Test quality assessment
      const qualityReport = await this.qualityMonitor.assessQuality(mockRequest, mockResult);

      // Test quality trends
      const trends = this.qualityMonitor.getQualityTrends();

      const success = 
        qualityReport.overallScore > 0 &&
        qualityReport.translationId === 'test-123' &&
        trends !== null;

      return {
        success,
        details: {
          overallScore: qualityReport.overallScore,
          issuesCount: qualityReport.issues.length,
          recommendationsCount: qualityReport.recommendations.length,
          processingTime: qualityReport.processingTime,
          trendsAvailable: trends !== null
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test Metrics Collector
   */
  private async testMetricsCollector(): Promise<{ success: boolean; details: any }> {
    try {
      // Test metrics recording
      const mockRequest = {
        text: 'Test content',
        sourceLanguage: Language.FRENCH,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: TranslationPriority.NORMAL
      };

      const mockResult = {
        translatedText: 'محتوى الاختبار',
        purityScore: 100,
        qualityMetrics: {
          purityScore: 100,
          terminologyAccuracy: 95,
          contextualRelevance: 90,
          readabilityScore: 85,
          professionalismScore: 90,
          encodingIntegrity: 100
        },
        processingTime: 1200,
        method: 'primary_ai' as any,
        confidence: 0.9,
        warnings: [],
        metadata: {
          requestId: 'metrics-test-123',
          timestamp: new Date(),
          processingSteps: [],
          fallbackUsed: false,
          cacheHit: false
        }
      };

      // Record translation events
      this.metricsCollector.recordTranslationStart(mockRequest);
      this.metricsCollector.recordTranslationComplete(mockRequest, mockResult);

      // Record user feedback
      this.metricsCollector.recordUserFeedback('metrics-test-123', true, 'Good translation');

      // Get metrics
      const metrics = this.metricsCollector.getMetrics();
      const recentEvents = this.metricsCollector.getRecentEvents(10);
      const systemHealth = this.metricsCollector.getSystemHealth();

      const success = 
        metrics.totalTranslations > 0 &&
        recentEvents.length > 0 &&
        systemHealth.status !== undefined;

      return {
        success,
        details: {
          totalTranslations: metrics.totalTranslations,
          purityRate: metrics.purityRate,
          recentEventsCount: recentEvents.length,
          systemHealthStatus: systemHealth.status,
          systemHealthIssues: systemHealth.issues.length
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Test Component Integration
   */
  private async testComponentIntegration(): Promise<{ success: boolean; details: any }> {
    try {
      // Test integration workflow: problematic content -> validation -> fallback -> quality assessment
      const problematicText = 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة';
      
      // Step 1: Validate purity (should fail)
      const purityResult = await this.purityValidator.validatePurity(problematicText, Language.ARABIC);
      
      // Step 2: Generate fallback content
      const fallbackContent = await this.fallbackGenerator.generateFallbackContent(
        problematicText,
        Language.ARABIC,
        'Mixed content detected'
      );
      
      // Step 3: Validate fallback content purity (should pass)
      const fallbackPurityResult = await this.purityValidator.validatePurity(
        fallbackContent.content,
        Language.ARABIC
      );
      
      // Step 4: Assess quality of fallback
      const mockRequest = {
        text: problematicText,
        sourceLanguage: Language.ARABIC,
        targetLanguage: Language.ARABIC,
        contentType: ContentType.LEGAL_DOCUMENT,
        priority: TranslationPriority.NORMAL
      };

      const mockResult = {
        translatedText: fallbackContent.content,
        purityScore: fallbackPurityResult.purityScore.overall,
        qualityMetrics: {
          purityScore: fallbackPurityResult.purityScore.overall,
          terminologyAccuracy: 90,
          contextualRelevance: 85,
          readabilityScore: 80,
          professionalismScore: 95,
          encodingIntegrity: 100
        },
        processingTime: 2000,
        method: 'fallback_generated' as any,
        confidence: fallbackContent.confidence,
        warnings: [],
        metadata: {
          requestId: 'integration-test-123',
          timestamp: new Date(),
          processingSteps: [],
          fallbackUsed: true,
          cacheHit: false
        }
      };

      const qualityReport = await this.qualityMonitor.assessQuality(mockRequest, mockResult);

      const success = 
        !purityResult.isPure && // Original content should fail purity
        fallbackPurityResult.isPure && // Fallback should pass purity
        qualityReport.overallScore > 0; // Quality assessment should work

      return {
        success,
        details: {
          originalPurityFailed: !purityResult.isPure,
          fallbackPurityPassed: fallbackPurityResult.isPure,
          fallbackContentGenerated: fallbackContent.content.length > 0,
          qualityAssessmentCompleted: qualityReport.overallScore > 0,
          integrationWorkflowCompleted: true,
          originalViolations: purityResult.violations.length,
          fallbackViolations: fallbackPurityResult.violations.length,
          qualityScore: qualityReport.overallScore
        }
      };

    } catch (error) {
      return { success: false, details: { error: error.message } };
    }
  }
}

// Export test runner function
export async function runCoreValidation(): Promise<boolean> {
  const test = new CorePipelineTest();
  const result = await test.runValidation();
  return result.success;
}