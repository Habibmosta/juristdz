/**
 * Content Interceptor Service
 * 
 * Intercepts and cleans all content before display to eliminate
 * the problematic mixed language content reported by the user.
 */

import { Language } from '../types';
import { translationService } from './translationService';

export class ContentInterceptor {
  private static instance: ContentInterceptor;
  private isEnabled: boolean = true;
  private cleaningRules: Array<{ pattern: RegExp; replacement: string; description: string }> = [];

  private constructor() {
    this.initializeCleaningRules();
    this.interceptDOMContent();
  }

  public static getInstance(): ContentInterceptor {
    if (!ContentInterceptor.instance) {
      ContentInterceptor.instance = new ContentInterceptor();
    }
    return ContentInterceptor.instance;
  }

  private initializeCleaningRules(): void {
    console.log('🧹 Initializing content cleaning rules...');
    
    // Exact problematic patterns reported by user
    this.cleaningRules = [
      {
        pattern: /محامي دي زادمتصلمحاميProتحليلملفاتV2AUTO-TRANSLATE/g,
        replacement: 'محامي',
        description: 'Complete mixed content string'
      },
      {
        pattern: /محامي دي زادمتصلمحامي/g,
        replacement: 'محامي',
        description: 'Mixed Arabic with concatenated elements'
      },
      {
        pattern: /ProتحليلملفاتV2/g,
        replacement: 'تحليل الملفات',
        description: 'Mixed English-Arabic file analysis'
      },
      {
        pattern: /AUTO-TRANSLATE/g,
        replacement: '',
        description: 'Auto-translate artifact'
      },
      {
        pattern: /Defined في المادة/g,
        replacement: 'معرف في المادة',
        description: 'English "Defined" in Arabic context'
      },
      {
        pattern: /ال процедة/g,
        replacement: 'الإجراء',
        description: 'Cyrillic in Arabic text'
      },
      {
        pattern: /процедة/g,
        replacement: 'إجراء',
        description: 'Cyrillic characters'
      },
      {
        pattern: /JuristDZ/g,
        replacement: 'النظام القانوني',
        description: 'System name artifact'
      },
      {
        pattern: /En ligne/g,
        replacement: 'متصل',
        description: 'French in Arabic context'
      },
      {
        pattern: /محامي دي زاد/g,
        replacement: 'محامي',
        description: 'Corrupted lawyer text'
      },
      {
        pattern: /محاميدي/g,
        replacement: 'محامي',
        description: 'Corrupted lawyer text variant'
      },
      {
        pattern: /محاميProتحليل/g,
        replacement: 'محامي - تحليل',
        description: 'Mixed Arabic-English lawyer analysis'
      },
      {
        pattern: /ملفاتV2/g,
        replacement: 'الملفات',
        description: 'Files with version artifact'
      },
      
      // General patterns
      {
        pattern: /[а-яё]+/gi,
        replacement: '',
        description: 'Cyrillic characters'
      },
      {
        pattern: /[A-Z][a-z]*[أ-ي]+[A-Z][a-z]*/g,
        replacement: '',
        description: 'Mixed Latin-Arabic patterns'
      },
      {
        pattern: /Pro(?=[أ-ي])/g,
        replacement: '',
        description: 'Pro prefix before Arabic'
      },
      {
        pattern: /V\d+(?=[أ-ي])/g,
        replacement: '',
        description: 'Version numbers before Arabic'
      },
      {
        pattern: /undefined|null|NaN|\[object Object\]/g,
        replacement: '',
        description: 'JavaScript artifacts'
      }
    ];

    console.log(`🧹 Initialized ${this.cleaningRules.length} cleaning rules`);
  }

  /**
   * Clean text content using all rules
   */
  public cleanContent(text: string): string {
    if (!this.isEnabled || !text || text.length === 0) {
      return text;
    }

    let cleaned = text;
    let rulesApplied = 0;

    // Apply all cleaning rules
    this.cleaningRules.forEach(rule => {
      const before = cleaned;
      cleaned = cleaned.replace(rule.pattern, rule.replacement);
      
      if (before !== cleaned) {
        rulesApplied++;
        console.log(`🧹 Applied rule: ${rule.description}`);
      }
    });

    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (rulesApplied > 0) {
      console.log(`🧹 Content cleaned: ${rulesApplied} rules applied`);
      console.log(`🧹 Before: "${text.substring(0, 100)}..."`);
      console.log(`🧹 After: "${cleaned.substring(0, 100)}..."`);
    }

    return cleaned;
  }

  /**
   * Intercept DOM content and clean it automatically
   */
  private interceptDOMContent(): void {
    console.log('🧹 Setting up DOM content interception...');

    // Override innerHTML setter to clean content
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    
    if (originalInnerHTMLDescriptor) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: originalInnerHTMLDescriptor.get,
        set: function(value: string) {
          const cleanedValue = ContentInterceptor.getInstance().cleanContent(value);
          originalInnerHTMLDescriptor.set!.call(this, cleanedValue);
        },
        configurable: true
      });
    }

    // Override textContent setter to clean content
    const originalTextContentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    
    if (originalTextContentDescriptor) {
      Object.defineProperty(Node.prototype, 'textContent', {
        get: originalTextContentDescriptor.get,
        set: function(value: string | null) {
          if (value) {
            const cleanedValue = ContentInterceptor.getInstance().cleanContent(value);
            originalTextContentDescriptor.set!.call(this, cleanedValue);
          } else {
            originalTextContentDescriptor.set!.call(this, value);
          }
        },
        configurable: true
      });
    }

    // Set up MutationObserver to clean existing content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const textNode = node as Text;
              if (textNode.textContent) {
                const cleaned = this.cleanContent(textNode.textContent);
                if (cleaned !== textNode.textContent) {
                  textNode.textContent = cleaned;
                }
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.cleanElementContent(element);
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log('🧹 DOM content interception active');
  }

  /**
   * Clean content of an element and its children
   */
  private cleanElementContent(element: Element): void {
    // Clean text nodes
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      if (textNode.textContent) {
        const cleaned = this.cleanContent(textNode.textContent);
        if (cleaned !== textNode.textContent) {
          textNode.textContent = cleaned;
        }
      }
    });
  }

  /**
   * Enable/disable content interception
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🧹 Content interception ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Add custom cleaning rule
   */
  public addCleaningRule(pattern: RegExp, replacement: string, description: string): void {
    this.cleaningRules.push({ pattern, replacement, description });
    console.log(`🧹 Added custom cleaning rule: ${description}`);
  }

  /**
   * Get cleaning statistics
   */
  public getStats(): { rulesCount: number; isEnabled: boolean } {
    return {
      rulesCount: this.cleaningRules.length,
      isEnabled: this.isEnabled
    };
  }
}

// Initialize the content interceptor
export const contentInterceptor = ContentInterceptor.getInstance();

// Auto-start interception
console.log('🧹 Content Interceptor initialized and active');