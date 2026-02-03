/**
 * INTERFACE CONTENT FIXER
 * 
 * Fixes the specific issue where UI elements get concatenated without spaces
 * This addresses the user's report of "متصلمحاميلوحة التحكم" instead of proper spacing
 */

export class InterfaceContentFixer {
  private static instance: InterfaceContentFixer;

  private constructor() {
    this.startInterfaceCleaning();
  }

  public static getInstance(): InterfaceContentFixer {
    if (!InterfaceContentFixer.instance) {
      InterfaceContentFixer.instance = new InterfaceContentFixer();
    }
    return InterfaceContentFixer.instance;
  }

  /**
   * Start continuous interface cleaning
   */
  private startInterfaceCleaning(): void {
    console.log('🔧 INTERFACE FIXER: Starting interface content fixing...');

    // Fix immediately
    this.fixAllInterfaceContent();

    // Fix every 100ms for real-time updates
    setInterval(() => {
      this.fixAllInterfaceContent();
    }, 100);

    // Fix on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(() => this.fixAllInterfaceContent(), 10);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Fix all interface content
   */
  private fixAllInterfaceContent(): void {
    // Fix all text nodes
    this.fixTextNodes();
    
    // Fix specific UI elements
    this.fixNavigationElements();
    
    // Fix button texts
    this.fixButtonTexts();
    
    // Fix sidebar content
    this.fixSidebarContent();
  }

  /**
   * Fix text nodes that have concatenated words
   */
  private fixTextNodes(): void {
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

    textNodes.forEach(textNode => {
      if (textNode.textContent && this.needsSpacing(textNode.textContent)) {
        const fixed = this.addProperSpacing(textNode.textContent);
        if (fixed !== textNode.textContent) {
          console.log('🔧 INTERFACE FIXER: Fixed spacing:', textNode.textContent, '->', fixed);
          textNode.textContent = fixed;
        }
      }
    });
  }

  /**
   * Check if text needs spacing fixes
   */
  private needsSpacing(text: string): boolean {
    // Patterns that indicate concatenated words without spaces
    const concatenatedPatterns = [
      // Arabic + French/English concatenation
      /متصلمحامي/,
      /محاميلوحة/,
      /لوحةالتحكم/,
      /التحكمبحث/,
      /بحثقانوني/,
      /قانونيتحرير/,
      /تحريرتحليل/,
      /تحليلملفات/,
      /ملفاتوثائق/,
      /وثائقإجراءات/,
      /إجراءاتسريعة/,
      /سريعةملف/,
      /ملفجديد/,
      /جديدبحث/,
      /بحثسريع/,
      
      // French concatenation
      /TableauBord/,
      /RechercheJuridique/,
      /RédactionAnalyse/,
      /AnalyseDossiers/,
      /DossiersDocumentation/,
      /DocumentationActions/,
      /ActionsRapides/,
      /RapidesDossier/,
      /DossierRecherche/,
      /RechercheExpress/,
      
      // Mixed language concatenation
      /متصلAvocat/,
      /AvocatCabinet/,
      /CabinetAvocat/,
      /ProAnalyse/,
      /AnalyseDossiers/,
      /DossiersV2/,
      /V2AUTO/,
      /AUTOTranslate/,
      
      // General pattern: Arabic word + Latin word without space
      /[أ-ي]+[A-Za-z]/,
      // General pattern: Latin word + Arabic word without space
      /[A-Za-z]+[أ-ي]/,
      // Multiple words without spaces
      /([A-Z][a-z]+){2,}/,
      /([أ-ي]+){2,}/
    ];

    return concatenatedPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Add proper spacing to concatenated text
   */
  private addProperSpacing(text: string): string {
    let fixed = text;

    // Specific fixes for user-reported patterns
    const specificFixes = [
      // Arabic navigation fixes
      { from: /متصلمحامي/g, to: 'متصل محامي' },
      { from: /محاميلوحة/g, to: 'محامي لوحة' },
      { from: /لوحةالتحكم/g, to: 'لوحة التحكم' },
      { from: /التحكمبحث/g, to: 'التحكم بحث' },
      { from: /بحثقانوني/g, to: 'بحث قانوني' },
      { from: /قانونيتحرير/g, to: 'قانوني تحرير' },
      { from: /تحريرتحليل/g, to: 'تحرير تحليل' },
      { from: /تحليلملفات/g, to: 'تحليل ملفات' },
      { from: /ملفاتوثائق/g, to: 'ملفات وثائق' },
      { from: /وثائقإجراءات/g, to: 'وثائق إجراءات' },
      { from: /إجراءاتسريعة/g, to: 'إجراءات سريعة' },
      { from: /سريعةملف/g, to: 'سريعة ملف' },
      { from: /ملفجديد/g, to: 'ملف جديد' },
      { from: /جديدبحث/g, to: 'جديد بحث' },
      { from: /بحثسريع/g, to: 'بحث سريع' },
      
      // French navigation fixes
      { from: /TableauBord/g, to: 'Tableau de Bord' },
      { from: /RechercheJuridique/g, to: 'Recherche Juridique' },
      { from: /RédactionAnalyse/g, to: 'Rédaction Analyse' },
      { from: /AnalyseDossiers/g, to: 'Analyse Dossiers' },
      { from: /DossiersDocumentation/g, to: 'Dossiers Documentation' },
      { from: /DocumentationActions/g, to: 'Documentation Actions' },
      { from: /ActionsRapides/g, to: 'Actions Rapides' },
      { from: /RapidesDossier/g, to: 'Rapides Dossier' },
      { from: /DossierRecherche/g, to: 'Dossier Recherche' },
      { from: /RechercheExpress/g, to: 'Recherche Express' },
      
      // Mixed language fixes
      { from: /متصلAvocat/g, to: 'متصل Avocat' },
      { from: /AvocatCabinet/g, to: 'Avocat Cabinet' },
      { from: /CabinetAvocat/g, to: 'Cabinet Avocat' },
      { from: /ProAnalyse/g, to: 'Pro Analyse' },
      { from: /DossiersV2/g, to: 'Dossiers V2' },
      { from: /V2AUTO/g, to: 'V2 AUTO' },
      { from: /AUTOTranslate/g, to: 'AUTO Translate' },
      
      // Remove problematic artifacts completely
      { from: /AUTO-TRANSLATE/g, to: '' },
      { from: /Pro(?=[أ-ي])/g, to: '' },
      { from: /V2(?=[أ-ي])/g, to: '' },
      { from: /Defined/g, to: '' },
      { from: /процедة/g, to: '' },
      
      // General spacing fixes
      { from: /([أ-ي]+)([A-Z][a-z]+)/g, to: '$1 $2' },
      { from: /([A-Z][a-z]+)([أ-ي]+)/g, to: '$1 $2' },
      { from: /([A-Z][a-z]+)([A-Z][a-z]+)/g, to: '$1 $2' },
      
      // Clean up multiple spaces
      { from: /\s+/g, to: ' ' }
    ];

    // Apply all fixes
    specificFixes.forEach(fix => {
      const before = fixed;
      fixed = fixed.replace(fix.from, fix.to);
      if (before !== fixed) {
        console.log(`🔧 Applied spacing fix: ${fix.from} -> ${fix.to}`);
      }
    });

    return fixed.trim();
  }

  /**
   * Fix navigation elements specifically
   */
  private fixNavigationElements(): void {
    // Fix sidebar navigation
    const navButtons = document.querySelectorAll('nav button, .sidebar button, [role="navigation"] button');
    navButtons.forEach(button => {
      if (button.textContent && this.needsSpacing(button.textContent)) {
        const fixed = this.addProperSpacing(button.textContent);
        if (fixed !== button.textContent) {
          console.log('🔧 Fixed navigation button:', button.textContent, '->', fixed);
          button.textContent = fixed;
        }
      }
    });

    // Fix menu items
    const menuItems = document.querySelectorAll('.menu-item, [class*="menu"], [class*="nav"]');
    menuItems.forEach(item => {
      if (item.textContent && this.needsSpacing(item.textContent)) {
        const fixed = this.addProperSpacing(item.textContent);
        if (fixed !== item.textContent) {
          console.log('🔧 Fixed menu item:', item.textContent, '->', fixed);
          item.textContent = fixed;
        }
      }
    });
  }

  /**
   * Fix button texts
   */
  private fixButtonTexts(): void {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.textContent && this.needsSpacing(button.textContent)) {
        const fixed = this.addProperSpacing(button.textContent);
        if (fixed !== button.textContent) {
          console.log('🔧 Fixed button text:', button.textContent, '->', fixed);
          button.textContent = fixed;
        }
      }
    });
  }

  /**
   * Fix sidebar content specifically
   */
  private fixSidebarContent(): void {
    const sidebar = document.querySelector('.sidebar, [class*="sidebar"], nav');
    if (sidebar) {
      const walker = document.createTreeWalker(
        sidebar,
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
        if (textNode.textContent && this.needsSpacing(textNode.textContent)) {
          const fixed = this.addProperSpacing(textNode.textContent);
          if (fixed !== textNode.textContent) {
            console.log('🔧 Fixed sidebar content:', textNode.textContent, '->', fixed);
            textNode.textContent = fixed;
          }
        }
      });
    }
  }
}

// Auto-initialize the interface fixer
export const interfaceContentFixer = InterfaceContentFixer.getInstance();

console.log('🔧 INTERFACE CONTENT FIXER: Activated for proper word spacing');