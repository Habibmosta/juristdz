/**
 * Document Management System - Content Extraction Service
 * 
 * Provides document content extraction capabilities for PDF and Word documents,
 * with text indexing and metadata generation for search functionality.
 * 
 * Requirements: 9.1, 9.2, 9.6
 */

import { supabaseService } from './supabaseService';
import { fileStorageService } from './fileStorageService';

// Content extraction result
export interface ContentExtractionResult {
  success: boolean;
  extractedText?: string;
  metadata?: ExtractedMetadata;
  error?: string;
  warnings?: string[];
}

// Extracted metadata
export interface ExtractedMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;
  language?: string;
  keywords?: string[];
  customProperties?: Record<string, any>;
}

// Content indexing result
export interface ContentIndexingResult {
  success: boolean;
  indexedContent?: IndexedContent;
  error?: string;
}

// Indexed content structure
export interface IndexedContent {
  documentId: string;
  fullText: string;
  extractedMetadata: ExtractedMetadata;
  searchableTerms: string[];
  legalTerms: string[];
  dates: Date[];
  entities: ExtractedEntity[];
  language: string;
  indexedAt: Date;
}

// Extracted entity (names, places, organizations, etc.)
export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'legal_term' | 'case_reference';
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

// Content processing options
export interface ContentProcessingOptions {
  extractMetadata?: boolean;
  indexContent?: boolean;
  extractEntities?: boolean;
  detectLanguage?: boolean;
  preserveFormatting?: boolean;
  generateSummary?: boolean;
}

export class ContentExtractionService {
  private readonly supportedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  /**
   * Extract content from document
   */
  async extractDocumentContent(
    documentId: string,
    options: ContentProcessingOptions = {}
  ): Promise<ContentExtractionResult> {
    try {
      // Get document information
      const docResult = await supabaseService.findById('documents', documentId);
      if (!docResult.success || !docResult.data) {
        return {
          success: false,
          error: 'Document not found'
        };
      }

      const document = docResult.data;

      // Check if document type is supported
      if (!this.supportedMimeTypes.includes(document.mime_type)) {
        return {
          success: false,
          error: `Unsupported document type: ${document.mime_type}`
        };
      }

      // Retrieve document file
      const fileResult = await fileStorageService.retrieveFile(document.storage_path);
      if (!fileResult.success || !fileResult.fileData) {
        return {
          success: false,
          error: `Failed to retrieve document file: ${fileResult.error}`
        };
      }

      // Extract content based on MIME type
      let extractionResult: ContentExtractionResult;

      switch (document.mime_type) {
        case 'application/pdf':
          extractionResult = await this.extractPdfContent(fileResult.fileData, options);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractionResult = await this.extractWordContent(fileResult.fileData, options);
          break;
        case 'text/plain':
          extractionResult = await this.extractTextContent(fileResult.fileData, options);
          break;
        default:
          return {
            success: false,
            error: `Content extraction not implemented for: ${document.mime_type}`
          };
      }

      if (!extractionResult.success) {
        return extractionResult;
      }

      // Store extracted content if indexing is enabled
      if (options.indexContent && extractionResult.extractedText) {
        await this.storeExtractedContent(documentId, extractionResult.extractedText, extractionResult.metadata);
      }

      // Create audit entry
      await supabaseService.createAuditEntry(
        'document',
        documentId,
        'content_extracted',
        {
          mimeType: document.mime_type,
          textLength: extractionResult.extractedText?.length || 0,
          hasMetadata: !!extractionResult.metadata
        }
      );

      return extractionResult;

    } catch (error) {
      return {
        success: false,
        error: `Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract content from PDF document
   */
  private async extractPdfContent(
    fileData: Buffer,
    options: ContentProcessingOptions
  ): Promise<ContentExtractionResult> {
    try {
      // Note: In a real implementation, you would use a library like pdf-parse
      // For this implementation, we'll simulate the extraction
      
      const warnings: string[] = [];
      
      // Simulate PDF parsing (in real implementation, use pdf-parse library)
      const simulatedText = this.simulatePdfExtraction(fileData);
      
      if (!simulatedText) {
        return {
          success: false,
          error: 'Failed to extract text from PDF document'
        };
      }

      // Extract metadata if requested
      let metadata: ExtractedMetadata | undefined;
      if (options.extractMetadata) {
        metadata = this.extractPdfMetadata(fileData);
      }

      // Detect language if requested
      if (options.detectLanguage && simulatedText) {
        const detectedLanguage = this.detectLanguage(simulatedText);
        if (metadata) {
          metadata.language = detectedLanguage;
        } else {
          metadata = { language: detectedLanguage };
        }
      }

      return {
        success: true,
        extractedText: simulatedText,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract content from Word document
   */
  private async extractWordContent(
    fileData: Buffer,
    options: ContentProcessingOptions
  ): Promise<ContentExtractionResult> {
    try {
      // Note: In a real implementation, you would use a library like mammoth or docx
      // For this implementation, we'll simulate the extraction
      
      const warnings: string[] = [];
      
      // Simulate Word document parsing
      const simulatedText = this.simulateWordExtraction(fileData);
      
      if (!simulatedText) {
        return {
          success: false,
          error: 'Failed to extract text from Word document'
        };
      }

      // Extract metadata if requested
      let metadata: ExtractedMetadata | undefined;
      if (options.extractMetadata) {
        metadata = this.extractWordMetadata(fileData);
      }

      // Detect language if requested
      if (options.detectLanguage && simulatedText) {
        const detectedLanguage = this.detectLanguage(simulatedText);
        if (metadata) {
          metadata.language = detectedLanguage;
        } else {
          metadata = { language: detectedLanguage };
        }
      }

      return {
        success: true,
        extractedText: simulatedText,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `Word extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract content from plain text document
   */
  private async extractTextContent(
    fileData: Buffer,
    options: ContentProcessingOptions
  ): Promise<ContentExtractionResult> {
    try {
      const text = fileData.toString('utf-8');
      
      // Basic metadata for text files
      let metadata: ExtractedMetadata | undefined;
      if (options.extractMetadata) {
        metadata = {
          wordCount: this.countWords(text),
          characterCount: text.length,
          language: options.detectLanguage ? this.detectLanguage(text) : undefined
        };
      }

      return {
        success: true,
        extractedText: text,
        metadata
      };

    } catch (error) {
      return {
        success: false,
        error: `Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Index document content for search
   */
  async indexDocumentContent(documentId: string): Promise<ContentIndexingResult> {
    try {
      // Extract content first
      const extractionResult = await this.extractDocumentContent(documentId, {
        extractMetadata: true,
        indexContent: false,
        extractEntities: true,
        detectLanguage: true
      });

      if (!extractionResult.success || !extractionResult.extractedText) {
        return {
          success: false,
          error: `Content extraction failed: ${extractionResult.error}`
        };
      }

      const fullText = extractionResult.extractedText;
      const metadata = extractionResult.metadata || {};

      // Generate searchable terms
      const searchableTerms = this.generateSearchableTerms(fullText);

      // Extract legal terms
      const legalTerms = this.extractLegalTerms(fullText);

      // Extract dates
      const dates = this.extractDates(fullText);

      // Extract entities
      const entities = this.extractEntities(fullText);

      // Detect language
      const language = metadata.language || this.detectLanguage(fullText);

      const indexedContent: IndexedContent = {
        documentId,
        fullText,
        extractedMetadata: metadata,
        searchableTerms,
        legalTerms,
        dates,
        entities,
        language,
        indexedAt: new Date()
      };

      // Store indexed content
      await this.storeIndexedContent(indexedContent);

      return {
        success: true,
        indexedContent
      };

    } catch (error) {
      return {
        success: false,
        error: `Content indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search documents by content
   */
  async searchDocumentsByContent(
    searchQuery: string,
    options: {
      caseId?: string;
      language?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    success: boolean;
    results?: Array<{
      documentId: string;
      relevanceScore: number;
      matchedTerms: string[];
      excerpt: string;
    }>;
    totalCount?: number;
    error?: string;
  }> {
    try {
      // Normalize search query
      const normalizedQuery = this.normalizeSearchQuery(searchQuery);
      const searchTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 2);

      if (searchTerms.length === 0) {
        return {
          success: true,
          results: [],
          totalCount: 0
        };
      }

      // Build search filters
      const filters: any = {};
      if (options.caseId) {
        filters.document_id = { in: await this.getDocumentIdsByCase(options.caseId) };
      }
      if (options.language) {
        filters.language = options.language;
      }

      // Search in indexed content
      const searchResult = await supabaseService.query('document_content_index', {
        filters,
        search: {
          fields: ['full_text', 'searchable_terms'],
          term: normalizedQuery
        },
        limit: options.limit || 20,
        offset: options.offset || 0,
        sortBy: 'indexed_at',
        sortOrder: 'desc'
      });

      if (!searchResult.success) {
        return {
          success: false,
          error: `Search failed: ${searchResult.error?.message || 'Unknown error'}`
        };
      }

      // Process search results
      const results = (searchResult.data || []).map(record => {
        const relevanceScore = this.calculateRelevanceScore(record.full_text, searchTerms);
        const matchedTerms = this.findMatchedTerms(record.full_text, searchTerms);
        const excerpt = this.generateExcerpt(record.full_text, searchTerms);

        return {
          documentId: record.document_id,
          relevanceScore,
          matchedTerms,
          excerpt
        };
      });

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        success: true,
        results,
        totalCount: searchResult.count
      };

    } catch (error) {
      return {
        success: false,
        error: `Content search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get content extraction statistics
   */
  async getContentExtractionStats(): Promise<{
    totalDocuments: number;
    extractedDocuments: number;
    indexedDocuments: number;
    extractionsByType: Record<string, number>;
    averageTextLength: number;
    languageDistribution: Record<string, number>;
  }> {
    try {
      // Get total documents
      const totalDocsResult = await supabaseService.query('documents', {
        filters: { is_deleted: false },
        select: 'id, mime_type'
      });

      const totalDocuments = totalDocsResult.success && totalDocsResult.data 
        ? totalDocsResult.data.length : 0;

      // Get indexed content stats
      const indexedResult = await supabaseService.query('document_content_index', {
        select: 'document_id, language, full_text'
      });

      const indexedDocuments = indexedResult.success && indexedResult.data 
        ? indexedResult.data.length : 0;

      // Calculate extraction stats by type
      const extractionsByType: Record<string, number> = {};
      let totalTextLength = 0;
      const languageDistribution: Record<string, number> = {};

      if (indexedResult.success && indexedResult.data) {
        indexedResult.data.forEach(record => {
          // Count by document type (would need to join with documents table in real implementation)
          const docType = 'unknown'; // Simplified for this implementation
          extractionsByType[docType] = (extractionsByType[docType] || 0) + 1;

          // Calculate text length
          totalTextLength += record.full_text?.length || 0;

          // Count by language
          const language = record.language || 'unknown';
          languageDistribution[language] = (languageDistribution[language] || 0) + 1;
        });
      }

      const averageTextLength = indexedDocuments > 0 ? totalTextLength / indexedDocuments : 0;

      return {
        totalDocuments,
        extractedDocuments: indexedDocuments, // Simplified - in real implementation, track separately
        indexedDocuments,
        extractionsByType,
        averageTextLength,
        languageDistribution
      };

    } catch (error) {
      console.error('Failed to get content extraction statistics:', error);
      return {
        totalDocuments: 0,
        extractedDocuments: 0,
        indexedDocuments: 0,
        extractionsByType: {},
        averageTextLength: 0,
        languageDistribution: {}
      };
    }
  }

  /**
   * Simulate PDF text extraction (placeholder for real pdf-parse implementation)
   */
  private simulatePdfExtraction(fileData: Buffer): string {
    // In a real implementation, you would use pdf-parse:
    // const pdf = require('pdf-parse');
    // const data = await pdf(fileData);
    // return data.text;
    
    // For simulation, return a sample text based on file size
    const sampleTexts = [
      "This is a sample PDF document containing legal text and clauses.",
      "Contract agreement between parties with terms and conditions outlined.",
      "Legal brief containing case references and legal arguments.",
      "Evidence document with witness statements and factual information."
    ];
    
    const index = Math.floor(fileData.length / 1000) % sampleTexts.length;
    return sampleTexts[index] + ` [Extracted from ${fileData.length} byte PDF file]`;
  }

  /**
   * Simulate Word document text extraction (placeholder for real mammoth/docx implementation)
   */
  private simulateWordExtraction(fileData: Buffer): string {
    // In a real implementation, you would use mammoth or docx:
    // const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({buffer: fileData});
    // return result.value;
    
    // For simulation, return a sample text based on file size
    const sampleTexts = [
      "This is a sample Word document with formatted legal content.",
      "Legal memorandum with structured arguments and citations.",
      "Client correspondence with case details and recommendations.",
      "Template document with variable placeholders and legal language."
    ];
    
    const index = Math.floor(fileData.length / 1000) % sampleTexts.length;
    return sampleTexts[index] + ` [Extracted from ${fileData.length} byte Word file]`;
  }

  /**
   * Extract PDF metadata (placeholder implementation)
   */
  private extractPdfMetadata(fileData: Buffer): ExtractedMetadata {
    // In a real implementation, you would extract actual PDF metadata
    return {
      title: 'Sample PDF Document',
      creator: 'PDF Creator',
      creationDate: new Date(),
      pageCount: Math.floor(fileData.length / 5000) + 1,
      wordCount: Math.floor(fileData.length / 50),
      characterCount: fileData.length * 2
    };
  }

  /**
   * Extract Word metadata (placeholder implementation)
   */
  private extractWordMetadata(fileData: Buffer): ExtractedMetadata {
    // In a real implementation, you would extract actual Word metadata
    return {
      title: 'Sample Word Document',
      author: 'Document Author',
      creationDate: new Date(),
      wordCount: Math.floor(fileData.length / 60),
      characterCount: fileData.length * 3
    };
  }

  /**
   * Detect document language (simplified implementation)
   */
  private detectLanguage(text: string): string {
    // In a real implementation, you would use a language detection library
    // This is a very simplified detection based on common words
    
    const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'à', 'un', 'une'];
    const arabicPattern = /[\u0600-\u06FF]/;
    
    if (arabicPattern.test(text)) {
      return 'ar';
    }
    
    const words = text.toLowerCase().split(/\s+/);
    const frenchCount = words.filter(word => frenchWords.includes(word)).length;
    
    if (frenchCount > words.length * 0.1) {
      return 'fr';
    }
    
    return 'en'; // Default to English
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate searchable terms from text
   */
  private generateSearchableTerms(text: string): string[] {
    // Normalize and tokenize text
    const normalized = text.toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ') // Keep alphanumeric and Arabic characters
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = normalized.split(' ').filter(word => word.length > 2);
    
    // Remove duplicates and return unique terms
    return [...new Set(words)];
  }

  /**
   * Extract legal terms from text (simplified implementation)
   */
  private extractLegalTerms(text: string): string[] {
    const legalTerms = [
      'contract', 'agreement', 'clause', 'article', 'section',
      'plaintiff', 'defendant', 'court', 'judge', 'jury',
      'evidence', 'witness', 'testimony', 'verdict', 'appeal',
      'contrat', 'accord', 'clause', 'article', 'section',
      'demandeur', 'défendeur', 'tribunal', 'juge', 'jury'
    ];
    
    const foundTerms: string[] = [];
    const lowerText = text.toLowerCase();
    
    legalTerms.forEach(term => {
      if (lowerText.includes(term)) {
        foundTerms.push(term);
      }
    });
    
    return [...new Set(foundTerms)];
  }

  /**
   * Extract dates from text (simplified implementation)
   */
  private extractDates(text: string): Date[] {
    // Simple date pattern matching
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g, // MM/DD/YYYY or DD/MM/YYYY
      /\d{1,2}-\d{1,2}-\d{4}/g,   // MM-DD-YYYY or DD-MM-YYYY
      /\d{4}-\d{1,2}-\d{1,2}/g    // YYYY-MM-DD
    ];
    
    const dates: Date[] = [];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        });
      }
    });
    
    return dates;
  }

  /**
   * Extract entities from text (placeholder implementation)
   */
  private extractEntities(text: string): ExtractedEntity[] {
    // In a real implementation, you would use NLP libraries for entity extraction
    // This is a simplified placeholder
    
    const entities: ExtractedEntity[] = [];
    
    // Simple pattern matching for demonstration
    const patterns = [
      { type: 'money' as const, pattern: /\$[\d,]+\.?\d*/g },
      { type: 'date' as const, pattern: /\d{1,2}\/\d{1,2}\/\d{4}/g },
      { type: 'case_reference' as const, pattern: /Case\s+No\.\s*\d+/gi }
    ];
    
    patterns.forEach(({ type, pattern }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type,
          value: match[0],
          confidence: 0.8, // Simplified confidence score
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    });
    
    return entities;
  }

  /**
   * Store extracted content in database
   */
  private async storeExtractedContent(
    documentId: string,
    extractedText: string,
    metadata?: ExtractedMetadata
  ): Promise<void> {
    try {
      await supabaseService.upsert('document_extracted_content', {
        document_id: documentId,
        extracted_text: extractedText,
        metadata: metadata || {},
        extracted_at: new Date().toISOString()
      }, 'document_id');
    } catch (error) {
      console.error('Failed to store extracted content:', error);
    }
  }

  /**
   * Store indexed content in database
   */
  private async storeIndexedContent(indexedContent: IndexedContent): Promise<void> {
    try {
      await supabaseService.upsert('document_content_index', {
        document_id: indexedContent.documentId,
        full_text: indexedContent.fullText,
        extracted_metadata: indexedContent.extractedMetadata,
        searchable_terms: indexedContent.searchableTerms,
        legal_terms: indexedContent.legalTerms,
        dates: indexedContent.dates.map(d => d.toISOString()),
        entities: indexedContent.entities,
        language: indexedContent.language,
        indexed_at: indexedContent.indexedAt.toISOString()
      }, 'document_id');
    } catch (error) {
      console.error('Failed to store indexed content:', error);
    }
  }

  /**
   * Normalize search query
   */
  private normalizeSearchQuery(query: string): string {
    return query.toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get document IDs by case
   */
  private async getDocumentIdsByCase(caseId: string): Promise<string[]> {
    try {
      const result = await supabaseService.query('documents', {
        filters: { case_id: caseId, is_deleted: false },
        select: 'id'
      });
      
      return result.success && result.data 
        ? result.data.map(doc => doc.id)
        : [];
    } catch (error) {
      console.error('Failed to get document IDs by case:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(text: string, searchTerms: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    searchTerms.forEach(term => {
      const termCount = (lowerText.match(new RegExp(term, 'g')) || []).length;
      score += termCount;
    });
    
    // Normalize by text length
    return score / (text.length / 1000);
  }

  /**
   * Find matched terms in text
   */
  private findMatchedTerms(text: string, searchTerms: string[]): string[] {
    const lowerText = text.toLowerCase();
    return searchTerms.filter(term => lowerText.includes(term));
  }

  /**
   * Generate excerpt around matched terms
   */
  private generateExcerpt(text: string, searchTerms: string[], maxLength: number = 200): string {
    const lowerText = text.toLowerCase();
    
    // Find first occurrence of any search term
    let firstMatchIndex = -1;
    for (const term of searchTerms) {
      const index = lowerText.indexOf(term);
      if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
        firstMatchIndex = index;
      }
    }
    
    if (firstMatchIndex === -1) {
      // No matches found, return beginning of text
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    // Extract excerpt around the match
    const start = Math.max(0, firstMatchIndex - maxLength / 2);
    const end = Math.min(text.length, start + maxLength);
    
    let excerpt = text.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
}

// Export singleton instance
export const contentExtractionService = new ContentExtractionService();
export default contentExtractionService;
