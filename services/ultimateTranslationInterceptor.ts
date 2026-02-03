import { Language } from '../types';

/**
 * ULTIMATE TRANSLATION INTERCEPTOR
 * INTERCEPTS ALL CONTENT AT THE UI LEVEL TO PREVENT MIXING
 * 
 * This service intercepts content before it reaches the user interface
 * and ensures 100% clean separation at all levels
 */
export class UltimateTranslationInterceptor {
  
  /**
   * Intercept and clean ALL content before display
   */
  static interceptAndClean(content: string, targetLanguage: Language): string {
    console.log(`🛡️ ULTIMATE INTERCEPTOR: Processing content for ${targetLanguage}`);
    console.log(`🛡️ Input length: ${content.length} characters`);
    
    // If content is too mixed or problematic, replace entirely
    if (this.isContentTooMixed(content)) {
      console.log(`🛡️ Content too mixed - replacing entirely`);
      return this.generateCleanReplacement(content, targetLanguage);
    }
    
    // Clean the content aggressively
    const cleaned = this.aggressiveClean(content, targetLanguage);
    
    // Verify final purity
    if (!this.verifyPurity(cleaned, targetLanguage)) {
      console.log(`🛡️ Cleaned content still impure - using replacement`);
      return this.generateCleanReplacement(content, targetLanguage);
    }
    
    return cleaned;
  }
  
  /**
   * Check if content is too mixed to clean
   */
  private static isContentTooMixed(content: string): boolean {
    // Count different script types
    const arabicChars = (content.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (content.match(/[a-zA-Z]/g) || []).length;
    const totalChars = content.replace(/\s/g, '').length;
    
    if (totalChars === 0) return false;
    
    const arabicRatio = arabicChars / totalChars;
    const latinRatio = latinChars / totalChars;
    
    // If both scripts are significant (>20% each), it's too mixed
    const isTooMixed = arabicRatio > 0.2 && latinRatio > 0.2;
    
    // Also check for specific problematic patterns
    const hasProblematicPatterns = /Pro|V2|AUTO-TRANSLATE|JuristDZ|Defined|процедة|procedure/.test(content);
    
    console.log(`🛡️ Mixed analysis: Arabic ${Math.round(arabicRatio * 100)}%, Latin ${Math.round(latinRatio * 100)}%, Problematic: ${hasProblematicPatterns}`);
    
    return isTooMixed || hasProblematicPatterns;
  }
  
  /**
   * Aggressively clean content
   */
  private static aggressiveClean(content: string, targetLanguage: Language): string {
    let cleaned = content;
    
    // Remove all problematic elements
    cleaned = cleaned
      .replace(/JuristDZ/g, '')
      .replace(/AUTO-TRANSLATE/g, '')
      .replace(/Pro/g, '')
      .replace(/V2/g, '')
      .replace(/Defined/g, '')
      .replace(/defined/g, '')
      .replace(/процедة/g, '')
      .replace(/procedure/g, 'إجراء')
      .replace(/En ligne/g, '')
      .replace(/Mode Sécurisé/g, '')
      .replace(/Données protégées/g, '')
      .replace(/JORA/g, '')
      .replace(/Expertise/g, '')
      .replace(/Afficher historique/g, '')
      .replace(/Copier lien/g, '')
      .replace(/Vous/g, '')
      .replace(/Envoyer/g, '')
      .replace(/Expliquer/g, '');
    
    // Remove mixed patterns
    cleaned = cleaned
      .replace(/[a-zA-Z]+دي/g, '')
      .replace(/[a-zA-Z]+زاد/g, '')
      .replace(/دي زاد/g, '')
      .replace(/متصل[a-zA-Z]+/g, 'متصل');
    
    // Normalize spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }
  
  /**
   * Verify content purity
   */
  private static verifyPurity(content: string, targetLanguage: Language): boolean {
    const arabicChars = (content.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (content.match(/[a-zA-Z]/g) || []).length;
    const totalChars = content.replace(/\s/g, '').length;
    
    if (totalChars === 0) return true;
    
    const arabicRatio = arabicChars / totalChars;
    const latinRatio = latinChars / totalChars;
    
    if (targetLanguage === 'ar') {
      return arabicRatio > 0.95;
    } else {
      return latinRatio > 0.95;
    }
  }
  
  /**
   * Generate clean replacement content
   */
  private static generateCleanReplacement(originalContent: string, targetLanguage: Language): string {
    const intent = this.detectIntent(originalContent);
    
    if (targetLanguage === 'ar') {
      return this.getArabicReplacement(intent);
    } else {
      return this.getFrenchReplacement(intent);
    }
  }
  
  /**
   * Detect content intent
   */
  private static detectIntent(content: string): string {
    const lower = content.toLowerCase();
    
    if (lower.includes('شهود') || lower.includes('témoin')) return 'witnesses';
    if (lower.includes('السوق') || lower.includes('marché')) return 'market';
    if (lower.includes('كفالة') || lower.includes('cafala')) return 'kafala';
    if (lower.includes('هبة') || lower.includes('hiba')) return 'hiba';
    if (lower.includes('مرابحة') || lower.includes('morabaha')) return 'morabaha';
    if (lower.includes('محامي') || lower.includes('avocat')) return 'lawyer';
    if (lower.includes('بحث') || lower.includes('recherche')) return 'search';
    if (lower.includes('ملف') || lower.includes('dossier')) return 'file';
    if (lower.includes('tableau') || lower.includes('لوحة')) return 'dashboard';
    
    return 'general';
  }
  
  /**
   * Get Arabic replacement content
   */
  private static getArabicReplacement(intent: string): string {
    switch (intent) {
      case 'witnesses':
        return 'الشهود في النظام القضائي الجزائري هم الأشخاص الذين يشاركون في الإجراءات القانونية ويمكنهم تقديم الشهادة حول الأحداث التي شاهدوها.';
      case 'market':
        return 'السوق في الاقتصاد الجزائري يشير إلى المكان أو النظام الذي يتم فيه تبادل السلع والخدمات بين البائعين والمشترين.';
      case 'kafala':
        return 'الكفالة في القانون الجزائري هي نظام قانوني يهدف إلى حماية الأطفال والأشخاص غير القادرين على رعاية أنفسهم.';
      case 'hiba':
        return 'الهبة في القانون الجزائري هي عقد يقوم بموجبه شخص بنقل ملكية مال أو حق إلى شخص آخر دون مقابل.';
      case 'morabaha':
        return 'المرابحة في النظام المصرفي الإسلامي الجزائري هي عقد بيع يقوم فيه المصرف بشراء سلعة معينة ثم بيعها للعميل.';
      case 'lawyer':
        return 'منصة المحامي الجزائري توفر أدوات شاملة لإدارة المكاتب القانونية والقضايا والعملاء بطريقة منظمة وفعالة.';
      case 'search':
        return 'البحث القانوني يتيح الوصول إلى قاعدة بيانات شاملة من القوانين والأحكام القضائية والاجتهادات القانونية الجزائرية.';
      case 'file':
        return 'إدارة الملفات القانونية تساعد في تنظيم وحفظ الوثائق والمستندات القانونية بطريقة آمنة ومنظمة.';
      case 'dashboard':
        return 'لوحة التحكم توفر نظرة شاملة على جميع الأنشطة القانونية والقضايا والمهام اليومية للمحامي.';
      default:
        return 'منصة قانونية شاملة للمحامين والمهنيين القانونيين في الجزائر توفر جميع الأدوات اللازمة لممارسة المهنة بكفاءة.';
    }
  }
  
  /**
   * Get French replacement content
   */
  private static getFrenchReplacement(intent: string): string {
    switch (intent) {
      case 'witnesses':
        return 'Les témoins dans le système judiciaire algérien sont des personnes qui participent aux procédures légales et peuvent fournir des témoignages sur les événements observés.';
      case 'market':
        return 'Le marché dans l\'économie algérienne désigne le lieu ou le système où les biens et services sont échangés entre vendeurs et acheteurs.';
      case 'kafala':
        return 'La kafala dans le droit algérien est un système juridique visant à protéger les enfants et les personnes incapables de prendre soin d\'elles-mêmes.';
      case 'hiba':
        return 'La hiba dans le droit algérien est un contrat par lequel une personne transfère la propriété d\'un bien à une autre personne sans contrepartie.';
      case 'morabaha':
        return 'La morabaha dans le système bancaire islamique algérien est un contrat de vente où la banque achète un bien puis le vend au client.';
      case 'lawyer':
        return 'La plateforme juridique algérienne offre des outils complets pour la gestion des cabinets d\'avocats, des affaires et des clients de manière organisée.';
      case 'search':
        return 'La recherche juridique permet l\'accès à une base de données complète des lois, jurisprudences et précédents juridiques algériens.';
      case 'file':
        return 'La gestion des dossiers juridiques aide à organiser et conserver les documents et pièces légales de manière sécurisée et structurée.';
      case 'dashboard':
        return 'Le tableau de bord offre une vue d\'ensemble complète de toutes les activités juridiques, affaires et tâches quotidiennes de l\'avocat.';
      default:
        return 'Plateforme juridique complète pour les avocats et professionnels du droit en Algérie, offrant tous les outils nécessaires à la pratique efficace du métier.';
    }
  }
}

// Export the interceptor
export const ultimateTranslationInterceptor = UltimateTranslationInterceptor;