/**
 * Language-Specific Formatting Utilities
 * 
 * Implements French and Arabic template formatting rules with proper text direction,
 * number formatting, date formatting, and typography rules.
 * 
 * Requirements: 3.5 - Multi-language template support
 */

import { Language } from '../../../types';

export interface LanguageFormattingOptions {
  language: Language;
  preserveFormatting?: boolean;
  useLocalizedNumbers?: boolean;
  useLocalizedDates?: boolean;
  applyTypographyRules?: boolean;
}

export interface FormattedContent {
  content: string;
  direction: 'ltr' | 'rtl';
  language: Language;
  metadata: {
    appliedRules: string[];
    warnings: string[];
  };
}

/**
 * Language-specific formatting service for templates
 */
export class LanguageFormattingService {
  
  /**
   * Apply language-specific formatting to template content
   */
  formatContent(content: string, options: LanguageFormattingOptions): FormattedContent {
    const appliedRules: string[] = [];
    const warnings: string[] = [];
    let formattedContent = content;

    switch (options.language) {
      case Language.ARABIC:
        formattedContent = this.applyArabicFormatting(formattedContent, options, appliedRules, warnings);
        break;
      case Language.FRENCH:
        formattedContent = this.applyFrenchFormatting(formattedContent, options, appliedRules, warnings);
        break;
      default:
        warnings.push(`Unsupported language: ${options.language}`);
    }

    return {
      content: formattedContent,
      direction: options.language === Language.ARABIC ? 'rtl' : 'ltr',
      language: options.language,
      metadata: {
        appliedRules,
        warnings
      }
    };
  }

  /**
   * Apply Arabic-specific formatting rules
   */
  private applyArabicFormatting(
    content: string,
    options: LanguageFormattingOptions,
    appliedRules: string[],
    warnings: string[]
  ): string {
    let formatted = content;

    // Apply right-to-left text direction markers
    if (options.preserveFormatting !== false) {
      formatted = this.applyRTLFormatting(formatted);
      appliedRules.push('rtl-formatting');
    }

    // Format Arabic numbers
    if (options.useLocalizedNumbers !== false) {
      formatted = this.formatArabicNumbers(formatted);
      appliedRules.push('arabic-numbers');
    }

    // Format Arabic dates
    if (options.useLocalizedDates !== false) {
      formatted = this.formatArabicDates(formatted);
      appliedRules.push('arabic-dates');
    }

    // Apply Arabic typography rules
    if (options.applyTypographyRules !== false) {
      formatted = this.applyArabicTypography(formatted);
      appliedRules.push('arabic-typography');
    }

    // Handle mixed content (Arabic + Latin)
    formatted = this.handleMixedArabicContent(formatted);
    appliedRules.push('mixed-content-handling');

    // Apply legal document specific Arabic formatting
    formatted = this.applyArabicLegalFormatting(formatted);
    appliedRules.push('arabic-legal-formatting');

    return formatted;
  }

  /**
   * Apply French-specific formatting rules
   */
  private applyFrenchFormatting(
    content: string,
    options: LanguageFormattingOptions,
    appliedRules: string[],
    warnings: string[]
  ): string {
    let formatted = content;

    // Format French numbers
    if (options.useLocalizedNumbers !== false) {
      formatted = this.formatFrenchNumbers(formatted);
      appliedRules.push('french-numbers');
    }

    // Format French dates
    if (options.useLocalizedDates !== false) {
      formatted = this.formatFrenchDates(formatted);
      appliedRules.push('french-dates');
    }

    // Apply French typography rules
    if (options.applyTypographyRules !== false) {
      formatted = this.applyFrenchTypography(formatted);
      appliedRules.push('french-typography');
    }

    // Apply legal document specific French formatting
    formatted = this.applyFrenchLegalFormatting(formatted);
    appliedRules.push('french-legal-formatting');

    return formatted;
  }

  /**
   * Apply right-to-left formatting for Arabic text
   */
  private applyRTLFormatting(content: string): string {
    // Add RTL direction markers for Arabic text blocks
    let formatted = content;

    // Wrap Arabic text blocks with RTL markers
    formatted = formatted.replace(
      /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200F\u202E\u202D]+(?:\s+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200F\u202E\u202D]+)*)/g,
      '\u202E$1\u202C'
    );

    // Ensure proper paragraph direction for Arabic content
    formatted = formatted.replace(/^(.*[\u0600-\u06FF].*$)/gm, '\u200F$1');

    // Handle line breaks in RTL context
    formatted = formatted.replace(/\n([\u0600-\u06FF])/g, '\n\u200F$1');

    return formatted;
  }

  /**
   * Convert Western Arabic numerals to Eastern Arabic numerals
   */
  private formatArabicNumbers(content: string): string {
    const westernToEastern: Record<string, string> = {
      '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
      '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
    };

    // Convert numbers in Arabic text contexts
    return content.replace(/(\d+)(?=[\s\u0600-\u06FF]|$)/g, (match) => {
      return match.replace(/[0-9]/g, (digit) => westernToEastern[digit] || digit);
    });
  }

  /**
   * Format dates in Arabic locale
   */
  private formatArabicDates(content: string): string {
    // Arabic month names
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // Convert date patterns to Arabic format
    return content.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
      const monthIndex = parseInt(month) - 1;
      const arabicMonth = arabicMonths[monthIndex] || month;
      
      // Convert numbers to Arabic numerals
      const arabicDay = day.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      const arabicYear = year.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      
      return `${arabicDay} ${arabicMonth} ${arabicYear}`;
    });
  }

  /**
   * Apply Arabic typography rules
   */
  private applyArabicTypography(content: string): string {
    let formatted = content;

    // Handle Arabic punctuation
    formatted = formatted.replace(/\s*([؟،؛])/g, '$1'); // Remove space before Arabic punctuation
    formatted = formatted.replace(/([؟،؛])\s*/g, '$1 '); // Add space after Arabic punctuation

    // Handle quotation marks in Arabic
    formatted = formatted.replace(/"/g, '«'); // Opening quote
    formatted = formatted.replace(/"/g, '»'); // Closing quote

    // Handle parentheses direction in RTL context
    formatted = formatted.replace(/\(/g, '(');
    formatted = formatted.replace(/\)/g, ')');

    // Ensure proper spacing around Arabic text
    formatted = formatted.replace(/([\u0600-\u06FF])([a-zA-Z])/g, '$1 $2');
    formatted = formatted.replace(/([a-zA-Z])([\u0600-\u06FF])/g, '$1 $2');

    return formatted;
  }

  /**
   * Apply Arabic legal document formatting
   */
  private applyArabicLegalFormatting(content: string): string {
    let formatted = content;

    // Format legal article references in Arabic
    formatted = formatted.replace(/المادة\s*(\d+)/g, (match, number) => {
      const arabicNumber = number.replace(/[0-9]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      return `المادة ${arabicNumber}`;
    });

    // Format legal dates
    formatted = formatted.replace(/في\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
      const arabicDay = day.replace(/[0-9]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      const arabicMonth = month.replace(/[0-9]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      const arabicYear = year.replace(/[0-9]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      return `في ${arabicDay}/${arabicMonth}/${arabicYear}`;
    });

    // Format monetary amounts in Arabic
    formatted = formatted.replace(/(\d+(?:\.\d{2})?)\s*(دج|دينار)/g, (match, amount, currency) => {
      const arabicAmount = amount.replace(/[0-9]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
      return `${arabicAmount} ${currency}`;
    });

    return formatted;
  }

  /**
   * Handle mixed Arabic and Latin content
   */
  private handleMixedArabicContent(content: string): string {
    let formatted = content;

    // Ensure proper direction for mixed content lines
    formatted = formatted.replace(/^(.*)$/gm, (line) => {
      const hasArabic = /[\u0600-\u06FF]/.test(line);
      const hasLatin = /[a-zA-Z]/.test(line);
      
      if (hasArabic && hasLatin) {
        // Mixed content - apply neutral direction with proper spacing
        return line.replace(/([\u0600-\u06FF]+)\s*([a-zA-Z0-9]+)/g, '$1 $2')
                  .replace(/([a-zA-Z0-9]+)\s*([\u0600-\u06FF]+)/g, '$1 $2');
      }
      
      return line;
    });

    return formatted;
  }

  /**
   * Format numbers in French locale
   */
  private formatFrenchNumbers(content: string): string {
    // Format large numbers with French thousand separators
    return content.replace(/\b(\d{1,3}(?:\s\d{3})*(?:,\d{2})?)\b/g, (match) => {
      // French uses space as thousand separator and comma as decimal separator
      return match.replace(/\s/g, '\u00A0'); // Use non-breaking space
    });
  }

  /**
   * Format dates in French locale
   */
  private formatFrenchDates(content: string): string {
    const frenchMonths = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];

    // Convert date patterns to French format
    return content.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
      const monthIndex = parseInt(month) - 1;
      const frenchMonth = frenchMonths[monthIndex] || month;
      return `${parseInt(day)} ${frenchMonth} ${year}`;
    });
  }

  /**
   * Apply French typography rules
   */
  private applyFrenchTypography(content: string): string {
    let formatted = content;

    // French punctuation spacing rules
    formatted = formatted.replace(/\s*([!?:;])/g, '\u00A0$1'); // Non-breaking space before punctuation
    formatted = formatted.replace(/([!?:;])\s*/g, '$1 '); // Regular space after punctuation

    // French quotation marks
    formatted = formatted.replace(/«\s*/g, '«\u00A0'); // Non-breaking space after opening guillemets
    formatted = formatted.replace(/\s*»/g, '\u00A0»'); // Non-breaking space before closing guillemets

    // Handle apostrophes
    formatted = formatted.replace(/'/g, "'"); // Use proper apostrophe

    // Ensure proper spacing around em dashes
    formatted = formatted.replace(/\s*—\s*/g, '\u00A0—\u00A0');

    return formatted;
  }

  /**
   * Apply French legal document formatting
   */
  private applyFrenchLegalFormatting(content: string): string {
    let formatted = content;

    // Format legal article references
    formatted = formatted.replace(/\b(Article\s+\d+|Art\.\s*\d+)\b/gi, '<strong>$1</strong>');

    // Format legal references
    formatted = formatted.replace(/\b(Loi\s+n°\s*[\d-]+)\b/gi, '<em>$1</em>');
    formatted = formatted.replace(/\b(Code\s+[a-zA-Z\s]+)\b/gi, '<em>$1</em>');

    // Format legal dates with proper French format
    formatted = formatted.replace(/\ble\s+(\d{1,2})\s+(\w+)\s+(\d{4})/g, (match, day, month, year) => {
      return `le ${day} ${month} ${year}`;
    });

    // Format monetary amounts in French legal format
    formatted = formatted.replace(/(\d+(?:,\d{2})?)\s*(€|EUR|DA|DZD)/gi, (match, amount, currency) => {
      const formattedAmount = amount.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
      return `${formattedAmount}\u00A0${currency.toUpperCase()}`;
    });

    // Format percentages
    formatted = formatted.replace(/(\d+(?:,\d+)?)\s*%/g, '$1\u00A0%');

    return formatted;
  }

  /**
   * Validate content for language-specific requirements
   */
  validateLanguageContent(content: string, language: Language): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (language === Language.ARABIC) {
      // Check for proper Arabic text
      if (!/[\u0600-\u06FF]/.test(content)) {
        warnings.push('No Arabic text detected in Arabic template');
      }

      // Check for mixed direction issues
      if (/[a-zA-Z][\u0600-\u06FF]|[\u0600-\u06FF][a-zA-Z]/.test(content)) {
        suggestions.push('Consider adding proper spacing between Arabic and Latin text');
      }

      // Check for Western numerals in Arabic context
      if (/[\u0600-\u06FF].*\d/.test(content)) {
        suggestions.push('Consider using Arabic-Indic numerals (٠-٩) in Arabic text');
      }
    }

    if (language === Language.FRENCH) {
      // Check for proper French punctuation spacing
      if (/\s[!?:;]/.test(content)) {
        suggestions.push('Use non-breaking spaces before French punctuation (!?:;)');
      }

      // Check for proper quotation marks
      if (/"/.test(content)) {
        suggestions.push('Consider using French quotation marks (« »)');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  /**
   * Get language-specific template placeholders
   */
  getLanguageSpecificPlaceholders(language: Language): Record<string, string> {
    const placeholders: Record<string, Record<string, string>> = {
      [Language.FRENCH]: {
        'currentDate': 'Date actuelle',
        'clientName': 'Nom du client',
        'lawyerName': 'Nom de l\'avocat',
        'caseNumber': 'Numéro de dossier',
        'courtName': 'Nom du tribunal',
        'amount': 'Montant',
        'signature': 'Signature'
      },
      [Language.ARABIC]: {
        'currentDate': 'التاريخ الحالي',
        'clientName': 'اسم العميل',
        'lawyerName': 'اسم المحامي',
        'caseNumber': 'رقم الملف',
        'courtName': 'اسم المحكمة',
        'amount': 'المبلغ',
        'signature': 'التوقيع'
      }
    };

    return placeholders[language] || {};
  }

  /**
   * Convert content between languages (for template translation)
   */
  convertContentLanguage(content: string, fromLanguage: Language, toLanguage: Language): {
    convertedContent: string;
    requiresManualReview: boolean;
    notes: string[];
  } {
    const notes: string[] = [];
    let convertedContent = content;
    let requiresManualReview = true; // Always require manual review for language conversion

    // Convert placeholders
    const fromPlaceholders = this.getLanguageSpecificPlaceholders(fromLanguage);
    const toPlaceholders = this.getLanguageSpecificPlaceholders(toLanguage);

    Object.entries(fromPlaceholders).forEach(([key, fromValue]) => {
      const toValue = toPlaceholders[key];
      if (toValue) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        convertedContent = convertedContent.replace(regex, `{{${key}}}`);
        notes.push(`Placeholder ${key} maintained for translation`);
      }
    });

    // Add language-specific formatting
    const formattingOptions: LanguageFormattingOptions = {
      language: toLanguage,
      preserveFormatting: true,
      useLocalizedNumbers: true,
      useLocalizedDates: true,
      applyTypographyRules: true
    };

    const formatted = this.formatContent(convertedContent, formattingOptions);
    convertedContent = formatted.content;

    notes.push(`Applied ${toLanguage} formatting rules`);
    notes.push('Manual translation of text content required');

    return {
      convertedContent,
      requiresManualReview,
      notes
    };
  }
}

// Export singleton instance
export const languageFormattingService = new LanguageFormattingService();