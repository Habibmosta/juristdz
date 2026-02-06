/**
 * Document Management System - Diff Visualization Service
 * 
 * Provides visual diff representations for document comparisons,
 * including HTML diff output, side-by-side comparisons, and inline highlighting.
 * 
 * Requirements: 4.2
 */

import type { 
  VersionComparisonVisualization,
  VersionDifference,
  DifferenceLocation 
} from '../../../types/document-management';

// Visualization options
export interface VisualizationOptions {
  format: 'html' | 'markdown' | 'json' | 'text';
  style: 'side-by-side' | 'inline' | 'unified';
  showLineNumbers?: boolean;
  showContext?: boolean;
  contextLines?: number;
  highlightSyntax?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  language?: 'fr' | 'ar' | 'en';
}

// HTML diff output
export interface HtmlDiffOutput {
  html: string;
  css: string;
  metadata: {
    totalLines: number;
    changedLines: number;
    addedLines: number;
    deletedLines: number;
  };
}

// Side-by-side comparison data
export interface SideBySideComparison {
  leftColumn: DiffColumn;
  rightColumn: DiffColumn;
  synchronizedScrolling: boolean;
}

// Diff column data
export interface DiffColumn {
  title: string;
  content: DiffLine[];
  lineCount: number;
}

// Individual diff line
export interface DiffLine {
  lineNumber?: number;
  content: string;
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
  highlightedContent?: string;
  cssClass: string;
}

export class DiffVisualizationService {
  /**
   * Generate HTML diff visualization
   */
  async generateHtmlDiff(
    visualization: VersionComparisonVisualization,
    oldContent: string,
    newContent: string,
    options: VisualizationOptions = { format: 'html', style: 'side-by-side' }
  ): Promise<HtmlDiffOutput> {
    try {
      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');
      
      let html = '';
      let css = this.generateDiffCSS(options.theme || 'light');
      
      switch (options.style) {
        case 'side-by-side':
          html = this.generateSideBySideHtml(oldLines, newLines, visualization, options);
          break;
        case 'inline':
          html = this.generateInlineHtml(oldLines, newLines, visualization, options);
          break;
        case 'unified':
          html = this.generateUnifiedHtml(oldLines, newLines, visualization, options);
          break;
        default:
          html = this.generateSideBySideHtml(oldLines, newLines, visualization, options);
      }
      
      const metadata = {
        totalLines: Math.max(oldLines.length, newLines.length),
        changedLines: visualization.statistics.totalChanges,
        addedLines: visualization.statistics.linesAdded,
        deletedLines: visualization.statistics.linesDeleted
      };
      
      return { html, css, metadata };
      
    } catch (error) {
      throw new Error(`HTML diff generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate side-by-side HTML comparison
   */
  private generateSideBySideHtml(
    oldLines: string[],
    newLines: string[],
    visualization: VersionComparisonVisualization,
    options: VisualizationOptions
  ): string {
    const isRTL = options.language === 'ar';
    const dirAttribute = isRTL ? 'dir="rtl"' : '';
    
    let html = `
      <div class="diff-container side-by-side" ${dirAttribute}>
        <div class="diff-header">
          <div class="diff-stats">
            <span class="similarity">Similarity: ${visualization.summary.similarityPercentage}%</span>
            <span class="changes">Changes: ${visualization.summary.totalChanges}</span>
            <span class="additions">+${visualization.statistics.linesAdded}</span>
            <span class="deletions">-${visualization.statistics.linesDeleted}</span>
          </div>
        </div>
        <div class="diff-content">
          <div class="diff-column old-version">
            <div class="column-header">Old Version</div>
            <div class="line-numbers">
    `;
    
    // Add line numbers for old version
    if (options.showLineNumbers) {
      for (let i = 1; i <= oldLines.length; i++) {
        html += `<div class="line-number">${i}</div>`;
      }
    }
    
    html += `
            </div>
            <div class="content">
    `;
    
    // Add old content lines
    oldLines.forEach((line, index) => {
      const changeInfo = this.findChangeForLine(index + 1, visualization.changes, 'old');
      const cssClass = changeInfo ? this.getLineCssClass(changeInfo.type) : 'unchanged';
      const highlightedLine = changeInfo ? this.highlightLine(line, changeInfo) : this.escapeHtml(line);
      
      html += `<div class="content-line ${cssClass}">${highlightedLine}</div>`;
    });
    
    html += `
            </div>
          </div>
          <div class="diff-column new-version">
            <div class="column-header">New Version</div>
            <div class="line-numbers">
    `;
    
    // Add line numbers for new version
    if (options.showLineNumbers) {
      for (let i = 1; i <= newLines.length; i++) {
        html += `<div class="line-number">${i}</div>`;
      }
    }
    
    html += `
            </div>
            <div class="content">
    `;
    
    // Add new content lines
    newLines.forEach((line, index) => {
      const changeInfo = this.findChangeForLine(index + 1, visualization.changes, 'new');
      const cssClass = changeInfo ? this.getLineCssClass(changeInfo.type) : 'unchanged';
      const highlightedLine = changeInfo ? this.highlightLine(line, changeInfo) : this.escapeHtml(line);
      
      html += `<div class="content-line ${cssClass}">${highlightedLine}</div>`;
    });
    
    html += `
            </div>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Generate inline HTML comparison
   */
  private generateInlineHtml(
    oldLines: string[],
    newLines: string[],
    visualization: VersionComparisonVisualization,
    options: VisualizationOptions
  ): string {
    const isRTL = options.language === 'ar';
    const dirAttribute = isRTL ? 'dir="rtl"' : '';
    
    let html = `
      <div class="diff-container inline" ${dirAttribute}>
        <div class="diff-header">
          <div class="diff-stats">
            <span class="similarity">Similarity: ${visualization.summary.similarityPercentage}%</span>
            <span class="changes">Changes: ${visualization.summary.totalChanges}</span>
          </div>
        </div>
        <div class="diff-content">
    `;
    
    // Process changes in order
    visualization.changes.forEach(change => {
      if (change.type === 'deletion' && change.oldContent) {
        html += `
          <div class="change-block deletion">
            <div class="change-header">Deleted at line ${change.location.line || 'unknown'}</div>
            <div class="content-line deleted">${this.escapeHtml(change.oldContent)}</div>
          </div>
        `;
      } else if (change.type === 'addition' && change.newContent) {
        html += `
          <div class="change-block addition">
            <div class="change-header">Added at line ${change.location.line || 'unknown'}</div>
            <div class="content-line added">${this.escapeHtml(change.newContent)}</div>
          </div>
        `;
      } else if (change.type === 'modification') {
        html += `
          <div class="change-block modification">
            <div class="change-header">Modified at line ${change.location.line || 'unknown'}</div>
            ${change.oldContent ? `<div class="content-line deleted">${this.escapeHtml(change.oldContent)}</div>` : ''}
            ${change.newContent ? `<div class="content-line added">${this.escapeHtml(change.newContent)}</div>` : ''}
          </div>
        `;
      }
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Generate unified HTML comparison (like git diff)
   */
  private generateUnifiedHtml(
    oldLines: string[],
    newLines: string[],
    visualization: VersionComparisonVisualization,
    options: VisualizationOptions
  ): string {
    const isRTL = options.language === 'ar';
    const dirAttribute = isRTL ? 'dir="rtl"' : '';
    
    let html = `
      <div class="diff-container unified" ${dirAttribute}>
        <div class="diff-header">
          <div class="diff-stats">
            <span class="similarity">Similarity: ${visualization.summary.similarityPercentage}%</span>
            <span class="file-info">--- Old Version</span>
            <span class="file-info">+++ New Version</span>
          </div>
        </div>
        <div class="diff-content">
    `;
    
    // Generate unified diff format
    let oldIndex = 0;
    let newIndex = 0;
    
    visualization.changes.forEach(change => {
      const contextBefore = options.showContext ? (options.contextLines || 3) : 0;
      
      // Add context lines before change
      if (contextBefore > 0) {
        for (let i = Math.max(0, oldIndex - contextBefore); i < oldIndex; i++) {
          if (i < oldLines.length) {
            html += `<div class="content-line context"> ${this.escapeHtml(oldLines[i])}</div>`;
          }
        }
      }
      
      // Add the change
      if (change.type === 'deletion' && change.oldContent) {
        html += `<div class="content-line deleted">-${this.escapeHtml(change.oldContent)}</div>`;
      } else if (change.type === 'addition' && change.newContent) {
        html += `<div class="content-line added">+${this.escapeHtml(change.newContent)}</div>`;
      } else if (change.type === 'modification') {
        if (change.oldContent) {
          html += `<div class="content-line deleted">-${this.escapeHtml(change.oldContent)}</div>`;
        }
        if (change.newContent) {
          html += `<div class="content-line added">+${this.escapeHtml(change.newContent)}</div>`;
        }
      }
      
      oldIndex = (change.location.line || 1) + 1;
      newIndex = oldIndex;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }
  
  /**
   * Generate CSS for diff visualization
   */
  private generateDiffCSS(theme: 'light' | 'dark'): string {
    const colors = theme === 'dark' ? {
      background: '#1e1e1e',
      text: '#d4d4d4',
      border: '#3e3e3e',
      added: '#1e3a1e',
      deleted: '#3a1e1e',
      modified: '#3a3a1e',
      addedText: '#4ec9b0',
      deletedText: '#f48771',
      modifiedText: '#dcdcaa'
    } : {
      background: '#ffffff',
      text: '#333333',
      border: '#e1e4e8',
      added: '#e6ffed',
      deleted: '#ffeef0',
      modified: '#fff5b4',
      addedText: '#28a745',
      deletedText: '#d73a49',
      modifiedText: '#b08800'
    };
    
    return `
      .diff-container {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.4;
        background: ${colors.background};
        color: ${colors.text};
        border: 1px solid ${colors.border};
        border-radius: 6px;
        overflow: hidden;
      }
      
      .diff-header {
        background: ${colors.border};
        padding: 10px;
        border-bottom: 1px solid ${colors.border};
      }
      
      .diff-stats span {
        margin-right: 15px;
        font-weight: bold;
      }
      
      .similarity { color: ${colors.text}; }
      .additions { color: ${colors.addedText}; }
      .deletions { color: ${colors.deletedText}; }
      
      .side-by-side .diff-content {
        display: flex;
      }
      
      .diff-column {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .column-header {
        background: ${colors.border};
        padding: 8px;
        font-weight: bold;
        text-align: center;
        border-bottom: 1px solid ${colors.border};
      }
      
      .line-numbers {
        background: ${colors.border};
        padding: 0;
        text-align: right;
        user-select: none;
        min-width: 50px;
      }
      
      .line-number {
        padding: 2px 8px;
        border-bottom: 1px solid ${colors.border};
        color: #666;
      }
      
      .content {
        flex: 1;
        overflow-x: auto;
      }
      
      .content-line {
        padding: 2px 8px;
        border-bottom: 1px solid ${colors.border};
        white-space: pre-wrap;
        word-break: break-all;
      }
      
      .content-line.added {
        background: ${colors.added};
        color: ${colors.addedText};
      }
      
      .content-line.deleted {
        background: ${colors.deleted};
        color: ${colors.deletedText};
      }
      
      .content-line.modified {
        background: ${colors.modified};
        color: ${colors.modifiedText};
      }
      
      .content-line.unchanged {
        background: ${colors.background};
      }
      
      .change-block {
        margin: 10px 0;
        border: 1px solid ${colors.border};
        border-radius: 4px;
      }
      
      .change-header {
        background: ${colors.border};
        padding: 5px 10px;
        font-weight: bold;
        font-size: 12px;
      }
      
      .inline .content-line {
        margin: 0;
        border-radius: 0;
      }
      
      .unified .content-line.context {
        color: #666;
      }
      
      /* RTL support */
      [dir="rtl"] .diff-container {
        text-align: right;
      }
      
      [dir="rtl"] .line-numbers {
        text-align: left;
      }
      
      /* Responsive design */
      @media (max-width: 768px) {
        .side-by-side .diff-content {
          flex-direction: column;
        }
        
        .diff-column {
          margin-bottom: 20px;
        }
      }
    `;
  }
  
  /**
   * Find change information for a specific line
   */
  private findChangeForLine(
    lineNumber: number,
    changes: VersionComparisonVisualization['changes'],
    version: 'old' | 'new'
  ): VersionComparisonVisualization['changes'][0] | null {
    return changes.find(change => 
      change.location.line === lineNumber &&
      ((version === 'old' && (change.type === 'deletion' || change.type === 'modification')) ||
       (version === 'new' && (change.type === 'addition' || change.type === 'modification')))
    ) || null;
  }
  
  /**
   * Get CSS class for line type
   */
  private getLineCssClass(type: 'addition' | 'deletion' | 'modification'): string {
    switch (type) {
      case 'addition': return 'added';
      case 'deletion': return 'deleted';
      case 'modification': return 'modified';
      default: return 'unchanged';
    }
  }
  
  /**
   * Highlight specific parts of a line based on change information
   */
  private highlightLine(
    line: string,
    change: VersionComparisonVisualization['changes'][0]
  ): string {
    // For now, just escape HTML. In a more advanced implementation,
    // you could highlight specific words or characters that changed
    return this.escapeHtml(line);
  }
  
  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Generate markdown diff output
   */
  async generateMarkdownDiff(
    visualization: VersionComparisonVisualization,
    oldContent: string,
    newContent: string
  ): Promise<string> {
    let markdown = `# Document Comparison\n\n`;
    markdown += `**Similarity:** ${visualization.summary.similarityPercentage}%\n`;
    markdown += `**Total Changes:** ${visualization.summary.totalChanges}\n\n`;
    
    markdown += `## Statistics\n`;
    markdown += `- **Additions:** ${visualization.statistics.additions} lines\n`;
    markdown += `- **Deletions:** ${visualization.statistics.deletions} lines\n`;
    markdown += `- **Modifications:** ${visualization.statistics.modifications} lines\n\n`;
    
    markdown += `## Changes\n\n`;
    
    visualization.changes.forEach((change, index) => {
      markdown += `### Change ${index + 1} (${change.type})\n`;
      markdown += `**Location:** Line ${change.location.line || 'unknown'}\n`;
      markdown += `**Severity:** ${change.severity}\n\n`;
      
      if (change.oldContent) {
        markdown += `**Old:**\n\`\`\`\n${change.oldContent}\n\`\`\`\n\n`;
      }
      
      if (change.newContent) {
        markdown += `**New:**\n\`\`\`\n${change.newContent}\n\`\`\`\n\n`;
      }
    });
    
    return markdown;
  }
  
  /**
   * Generate text-based diff output
   */
  async generateTextDiff(
    visualization: VersionComparisonVisualization,
    oldContent: string,
    newContent: string
  ): Promise<string> {
    let text = `Document Comparison Report\n`;
    text += `========================\n\n`;
    text += `Similarity: ${visualization.summary.similarityPercentage}%\n`;
    text += `Total Changes: ${visualization.summary.totalChanges}\n\n`;
    
    text += `Statistics:\n`;
    text += `- Additions: ${visualization.statistics.additions} lines\n`;
    text += `- Deletions: ${visualization.statistics.deletions} lines\n`;
    text += `- Modifications: ${visualization.statistics.modifications} lines\n\n`;
    
    text += `Changes:\n`;
    text += `--------\n\n`;
    
    visualization.changes.forEach((change, index) => {
      text += `${index + 1}. ${change.type.toUpperCase()} at line ${change.location.line || 'unknown'}\n`;
      text += `   Severity: ${change.severity}\n`;
      
      if (change.oldContent) {
        text += `   Old: ${change.oldContent}\n`;
      }
      
      if (change.newContent) {
        text += `   New: ${change.newContent}\n`;
      }
      
      text += `\n`;
    });
    
    return text;
  }
}

// Export singleton instance
export const diffVisualizationService = new DiffVisualizationService();
export default diffVisualizationService;
