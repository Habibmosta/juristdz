/**
 * Comprehensive Test Suite for Feedback-Driven Improvement System
 * 
 * Tests the complete feedback processing pipeline including:
 * - Algorithm enhancement based on user feedback
 * - Immediate investigation and resolution for mixed content reports
 * - Continuous improvement feedback loop
 */

import { FeedbackDrivenImprovementSystem } from '../feedback/FeedbackDrivenImprovementSystem';
import { UserFeedbackSystem, UserFeedback, FeedbackType, ReportedIssue } from '../feedback/UserFeedbackSystem';
import { PatternDetectionSystem } from '../core/PatternDetectionSystem';
import { AnalyticsReportingSystem } from '../reporting/AnalyticsReportingSystem';
import { ContentCleaner } from '../core/ContentCleaner';
import { PurityValidationSystem } from '../core/PurityValidationSystem';
import { LegalTerminologyManager } from '../core/LegalTerminologyManager';
import { IssueType, Severity, Language } from '../types';

describe('Feedback-Driven Improvement System', () => {
  let feedbackSystem: FeedbackDrivenImprovementSystem;
  let userFeedbackSystem: UserFeedbackSystem;
  let patternDetection: PatternDetectionSystem;
  let analyticsReporting: AnalyticsReportingSystem;
  let contentCleaner: ContentCleaner;
  let purityValidator: PurityValidationSystem;
  let terminologyManager: LegalTerminologyManager;

  beforeEach(() => {
    // Initialize all components
    patternDetection = new PatternDetectionSystem();
    analyticsReporting = new AnalyticsReportingSystem();
    contentCleaner = new ContentCleaner();
    purityValidator = new PurityValidationSystem();
    terminologyManager = new LegalTerminologyManager();
    
    feedbackSystem = new FeedbackDrivenImprovementSystem(
      patternDetection,
      analyticsReporting,
      contentCleaner,
      purityValidator,
      terminologyManager
    );
    
    userFeedbackSystem = new UserFeedbackSystem();
  });

  describe('Algorithm Enhancement from User Feedback', () => {
    test('should generate enhancement from mixed content feedback', async () => {
      // Create feedback with mixed content issue
      const feedback: UserFeedback = {
        id: 'feedback_001',
        userId: 'user_123',
        translationId: 'trans_456',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        isPositive: false,
        comment: 'Translation contains mixed Arabic and English text',
        reportedIssues: [{
          type: IssueType.LANGUAGE_MIXING,
          severity: Severity.CRITICAL,
          description: 'Mixed Arabic-English content in translation',
          originalText: 'النص القانوني',
          translatedText: 'النص القانوني Defined في المادة',
          expectedResult: 'النص القانوني المحدد في المادة'
        }],
        suggestions: ['Improve content cleaning before translation'],
        timestamp: new Date(),
        processed: false
      };

      // Process feedback for enhancement
      const enhancements = await feedbackSystem.processFeedbackForEnhancement(feedback);

      // Verify enhancement was generated
      expect(enhancements).toHaveLength(1);
      expect(enhancements[0].type).toBe('content_cleaning');
      expect(enhancements[0].feedbackSource).toContain(feedback.id);
      expect(enhancements[0].status).toBe('identified');
    });

    test('should implement enhancement successfully', async () => {
      // Create a test enhancement
      const feedback: UserFeedback = {
        id: 'feedback_002',
        userId: 'user_124',
        translationId: 'trans_457',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 2,
        isPositive: false,
        comment: 'Cyrillic characters appearing in Arabic translation',
        reportedIssues: [{
          type: IssueType.CORRUPTED_CHARACTERS,
          severity: Severity.HIGH,
          description: 'Cyrillic contamination in Arabic text',
          originalText: 'القانون الجنائي',
          translatedText: 'القانون الجنائي процедة',
          expectedResult: 'القانون الجنائي الإجرائي'
        }],
        suggestions: [],
        timestamp: new Date(),
        processed: false
      };

      const enhancements = await feedbackSystem.processFeedbackForEnhancement(feedback);
      expect(enhancements).toHaveLength(1);

      // Implement the enhancement
      const success = await feedbackSystem.implementEnhancement(enhancements[0].id);
      expect(success).toBe(true);

      // Verify enhancement status
      const enhancementStatus = feedbackSystem.getEnhancementStatus(enhancements[0].id);
      expect(enhancementStatus?.status).toBe('deployed');
    });
  });

  describe('Immediate Investigation for Mixed Content', () => {
    test('should initiate immediate investigation for critical mixed content', async () => {
      const criticalFeedback: UserFeedback = {
        id: 'feedback_critical_001',
        userId: 'user_125',
        translationId: 'trans_458',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        isPositive: false,
        comment: 'Severe mixed content with UI elements',
        reportedIssues: [{
          type: IssueType.LANGUAGE_MIXING,
          severity: Severity.CRITICAL,
          description: 'UI elements contaminating legal translation',
          originalText: 'محامي متخصص',
          translatedText: 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
          expectedResult: 'محامي متخصص'
        }],
        suggestions: [],
        timestamp: new Date(),
        processed: false
      };

      // Initiate immediate investigation
      const investigationId = await feedbackSystem.initiateImmediateInvestigation(criticalFeedback);
      expect(investigationId).toBeDefined();
      expect(investigationId).toMatch(/^inv_/);

      // Verify investigation was created
      const investigation = feedbackSystem.getInvestigationStatus(investigationId);
      expect(investigation).toBeDefined();
      expect(investigation?.feedbackId).toBe(criticalFeedback.id);
      expect(investigation?.issueType).toBe(IssueType.LANGUAGE_MIXING);
      expect(investigation?.severity).toBe(Severity.CRITICAL);
    });

    test('should complete investigation with resolution', async () => {
      const feedback: UserFeedback = {
        id: 'feedback_investigation_001',
        userId: 'user_126',
        translationId: 'trans_459',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        isPositive: false,
        comment: 'Corrupted characters in legal document translation',
        reportedIssues: [{
          type: IssueType.CORRUPTED_CHARACTERS,
          severity: Severity.HIGH,
          description: 'Cyrillic characters in Arabic legal text',
          originalText: 'الشهود في المحكمة',
          translatedText: 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
          expectedResult: 'الشهود المحددون في المادة 1 من قانون الإجراءات الجنائية'
        }],
        suggestions: [],
        timestamp: new Date(),
        processed: false
      };

      const investigationId = await feedbackSystem.initiateImmediateInvestigation(feedback);
      
      // Wait for investigation to complete (simulate async processing)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const investigation = feedbackSystem.getInvestigationStatus(investigationId);
      expect(investigation?.status).toBe('resolution_implemented');
      expect(investigation?.investigationSteps.length).toBeGreaterThan(0);
      expect(investigation?.preventionMeasures.length).toBeGreaterThan(0);
    });
  });

  describe('Continuous Improvement Feedback Loop', () => {
    test('should track improvement metrics', async () => {
      const initialMetrics = feedbackSystem.getImprovementMetrics();
      expect(initialMetrics.totalEnhancements).toBe(0);
      expect(initialMetrics.successfulEnhancements).toBe(0);

      // Process multiple feedback items
      const feedbackItems = [
        {
          id: 'feedback_loop_001',
          userId: 'user_127',
          translationId: 'trans_460',
          feedbackType: FeedbackType.MIXED_CONTENT,
          rating: 2,
          isPositive: false,
          comment: 'Mixed content issue',
          reportedIssues: [{
            type: IssueType.LANGUAGE_MIXING,
            severity: Severity.MEDIUM,
            description: 'Mixed scripts detected',
            originalText: 'النص الأصلي',
            translatedText: 'النص الأصلي with English',
            expectedResult: 'النص الأصلي مع الإنجليزية'
          }],
          suggestions: [],
          timestamp: new Date(),
          processed: false
        },
        {
          id: 'feedback_loop_002',
          userId: 'user_128',
          translationId: 'trans_461',
          feedbackType: FeedbackType.TERMINOLOGY_ERROR,
          rating: 3,
          isPositive: false,
          comment: 'Incorrect legal terminology',
          reportedIssues: [{
            type: IssueType.POOR_TERMINOLOGY,
            severity: Severity.MEDIUM,
            description: 'Wrong legal term used',
            originalText: 'avocat',
            translatedText: 'محامي',
            expectedResult: 'محامٍ'
          }],
          suggestions: ['Update legal dictionary'],
          timestamp: new Date(),
          processed: false
        }
      ];

      // Process feedback and generate enhancements
      for (const feedback of feedbackItems) {
        const enhancements = await feedbackSystem.processFeedbackForEnhancement(feedback);
        for (const enhancement of enhancements) {
          await feedbackSystem.implementEnhancement(enhancement.id);
        }
      }

      // Check updated metrics
      const updatedMetrics = feedbackSystem.getImprovementMetrics();
      expect(updatedMetrics.totalEnhancements).toBeGreaterThan(initialMetrics.totalEnhancements);
      expect(updatedMetrics.successfulEnhancements).toBeGreaterThan(initialMetrics.successfulEnhancements);
    });

    test('should maintain active and completed enhancement lists', async () => {
      // Initially should have no enhancements
      expect(feedbackSystem.getActiveEnhancements()).toHaveLength(0);
      expect(feedbackSystem.getCompletedEnhancements()).toHaveLength(0);

      // Create and process feedback
      const feedback: UserFeedback = {
        id: 'feedback_enhancement_001',
        userId: 'user_129',
        translationId: 'trans_462',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        isPositive: false,
        comment: 'UI contamination in translation',
        reportedIssues: [{
          type: IssueType.UI_CONTAMINATION,
          severity: Severity.HIGH,
          description: 'UI elements in legal text',
          originalText: 'المحامي المختص',
          translatedText: 'المحامي المختص Pro V2',
          expectedResult: 'المحامي المختص'
        }],
        suggestions: [],
        timestamp: new Date(),
        processed: false
      };

      const enhancements = await feedbackSystem.processFeedbackForEnhancement(feedback);
      expect(enhancements).toHaveLength(1);

      // Should have active enhancement
      expect(feedbackSystem.getActiveEnhancements()).toHaveLength(1);
      expect(feedbackSystem.getCompletedEnhancements()).toHaveLength(0);

      // Implement enhancement
      await feedbackSystem.implementEnhancement(enhancements[0].id);

      // Should still be active (deployed but not completed)
      const activeEnhancements = feedbackSystem.getActiveEnhancements();
      expect(activeEnhancements).toHaveLength(1);
      expect(activeEnhancements[0].status).toBe('deployed');
    });
  });

  describe('Integration with User Feedback System', () => {
    test('should process user feedback end-to-end', async () => {
      // Collect user feedback
      const feedbackId = await userFeedbackSystem.collectFeedback({
        userId: 'user_130',
        translationId: 'trans_463',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        comment: 'Severe mixed content with corrupted characters',
        reportedIssues: [{
          type: IssueType.LANGUAGE_MIXING,
          severity: Severity.CRITICAL,
          description: 'Mixed Arabic-Cyrillic content',
          originalText: 'القانون المدني',
          translatedText: 'القانون المدني процедة',
          expectedResult: 'القانون المدني'
        }],
        suggestions: ['Fix character encoding issues']
      });

      expect(feedbackId).toBeDefined();

      // Process feedback
      const processingResult = await userFeedbackSystem.processFeedback(feedbackId);
      expect(processingResult.processed).toBe(true);
      expect(processingResult.actionsTriggered.length).toBeGreaterThan(0);
      expect(processingResult.userNotified).toBe(true);

      // Verify feedback was processed by improvement system
      const feedback = userFeedbackSystem.getFeedbackById(feedbackId);
      expect(feedback?.processed).toBe(true);
      expect(feedback?.response).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle invalid enhancement gracefully', async () => {
      // Try to implement non-existent enhancement
      const success = await feedbackSystem.implementEnhancement('invalid_id');
      expect(success).toBe(false);
    });

    test('should handle investigation of empty content', async () => {
      const feedback: UserFeedback = {
        id: 'feedback_empty_001',
        userId: 'user_131',
        translationId: 'trans_464',
        feedbackType: FeedbackType.MIXED_CONTENT,
        rating: 1,
        isPositive: false,
        comment: 'Empty translation result',
        reportedIssues: [{
          type: IssueType.LANGUAGE_MIXING,
          severity: Severity.MEDIUM,
          description: 'Empty or null translation',
          originalText: 'النص الأصلي',
          translatedText: '',
          expectedResult: 'النص الأصلي'
        }],
        suggestions: [],
        timestamp: new Date(),
        processed: false
      };

      const investigationId = await feedbackSystem.initiateImmediateInvestigation(feedback);
      expect(investigationId).toBeDefined();

      const investigation = feedbackSystem.getInvestigationStatus(investigationId);
      expect(investigation).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent feedback processing', async () => {
      const feedbackPromises = [];
      
      // Create 10 concurrent feedback items
      for (let i = 0; i < 10; i++) {
        const feedback: UserFeedback = {
          id: `feedback_concurrent_${i}`,
          userId: `user_${132 + i}`,
          translationId: `trans_${465 + i}`,
          feedbackType: FeedbackType.MIXED_CONTENT,
          rating: Math.floor(Math.random() * 3) + 1,
          isPositive: false,
          comment: `Concurrent feedback ${i}`,
          reportedIssues: [{
            type: IssueType.LANGUAGE_MIXING,
            severity: Severity.MEDIUM,
            description: `Mixed content issue ${i}`,
            originalText: `النص ${i}`,
            translatedText: `النص ${i} mixed content`,
            expectedResult: `النص المختلط ${i}`
          }],
          suggestions: [],
          timestamp: new Date(),
          processed: false
        };

        feedbackPromises.push(feedbackSystem.processFeedbackForEnhancement(feedback));
      }

      // Wait for all to complete
      const results = await Promise.all(feedbackPromises);
      
      // Verify all were processed
      expect(results).toHaveLength(10);
      results.forEach(enhancements => {
        expect(Array.isArray(enhancements)).toBe(true);
      });
    });
  });
});