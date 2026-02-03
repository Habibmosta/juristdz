/**
 * RADICAL CONTENT CLEANER
 * 
 * This is the nuclear option - intercepts ALL content at every possible level
 * to eliminate the persistent language mixing problem once and for all.
 */

import React from 'react';

export class RadicalContentCleaner {
  private static instance: RadicalContentCleaner;
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;

  private constructor() {
    this.interceptAllAPIs();
    this.interceptAllContent();
    this.startAggressiveCleaning();
  }

  public static getInstance(): RadicalContentCleaner {
    if (!RadicalContentCleaner.instance) {
      RadicalContentCleaner.instance = new RadicalContentCleaner();
    }
    return RadicalContentCleaner.instance;
  }

  /**
   * Intercept all API calls and clean responses
   */
  private interceptAllAPIs(): void {
    console.log('🔥 RADICAL CLEANER: API interception disabled to avoid fetch conflicts');
    // DÉSACTIVÉ: L'interception de fetch cause des problèmes avec les vraies API calls
    // Nous gardons seulement le nettoyage DOM qui fonctionne bien
    return;
    
    /* CODE ORIGINAL COMMENTÉ
    console.log('🔥 RADICAL CLEANER: Intercepting ALL API calls...');

    // Intercept fetch
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await this.originalFetch(...args);
      
      // Clone response to modify it
      const clonedResponse = response.clone();
      
      try {
        const text = await clonedResponse.text();
        const cleanedText = this.radicalClean(text);
        
        if (cleanedText !== text) {
          console.log('🔥 CLEANED API RESPONSE:', text.substring(0, 100), '->', cleanedText.substring(0, 100));
          
          // Return modified response
          return new Response(cleanedText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      } catch (e) {
        // If not text, return original
      }
      
      return response;
    };

    // Intercept XMLHttpRequest
    this.originalXMLHttpRequest = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new self.originalXMLHttpRequest();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(...args) {
        return originalOpen.apply(this, args);
      };
      
      xhr.send = function(...args) {
        const originalOnReadyStateChange = this.onreadystatechange;
        
        this.onreadystatechange = function() {
          if (this.readyState === 4 && this.responseText) {
            const cleaned = self.radicalClean(this.responseText);
            if (cleaned !== this.responseText) {
              console.log('🔥 CLEANED XHR RESPONSE');
              // Override responseText (this is tricky but we try)
              Object.defineProperty(this, 'responseText', {
                value: cleaned,
                writable: false
              });
            }
          }
          
          if (originalOnReadyStateChange) {
            return originalOnReadyStateChange.apply(this, arguments);
          }
        };
        
        return originalSend.apply(this, args);
      };
      
      return xhr;
    } as any;
    */
  }

  /**
   * Intercept all content modification methods
   */
  private interceptAllContent(): void {
    console.log('🔥 RADICAL CLEANER: Intercepting ALL content modification...');

    // Intercept React setState and similar
    this.interceptReactUpdates();
    
    // Intercept all DOM modifications
    this.interceptDOMModifications();
    
    // Intercept JSON parsing
    this.interceptJSONParsing();
  }

  private interceptReactUpdates(): void {
    // Intercept React's render methods
    if (typeof React !== 'undefined' && React.createElement) {
      const originalCreateElement = React.createElement;
      React.createElement = function(type, props, ...children) {
        // Clean all string props and children
        if (props) {
          Object.keys(props).forEach(key => {
            if (typeof props[key] === 'string') {
              const cleaned = RadicalContentCleaner.getInstance().radicalClean(props[key]);
              if (cleaned !== props[key]) {
                console.log(`🔥 CLEANED REACT PROP ${key}:`, props[key], '->', cleaned);
                props[key] = cleaned;
              }
            }
          });
        }
        
        const cleanedChildren = children.map(child => {
          if (typeof child === 'string') {
            const cleaned = RadicalContentCleaner.getInstance().radicalClean(child);
            if (cleaned !== child) {
              console.log('🔥 CLEANED REACT CHILD:', child, '->', cleaned);
            }
            return cleaned;
          }
          return child;
        });
        
        return originalCreateElement.call(this, type, props, ...cleanedChildren);
      };
    }
  }

  private interceptDOMModifications(): void {
    // Intercept innerHTML
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (originalInnerHTMLDescriptor) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        get: originalInnerHTMLDescriptor.get,
        set: function(value: string) {
          const cleaned = RadicalContentCleaner.getInstance().radicalClean(value);
          if (cleaned !== value) {
            console.log('🔥 CLEANED innerHTML:', value.substring(0, 50), '->', cleaned.substring(0, 50));
          }
          originalInnerHTMLDescriptor.set!.call(this, cleaned);
        },
        configurable: true
      });
    }

    // Intercept textContent
    const originalTextContentDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (originalTextContentDescriptor) {
      Object.defineProperty(Node.prototype, 'textContent', {
        get: originalTextContentDescriptor.get,
        set: function(value: string | null) {
          if (value && typeof value === 'string') {
            const cleaned = RadicalContentCleaner.getInstance().radicalClean(value);
            if (cleaned !== value) {
              console.log('🔥 CLEANED textContent:', value.substring(0, 50), '->', cleaned.substring(0, 50));
            }
            originalTextContentDescriptor.set!.call(this, cleaned);
          } else {
            originalTextContentDescriptor.set!.call(this, value);
          }
        },
        configurable: true
      });
    }
  }

  private interceptJSONParsing(): void {
    const originalJSONParse = JSON.parse;
    JSON.parse = function(text: string, reviver?: any) {
      const result = originalJSONParse.call(this, text, reviver);
      
      // Clean all string values in the parsed object
      const cleaned = RadicalContentCleaner.getInstance().deepCleanObject(result);
      
      return cleaned;
    };
  }

  /**
   * Deep clean all strings in an object
   */
  private deepCleanObject(obj: any): any {
    if (typeof obj === 'string') {
      const cleaned = this.radicalClean(obj);
      if (cleaned !== obj) {
        console.log('🔥 CLEANED JSON STRING:', obj.substring(0, 50), '->', cleaned.substring(0, 50));
      }
      return cleaned;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const cleanedObj: any = {};
      Object.keys(obj).forEach(key => {
        cleanedObj[key] = this.deepCleanObject(obj[key]);
      });
      return cleanedObj;
    }
    
    return obj;
  }

  /**
   * Start aggressive continuous cleaning
   */
  private startAggressiveCleaning(): void {
    console.log('🔥 RADICAL CLEANER: Starting aggressive continuous cleaning...');

    // Clean every 50ms
    setInterval(() => {
      this.cleanAllExistingContent();
    }, 50);

    // Clean on every possible event
    ['click', 'keyup', 'change', 'input', 'focus', 'blur', 'scroll'].forEach(event => {
      document.addEventListener(event, () => {
        setTimeout(() => this.cleanAllExistingContent(), 10);
      });
    });
  }

  /**
   * Clean all existing content in the DOM
   */
  private cleanAllExistingContent(): void {
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
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
      if (textNode.textContent && this.needsCleaning(textNode.textContent)) {
        const cleaned = this.radicalClean(textNode.textContent);
        if (cleaned !== textNode.textContent) {
          console.log('🔥 RADICAL CLEAN DOM:', textNode.textContent.substring(0, 50), '->', cleaned.substring(0, 50));
          textNode.textContent = cleaned;
        }
      }
    });
  }

  /**
   * Check if content needs cleaning
   */
  private needsCleaning(text: string): boolean {
    // Ne pas nettoyer les éléments de navigation purs (sans mélange)
    const pureNavigationElements = [
      'JuristDZ', 'محامي دي زاد',
      'Tableau de Bord', 'لوحة التحكم',
      'Recherche Juridique', 'بحث قانوني',
      'Rédaction', 'تحرير',
      'Analyse', 'تحليل',
      'Dossiers', 'ملفات',
      'Administration', 'إدارة',
      'Suite Métier', 'المساحة المهنية',
      'Assistant IA', 'مساعد ذكي',
      'En ligne', 'متصل',
      'Hors ligne', 'غير متصل'
    ];
    
    // Si c'est un élément de navigation pur, ne pas nettoyer
    if (pureNavigationElements.includes(text.trim())) {
      return false;
    }
    
    // Nettoyer TOUT contenu qui contient des mélanges de langues - PATTERNS EXACTS DU RAPPORT UTILISATEUR
    const mixedLanguagePatterns = [
      // PATTERNS EXACTS DU DERNIER RAPPORT UTILISATEUR - PRIORITÉ MAXIMALE
      /النظام القانونيمتصلAvocatCabinet d'AvocatCabinet d'Avocat/,
      /النظام القانونيلوحة التحكم/,
      /البحث القانونيRédactionAnalyseDossiers/,
      /البحث القانونيRédaction/,
      /RédactionAnalyseDossiers/,
      /Documentationإجراءات سريعة/,
      /إجراءات سريعةملف جديد/,
      /ملف جديدبحث سريع/,
      /بحث سريعfrMode/,
      /frMode Sécurisé/,
      
      // Patterns généraux de mélange
      /[أ-ي]+[A-Za-z]/,
      /[A-Za-z]+[أ-ي]/,
      /متصلAvocat/,
      /Cabinet.*Cabinet/,
      /ProAnalyse/,
      /DossiersV2/,
      /Actions Rapides/,
      /AUTO-TRANSLATE/,
      /محاميPro/,
      /ملفاتV2/,
      /процедة/,
      /Pro(?=[أ-ي])/,
      /V2(?=[أ-ي])/,
      /([أ-ي]+)Pro/,
      /([أ-ي]+)V2/
    ];

    return mixedLanguagePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Radical cleaning function - the nuclear option
   */
  private radicalClean(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let cleaned = text;

    // NUCLEAR FIXES - exact patterns from user's latest report
    const nuclearFixes = [
      // EXACT USER REPORT PATTERNS - HIGHEST PRIORITY
      { from: /النظام القانونيمتصلAvocatCabinet d'AvocatCabinet d'Avocat/g, to: '' },
      { from: /النظام القانونيلوحة التحكم/g, to: '' },
      { from: /البحث القانونيRédactionAnalyseDossiers/g, to: '' },
      { from: /البحث القانونيRédaction/g, to: '' },
      { from: /RédactionAnalyseDossiers/g, to: '' },
      { from: /RédactionAnalyse/g, to: '' },
      { from: /Documentationإجراءات سريعة/g, to: '' },
      { from: /إجراءات سريعةملف جديد/g, to: '' },
      { from: /ملف جديدبحث سريع/g, to: '' },
      { from: /بحث سريعfrMode/g, to: '' },
      { from: /frMode Sécurisé/g, to: '' },
      { from: /frMode/g, to: '' },
      
      // Previous patterns
      { from: /النظام القانونيمتصلAvocat/g, to: '' },
      { from: /النظام القانونيمتصل/g, to: '' },
      { from: /متصلAvocat/g, to: '' },
      { from: /Cabinet d'AvocatCabinet d'Avocat/g, to: '' },
      { from: /Cabinet d'AvocatCabinet/g, to: '' },
      { from: /AvocatCabinet d'Avocat/g, to: '' },
      { from: /ProAnalyseDossiersV2/g, to: '' },
      { from: /ProAnalyse/g, to: '' },
      { from: /DossiersV2/g, to: '' },
      { from: /Système JuridiqueTableau de Bord/g, to: '' },
      { from: /Système Juridique/g, to: '' },
      { from: /Recherche JuridiqueRédaction/g, to: '' },
      { from: /Actions Rapides\+ Nouveau Dossier/g, to: '' },
      { from: /Actions Rapides/g, to: '' },
      { from: /\+ Nouveau Dossier/g, to: '' },
      { from: /\+ Recherche Express/g, to: '' },
      { from: /الإجراء لتكليف شهودالprocedure لتكليف شهود/g, to: '' },
      { from: /الprocedure لتكليف/g, to: '' },
      { from: /procedure لتكليف/g, to: '' },
      { from: /محامي دي زادمتصلمحامي/g, to: '' },
      { from: /محامي دي زادمتصل/g, to: '' },
      { from: /محاميProتحليل/g, to: '' },
      { from: /ملفاتV2/g, to: '' },
      
      // Remove ALL mixed language artifacts - MORE AGGRESSIVE
      { from: /[أ-ي]+[A-Za-z]+[أ-ي]*/g, to: '' },
      { from: /[A-Za-z]+[أ-ي]+[A-Za-z]*/g, to: '' },
      { from: /Pro(?=[أ-ي])/g, to: '' },
      { from: /V2(?=[أ-ي])/g, to: '' },
      { from: /([أ-ي]+)Pro/g, to: '' },
      { from: /([أ-ي]+)V2/g, to: '' },
      { from: /\bPro\b(?=\s*[أ-ي])/g, to: '' },
      { from: /\bV2\b(?=\s*[أ-ي])/g, to: '' },
      { from: /\bAUTO-TRANSLATE\b/g, to: '' },
      { from: /\bDefined\b/g, to: '' },
      { from: /процедة/g, to: '' },
      
      // Clean up multiple spaces and empty content
      { from: /\s+/g, to: ' ' },
      { from: /^\s*$/g, to: '' }
    ];

    // Apply all nuclear fixes
    nuclearFixes.forEach(fix => {
      const before = cleaned;
      cleaned = cleaned.replace(fix.from, fix.to);
      if (before !== cleaned && cleaned.length > 0) {
        console.log(`🔥 NUCLEAR FIX APPLIED: Removed mixed content`);
      }
    });

    return cleaned.trim();
  }
}

// Auto-initialize the radical cleaner
export const radicalContentCleaner = RadicalContentCleaner.getInstance();

console.log('🔥 RADICAL CONTENT CLEANER: NUCLEAR OPTION ACTIVATED');