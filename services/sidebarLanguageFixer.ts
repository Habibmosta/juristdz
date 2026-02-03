/**
 * SIDEBAR LANGUAGE FIXER
 * 
 * Ensures the sidebar displays content in the correct language only
 */

import { Language } from '../types';

export class SidebarLanguageFixer {
  private static instance: SidebarLanguageFixer;
  private currentLanguage: Language = 'fr';

  private constructor() {
    this.startSidebarMonitoring();
  }

  public static getInstance(): SidebarLanguageFixer {
    if (!SidebarLanguageFixer.instance) {
      SidebarLanguageFixer.instance = new SidebarLanguageFixer();
    }
    return SidebarLanguageFixer.instance;
  }

  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    console.log(`🔧 Sidebar Language Fixer: Language set to ${language}`);
    this.cleanSidebarNow();
  }

  private startSidebarMonitoring(): void {
    // Monitor sidebar changes every 500ms
    setInterval(() => {
      this.cleanSidebarNow();
    }, 500);

    // Monitor on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(() => this.cleanSidebarNow(), 100);
    });

    // Start observing when DOM is ready
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      });
    }
  }

  private cleanSidebarNow(): void {
    // Find sidebar elements
    const sidebarSelectors = [
      '[class*="sidebar"]',
      '[class*="nav"]',
      '[class*="menu"]',
      'nav',
      'aside'
    ];

    sidebarSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.cleanElement(element as HTMLElement);
      });
    });
  }

  private cleanElement(element: HTMLElement): void {
    if (!element) return;

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
        const cleaned = this.cleanMixedContent(textNode.textContent);
        if (cleaned !== textNode.textContent) {
          console.log(`🔧 Sidebar cleaned: "${textNode.textContent}" -> "${cleaned}"`);
          textNode.textContent = cleaned;
        }
      }
    });
  }

  private cleanMixedContent(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // Patterns de contenu mélangé à supprimer complètement
    const mixedPatterns = [
      /النظام القانونيمتصلAvocatCabinet d'AvocatCabinet d'Avocat/g,
      /النظام القانونيلوحة التحكم/g,
      /البحث القانونيRédactionAnalyseDossiers/g,
      /البحث القانونيRédaction/g,
      /RédactionAnalyseDossiers/g,
      /Documentationإجراءات سريعة/g,
      /إجراءات سريعةملف جديد/g,
      /ملف جديدبحث سريع/g,
      /بحث سريعfrMode/g,
      /frMode Sécurisé/g,
      /النظام القانونيمتصل/g,
      /متصلAvocat/g,
      /Cabinet d'AvocatCabinet/g,
      /محامي دي زادمتصل/g,
      /محاميProتحليل/g,
      /ملفاتV2/g,
      /[أ-ي]+[A-Za-z]+[أ-ي]*/g,
      /[A-Za-z]+[أ-ي]+[A-Za-z]*/g,
      /Pro(?=[أ-ي])/g,
      /V2(?=[أ-ي])/g,
      /AUTO-TRANSLATE/g,
      /Defined/g,
      /процедة/g
    ];

    let cleaned = text;

    // Supprimer tous les patterns de mélange
    mixedPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Si le texte est maintenant vide ou trop court, le supprimer
    cleaned = cleaned.trim();
    if (cleaned.length < 2) {
      return '';
    }

    // Nettoyer les espaces multiples
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
  }
}

// Auto-initialize
export const sidebarLanguageFixer = SidebarLanguageFixer.getInstance();

console.log('🔧 SIDEBAR LANGUAGE FIXER: Initialized');