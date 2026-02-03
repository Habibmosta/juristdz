/**
 * Regression Prevention Validator
 * 
 * This module provides validation to ensure that previously fixed user-reported
 * issues do not reappear in the system. It maintains a comprehensive database
 * of known problematic patterns and validates that they remain cleaned.
 * 
 * Task 13.2: Implement validation to prevent regression of fixed issues
 * Requirements: 8.1, 8.2
 */

import {
  PatternType,
  Severity,
  ProblematicPattern,
  TextPosition,
  Language
} from '../types';
import { defaultLogger } from '../utils/Logger';

export interface RegressionTestCase {
  id: string;
  name: string;
  originalProblematicText: string;
  expectedCleanedText: string;
  reportedDate: Date;
  fixedDate?: Date;
  reportedBy: string;
  issueDescription: string;
  patternType: PatternType;
  severity: Severity;
  testStatus: 'active' | 'resolved' | 'monitoring' | 'deprecated';
  lastTestedDate?: Date;
  testResults: RegressionTestResult[];
}

export interface RegressionTestResult {
  testDate: Date;
  passed: boolean;
  actualCleanedText: string;
  issues: string[];
  confidence: number;
  processingTime: number;
}

export interface RegressionValidationReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  failedTestCases: RegressionTestCase[];
  newRegressions: RegressionTestCase[];
  resolvedRegressions: RegressionTestCase[];
  recommendations: string[];
  timestamp: Date;
}

export class RegressionPreventionValidator {
  private testCases: Map<string, RegressionTestCase> = new Map();
  private knownProblematicPatterns: Set<string> = new Set();
  private validationHistory: RegressionValidationReport[] = [];
  private readonly maxHistorySize = 100;

  constructor() {
    this.initializeKnownTestCases();
    this.initializeProblematicPatterns();
    
    defaultLogger.info('Regression Prevention Validator initialized', {
      testCases: this.testCases.size,
      knownPatterns: this.knownProblematicPatterns.size
    }, 'RegressionPreventionValidator');
  }

  /**
   * Initialize known test cases from user reports
   */
  private initializeKnownTestCases(): void {
    // Test Case 1: Complete mixed content string
    this.addTestCase({
      id: 'user_report_001',
      name: 'Complete Mixed Content String',
      originalProblematicText: 'محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE',
      expectedCleanedText: 'محامي متصل تحليل ملفات',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_001',
      issueDescription: 'Arabic text contaminated with UI elements Pro, V2, AUTO-TRANSLATE',
      patternType: PatternType.USER_REPORTED,
      severity: Severity.CRITICAL,
      testStatus: 'active'
    });

    // Test Case 2: Legal text with corrupted characters
    this.addTestCase({
      id: 'user_report_002',
      name: 'Legal Text with Corrupted Characters',
      originalProblematicText: 'الشهود Defined في المادة 1 من قانون الإجراءات الجنائية ال процедة',
      expectedCleanedText: 'الشهود في المادة 1 من قانون الإجراءات الجنائية',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_002',
      issueDescription: 'Arabic legal text contaminated with English "Defined" and Cyrillic "процедة"',
      patternType: PatternType.USER_REPORTED,
      severity: Severity.CRITICAL,
      testStatus: 'active'
    });

    // Test Case 3: UI elements mixed with legal content
    this.addTestCase({
      id: 'user_report_003',
      name: 'UI Elements in Legal Content',
      originalProblematicText: 'Les témoins sont Pro V2 الشهود AUTO-TRANSLATE',
      expectedCleanedText: 'Les témoins sont الشهود',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_003',
      issueDescription: 'Mixed French-Arabic content with UI elements',
      patternType: PatternType.UI_ELEMENTS,
      severity: Severity.HIGH,
      testStatus: 'active'
    });

    // Test Case 4: System artifacts contamination
    this.addTestCase({
      id: 'user_report_004',
      name: 'System Artifacts Contamination',
      originalProblematicText: 'Defined محامي процедة JuristDZ',
      expectedCleanedText: 'محامي',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_004',
      issueDescription: 'Arabic content contaminated with multiple system artifacts',
      patternType: PatternType.SYSTEM_ARTIFACTS,
      severity: Severity.HIGH,
      testStatus: 'active'
    });

    // Test Case 5: Concatenated problematic elements
    this.addTestCase({
      id: 'user_report_005',
      name: 'Concatenated Problematic Elements',
      originalProblematicText: 'محاميProV2AUTO-TRANSLATEتحليل',
      expectedCleanedText: 'محامي تحليل',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_005',
      issueDescription: 'Arabic words concatenated with multiple UI elements',
      patternType: PatternType.UI_ELEMENTS,
      severity: Severity.HIGH,
      testStatus: 'active'
    });

    // Test Case 6: Mixed script boundaries
    this.addTestCase({
      id: 'user_report_006',
      name: 'Mixed Script Boundaries',
      originalProblematicText: 'محاميProتحليلV2ملفات',
      expectedCleanedText: 'محامي تحليل ملفات',
      reportedDate: new Date('2024-01-15'),
      fixedDate: new Date('2024-01-16'),
      reportedBy: 'user_006',
      issueDescription: 'Mixed script boundaries without proper separation',
      patternType: PatternType.MIXED_SCRIPTS,
      severity: Severity.HIGH,
      testStatus: 'active'
    });
  }

  /**
   * Initialize known problematic patterns
   */
  private initializeProblematicPatterns(): void {
    // UI Elements
    this.knownProblematicPatterns.add('Pro');
    this.knownProblematicPatterns.add('V2');
    this.knownProblematicPatterns.add('AUTO-TRANSLATE');
    this.knownProblematicPatterns.add('JuristDZ');
    this.knownProblematicPatterns.add('JURIST');
    this.knownProblematicPatterns.add('DZ');

    // English fragments
    this.knownProblematicPatterns.add('Defined');
    this.knownProblematicPatterns.add('Article');
    this.knownProblematicPatterns.add('Law');
    this.knownProblematicPatterns.add('Criminal');
    this.knownProblematicPatterns.add('Procedure');

    // Cyrillic characters
    this.knownProblematicPatterns.add('процедة');
    this.knownProblematicPatterns.add('а');
    this.knownProblematicPatterns.add('я');
    this.knownProblematicPatterns.add('е');

    // System artifacts
    this.knownProblematicPatterns.add('undefined');
    this.knownProblematicPatterns.add('null');
    this.knownProblematicPatterns.add('NaN');
    this.knownProblematicPatterns.add('[object Object]');
  }

  /**
   * Add a new regression test case
   */
  addTestCase(testCase: Omit<RegressionTestCase, 'testResults'>): string {
    const fullTestCase: RegressionTestCase = {
      ...testCase,
      testResults: []
    };

    this.testCases.set(testCase.id, fullTestCase);

    defaultLogger.info('Added regression test case', {
      testCaseId: testCase.id,
      name: testCase.name,
      severity: testCase.severity
    }, 'RegressionPreventionValidator');

    return testCase.id;
  }

  /**
   * Validate that a cleaned text doesn't contain regression patterns
   */
  async validateNoRegression(
    originalText: string,
    cleanedText: string,
    cleaningMethod?: string
  ): Promise<{
    hasRegression: boolean;
    regressionPatterns: string[];
    confidence: number;
    issues: string[];
    recommendations: string[];
  }> {
    const regressionPatterns: string[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for known problematic patterns in cleaned text
    for (const pattern of this.knownProblematicPatterns) {
      if (cleanedText.includes(pattern)) {
        regressionPatterns.push(pattern);
        issues.push(`Regression detected: "${pattern}" found in cleaned text`);
      }
    }

    // Check specific test cases
    for (const testCase of this.testCases.values()) {
      if (originalText.includes(testCase.originalProblematicText.substring(0, 20))) {
        // This might be related to a known test case
        const hasProblematicElements = this.checkForProblematicElements(cleanedText, testCase);
        if (hasProblematicElements.length > 0) {
          regressionPatterns.push(...hasProblematicElements);
          issues.push(`Test case regression: ${testCase.name} - ${hasProblematicElements.join(', ')}`);
        }
      }
    }

    // Generate recommendations
    if (regressionPatterns.length > 0) {
      recommendations.push('Apply additional specialized cleaning rules');
      recommendations.push('Review and update pattern detection algorithms');
      recommendations.push('Consider manual review of cleaning results');
      
      if (cleaningMethod) {
        recommendations.push(`Review ${cleaningMethod} cleaning method effectiveness`);
      }
    }

    const hasRegression = regressionPatterns.length > 0;
    const confidence = hasRegression ? Math.max(0.1, 1.0 - (regressionPatterns.length * 0.2)) : 1.0;

    if (hasRegression) {
      defaultLogger.warn('Regression detected in cleaned text', {
        originalLength: originalText.length,
        cleanedLength: cleanedText.length,
        regressionPatterns,
        issuesCount: issues.length
      }, 'RegressionPreventionValidator');
    }

    return {
      hasRegression,
      regressionPatterns,
      confidence,
      issues,
      recommendations
    };
  }

  /**
   * Run all regression tests against a cleaning function
   */
  async runRegressionTests(
    cleaningFunction: (text: string) => Promise<{ cleanedText: string; confidence: number; processingTime: number }>
  ): Promise<RegressionValidationReport> {
    const startTime = Date.now();
    const failedTestCases: RegressionTestCase[] = [];
    const newRegressions: RegressionTestCase[] = [];
    const resolvedRegressions: RegressionTestCase[] = [];
    let passedTests = 0;
    let failedTests = 0;

    defaultLogger.info('Starting regression test suite', {
      totalTests: this.testCases.size
    }, 'RegressionPreventionValidator');

    for (const testCase of this.testCases.values()) {
      if (testCase.testStatus !== 'active') {
        continue; // Skip inactive test cases
      }

      try {
        const cleaningResult = await cleaningFunction(testCase.originalProblematicText);
        
        const testResult: RegressionTestResult = {
          testDate: new Date(),
          passed: false,
          actualCleanedText: cleaningResult.cleanedText,
          issues: [],
          confidence: cleaningResult.confidence,
          processingTime: cleaningResult.processingTime
        };

        // Validate the cleaning result
        const validation = await this.validateNoRegression(
          testCase.originalProblematicText,
          cleaningResult.cleanedText,
          'regression_test'
        );

        testResult.passed = !validation.hasRegression;
        testResult.issues = validation.issues;

        // Check if this is a new regression or resolved regression
        const previousResult = testCase.testResults[testCase.testResults.length - 1];
        if (previousResult) {
          if (previousResult.passed && !testResult.passed) {
            newRegressions.push(testCase);
          } else if (!previousResult.passed && testResult.passed) {
            resolvedRegressions.push(testCase);
          }
        }

        // Update test case
        testCase.testResults.push(testResult);
        testCase.lastTestedDate = new Date();

        if (testResult.passed) {
          passedTests++;
        } else {
          failedTests++;
          failedTestCases.push(testCase);
        }

        // Keep only last 10 test results per test case
        if (testCase.testResults.length > 10) {
          testCase.testResults = testCase.testResults.slice(-10);
        }

      } catch (error) {
        failedTests++;
        failedTestCases.push(testCase);
        
        defaultLogger.error('Regression test failed with error', {
          testCaseId: testCase.id,
          error: error.message
        }, 'RegressionPreventionValidator');
      }
    }

    const totalTests = passedTests + failedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

    const recommendations: string[] = [];
    if (failedTests > 0) {
      recommendations.push(`${failedTests} test cases failed - review cleaning algorithms`);
    }
    if (newRegressions.length > 0) {
      recommendations.push(`${newRegressions.length} new regressions detected - immediate attention required`);
    }
    if (passRate < 95) {
      recommendations.push('Pass rate below 95% - comprehensive review needed');
    }

    const report: RegressionValidationReport = {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      failedTestCases,
      newRegressions,
      resolvedRegressions,
      recommendations,
      timestamp: new Date()
    };

    // Store in history
    this.validationHistory.push(report);
    if (this.validationHistory.length > this.maxHistorySize) {
      this.validationHistory = this.validationHistory.slice(-this.maxHistorySize);
    }

    const totalTime = Date.now() - startTime;
    
    defaultLogger.info('Regression test suite completed', {
      totalTests,
      passedTests,
      failedTests,
      passRate: Math.round(passRate * 100) / 100,
      newRegressions: newRegressions.length,
      resolvedRegressions: resolvedRegressions.length,
      totalTime
    }, 'RegressionPreventionValidator');

    return report;
  }

  /**
   * Check for problematic elements specific to a test case
   */
  private checkForProblematicElements(cleanedText: string, testCase: RegressionTestCase): string[] {
    const problematicElements: string[] = [];

    // Check based on pattern type
    switch (testCase.patternType) {
      case PatternType.UI_ELEMENTS:
        const uiElements = ['Pro', 'V2', 'AUTO-TRANSLATE', 'JuristDZ', 'JURIST', 'DZ'];
        uiElements.forEach(element => {
          if (cleanedText.includes(element)) {
            problematicElements.push(element);
          }
        });
        break;

      case PatternType.CYRILLIC_CHARACTERS:
        const cyrillicPattern = /[\u0400-\u04FF]/g;
        const cyrillicMatches = cleanedText.match(cyrillicPattern);
        if (cyrillicMatches) {
          problematicElements.push(...cyrillicMatches);
        }
        break;

      case PatternType.ENGLISH_FRAGMENTS:
        const englishFragments = ['Defined', 'Article', 'Law', 'Criminal', 'Procedure'];
        englishFragments.forEach(fragment => {
          if (cleanedText.includes(fragment)) {
            problematicElements.push(fragment);
          }
        });
        break;

      case PatternType.MIXED_SCRIPTS:
        const mixedScriptPattern = /[أ-ي]+[a-zA-Z]+|[a-zA-Z]+[أ-ي]+/g;
        const mixedMatches = cleanedText.match(mixedScriptPattern);
        if (mixedMatches) {
          problematicElements.push(...mixedMatches);
        }
        break;

      case PatternType.USER_REPORTED:
        // Check for any known problematic patterns
        for (const pattern of this.knownProblematicPatterns) {
          if (cleanedText.includes(pattern)) {
            problematicElements.push(pattern);
          }
        }
        break;
    }

    return problematicElements;
  }

  /**
   * Get test case by ID
   */
  getTestCase(id: string): RegressionTestCase | undefined {
    return this.testCases.get(id);
  }

  /**
   * Get all test cases
   */
  getAllTestCases(): RegressionTestCase[] {
    return Array.from(this.testCases.values());
  }

  /**
   * Get active test cases
   */
  getActiveTestCases(): RegressionTestCase[] {
    return Array.from(this.testCases.values()).filter(tc => tc.testStatus === 'active');
  }

  /**
   * Update test case status
   */
  updateTestCaseStatus(id: string, status: RegressionTestCase['testStatus']): boolean {
    const testCase = this.testCases.get(id);
    if (!testCase) {
      return false;
    }

    testCase.testStatus = status;
    
    defaultLogger.info('Updated test case status', {
      testCaseId: id,
      newStatus: status
    }, 'RegressionPreventionValidator');

    return true;
  }

  /**
   * Get validation history
   */
  getValidationHistory(): RegressionValidationReport[] {
    return [...this.validationHistory];
  }

  /**
   * Get latest validation report
   */
  getLatestValidationReport(): RegressionValidationReport | undefined {
    return this.validationHistory[this.validationHistory.length - 1];
  }

  /**
   * Get regression statistics
   */
  getRegressionStatistics(): {
    totalTestCases: number;
    activeTestCases: number;
    testCasesByType: { [key: string]: number };
    testCasesBySeverity: { [key: string]: number };
    recentPassRate: number;
    knownProblematicPatterns: number;
    validationHistorySize: number;
  } {
    const testCases = Array.from(this.testCases.values());
    const activeTestCases = testCases.filter(tc => tc.testStatus === 'active');
    
    const testCasesByType: { [key: string]: number } = {};
    const testCasesBySeverity: { [key: string]: number } = {};

    testCases.forEach(tc => {
      testCasesByType[tc.patternType] = (testCasesByType[tc.patternType] || 0) + 1;
      testCasesBySeverity[tc.severity] = (testCasesBySeverity[tc.severity] || 0) + 1;
    });

    const latestReport = this.getLatestValidationReport();
    const recentPassRate = latestReport ? latestReport.passRate : 0;

    return {
      totalTestCases: testCases.length,
      activeTestCases: activeTestCases.length,
      testCasesByType,
      testCasesBySeverity,
      recentPassRate,
      knownProblematicPatterns: this.knownProblematicPatterns.size,
      validationHistorySize: this.validationHistory.length
    };
  }

  /**
   * Add known problematic pattern
   */
  addProblematicPattern(pattern: string): void {
    this.knownProblematicPatterns.add(pattern);
    
    defaultLogger.info('Added known problematic pattern', {
      pattern: pattern.substring(0, 50),
      totalPatterns: this.knownProblematicPatterns.size
    }, 'RegressionPreventionValidator');
  }

  /**
   * Remove known problematic pattern
   */
  removeProblematicPattern(pattern: string): boolean {
    const removed = this.knownProblematicPatterns.delete(pattern);
    
    if (removed) {
      defaultLogger.info('Removed known problematic pattern', {
        pattern: pattern.substring(0, 50),
        totalPatterns: this.knownProblematicPatterns.size
      }, 'RegressionPreventionValidator');
    }

    return removed;
  }

  /**
   * Export test cases and configuration
   */
  exportConfiguration(): string {
    const config = {
      testCases: Array.from(this.testCases.entries()),
      knownProblematicPatterns: Array.from(this.knownProblematicPatterns),
      validationHistory: this.validationHistory.slice(-10), // Export last 10 reports
      exportDate: new Date()
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import test cases and configuration
   */
  importConfiguration(configJson: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const config = JSON.parse(configJson);
      const errors: string[] = [];
      let imported = 0;

      // Import test cases
      if (config.testCases) {
        config.testCases.forEach(([id, testCase]: [string, RegressionTestCase]) => {
          try {
            this.testCases.set(id, testCase);
            imported++;
          } catch (error) {
            errors.push(`Failed to import test case ${id}: ${error.message}`);
          }
        });
      }

      // Import known problematic patterns
      if (config.knownProblematicPatterns) {
        config.knownProblematicPatterns.forEach((pattern: string) => {
          this.knownProblematicPatterns.add(pattern);
        });
      }

      // Import validation history
      if (config.validationHistory) {
        this.validationHistory.push(...config.validationHistory);
        if (this.validationHistory.length > this.maxHistorySize) {
          this.validationHistory = this.validationHistory.slice(-this.maxHistorySize);
        }
      }

      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [`Import failed: ${error.message}`] };
    }
  }
}