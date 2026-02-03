/**
 * Emergency Content Cleaner
 * 
 * Immediate and aggressive cleaning of all existing content
 * to fix the persistent language mixing problem.
 */

export class EmergencyContentCleaner {
  private static instance: EmergencyContentCleaner;
  private cleaningInterval: number | null = null;

  private constructor() {
    this.startImmediateCleaning();
  }

  public static getInstance(): EmergencyContentCleaner {
    if (!EmergencyContentCleaner.instance) {
      EmergencyContentCleaner.instance = new EmergencyContentCleaner();
    }
    return EmergencyContentCleaner.instance;
  }

  /**
   * Start immediate and continuous cleaning
   */
  private startImmediateCleaning(): void {
    console.log('🚨 EMERGENCY CONTENT CLEANER ACTIVATED');
    
    // Clean immediately
    this.cleanAllContent();
    
    // Clean every 100ms to catch all content
    this.cleaningInterval = window.setInterval(() => {
      this.cleanAllContent();
    }, 100);
    
    // Also clean on DOM changes
    const observer = new MutationObserver(() => {
      this.cleanAllContent();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Clean all content in the entire document
   */
  private cleanAllContent(): void {
    // Get all text nodes in the document
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    // Clean each text node
    textNodes.forEach(textNode => {
      if (textNode.textContent && this.needsCleaning(textNode.textContent)) {
        const cleaned = this.aggressiveClean(textNode.textContent);
        if (cleaned !== textNode.textContent) {
          textNode.textContent = cleaned;
          console.log('🚨 CLEANED:', textNode.textContent.substring(0, 50));
        }
      }
    });
  }

  /**
   * Check if text needs cleaning
   */
  private needsCleaning(text: string): boolean {
    const problematicPatterns = [
      /النظام القانونيمتصل/,
      /ProAnalyseDossiersV2/,
      /الإجراء لتكليف شهودالprocedure/,
      /Cabinet d'AvocatCabinet d'Avocat/,
      /AvocatCabinet/,
      /متصلAvocat/,
      /Pro[أ-ي]/,
      /V2[أ-ي]/,
      /procedure لتكليف/,
      /[أ-ي]+[A-Z][a-z]+[أ-ي]+/,
      /[A-Z][a-z]+[أ-ي]+[A-Z]/
    ];

    return problematicPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Aggressive cleaning of problematic content
   */
  private aggressiveClean(text: string): string {
    let cleaned = text;

    // Specific fixes for the exact problems shown
    const fixes = [
      // Fix concatenated system names
      { from: /النظام القانونيمتصلAvocat/g, to: 'النظام القانوني - محامي' },
      { from: /النظام القانونيمتصل/g, to: 'النظام القانوني' },
      { from: /متصلAvocat/g, to: 'محامي متصل' },
      
      // Fix cabinet repetition
      { from: /Cabinet d'AvocatCabinet d'Avocat/g, to: 'Cabinet d\'Avocat' },
      { from: /AvocatCabinet d'Avocat/g, to: 'Cabinet d\'Avocat' },
      
      // Fix Pro/V2 mixed with Arabic
      { from: /ProAnalyseDossiersV2/g, to: 'تحليل الملفات' },
      { from: /ProAnalyse/g, to: 'تحليل' },
      { from: /DossiersV2/g, to: 'الملفات' },
      { from: /Pro([أ-ي]+)/g, to: '$1' },
      { from: /V2([أ-ي]+)/g, to: '$1' },
      
      // Fix procedure mixing
      { from: /الإجراء لتكليف شهودالprocedure لتكليف شهود/g, to: 'الإجراء لتكليف شهود' },
      { from: /الprocedure لتكليف/g, to: 'الإجراء لتكليف' },
      { from: /procedure لتكليف/g, to: 'إجراء تكليف' },
      
      // Fix system artifacts
      { from: /Système JuridiqueTableau de Bord/g, to: 'النظام القانوني - لوحة التحكم' },
      { from: /Recherche JuridiqueRédaction/g, to: 'البحث القانوني - التحرير' },
      { from: /Actions Rapides\+ Nouveau Dossier/g, to: 'إجراءات سريعة - ملف جديد' },
      { from: /\+ Recherche Express/g, to: 'بحث سريع' },
      
      // General mixed script cleanup
      { from: /([أ-ي]+)([A-Z][a-z]+)([أ-ي]+)/g, to: '$1 $3' },
      { from: /([A-Z][a-z]+)([أ-ي]+)([A-Z][a-z]+)/g, to: '$1 $3' },
      
      // Remove standalone artifacts
      { from: /\bPro\b/g, to: '' },
      { from: /\bV2\b/g, to: '' },
      { from: /\bAUTO-TRANSLATE\b/g, to: '' },
      
      // Clean up extra spaces
      { from: /\s+/g, to: ' ' }
    ];

    // Apply all fixes
    fixes.forEach(fix => {
      const before = cleaned;
      cleaned = cleaned.replace(fix.from, fix.to);
      if (before !== cleaned) {
        console.log(`🚨 Applied fix: ${fix.from} -> ${fix.to}`);
      }
    });

    return cleaned.trim();
  }

  /**
   * Stop the emergency cleaner
   */
  public stop(): void {
    if (this.cleaningInterval) {
      clearInterval(this.cleaningInterval);
      this.cleaningInterval = null;
    }
    console.log('🚨 Emergency Content Cleaner stopped');
  }
}

// Auto-start the emergency cleaner
export const emergencyContentCleaner = EmergencyContentCleaner.getInstance();