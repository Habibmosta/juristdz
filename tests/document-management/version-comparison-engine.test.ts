/**
 * Version Comparison Engine Tests
 * 
 * Tests for document diff generation and highlighting, version comparison visualization,
 * and similarity scoring between versions.
 * 
 * Requirements: 4.2
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';
import { versionControlService } from '../../src/document-management/services/versionControlService';
import { documentComparisonService } from '../../src/document-management/services/documentComparisonService';
import { diffVisualizationService } from '../../src/document-management/services/diffVisualizationService';

describe('Version Comparison Engine', () => {
  let testDocumentId: string;
  let testUserId: string;
  let version1Id: string;
  let version2Id: string;

  beforeAll(async () => {
    // Setup test data
    testUserId = 'test-user-123';
    testDocumentId = 'test-doc-456';
    
    // Create test versions
    const content1 = Buffer.from('Original document content\nLine 2\nLine 3');
    const content2 = Buffer.from('Modified document content\nLine 2 updated\nLine 3\nNew line 4');
    
    // Mock version creation (in real tests, this would use actual service)
    version1Id = 'version-1';
    version2Id = 'version-2';
  });

  describe('Document Comparison Service', () => {
    test('should detect document type correctly', async () => {
      const textContent = Buffer.from('This is a text document');
      const pdfContent = Buffer.from('%PDF-1.4'); // PDF header
      
      // Test text detection
      const textComparison = await documentComparisonService.compareDocuments(
        textContent,
        textContent,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any
      );
      
      expect(textComparison.metadata.documentType).toBe('text');
    });

    test('should calculate similarity score accurately', async () => {
      const content1 = Buffer.from('Hello world');
      const content2 = Buffer.from('Hello world');
      const content3 = Buffer.from('Goodbye world');
      
      // Identical content should have 100% similarity
      const identicalComparison = await documentComparisonService.compareDocuments(
        content1,
        content2,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any
      );
      
      expect(identicalComparison.similarities).toBe(1.0);
      
      // Different content should have lower similarity
      const differentComparison = await documentComparisonService.compareDocuments(
        content1,
        content3,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any
      );
      
      expect(differentComparison.similarities).toBeLessThan(1.0);
    });

    test('should generate detailed differences', async () => {
      const content1 = Buffer.from('Line 1\nLine 2\nLine 3');
      const content2 = Buffer.from('Line 1\nModified Line 2\nLine 3\nNew Line 4');
      
      const comparison = await documentComparisonService.compareDocuments(
        content1,
        content2,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any
      );
      
      expect(comparison.differences.length).toBeGreaterThan(0);
      expect(comparison.statistics.totalChanges).toBeGreaterThan(0);
      expect(comparison.statistics.additions).toBeGreaterThan(0);
    });

    test('should handle different comparison options', async () => {
      const content1 = Buffer.from('Hello World');
      const content2 = Buffer.from('hello world');
      
      // Case-sensitive comparison
      const caseSensitive = await documentComparisonService.compareDocuments(
        content1,
        content2,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any,
        { ignoreCase: false }
      );
      
      // Case-insensitive comparison
      const caseInsensitive = await documentComparisonService.compareDocuments(
        content1,
        content2,
        { id: 'v1', storagePath: 'test.txt' } as any,
        { id: 'v2', storagePath: 'test.txt' } as any,
        { ignoreCase: true }
      );
      
      expect(caseSensitive.similarities).toBeLessThan(caseInsensitive.similarities);
    });
  });

  describe('Diff Visualization Service', () => {
    test('should generate HTML diff output', async () => {
      const mockVisualization = {
        summary: {
          similarityPercentage: 80,
          totalChanges: 2,
          changeBreakdown: { additions: 1, deletions: 0, modifications: 1 }
        },
        changes: [
          {
            type: 'modification' as const,
            location: { line: 2 },
            oldContent: 'Line 2',
            newContent: 'Modified Line 2',
            severity: 'minor' as const,
            confidence: 0.9
          }
        ],
        statistics: {
          totalChanges: 2,
          additions: 1,
          deletions: 0,
          modifications: 1,
          charactersAdded: 10,
          charactersDeleted: 0,
          linesAdded: 1,
          linesDeleted: 0,
          wordsAdded: 2,
          wordsDeleted: 0
        },
        metadata: {
          comparisonTime: new Date(),
          algorithm: 'Myers Diff',
          documentType: 'text',
          processingTime: 100
        }
      };
      
      const oldContent = 'Line 1\nLine 2\nLine 3';
      const newContent = 'Line 1\nModified Line 2\nLine 3\nNew Line 4';
      
      const htmlDiff = await diffVisualizationService.generateHtmlDiff(
        mockVisualization,
        oldContent,
        newContent,
        { format: 'html', style: 'side-by-side' }
      );
      
      expect(htmlDiff.html).toContain('diff-container');
      expect(htmlDiff.html).toContain('side-by-side');
      expect(htmlDiff.css).toContain('.diff-container');
      expect(htmlDiff.metadata.totalLines).toBeGreaterThan(0);
    });

    test('should generate markdown diff output', async () => {
      const mockVisualization = {
        summary: {
          similarityPercentage: 75,
          totalChanges: 1,
          changeBreakdown: { additions: 1, deletions: 0, modifications: 0 }
        },
        changes: [
          {
            type: 'addition' as const,
            location: { line: 4 },
            newContent: 'New Line 4',
            severity: 'minor' as const,
            confidence: 1.0
          }
        ],
        statistics: {
          totalChanges: 1,
          additions: 1,
          deletions: 0,
          modifications: 0,
          charactersAdded: 10,
          charactersDeleted: 0,
          linesAdded: 1,
          linesDeleted: 0,
          wordsAdded: 2,
          wordsDeleted: 0
        },
        metadata: {
          comparisonTime: new Date(),
          algorithm: 'Myers Diff',
          documentType: 'text',
          processingTime: 50
        }
      };
      
      const oldContent = 'Line 1\nLine 2\nLine 3';
      const newContent = 'Line 1\nLine 2\nLine 3\nNew Line 4';
      
      const markdownDiff = await diffVisualizationService.generateMarkdownDiff(
        mockVisualization,
        oldContent,
        newContent
      );
      
      expect(markdownDiff).toContain('# Document Comparison');
      expect(markdownDiff).toContain('**Similarity:** 75%');
      expect(markdownDiff).toContain('## Changes');
    });

    test('should support different visualization styles', async () => {
      const mockVisualization = {
        summary: {
          similarityPercentage: 90,
          totalChanges: 1,
          changeBreakdown: { additions: 0, deletions: 1, modifications: 0 }
        },
        changes: [
          {
            type: 'deletion' as const,
            location: { line: 2 },
            oldContent: 'Deleted line',
            severity: 'minor' as const,
            confidence: 0.95
          }
        ],
        statistics: {
          totalChanges: 1,
          additions: 0,
          deletions: 1,
          modifications: 0,
          charactersAdded: 0,
          charactersDeleted: 12,
          linesAdded: 0,
          linesDeleted: 1,
          wordsAdded: 0,
          wordsDeleted: 2
        },
        metadata: {
          comparisonTime: new Date(),
          algorithm: 'Myers Diff',
          documentType: 'text',
          processingTime: 75
        }
      };
      
      const oldContent = 'Line 1\nDeleted line\nLine 3';
      const newContent = 'Line 1\nLine 3';
      
      // Test side-by-side style
      const sideBySide = await diffVisualizationService.generateHtmlDiff(
        mockVisualization,
        oldContent,
        newContent,
        { format: 'html', style: 'side-by-side' }
      );
      
      expect(sideBySide.html).toContain('side-by-side');
      
      // Test inline style
      const inline = await diffVisualizationService.generateHtmlDiff(
        mockVisualization,
        oldContent,
        newContent,
        { format: 'html', style: 'inline' }
      );
      
      expect(inline.html).toContain('inline');
      
      // Test unified style
      const unified = await diffVisualizationService.generateHtmlDiff(
        mockVisualization,
        oldContent,
        newContent,
        { format: 'html', style: 'unified' }
      );
      
      expect(unified.html).toContain('unified');
    });

    test('should support RTL languages', async () => {
      const mockVisualization = {
        summary: {
          similarityPercentage: 85,
          totalChanges: 1,
          changeBreakdown: { additions: 1, deletions: 0, modifications: 0 }
        },
        changes: [
          {
            type: 'addition' as const,
            location: { line: 2 },
            newContent: 'نص عربي جديد',
            severity: 'minor' as const,
            confidence: 1.0
          }
        ],
        statistics: {
          totalChanges: 1,
          additions: 1,
          deletions: 0,
          modifications: 0,
          charactersAdded: 12,
          charactersDeleted: 0,
          linesAdded: 1,
          linesDeleted: 0,
          wordsAdded: 3,
          wordsDeleted: 0
        },
        metadata: {
          comparisonTime: new Date(),
          algorithm: 'Myers Diff',
          documentType: 'text',
          processingTime: 60
        }
      };
      
      const oldContent = 'نص عربي';
      const newContent = 'نص عربي\nنص عربي جديد';
      
      const arabicDiff = await diffVisualizationService.generateHtmlDiff(
        mockVisualization,
        oldContent,
        newContent,
        { format: 'html', style: 'side-by-side', language: 'ar' }
      );
      
      expect(arabicDiff.html).toContain('dir="rtl"');
    });
  });

  describe('Property-Based Tests', () => {
    test('Property 17: Version Comparison Accuracy - comparisons accurately identify differences', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (content1, content2) => {
            const buffer1 = Buffer.from(content1);
            const buffer2 = Buffer.from(content2);
            
            const comparison = await documentComparisonService.compareDocuments(
              buffer1,
              buffer2,
              { id: 'v1', storagePath: 'test.txt' } as any,
              { id: 'v2', storagePath: 'test.txt' } as any
            );
            
            // Similarity should be between 0 and 1
            expect(comparison.similarities).toBeGreaterThanOrEqual(0);
            expect(comparison.similarities).toBeLessThanOrEqual(1);
            
            // If content is identical, similarity should be 1
            if (content1 === content2) {
              expect(comparison.similarities).toBe(1.0);
              expect(comparison.differences.length).toBe(0);
            }
            
            // Statistics should be consistent
            expect(comparison.statistics.totalChanges).toBe(comparison.differences.length);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    test('Property: Diff visualization should be consistent across formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (oldContent, newContent) => {
            const mockVisualization = {
              summary: {
                similarityPercentage: 80,
                totalChanges: 1,
                changeBreakdown: { additions: 1, deletions: 0, modifications: 0 }
              },
              changes: [
                {
                  type: 'modification' as const,
                  location: { line: 1 },
                  oldContent: oldContent.split('\n')[0] || '',
                  newContent: newContent.split('\n')[0] || '',
                  severity: 'minor' as const,
                  confidence: 0.9
                }
              ],
              statistics: {
                totalChanges: 1,
                additions: 0,
                deletions: 0,
                modifications: 1,
                charactersAdded: Math.max(0, newContent.length - oldContent.length),
                charactersDeleted: Math.max(0, oldContent.length - newContent.length),
                linesAdded: 0,
                linesDeleted: 0,
                wordsAdded: 0,
                wordsDeleted: 0
              },
              metadata: {
                comparisonTime: new Date(),
                algorithm: 'Myers Diff',
                documentType: 'text',
                processingTime: 100
              }
            };
            
            // Generate different formats
            const htmlDiff = await diffVisualizationService.generateHtmlDiff(
              mockVisualization,
              oldContent,
              newContent
            );
            
            const markdownDiff = await diffVisualizationService.generateMarkdownDiff(
              mockVisualization,
              oldContent,
              newContent
            );
            
            const textDiff = await diffVisualizationService.generateTextDiff(
              mockVisualization,
              oldContent,
              newContent
            );
            
            // All formats should contain similarity information
            expect(htmlDiff.html).toContain('80%');
            expect(markdownDiff).toContain('80%');
            expect(textDiff).toContain('80%');
            
            // All formats should be non-empty
            expect(htmlDiff.html.length).toBeGreaterThan(0);
            expect(markdownDiff.length).toBeGreaterThan(0);
            expect(textDiff.length).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});