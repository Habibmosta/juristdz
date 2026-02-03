/**
 * User Feedback Collection and Processing System
 * 
 * Easy-to-use translation issue reporting mechanism with feedback processing
 * for system improvement, user acknowledgment, and status updates.
 */

import {
  TranslationRequest,
  PureTranslationResult,
  IssueType,
  Severity,
  Language,
  TranslationMethod
} from '../types';
import { AnalyticsReportingSystem } from '../reporting/AnalyticsReportingSystem';
import { PatternDetectionSystem } from '../core/PatternDetectionSystem';
import { defaultLogger } from '../utils/Logger';

export interface UserFeedback {
  id: string;
  userId: string;
  translationId: string;
  feedbackType: FeedbackType;
  rating: number; // 1-5 scale
  isPositive: boolean;
  comment: string;
  reportedIssues: ReportedIssue[];
  suggestions: string[];
  timestamp: Date;
  processed: boolean;
  response?: FeedbackResponse;
}

export interface ReportedIssue {
  type: IssueType;
  severity: Severity;
  description: string;
  originalText: string;
  translatedText: string;
  expectedResult?: string;
  position?: { start: number; end: number };
  screenshots?: string[];
}

export interface FeedbackResponse {
  responseId: string;
  message: string;
  actionTaken: string;
  estimatedResolutionTime?: string;
  followUpRequired: boolean;
  respondedBy: string;
  respondedAt: Date;
}

export enum FeedbackType {
  QUALITY_ISSUE = 'quality_issue',
  MIXED_CONTENT = 'mixed_content',
  TERMINOLOGY_ERROR = 'terminology_error',
  PERFORMANCE_ISSUE = 'performance_issue',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_FEEDBACK = 'general_feedback',
  BUG_REPORT = 'bug_report'
}

export interface FeedbackProcessingResult {
  feedbackId: string;
  processed: boolean;
  actionsTriggered: string[];
  patternsAdded: string[];
  improvementsScheduled: string[];
  userNotified: boolean;
  processingTime: number;
}

export class UserFeedbackSystem {
  private feedbackDatabase: Map<string, UserFeedback> = new Map();
  private reportingSystem: AnalyticsReportingSystem;
  private patternDetection: PatternDetectionSystem;
  
  // Processing statistics
  private processingStats = {
    totalFeedback: 0,
    processedFeedback: 0,
    averageProcessingTime: 0,
    issuesResolved: 0,
    patternsAdded: 0,
    userSatisfactionImprovement: 0
  };

  // Auto-processing rules
  private autoProcessingRules: Map<string, AutoProcessingRule> = new Map();

  constructor() {
    this.reportingSystem = new AnalyticsReportingSystem();
    this.patternDetection = new PatternDetectionSystem();
    
    this.initializeAutoProcessingRules();
    this.startFeedbackProcessingLoop();
    
    defaultLogger.info('User Feedback System initialized', {
      autoProcessingRules: this.autoProcessingRules.size
    }, 'UserFeedbackSystem');
  }

  /**
   * Collect user feedback with easy-to-use interface
   */
  async collectFeedback(feedbackData: {
    userId: string;
    translationId: string;
    feedbackType: FeedbackType;
    rating: number;
    comment: string;
    reportedIssues?: ReportedIssue[];
    suggestions?: string[];
  }): Promise<string> {
    const feedbackId = this.generateFeedbackId();
    
    const feedback: UserFeedback = {
      id: feedbackId,
      userId: feedbackData.userId,
      translationId: feedbackData.translationId,
      feedbackType: feedbackData.feedbackType,
      rating: feedbackData.rating,
      isPositive: feedbackData.rating >= 4,
      comment: feedbackData.comment,
      reportedIssues: feedbackData.reportedIssues || [],
      suggestions: feedbackData.suggestions || [],
      timestamp: new Date(),
      processed: false
    };

    this.feedbackDatabase.set(feedbackId, feedback);
    this.processingStats.totalFeedback++;

    // Send immediate acknowledgment to user
    await this.sendUserAcknowledgment(feedback);

    // Trigger immediate processing for critical issues
    if (this.isCriticalFeedback(feedback)) {
      await this.processFeedbackImmediate(feedbackId);
    }

    defaultLogger.info('User feedback collected', {
      feedbackId,
      userId: feedbackData.userId,
      feedbackType: feedbackData.feedbackType,
      rating: feedbackData.rating,
      issuesCount: feedback.reportedIssues.length
    }, 'UserFeedbackSystem');

    return feedbackId;
  }

  /**
   * Process feedback for system improvement
   */
  async processFeedback(feedbackId: string): Promise<FeedbackProcessingResult> {
    const startTime = Date.now();
    const feedback = this.feedbackDatabase.get(feedbackId);
    
    if (!feedback) {
      throw new Error(`Feedback not found: ${feedbackId}`);
    }

    if (feedback.processed) {
      throw new Error(`Feedback already processed: ${feedbackId}`);
    }

    try {
      const actionsTriggered: string[] = [];
      const patternsAdded: string[] = [];
      const improvementsScheduled: string[] = [];

      // Process reported issues
      for (const issue of feedback.reportedIssues) {
        const issueActions = await this.processReportedIssue(issue, feedback);
        actionsTriggered.push(...issueActions.actions);
        patternsAdded.push(...issueActions.patternsAdded);
        improvementsScheduled.push(...issueActions.improvements);
      }

      // Process suggestions
      if (feedback.suggestions.length > 0) {
        const suggestionActions = await this.processSuggestions(feedback.suggestions, feedback);
        actionsTriggered.push(...suggestionActions);
      }

      // Update feedback processing status
      feedback.processed = true;
      this.processingStats.processedFeedback++;

      // Generate response for user
      const response = await this.generateUserResponse(feedback, actionsTriggered);
      feedback.response = response;

      // Notify user of processing completion
      const userNotified = await this.notifyUserOfProcessing(feedback);

      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime);

      const result: FeedbackProcessingResult = {
        feedbackId,
        processed: true,
        actionsTriggered,
        patternsAdded,
        improvementsScheduled,
        userNotified,
        processingTime
      };

      defaultLogger.info('Feedback processed successfully', {
        feedbackId,
        actionsCount: actionsTriggered.length,
        patternsAdded: patternsAdded.length,
        processingTime
      }, 'UserFeedbackSystem');

      return result;

    } catch (error) {
      defaultLogger.error('Feedback processing failed', {
        feedbackId,
        error: error.message
      }, 'UserFeedbackSystem');

      throw error;
    }
  }

  /**
   * Process reported issue and trigger improvements
   */
  private async processReportedIssue(
    issue: ReportedIssue, 
    feedback: UserFeedback
  ): Promise<{
    actions: string[];
    patternsAdded: string[];
    improvements: string[];
  }> {
    const actions: string[] = [];
    const patternsAdded: string[] = [];
    const improvements: string[] = [];

    switch (issue.type) {
      case IssueType.LANGUAGE_MIXING:
        // Add problematic pattern to blacklist
        if (issue.originalText || issue.translatedText) {
          const patternId = this.patternDetection.reportProblematicPattern(
            issue.originalText || issue.translatedText,
            `User reported mixed content: ${issue.description}`,
            issue.severity
          );
          patternsAdded.push(patternId);
          actions.push('Added problematic pattern to blacklist');
        }
        
        // Schedule content cleaning improvement
        improvements.push('Enhance content cleaning algorithms');
        actions.push('Scheduled content cleaning enhancement');
        break;

      case IssueType.POOR_TERMINOLOGY:
        // Track terminology issue for dictionary update
        await this.reportingSystem.trackUserIssue({
          userId: feedback.userId,
          translationId: feedback.translationId,
          issueType: issue.type,
          description: issue.description,
          originalText: issue.originalText,
          translatedText: issue.translatedText,
          expectedResult: issue.expectedResult,
          severity: issue.severity
        });
        
        improvements.push('Update legal terminology dictionary');
        actions.push('Tracked terminology issue for dictionary update');
        break;

      case IssueType.CORRUPTED_CHARACTERS:
        // Add encoding pattern to detection system
        if (issue.translatedText) {
          const patternId = this.patternDetection.reportProblematicPattern(
            issue.translatedText,
            `User reported corrupted characters: ${issue.description}`,
            Severity.HIGH
          );
          patternsAdded.push(patternId);
        }
        
        improvements.push('Enhance encoding validation');
        actions.push('Added corrupted character pattern');
        break;

      case IssueType.CONTEXT_LOSS:
        improvements.push('Improve contextual translation accuracy');
        actions.push('Scheduled context enhancement');
        break;

      default:
        actions.push('Logged issue for manual review');
    }

    return { actions, patternsAdded, improvements };
  }

  /**
   * Process user suggestions
   */
  private async processSuggestions(
    suggestions: string[], 
    feedback: UserFeedback
  ): Promise<string[]> {
    const actions: string[] = [];

    for (const suggestion of suggestions) {
      // Analyze suggestion and categorize
      const category = this.categorizeSuggestion(suggestion);
      
      switch (category) {
        case 'feature_request':
          actions.push('Logged feature request for product team');
          break;
        case 'improvement':
          actions.push('Scheduled improvement for development');
          break;
        case 'bug_fix':
          actions.push('Created bug report for engineering team');
          break;
        default:
          actions.push('Logged suggestion for review');
      }
    }

    return actions;
  }

  /**
   * Generate response for user
   */
  private async generateUserResponse(
    feedback: UserFeedback, 
    actionsTriggered: string[]
  ): Promise<FeedbackResponse> {
    const responseId = this.generateResponseId();
    
    let message = `Thank you for your feedback! We have processed your report and taken the following actions:\n\n`;
    
    actionsTriggered.forEach((action, index) => {
      message += `${index + 1}. ${action}\n`;
    });

    // Estimate resolution time based on feedback type and severity
    const estimatedResolutionTime = this.estimateResolutionTime(feedback);
    
    if (estimatedResolutionTime) {
      message += `\nEstimated resolution time: ${estimatedResolutionTime}`;
    }

    message += `\n\nWe appreciate your help in improving our translation system!`;

    return {
      responseId,
      message,
      actionTaken: actionsTriggered.join(', '),
      estimatedResolutionTime,
      followUpRequired: this.requiresFollowUp(feedback),
      respondedBy: 'AutomatedFeedbackSystem',
      respondedAt: new Date()
    };
  }

  /**
   * Send immediate acknowledgment to user
   */
  private async sendUserAcknowledgment(feedback: UserFeedback): Promise<void> {
    // This would integrate with notification system
    const message = feedback.feedbackType === FeedbackType.MIXED_CONTENT
      ? 'Thank you for reporting mixed content. We are investigating immediately.'
      : 'Thank you for your feedback. We will review and respond within 24 hours.';

    defaultLogger.info('User acknowledgment sent', {
      feedbackId: feedback.id,
      userId: feedback.userId,
      message: message.substring(0, 50) + '...'
    }, 'UserFeedbackSystem');
  }

  /**
   * Notify user of processing completion
   */
  private async notifyUserOfProcessing(feedback: UserFeedback): Promise<boolean> {
    if (!feedback.response) return false;

    // This would integrate with notification system
    defaultLogger.info('User notified of feedback processing', {
      feedbackId: feedback.id,
      userId: feedback.userId,
      responseId: feedback.response.responseId
    }, 'UserFeedbackSystem');

    return true;
  }

  /**
   * Initialize auto-processing rules
   */
  private initializeAutoProcessingRules(): void {
    // Critical mixed content reports
    this.autoProcessingRules.set('critical_mixed_content', {
      condition: (feedback) => 
        feedback.feedbackType === FeedbackType.MIXED_CONTENT && 
        feedback.reportedIssues.some(issue => issue.severity === Severity.CRITICAL),
      action: 'immediate_processing',
      priority: 1
    });

    // Low rating with specific issues
    this.autoProcessingRules.set('low_rating_with_issues', {
      condition: (feedback) => 
        feedback.rating <= 2 && feedback.reportedIssues.length > 0,
      action: 'priority_processing',
      priority: 2
    });

    // Terminology errors
    this.autoProcessingRules.set('terminology_errors', {
      condition: (feedback) => 
        feedback.reportedIssues.some(issue => issue.type === IssueType.POOR_TERMINOLOGY),
      action: 'terminology_review',
      priority: 3
    });
  }

  /**
   * Start feedback processing loop
   */
  private startFeedbackProcessingLoop(): void {
    // Process pending feedback every 5 minutes
    setInterval(async () => {
      await this.processPendingFeedback();
    }, 5 * 60 * 1000);
  }

  /**
   * Process pending feedback automatically
   */
  private async processPendingFeedback(): Promise<void> {
    const pendingFeedback = Array.from(this.feedbackDatabase.values())
      .filter(feedback => !feedback.processed)
      .sort((a, b) => this.getFeedbackPriority(b) - this.getFeedbackPriority(a));

    for (const feedback of pendingFeedback.slice(0, 10)) { // Process up to 10 at a time
      try {
        await this.processFeedback(feedback.id);
      } catch (error) {
        defaultLogger.error('Auto-processing failed', {
          feedbackId: feedback.id,
          error: error.message
        }, 'UserFeedbackSystem');
      }
    }
  }

  /**
   * Helper methods
   */
  private isCriticalFeedback(feedback: UserFeedback): boolean {
    return feedback.feedbackType === FeedbackType.MIXED_CONTENT ||
           feedback.rating <= 2 ||
           feedback.reportedIssues.some(issue => issue.severity === Severity.CRITICAL);
  }

  private async processFeedbackImmediate(feedbackId: string): Promise<void> {
    try {
      await this.processFeedback(feedbackId);
    } catch (error) {
      defaultLogger.error('Immediate feedback processing failed', {
        feedbackId,
        error: error.message
      }, 'UserFeedbackSystem');
    }
  }

  private getFeedbackPriority(feedback: UserFeedback): number {
    let priority = 0;
    
    // Rating-based priority
    if (feedback.rating <= 2) priority += 10;
    else if (feedback.rating <= 3) priority += 5;
    
    // Issue severity priority
    feedback.reportedIssues.forEach(issue => {
      switch (issue.severity) {
        case Severity.CRITICAL: priority += 20; break;
        case Severity.HIGH: priority += 15; break;
        case Severity.MEDIUM: priority += 10; break;
        case Severity.LOW: priority += 5; break;
      }
    });
    
    // Feedback type priority
    switch (feedback.feedbackType) {
      case FeedbackType.MIXED_CONTENT: priority += 25; break;
      case FeedbackType.BUG_REPORT: priority += 20; break;
      case FeedbackType.QUALITY_ISSUE: priority += 15; break;
      case FeedbackType.TERMINOLOGY_ERROR: priority += 10; break;
    }
    
    return priority;
  }

  private categorizeSuggestion(suggestion: string): string {
    const lowerSuggestion = suggestion.toLowerCase();
    
    if (lowerSuggestion.includes('feature') || lowerSuggestion.includes('add')) {
      return 'feature_request';
    } else if (lowerSuggestion.includes('improve') || lowerSuggestion.includes('better')) {
      return 'improvement';
    } else if (lowerSuggestion.includes('bug') || lowerSuggestion.includes('error')) {
      return 'bug_fix';
    }
    
    return 'general';
  }

  private estimateResolutionTime(feedback: UserFeedback): string | undefined {
    if (feedback.feedbackType === FeedbackType.MIXED_CONTENT) {
      return '24-48 hours';
    } else if (feedback.rating <= 2) {
      return '2-3 business days';
    } else if (feedback.reportedIssues.length > 0) {
      return '3-5 business days';
    }
    
    return '1 week';
  }

  private requiresFollowUp(feedback: UserFeedback): boolean {
    return feedback.rating <= 2 || 
           feedback.reportedIssues.some(issue => issue.severity === Severity.CRITICAL) ||
           feedback.feedbackType === FeedbackType.BUG_REPORT;
  }

  private updateProcessingStats(processingTime: number): void {
    const currentAvg = this.processingStats.averageProcessingTime;
    const count = this.processingStats.processedFeedback;
    
    this.processingStats.averageProcessingTime = 
      (currentAvg * (count - 1) + processingTime) / count;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  public getFeedbackStatistics(): typeof this.processingStats {
    return { ...this.processingStats };
  }

  public getFeedbackById(feedbackId: string): UserFeedback | null {
    return this.feedbackDatabase.get(feedbackId) || null;
  }

  public getFeedbackByUser(userId: string): UserFeedback[] {
    return Array.from(this.feedbackDatabase.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getPendingFeedback(): UserFeedback[] {
    return Array.from(this.feedbackDatabase.values())
      .filter(feedback => !feedback.processed)
      .sort((a, b) => this.getFeedbackPriority(b) - this.getFeedbackPriority(a));
  }

  public getProcessedFeedback(limit: number = 100): UserFeedback[] {
    return Array.from(this.feedbackDatabase.values())
      .filter(feedback => feedback.processed)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Supporting interfaces
interface AutoProcessingRule {
  condition: (feedback: UserFeedback) => boolean;
  action: string;
  priority: number;
}