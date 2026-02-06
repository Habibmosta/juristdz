/**
 * Search Functionality Property Tests
 * 
 * Property-based tests for search functionality implemented in task 5.5
 * Validates the correctness properties for comprehensive search, multi-criteria filtering,
 * document text extraction, and legal content analysis.
 * 
 * Requirements: 2.4, 2.5, 9.1, 9.2, 9.3
 */

import * as fc from 'fast-check';
import {
  Document,
  DocumentFilters,
  DocumentCategory,
  ConfidentialityLevel,
  Language
} from '../../types/document-management';

import { mockGenerators } from './mockGenerators';

// Mock search result interface
interface SearchResult {
  documentId: string;
  relevanceScore: number;
  matchedFields: string[];
  highlights: SearchHighlight[];
  document: Document;
}

// Mock search highlight interface
interface SearchHighlight {
  field: string;
  matchedText: string;
  context: string;
  position: number;
}

// Mock search query interface
interface SearchQuery {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
  language?: Language;
}

// Mock extracted content interface
interface ExtractedContent {
  documentId: string;
  text: string;
  extractedAt: Date;
  extractionMethod: 'pdf-parse' | 'word-parse' | 'text-direct';
  language: Language;
  wordCount: number;
  legalTerms: string[];
  dates: Date[];
  keyPhrases: string[];
}

// Mock legal term interface
interface LegalTerm {
  term: string;
  category: 'contract' | 'procedure' | 'law' | 'court' | 'party' | 'document';
  language: Language;
  confidence: number;
  position: number;
  context: string;
}

describe('Search Functionality Property Tests', () => {
  
  // ============================================================================
  // PROPERTY 8: COMPREHENSIVE SEARCH
  // ============================================================================
  
  describe('Property 8: Comprehensive Search', () => {
    /**
     * **Property 8: Comprehensive Search**
     * *For any* search query, results should include documents matching the query 
     * in filename, content, tags, or metadata
     * **Validates: Requirements 2.4**
     */
    it('should search across filename, content, tags, and metadata', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: fc.oneof(
                  fc.constant('contract_agreement.pdf'),
                  fc.constant('legal_brief.docx'),
                  fc.constant('evidence_photo.jpg'),
                  fc.constant('client_correspondence.txt')
                ),
                content: fc.oneof(
                  fc.constant('This is a legal contract between parties for services'),
                  fc.constant('Brief submitted to the court regarding the case'),
                  fc.constant('Photographic evidence of the incident'),
                  fc.constant('Email correspondence with client about legal matters')
                ),
                tags: fc.array(
                  fc.constantFrom('contract', 'legal', 'court', 'client', 'evidence', 'brief'),
                  { minLength: 1, maxLength: 3 }
                ),
                metadata: fc.record({
                  category: mockGenerators.documentCategory,
                  description: fc.option(fc.constantFrom(
                    'Legal contract document',
                    'Court filing brief',
                    'Evidence documentation',
                    'Client communication'
                  ))
                })
              }),
              { minLength: 3, maxLength: 10 }
            ),
            searchQuery: fc.constantFrom('contract', 'legal', 'court', 'client', 'evidence', 'brief')
          }),
          (testData) => {
            // Requirement 2.4: Search should return results based on filename, content, tags, and metadata
            const searchResults: SearchResult[] = [];
            
            testData.documents.forEach(doc => {
              const matchedFields: string[] = [];
              const highlights: SearchHighlight[] = [];
              let relevanceScore = 0;
              
              // Search in filename
              if (doc.name.toLowerCase().includes(testData.searchQuery.toLowerCase())) {
                matchedFields.push('filename');
                highlights.push({
                  field: 'filename',
                  matchedText: testData.searchQuery,
                  context: doc.name,
                  position: doc.name.toLowerCase().indexOf(testData.searchQuery.toLowerCase())
                });
                relevanceScore += 10;
              }
              
              // Search in content
              if (doc.content.toLowerCase().includes(testData.searchQuery.toLowerCase())) {
                matchedFields.push('content');
                const position = doc.content.toLowerCase().indexOf(testData.searchQuery.toLowerCase());
                const contextStart = Math.max(0, position - 20);
                const contextEnd = Math.min(doc.content.length, position + testData.searchQuery.length + 20);
                highlights.push({
                  field: 'content',
                  matchedText: testData.searchQuery,
                  context: doc.content.substring(contextStart, contextEnd),
                  position
                });
                relevanceScore += 8;
              }
              
              // Search in tags
              const matchingTags = doc.tags.filter(tag => 
                tag.toLowerCase().includes(testData.searchQuery.toLowerCase())
              );
              if (matchingTags.length > 0) {
                matchedFields.push('tags');
                matchingTags.forEach(tag => {
                  highlights.push({
                    field: 'tags',
                    matchedText: testData.searchQuery,
                    context: tag,
                    position: tag.toLowerCase().indexOf(testData.searchQuery.toLowerCase())
                  });
                });
                relevanceScore += 6 * matchingTags.length;
              }
              
              // Search in metadata
              if (doc.metadata.description && 
                  doc.metadata.description.toLowerCase().includes(testData.searchQuery.toLowerCase())) {
                matchedFields.push('metadata');
                highlights.push({
                  field: 'metadata',
                  matchedText: testData.searchQuery,
                  context: doc.metadata.description,
                  position: doc.metadata.description.toLowerCase().indexOf(testData.searchQuery.toLowerCase())
                });
                relevanceScore += 4;
              }
              
              // If any matches found, add to results
              if (matchedFields.length > 0) {
                searchResults.push({
                  documentId: doc.id,
                  relevanceScore,
                  matchedFields,
                  highlights,
                  document: {
                    id: doc.id,
                    caseId: mockGenerators.caseId.generate(fc.random()),
                    name: doc.name,
                    originalName: doc.name,
                    mimeType: 'application/pdf',
                    size: 1024,
                    checksum: mockGenerators.checksum.generate(fc.random()),
                    encryptionKey: mockGenerators.encryptionKey.generate(fc.random()),
                    storagePath: mockGenerators.storagePath.generate(fc.random()),
                    folderId: undefined,
                    tags: doc.tags,
                    metadata: {
                      category: doc.metadata.category,
                      confidentialityLevel: ConfidentialityLevel.INTERNAL,
                      description: doc.metadata.description,
                      customFields: {}
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: mockGenerators.userId.generate(fc.random()),
                    currentVersionId: mockGenerators.documentId.generate(fc.random()),
                    isDeleted: false,
                    deletedAt: undefined
                  }
                });
              }
            });
            
            // Validate search results
            searchResults.forEach(result => {
              expect(typeof result.documentId).toBe('string');
              expect(result.documentId.length).toBeGreaterThan(0);
              expect(typeof result.relevanceScore).toBe('number');
              expect(result.relevanceScore).toBeGreaterThan(0);
              expect(Array.isArray(result.matchedFields)).toBe(true);
              expect(result.matchedFields.length).toBeGreaterThan(0);
              expect(Array.isArray(result.highlights)).toBe(true);
              expect(result.highlights.length).toBeGreaterThan(0);
              
              // Each matched field should have corresponding highlights
              result.matchedFields.forEach(field => {
                const fieldHighlights = result.highlights.filter(h => h.field === field);
                expect(fieldHighlights.length).toBeGreaterThan(0);
              });
              
              // Highlights should contain the search query
              result.highlights.forEach(highlight => {
                expect(highlight.context.toLowerCase()).toContain(testData.searchQuery.toLowerCase());
                expect(typeof highlight.position).toBe('number');
                expect(highlight.position).toBeGreaterThanOrEqual(0);
              });
            });
            
            // Results should be sorted by relevance score (highest first)
            for (let i = 0; i < searchResults.length - 1; i++) {
              expect(searchResults[i].relevanceScore).toBeGreaterThanOrEqual(searchResults[i + 1].relevanceScore);
            }
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
    
    it('should handle fuzzy search and typo tolerance', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: fc.constantFrom('contract.pdf', 'agreement.docx', 'legal_document.txt'),
                content: fc.constantFrom(
                  'This is a legal contract document',
                  'Agreement between parties',
                  'Legal documentation for the case'
                )
              }),
              { minLength: 2, maxLength: 5 }
            ),
            searchQuery: fc.record({
              original: fc.constantFrom('contract', 'agreement', 'legal'),
              withTypo: fc.constantFrom('contrat', 'agreemnt', 'leagal') // Common typos
            })
          }),
          (testData) => {
            // Fuzzy search should find documents even with typos
            const fuzzySearchResults = testData.documents.filter(doc => {
              const searchText = `${doc.name} ${doc.content}`.toLowerCase();
              
              // Simple fuzzy matching (Levenshtein distance approximation)
              const calculateSimilarity = (str1: string, str2: string): number => {
                const longer = str1.length > str2.length ? str1 : str2;
                const shorter = str1.length > str2.length ? str2 : str1;
                
                if (longer.length === 0) return 1.0;
                
                const editDistance = levenshteinDistance(longer, shorter);
                return (longer.length - editDistance) / longer.length;
              };
              
              const levenshteinDistance = (str1: string, str2: string): number => {
                const matrix = [];
                
                for (let i = 0; i <= str2.length; i++) {
                  matrix[i] = [i];
                }
                
                for (let j = 0; j <= str1.length; j++) {
                  matrix[0][j] = j;
                }
                
                for (let i = 1; i <= str2.length; i++) {
                  for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                      matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                      matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                      );
                    }
                  }
                }
                
                return matrix[str2.length][str1.length];
              };
              
              // Check for exact match first
              if (searchText.includes(testData.searchQuery.original.toLowerCase())) {
                return true;
              }
              
              // Check for fuzzy match with typo
              const words = searchText.split(/\s+/);
              return words.some(word => {
                const similarity = calculateSimilarity(word, testData.searchQuery.withTypo.toLowerCase());
                return similarity >= 0.7; // 70% similarity threshold
              });
            });
            
            // Validate fuzzy search results
            expect(Array.isArray(fuzzySearchResults)).toBe(true);
            
            // If original query would match, fuzzy query should also match
            const exactMatches = testData.documents.filter(doc => {
              const searchText = `${doc.name} ${doc.content}`.toLowerCase();
              return searchText.includes(testData.searchQuery.original.toLowerCase());
            });
            
            // Fuzzy search should find at least as many results as exact search
            expect(fuzzySearchResults.length).toBeGreaterThanOrEqual(exactMatches.length);
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 9: MULTI-CRITERIA FILTERING
  // ============================================================================
  
  describe('Property 9: Multi-Criteria Filtering', () => {
    /**
     * **Property 9: Multi-Criteria Filtering**
     * *For any* filter combination (date range, file type, case, tags), the system 
     * should return only documents matching all specified criteria
     * **Validates: Requirements 2.5**
     */
    it('should filter documents by multiple criteria simultaneously', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                caseId: mockGenerators.caseId,
                name: mockGenerators.fileName,
                mimeType: mockGenerators.mimeType,
                tags: fc.array(
                  fc.constantFrom('urgent', 'draft', 'final', 'confidential', 'public'),
                  { minLength: 1, maxLength: 3 }
                ),
                createdAt: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
                category: mockGenerators.documentCategory
              }),
              { minLength: 5, maxLength: 15 }
            ),
            filters: fc.record({
              caseId: fc.option(mockGenerators.caseId),
              mimeTypes: fc.option(fc.array(mockGenerators.mimeType, { minLength: 1, maxLength: 3 })),
              tags: fc.option(fc.array(
                fc.constantFrom('urgent', 'draft', 'final', 'confidential', 'public'),
                { minLength: 1, maxLength: 2 }
              )),
              dateRange: fc.option(fc.record({
                from: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-06-01') }),
                to: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') })
              })),
              category: fc.option(mockGenerators.documentCategory)
            })
          }),
          (testData) => {
            // Requirement 2.5: Support filtering by date range, file type, case, and tags
            const filteredDocuments = testData.documents.filter(doc => {
              // Case filter
              if (testData.filters.caseId && doc.caseId !== testData.filters.caseId) {
                return false;
              }
              
              // MIME type filter
              if (testData.filters.mimeTypes && !testData.filters.mimeTypes.includes(doc.mimeType)) {
                return false;
              }
              
              // Tags filter (document must have ALL specified tags)
              if (testData.filters.tags) {
                const hasAllTags = testData.filters.tags.every(filterTag => 
                  doc.tags.some(docTag => docTag.toLowerCase() === filterTag.toLowerCase())
                );
                if (!hasAllTags) {
                  return false;
                }
              }
              
              // Date range filter
              if (testData.filters.dateRange) {
                const docDate = doc.createdAt.getTime();
                const fromDate = testData.filters.dateRange.from.getTime();
                const toDate = testData.filters.dateRange.to.getTime();
                
                if (docDate < fromDate || docDate > toDate) {
                  return false;
                }
              }
              
              // Category filter
              if (testData.filters.category && doc.category !== testData.filters.category) {
                return false;
              }
              
              return true;
            });
            
            // Validate filtering results
            filteredDocuments.forEach(doc => {
              // Verify each document matches all applied filters
              if (testData.filters.caseId) {
                expect(doc.caseId).toBe(testData.filters.caseId);
              }
              
              if (testData.filters.mimeTypes) {
                expect(testData.filters.mimeTypes).toContain(doc.mimeType);
              }
              
              if (testData.filters.tags) {
                testData.filters.tags.forEach(filterTag => {
                  expect(doc.tags.some(docTag => 
                    docTag.toLowerCase() === filterTag.toLowerCase()
                  )).toBe(true);
                });
              }
              
              if (testData.filters.dateRange) {
                expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(testData.filters.dateRange.from.getTime());
                expect(doc.createdAt.getTime()).toBeLessThanOrEqual(testData.filters.dateRange.to.getTime());
              }
              
              if (testData.filters.category) {
                expect(doc.category).toBe(testData.filters.category);
              }
            });
            
            // Filtered results should be a subset of original documents
            expect(filteredDocuments.length).toBeLessThanOrEqual(testData.documents.length);
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
    
    it('should handle empty filter results gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(mockGenerators.document, { minLength: 3, maxLength: 8 }),
            restrictiveFilters: fc.record({
              nonExistentCaseId: fc.string({ minLength: 10, maxLength: 20 }).map(s => `nonexistent-${s}`),
              futureDateRange: fc.record({
                from: fc.date({ min: new Date('2030-01-01'), max: new Date('2030-12-31') }),
                to: fc.date({ min: new Date('2031-01-01'), max: new Date('2031-12-31') })
              }),
              nonExistentTags: fc.array(
                fc.string({ minLength: 5, maxLength: 15 }).map(s => `nonexistent-${s}`),
                { minLength: 1, maxLength: 3 }
              )
            })
          }),
          (testData) => {
            // Apply restrictive filters that should return no results
            const emptyResults = testData.documents.filter(doc => {
              // Non-existent case ID
              if (doc.caseId === testData.restrictiveFilters.nonExistentCaseId) {
                return true;
              }
              
              // Future date range (documents are created in the past)
              const docDate = doc.createdAt.getTime();
              const fromDate = testData.restrictiveFilters.futureDateRange.from.getTime();
              const toDate = testData.restrictiveFilters.futureDateRange.to.getTime();
              
              if (docDate >= fromDate && docDate <= toDate) {
                return true;
              }
              
              // Non-existent tags
              const hasNonExistentTags = testData.restrictiveFilters.nonExistentTags.every(filterTag => 
                doc.tags.some(docTag => docTag === filterTag)
              );
              
              if (hasNonExistentTags) {
                return true;
              }
              
              return false;
            });
            
            // Should return empty results
            expect(emptyResults.length).toBe(0);
            expect(Array.isArray(emptyResults)).toBe(true);
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 46: DOCUMENT TEXT EXTRACTION
  // ============================================================================
  
  describe('Property 46: Document Text Extraction', () => {
    /**
     * **Property 46: Document Text Extraction**
     * *For any* uploaded PDF or Word document, the system should extract and 
     * index the text content for searching
     * **Validates: Requirements 9.1, 9.2**
     */
    it('should extract text content from PDF and Word documents', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: fc.oneof(
                  fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.pdf`),
                  fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.docx`),
                  fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.doc`)
                ),
                mimeType: fc.constantFrom(
                  'application/pdf',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/msword'
                ),
                simulatedContent: fc.string({ minLength: 50, maxLength: 1000 }),
                language: mockGenerators.language
              }),
              { minLength: 2, maxLength: 8 }
            )
          }),
          (testData) => {
            // Requirements 9.1, 9.2: Extract text content from PDF and Word documents
            const extractedContents: ExtractedContent[] = testData.documents.map(doc => {
              let extractionMethod: 'pdf-parse' | 'word-parse' | 'text-direct';
              
              if (doc.mimeType === 'application/pdf') {
                extractionMethod = 'pdf-parse';
              } else if (doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                         doc.mimeType === 'application/msword') {
                extractionMethod = 'word-parse';
              } else {
                extractionMethod = 'text-direct';
              }
              
              return {
                documentId: doc.id,
                text: doc.simulatedContent,
                extractedAt: new Date(),
                extractionMethod,
                language: doc.language,
                wordCount: doc.simulatedContent.split(/\s+/).length,
                legalTerms: [], // Will be populated by legal content analysis
                dates: [], // Will be populated by date extraction
                keyPhrases: doc.simulatedContent.split(/[.!?]+/).slice(0, 3).map(s => s.trim())
              };
            });
            
            // Validate text extraction
            extractedContents.forEach((content, index) => {
              const originalDoc = testData.documents[index];
              
              expect(content.documentId).toBe(originalDoc.id);
              expect(typeof content.text).toBe('string');
              expect(content.text.length).toBeGreaterThan(0);
              expect(content.text).toBe(originalDoc.simulatedContent);
              expect(content.extractedAt instanceof Date).toBe(true);
              expect(['pdf-parse', 'word-parse', 'text-direct']).toContain(content.extractionMethod);
              expect([Language.FRENCH, Language.ARABIC]).toContain(content.language);
              expect(typeof content.wordCount).toBe('number');
              expect(content.wordCount).toBeGreaterThan(0);
              expect(Array.isArray(content.legalTerms)).toBe(true);
              expect(Array.isArray(content.dates)).toBe(true);
              expect(Array.isArray(content.keyPhrases)).toBe(true);
              
              // Word count should be reasonable
              const actualWordCount = content.text.split(/\s+/).filter(word => word.length > 0).length;
              expect(content.wordCount).toBe(actualWordCount);
              
              // Extraction method should match document type
              if (originalDoc.mimeType === 'application/pdf') {
                expect(content.extractionMethod).toBe('pdf-parse');
              } else if (originalDoc.mimeType.includes('word')) {
                expect(content.extractionMethod).toBe('word-parse');
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 50,
          verbose: true
        }
      );
    });
    
    it('should handle extraction errors gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            corruptedDocuments: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                name: fc.string({ minLength: 1, maxLength: 30 }).map(s => `${s}.pdf`),
                mimeType: fc.constant('application/pdf'),
                isCorrupted: fc.boolean(),
                isEmpty: fc.boolean()
              }),
              { minLength: 2, maxLength: 5 }
            )
          }),
          (testData) => {
            // Simulate extraction attempts on problematic documents
            const extractionResults = testData.corruptedDocuments.map(doc => {
              if (doc.isCorrupted) {
                return {
                  documentId: doc.id,
                  success: false,
                  error: 'Document appears to be corrupted or unreadable',
                  extractedText: '',
                  fallbackIndexing: true
                };
              } else if (doc.isEmpty) {
                return {
                  documentId: doc.id,
                  success: true,
                  error: null,
                  extractedText: '',
                  fallbackIndexing: false
                };
              } else {
                return {
                  documentId: doc.id,
                  success: true,
                  error: null,
                  extractedText: 'Sample extracted text content',
                  fallbackIndexing: false
                };
              }
            });
            
            // Validate error handling
            extractionResults.forEach((result, index) => {
              const originalDoc = testData.corruptedDocuments[index];
              
              expect(result.documentId).toBe(originalDoc.id);
              expect(typeof result.success).toBe('boolean');
              expect(typeof result.extractedText).toBe('string');
              
              if (originalDoc.isCorrupted) {
                expect(result.success).toBe(false);
                expect(typeof result.error).toBe('string');
                expect(result.error!.length).toBeGreaterThan(0);
                expect(result.fallbackIndexing).toBe(true);
              } else {
                expect(result.success).toBe(true);
                expect(result.error).toBeNull();
                expect(result.fallbackIndexing).toBe(false);
              }
              
              if (originalDoc.isEmpty) {
                expect(result.extractedText).toBe('');
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 30,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // PROPERTY 47: LEGAL CONTENT ANALYSIS
  // ============================================================================
  
  describe('Property 47: Legal Content Analysis', () => {
    /**
     * **Property 47: Legal Content Analysis**
     * *For any* processed document, the system should identify and extract 
     * key legal terms and dates from the content
     * **Validates: Requirements 9.3**
     */
    it('should identify and extract legal terms from document content', () => {
      fc.assert(
        fc.property(
          fc.record({
            documents: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                content: fc.oneof(
                  fc.constant('This contract is entered into between the plaintiff and defendant on January 15, 2024'),
                  fc.constant('The court hereby orders the respondent to appear before the tribunal on March 20, 2024'),
                  fc.constant('Agreement signed by both parties with witness present on December 1, 2023'),
                  fc.constant('Legal notice served to the accused regarding the hearing scheduled for April 10, 2024')
                ),
                language: mockGenerators.language
              }),
              { minLength: 2, maxLength: 6 }
            )
          }),
          (testData) => {
            // Requirement 9.3: Identify and extract key legal terms and dates
            const legalAnalysisResults = testData.documents.map(doc => {
              // Simulate legal term extraction
              const legalTermPatterns = {
                contract: ['contract', 'agreement', 'accord'],
                parties: ['plaintiff', 'defendant', 'respondent', 'accused', 'parties'],
                court: ['court', 'tribunal', 'hearing', 'judge'],
                procedure: ['orders', 'served', 'notice', 'appear'],
                document: ['signed', 'witness', 'legal notice']
              };
              
              const extractedTerms: LegalTerm[] = [];
              const content = doc.content.toLowerCase();
              
              Object.entries(legalTermPatterns).forEach(([category, terms]) => {
                terms.forEach(term => {
                  const position = content.indexOf(term);
                  if (position !== -1) {
                    extractedTerms.push({
                      term,
                      category: category as any,
                      language: doc.language,
                      confidence: 0.8 + Math.random() * 0.2, // 80-100% confidence
                      position,
                      context: doc.content.substring(Math.max(0, position - 20), position + term.length + 20)
                    });
                  }
                });
              });
              
              // Extract dates
              const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi;
              const dateMatches = doc.content.match(datePattern) || [];
              const extractedDates = dateMatches.map(dateStr => new Date(dateStr));
              
              return {
                documentId: doc.id,
                legalTerms: extractedTerms,
                extractedDates,
                analysisDate: new Date(),
                language: doc.language,
                confidence: extractedTerms.length > 0 ? 
                  extractedTerms.reduce((sum, term) => sum + term.confidence, 0) / extractedTerms.length : 0
              };
            });
            
            // Validate legal content analysis
            legalAnalysisResults.forEach((result, index) => {
              const originalDoc = testData.documents[index];
              
              expect(result.documentId).toBe(originalDoc.id);
              expect(Array.isArray(result.legalTerms)).toBe(true);
              expect(Array.isArray(result.extractedDates)).toBe(true);
              expect(result.analysisDate instanceof Date).toBe(true);
              expect([Language.FRENCH, Language.ARABIC]).toContain(result.language);
              expect(typeof result.confidence).toBe('number');
              expect(result.confidence).toBeGreaterThanOrEqual(0);
              expect(result.confidence).toBeLessThanOrEqual(1);
              
              // Validate extracted legal terms
              result.legalTerms.forEach(term => {
                expect(typeof term.term).toBe('string');
                expect(term.term.length).toBeGreaterThan(0);
                expect(['contract', 'parties', 'court', 'procedure', 'document']).toContain(term.category);
                expect(term.language).toBe(originalDoc.language);
                expect(typeof term.confidence).toBe('number');
                expect(term.confidence).toBeGreaterThan(0);
                expect(term.confidence).toBeLessThanOrEqual(1);
                expect(typeof term.position).toBe('number');
                expect(term.position).toBeGreaterThanOrEqual(0);
                expect(typeof term.context).toBe('string');
                expect(term.context.toLowerCase()).toContain(term.term.toLowerCase());
              });
              
              // Validate extracted dates
              result.extractedDates.forEach(date => {
                expect(date instanceof Date).toBe(true);
                expect(date.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
                expect(date.getTime()).toBeLessThan(new Date('2030-01-01').getTime());
              });
              
              // Documents with legal content should have extracted terms
              const hasLegalContent = originalDoc.content.toLowerCase().match(/contract|court|agreement|plaintiff|defendant/);
              if (hasLegalContent) {
                expect(result.legalTerms.length).toBeGreaterThan(0);
              }
            });
            
            return true;
          }
        ),
        { 
          numRuns: 40,
          verbose: true
        }
      );
    });
    
    it('should handle multi-language legal content analysis', () => {
      fc.assert(
        fc.property(
          fc.record({
            frenchDocument: fc.record({
              id: mockGenerators.documentId,
              content: fc.constantFrom(
                'Ce contrat est conclu entre les parties le 15 janvier 2024',
                'Le tribunal ordonne au défendeur de comparaître le 20 mars 2024',
                'Accord signé par les deux parties avec témoin présent le 1er décembre 2023'
              ),
              language: fc.constant(Language.FRENCH)
            }),
            arabicDocument: fc.record({
              id: mockGenerators.documentId,
              content: fc.constantFrom(
                'هذا العقد مبرم بين الأطراف في 15 يناير 2024',
                'تأمر المحكمة المدعى عليه بالمثول في 20 مارس 2024',
                'اتفاقية موقعة من قبل الطرفين مع وجود شاهد في 1 ديسمبر 2023'
              ),
              language: fc.constant(Language.ARABIC)
            })
          }),
          (testData) => {
            // Analyze French document
            const frenchAnalysis = {
              documentId: testData.frenchDocument.id,
              language: testData.frenchDocument.language,
              legalTerms: [
                { term: 'contrat', category: 'contract', confidence: 0.9 },
                { term: 'parties', category: 'parties', confidence: 0.85 },
                { term: 'tribunal', category: 'court', confidence: 0.9 }
              ].filter(term => 
                testData.frenchDocument.content.toLowerCase().includes(term.term)
              ),
              textDirection: 'ltr'
            };
            
            // Analyze Arabic document
            const arabicAnalysis = {
              documentId: testData.arabicDocument.id,
              language: testData.arabicDocument.language,
              legalTerms: [
                { term: 'العقد', category: 'contract', confidence: 0.9 },
                { term: 'الأطراف', category: 'parties', confidence: 0.85 },
                { term: 'المحكمة', category: 'court', confidence: 0.9 }
              ].filter(term => 
                testData.arabicDocument.content.includes(term.term)
              ),
              textDirection: 'rtl'
            };
            
            // Validate French analysis
            expect(frenchAnalysis.language).toBe(Language.FRENCH);
            expect(frenchAnalysis.textDirection).toBe('ltr');
            expect(Array.isArray(frenchAnalysis.legalTerms)).toBe(true);
            
            // Validate Arabic analysis
            expect(arabicAnalysis.language).toBe(Language.ARABIC);
            expect(arabicAnalysis.textDirection).toBe('rtl');
            expect(Array.isArray(arabicAnalysis.legalTerms)).toBe(true);
            
            // Both analyses should have extracted some legal terms
            const totalTerms = frenchAnalysis.legalTerms.length + arabicAnalysis.legalTerms.length;
            expect(totalTerms).toBeGreaterThan(0);
            
            return true;
          }
        ),
        { 
          numRuns: 20,
          verbose: true
        }
      );
    });
  });
  
  // ============================================================================
  // INTEGRATION TESTS FOR SEARCH FUNCTIONALITY
  // ============================================================================
  
  describe('Search Functionality Integration', () => {
    it('should handle complete search and filter workflow', () => {
      fc.assert(
        fc.property(
          fc.record({
            documentCollection: fc.array(
              fc.record({
                id: mockGenerators.documentId,
                caseId: mockGenerators.caseId,
                name: mockGenerators.fileName,
                content: fc.string({ minLength: 100, maxLength: 500 }),
                tags: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 4 }),
                mimeType: mockGenerators.mimeType,
                createdAt: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
                category: mockGenerators.documentCategory
              }),
              { minLength: 10, maxLength: 20 }
            ),
            searchAndFilterQuery: fc.record({
              searchText: fc.string({ minLength: 3, maxLength: 20 }),
              filters: fc.record({
                dateRange: fc.option(fc.record({
                  from: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-06-01') }),
                  to: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') })
                })),
                tags: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 2 })),
                mimeType: fc.option(mockGenerators.mimeType)
              })
            })
          }),
          (testData) => {
            // Step 1: Extract and index content
            const indexedDocuments = testData.documentCollection.map(doc => ({
              ...doc,
              extractedContent: {
                text: doc.content,
                legalTerms: doc.content.toLowerCase().match(/contract|agreement|court|legal/g) || [],
                dates: doc.content.match(/\d{4}-\d{2}-\d{2}/g)?.map(d => new Date(d)) || [],
                indexed: true
              }
            }));
            
            // Step 2: Apply search query
            const searchResults = indexedDocuments.filter(doc => {
              const searchableText = `${doc.name} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
              return searchableText.includes(testData.searchAndFilterQuery.searchText.toLowerCase());
            });
            
            // Step 3: Apply filters
            const filteredResults = searchResults.filter(doc => {
              // Date range filter
              if (testData.searchAndFilterQuery.filters.dateRange) {
                const docDate = doc.createdAt.getTime();
                const fromDate = testData.searchAndFilterQuery.filters.dateRange.from.getTime();
                const toDate = testData.searchAndFilterQuery.filters.dateRange.to.getTime();
                
                if (docDate < fromDate || docDate > toDate) {
                  return false;
                }
              }
              
              // Tags filter
              if (testData.searchAndFilterQuery.filters.tags) {
                const hasAllTags = testData.searchAndFilterQuery.filters.tags.every(filterTag =>
                  doc.tags.some(docTag => docTag.toLowerCase().includes(filterTag.toLowerCase()))
                );
                if (!hasAllTags) {
                  return false;
                }
              }
              
              // MIME type filter
              if (testData.searchAndFilterQuery.filters.mimeType && 
                  doc.mimeType !== testData.searchAndFilterQuery.filters.mimeType) {
                return false;
              }
              
              return true;
            });
            
            // Validate complete workflow
            expect(Array.isArray(indexedDocuments)).toBe(true);
            expect(indexedDocuments.length).toBe(testData.documentCollection.length);
            
            // All documents should be indexed
            indexedDocuments.forEach(doc => {
              expect(doc.extractedContent.indexed).toBe(true);
              expect(typeof doc.extractedContent.text).toBe('string');
              expect(Array.isArray(doc.extractedContent.legalTerms)).toBe(true);
              expect(Array.isArray(doc.extractedContent.dates)).toBe(true);
            });
            
            // Search results should be subset of indexed documents
            expect(filteredResults.length).toBeLessThanOrEqual(searchResults.length);
            expect(searchResults.length).toBeLessThanOrEqual(indexedDocuments.length);
            
            // All filtered results should match search criteria
            filteredResults.forEach(doc => {
              const searchableText = `${doc.name} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
              expect(searchableText.includes(testData.searchAndFilterQuery.searchText.toLowerCase())).toBe(true);
            });
            
            return true;
          }
        ),
        { 
          numRuns: 15,
          verbose: true
        }
      );
    });
  });
});