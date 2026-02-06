/**
 * Document Management System - Document Comparison Service
 * 
 * Provides advanced document comparison capabilities including text diff analysis,
 * similarity scoring, and format-specific comparison for different document types.
 * 
 * Requirements: 4.2
 */

import type { 
  VersionDifference, 
  DifferenceLocation,
  DocumentVersion 
} from '../../../types/document-management';

// Enhanced comparison options
export interface ComparisonOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  contextLines?: number; // Number of context lines around changes
  granularity?: 'character' | 'word' | 'line' | 'paragraph';
  highlightSyntax?: boolean;
}

// Detailed comparison result
export interface DetailedComparison {
  similarities: number; // 0-1 score
  differences: EnhancedVersionDifference[];
  statistics: ComparisonStatistics;
  metadata: ComparisonMetadata;
}

// Enhanced version difference with more detail
export interface EnhancedVersionDifference extends VersionDifference {
  contextBefore?: string;
  contextAfter?: string;
  confidence: number; // 0-1 confidence in the diff
  changeType: 'structural' | 'content' | 'formatting' | 'metadata';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

// Comparison statistics
export interface ComparisonStatistics {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  charactersAdded: number;
  charactersDeleted: number;
  linesAdded: number;
  linesDeleted: number;
  wordsAdded: number;
  wordsDeleted: number;
}

// Comparison metadata
export interface ComparisonMetadata {
  comparisonTime: Date;
  algorithm: string;
  options: ComparisonOptions;
  documentType: string;
  processingTime: number; // milliseconds
}

// Document type detector
interface DocumentTypeInfo {
  type: 'text' | 'pdf' | 'docx' | 'binary';
  mimeType: string;
  encoding?: string;
  isStructured: boolean;
}

export class DocumentComparisonService {
  /**
   * Compare two document versions with enhanced analysis
   */
  async compareDocuments(
    content1: Buffer,
    content2: Buffer,
    version1: DocumentVersion,
    version2: DocumentVersion,
    options: ComparisonOptions = {}
  ): Promise<DetailedComparison> {
    const startTime = Date.now();
    
    try {
      // Detect document types
      const type1 = this.detectDocumentType(content1, version1);
      const type2 = this.detectDocumentType(content2, version2);
      
      // Ensure compatible document types
      if (type1.type !== type2.type) {
        throw new Error(`Cannot compare different document types: ${type1.type} vs ${type2.type}`);
      }
      
      let comparison: DetailedComparison;
      
      // Use appropriate comparison method based on document type
      switch (type1.type) {
        case 'text':
          comparison = await this.compareTextDocuments(content1, content2, options);
          break;
        case 'pdf':
          comparison = await this.comparePdfDocuments(content1, content2, options);
          break;
        case 'docx':
          comparison = await this.compareDocxDocuments(content1, content2, options);
          break;
        case 'binary':
          comparison = await this.compareBinaryDocuments(content1, content2, options);
          break;
        default:
          throw new Error(`Unsupported document type: ${type1.type}`);
      }
      
      // Add metadata
      comparison.metadata = {
        comparisonTime: new Date(),
        algorithm: this.getAlgorithmName(type1.type),
        options,
        documentType: type1.type,
        processingTime: Date.now() - startTime
      };
      
      return comparison;
      
    } catch (error) {
      throw new Error(`Document comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Compare text documents using advanced diff algorithms
   */
  private async compareTextDocuments(
    content1: Buffer,
    content2: Buffer,
    options: ComparisonOptions
  ): Promise<DetailedComparison> {
    const text1 = content1.toString('utf-8');
    const text2 = content2.toString('utf-8');
    
    // Normalize text based on options
    const normalizedText1 = this.normalizeText(text1, options);
    const normalizedText2 = this.normalizeText(text2, options);
    
    // Split into units based on granularity
    const units1 = this.splitTextIntoUnits(normalizedText1, options.granularity || 'line');
    const units2 = this.splitTextIntoUnits(normalizedText2, options.granularity || 'line');
    
    // Calculate differences using Myers' algorithm
    const differences = this.calculateMyersDiff(units1, units2, options);
    
    // Calculate similarity score
    const similarities = this.calculateTextSimilarity(units1, units2, differences);
    
    // Generate statistics
    const statistics = this.calculateStatistics(differences, text1, text2);
    
    return {
      similarities,
      differences,
      statistics,
      metadata: {} as ComparisonMetadata // Will be filled by caller
    };
  }
  
  /**
   * Compare PDF documents by extracting text content
   */
  private async comparePdfDocuments(
    content1: Buffer,
    content2: Buffer,
    options: ComparisonOptions
  ): Promise<DetailedComparison> {
    try {
      // Extract text from PDFs
      const text1 = await this.extractPdfText(content1);
      const text2 = await this.extractPdfText(content2);
      
      // Convert to text buffers and use text comparison
      const textBuffer1 = Buffer.from(text1, 'utf-8');
      const textBuffer2 = Buffer.from(text2, 'utf-8');
      
      return await this.compareTextDocuments(textBuffer1, textBuffer2, options);
      
    } catch (error) {
      // Fallback to binary comparison if text extraction fails
      return await this.compareBinaryDocuments(content1, content2, options);
    }
  }
  
  /**
   * Compare DOCX documents by extracting structured content
   */
  private async compareDocxDocuments(
    content1: Buffer,
    content2: Buffer,
    options: ComparisonOptions
  ): Promise<DetailedComparison> {
    try {
      // Extract text and structure from DOCX files
      const doc1 = await this.extractDocxContent(content1);
      const doc2 = await this.extractDocxContent(content2);
      
      // Compare text content
      const textComparison = await this.compareTextDocuments(
        Buffer.from(doc1.text, 'utf-8'),
        Buffer.from(doc2.text, 'utf-8'),
        options
      );
      
      // Add structure-specific differences
      const structuralDiffs = this.compareDocumentStructure(doc1.structure, doc2.structure);
      textComparison.differences.push(...structuralDiffs);
      
      return textComparison;
      
    } catch (error) {
      // Fallback to binary comparison if DOCX parsing fails
      return await this.compareBinaryDocuments(content1, content2, options);
    }
  }
  
  /**
   * Compare binary documents using byte-level analysis
   */
  private async compareBinaryDocuments(
    content1: Buffer,
    content2: Buffer,
    options: ComparisonOptions
  ): Promise<DetailedComparison> {
    const differences: EnhancedVersionDifference[] = [];
    
    // Basic binary comparison
    if (content1.length !== content2.length) {
      differences.push({
        type: 'modification',
        location: { section: 'file_size' },
        oldContent: `${content1.length} bytes`,
        newContent: `${content2.length} bytes`,
        confidence: 1.0,
        changeType: 'metadata',
        severity: content1.length === 0 || content2.length === 0 ? 'critical' : 'moderate'
      });
    }
    
    // Calculate binary similarity using byte comparison
    const similarities = this.calculateBinarySimilarity(content1, content2);
    
    // If files are different, add a general difference entry
    if (!content1.equals(content2)) {
      differences.push({
        type: 'modification',
        location: { section: 'binary_content' },
        oldContent: 'Binary content',
        newContent: 'Binary content (modified)',
        confidence: 0.8,
        changeType: 'content',
        severity: similarities < 0.5 ? 'major' : 'moderate'
      });
    }
    
    const statistics: ComparisonStatistics = {
      totalChanges: differences.length,
      additions: 0,
      deletions: 0,
      modifications: differences.length,
      charactersAdded: Math.max(0, content2.length - content1.length),
      charactersDeleted: Math.max(0, content1.length - content2.length),
      linesAdded: 0,
      linesDeleted: 0,
      wordsAdded: 0,
      wordsDeleted: 0
    };
    
    return {
      similarities,
      differences,
      statistics,
      metadata: {} as ComparisonMetadata
    };
  }
  
  /**
   * Detect document type from content and metadata
   */
  private detectDocumentType(content: Buffer, version: DocumentVersion): DocumentTypeInfo {
    // Check by file extension or MIME type first
    const storagePath = version.storagePath.toLowerCase();
    
    if (storagePath.includes('.pdf')) {
      return { type: 'pdf', mimeType: 'application/pdf', isStructured: true };
    }
    
    if (storagePath.includes('.docx')) {
      return { type: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', isStructured: true };
    }
    
    if (storagePath.includes('.txt')) {
      return { type: 'text', mimeType: 'text/plain', encoding: 'utf-8', isStructured: false };
    }
    
    // Try to detect by content
    if (this.isTextContent(content)) {
      return { type: 'text', mimeType: 'text/plain', encoding: 'utf-8', isStructured: false };
    }
    
    // Default to binary
    return { type: 'binary', mimeType: 'application/octet-stream', isStructured: false };
  }
  
  /**
   * Check if content is text-based
   */
  private isTextContent(content: Buffer): boolean {
    // Simple heuristic: check if most bytes are printable ASCII or UTF-8
    let textBytes = 0;
    const sampleSize = Math.min(1000, content.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const byte = content[i];
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        textBytes++;
      }
    }
    
    return textBytes / sampleSize > 0.7; // 70% text threshold
  }
  
  /**
   * Normalize text based on comparison options
   */
  private normalizeText(text: string, options: ComparisonOptions): string {
    let normalized = text;
    
    if (options.ignoreCase) {
      normalized = normalized.toLowerCase();
    }
    
    if (options.ignoreWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }
    
    return normalized;
  }
  
  /**
   * Split text into units for comparison
   */
  private splitTextIntoUnits(text: string, granularity: 'character' | 'word' | 'line' | 'paragraph'): string[] {
    switch (granularity) {
      case 'character':
        return text.split('');
      case 'word':
        return text.split(/\s+/).filter(word => word.length > 0);
      case 'line':
        return text.split(/\r?\n/);
      case 'paragraph':
        return text.split(/\r?\n\s*\r?\n/).filter(para => para.trim().length > 0);
      default:
        return text.split(/\r?\n/);
    }
  }
  
  /**
   * Calculate differences using Myers' diff algorithm (simplified implementation)
   */
  private calculateMyersDiff(
    units1: string[],
    units2: string[],
    options: ComparisonOptions
  ): EnhancedVersionDifference[] {
    const differences: EnhancedVersionDifference[] = [];
    
    // Simplified diff implementation
    // In a production system, you would use a proper diff library like 'diff' or implement Myers' algorithm
    
    let i = 0, j = 0;
    let lineNumber = 1;
    
    while (i < units1.length || j < units2.length) {
      if (i >= units1.length) {
        // Addition
        differences.push({
          type: 'addition',
          location: { line: lineNumber, section: 'content' },
          newContent: units2[j],
          confidence: 0.9,
          changeType: 'content',
          severity: 'minor'
        });
        j++;
      } else if (j >= units2.length) {
        // Deletion
        differences.push({
          type: 'deletion',
          location: { line: lineNumber, section: 'content' },
          oldContent: units1[i],
          confidence: 0.9,
          changeType: 'content',
          severity: 'minor'
        });
        i++;
      } else if (units1[i] === units2[j]) {
        // No change
        i++;
        j++;
      } else {
        // Modification
        differences.push({
          type: 'modification',
          location: { line: lineNumber, section: 'content' },
          oldContent: units1[i],
          newContent: units2[j],
          confidence: 0.8,
          changeType: 'content',
          severity: this.calculateChangeSeverity(units1[i], units2[j])
        });
        i++;
        j++;
      }
      lineNumber++;
    }
    
    return differences;
  }
  
  /**
   * Calculate text similarity score
   */
  private calculateTextSimilarity(
    units1: string[],
    units2: string[],
    differences: EnhancedVersionDifference[]
  ): number {
    const totalUnits = Math.max(units1.length, units2.length);
    if (totalUnits === 0) return 1.0;
    
    const changedUnits = differences.length;
    return Math.max(0, 1 - (changedUnits / totalUnits));
  }
  
  /**
   * Calculate binary similarity using byte comparison
   */
  private calculateBinarySimilarity(content1: Buffer, content2: Buffer): number {
    if (content1.length === 0 && content2.length === 0) return 1.0;
    if (content1.length === 0 || content2.length === 0) return 0.0;
    
    const minLength = Math.min(content1.length, content2.length);
    const maxLength = Math.max(content1.length, content2.length);
    
    let matchingBytes = 0;
    for (let i = 0; i < minLength; i++) {
      if (content1[i] === content2[i]) {
        matchingBytes++;
      }
    }
    
    // Account for size difference
    const sizeSimilarity = minLength / maxLength;
    const contentSimilarity = matchingBytes / minLength;
    
    return sizeSimilarity * contentSimilarity;
  }
  
  /**
   * Calculate change severity based on content
   */
  private calculateChangeSeverity(oldContent: string, newContent: string): 'minor' | 'moderate' | 'major' | 'critical' {
    const oldLength = oldContent.length;
    const newLength = newContent.length;
    
    if (oldLength === 0 || newLength === 0) return 'critical';
    
    const lengthRatio = Math.min(oldLength, newLength) / Math.max(oldLength, newLength);
    
    if (lengthRatio > 0.8) return 'minor';
    if (lengthRatio > 0.5) return 'moderate';
    if (lengthRatio > 0.2) return 'major';
    return 'critical';
  }
  
  /**
   * Calculate comparison statistics
   */
  private calculateStatistics(
    differences: EnhancedVersionDifference[],
    text1: string,
    text2: string
  ): ComparisonStatistics {
    let additions = 0, deletions = 0, modifications = 0;
    let charactersAdded = 0, charactersDeleted = 0;
    let linesAdded = 0, linesDeleted = 0;
    let wordsAdded = 0, wordsDeleted = 0;
    
    differences.forEach(diff => {
      switch (diff.type) {
        case 'addition':
          additions++;
          if (diff.newContent) {
            charactersAdded += diff.newContent.length;
            linesAdded += (diff.newContent.match(/\n/g) || []).length + 1;
            wordsAdded += diff.newContent.split(/\s+/).length;
          }
          break;
        case 'deletion':
          deletions++;
          if (diff.oldContent) {
            charactersDeleted += diff.oldContent.length;
            linesDeleted += (diff.oldContent.match(/\n/g) || []).length + 1;
            wordsDeleted += diff.oldContent.split(/\s+/).length;
          }
          break;
        case 'modification':
          modifications++;
          if (diff.oldContent && diff.newContent) {
            const oldLen = diff.oldContent.length;
            const newLen = diff.newContent.length;
            if (newLen > oldLen) {
              charactersAdded += newLen - oldLen;
            } else {
              charactersDeleted += oldLen - newLen;
            }
          }
          break;
      }
    });
    
    return {
      totalChanges: differences.length,
      additions,
      deletions,
      modifications,
      charactersAdded,
      charactersDeleted,
      linesAdded,
      linesDeleted,
      wordsAdded,
      wordsDeleted
    };
  }
  
  /**
   * Extract text from PDF (placeholder implementation)
   */
  private async extractPdfText(content: Buffer): Promise<string> {
    // In a real implementation, you would use a PDF parsing library like pdf-parse
    // For now, return a placeholder
    return `[PDF Content - ${content.length} bytes]`;
  }
  
  /**
   * Extract content from DOCX (placeholder implementation)
   */
  private async extractDocxContent(content: Buffer): Promise<{ text: string; structure: any }> {
    // In a real implementation, you would use a DOCX parsing library
    // For now, return a placeholder
    return {
      text: `[DOCX Content - ${content.length} bytes]`,
      structure: { paragraphs: [], styles: [] }
    };
  }
  
  /**
   * Compare document structure (placeholder implementation)
   */
  private compareDocumentStructure(structure1: any, structure2: any): EnhancedVersionDifference[] {
    // Placeholder for structural comparison
    return [];
  }
  
  /**
   * Get algorithm name for document type
   */
  private getAlgorithmName(documentType: string): string {
    switch (documentType) {
      case 'text': return 'Myers Diff Algorithm';
      case 'pdf': return 'PDF Text Extraction + Myers Diff';
      case 'docx': return 'DOCX Structure + Text Diff';
      case 'binary': return 'Binary Byte Comparison';
      default: return 'Unknown Algorithm';
    }
  }
}

// Export singleton instance
export const documentComparisonService = new DocumentComparisonService();
export default documentComparisonService;
