// Test du nettoyage radical avec le contenu utilisateur réel
console.log('🚨 Test du nettoyage RADICAL');

// Contenu exact fourni par l'utilisateur
const userContent = `محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونيةلوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائقإجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمنجميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.بحث قانونيخبرة في القانون الجزائري🔄إعادة تعيين🧹تنظيفترجمة الرسائلعرض السجلنسخ رابطأنتمترجمla الأسرةJuristDZمترجمLa الأسرة est un domaine juridique important en Algrie. Voici quelques informations cls : Marriage Le الزواج est reconnu par larticle 1 du قانون de la الأسرة, qui stipule que le الزواج est un contrat par lequel deux personnes, capables de contracter, sengagent vivre ensemble en الزواج. Le الزواج est considr comme un contrat civil, et ses effets sont rgis par le قانون de la الأسرة (articles 2 15). Les poux ont les mmes الحقوق et devoirs (المادة 12 du قانون de la الأسرة). Le الطلاق Le الطلاق est autoris par larticle 16 du قانون de la الأسرة, qui stipule que le الطلاق peut tre prononc pour faute ou pour incompatibilit de caractre. Les poux peuvent demander le الطلاق en justice (المادة 17 du قانون de la الأسرة). Le الطلاق est prononc par le tribunal de premire instance (المادة 18 du قانون de la الأسرة). Lenfant est protg par larticle 19 du قانون de la الأسرة, qui stipule que lenfant a الحق la الحماية de ses الوالدين et de la socit. Les الوالدين ont lobligation de fournir leur الطفل une ducation et une formation appropries (المادة 20 du قانون de la الأسرة). Lenfant a le الحق de bnficier de la الحضانة de ses الوالدين (المادة 21 du قانون de la الأسرة). La النسب La النسب est rgie par larticle 22 du قانون de la الأسرة, qui stipule que la النسب est tablie par la naissance ou par ladoption. La النسب peut tre tablie par le pre ou la mre (المادة 23 du قانون de la الأسرة). La النسب peut tre conteste en justice (المادة 24 du قانون de la الأسرة). La الوصاية La الوصاية est rgie par larticle 25 du قانون de la الأسرة, qui stipule que la الوصاية est institue pour veiller au bien-tre de lenfant. La الوصاية peut tre confie un الوالد ou un tiers (المادة 26 du قانون de la الأسرة). La الوصاية peut tre conteste en justice (المادة 27 du قانون de la الأسرة). Ces informations sont extraites du قانون de la الأسرة algrien. Si vous avez besoin de plus de dtails ou de prcisions, nhsitez pas me le demander.إرسال`;

// Fonction de nettoyage radical (copiée de ImprovedChatInterface.tsx)
function cleanUIContent(text) {
    if (!text || typeof text !== 'string') return text;
    
    console.log(`🧹 NETTOYAGE RADICAL - Début: "${text.substring(0, 100)}..."`);
    
    // ÉTAPE 0: Si le texte contient trop d'éléments UI, le rejeter complètement
    const uiIndicators = [
      'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
      'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
      'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
      'خبرة في القانون الجزائري', 'ترجمة الرسائل', 'عرض السجل', 'نسخ رابط',
      'أنتمترجم', 'JuristDZ', '🔄إعادة تعيين', '🧹تنظيف', 'إرسال'
    ];
    
    let uiCount = 0;
    uiIndicators.forEach(indicator => {
      if (text.includes(indicator)) {
        uiCount++;
      }
    });
    
    // Si plus de 3 indicateurs UI, rejeter complètement le texte
    if (uiCount > 3) {
      console.log(`🧹 REJET COMPLET - Trop d'éléments UI détectés: ${uiCount}`);
      return '';
    }
    
    let cleaned = text;
    
    // ÉTAPE 1: Supprimer TOUS les patterns exacts du nouveau rapport utilisateur
    const exactUIPatterns = [
      // NOUVEAU: Patterns du dernier rapport utilisateur
      'محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونيةلوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائقإجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمنجميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.بحث قانونيخبرة في القانون الجزائري🔄إعادة تعيين🧹تنظيفترجمة الرسائلعرض السجلنسخ رابطأنتمترجم',
      
      // Patterns individuels
      'محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونية',
      'لوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائق',
      'إجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمن',
      'جميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.',
      'بحث قانونيخبرة في القانون الجزائري🔄إعادة تعيين🧹تنظيف',
      'ترجمة الرسائلعرض السجلنسخ رابطأنتمترجم',
      
      // Éléments individuels
      'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
      'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
      'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
      'خبرة في القانون الجزائري', 'ترجمة الرسائل', 'عرض السجل', 'نسخ رابط',
      'أنتمترجم', '🔄إعادة تعيين', '🧹تنظيف',
      
      // Artifacts techniques
      'JuristDZ', 'AUTO-TRANSLATE', 'Defined', 'процедة', 'إرسال',
      
      // NOUVEAU: Patterns de mélange spécifiques du rapport
      'la الأسرة', 'La الأسرة', 'Le الزواج', 'le الزواج', 'Le الطلاق', 'le الطلاق',
      'du قانون', 'de la الأسرة', 'المادة', 'les الحقوق', 'الحماية', 'ses الوالدين',
      'leur الطفل', 'le الحق', 'la الحضانة', 'La النسب', 'la النسب', 'La الوصاية',
      'la الوصاية', 'un الوالد'
    ];
    
    // Supprimer tous les patterns exacts
    exactUIPatterns.forEach(pattern => {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(escapedPattern, 'g'), '');
    });
    
    // ÉTAPE 2: Supprimer les mélanges arabe-français spécifiques
    const mixedLanguagePatterns = [
      // Patterns français-arabe mélangés
      /\b[A-Za-zÀ-ÿ]+\s+[\u0600-\u06FF]+/g, // Mot français suivi d'arabe
      /[\u0600-\u06FF]+\s+[A-Za-zÀ-ÿ]+/g, // Mot arabe suivi de français
      /\b[A-Za-zÀ-ÿ]+[\u0600-\u06FF]+/g, // Français collé à l'arabe
      /[\u0600-\u06FF]+[A-Za-zÀ-ÿ]+/g, // Arabe collé au français
      
      // Patterns spécifiques problématiques
      /Pro(?=[\u0600-\u06FF])/g,
      /V2(?=[\u0600-\u06FF])/g,
      /ar(?=[\u0600-\u06FF])/g,
      
      // Émojis et caractères spéciaux
      /🔄|🧹|📋|⚖️|🏛️|📊|📈|💼|🔍|📝|📄|📋|✅|❌|⭐|🌟/g,
      
      // Suppression des doublons de mots
      /(\b\w+\b)(\s+\1\b)+/g,
      
      // Nettoyage des espaces et caractères
      /\s{2,}/g, // Espaces multiples
      /[\r\n\t]+/g, // Sauts de ligne et tabulations
    ];
    
    mixedLanguagePatterns.forEach(pattern => {
      if (pattern.toString().includes('(\\b\\w+\\b)')) {
        // Pattern spécial pour les doublons
        cleaned = cleaned.replace(pattern, '$1');
      } else if (pattern.toString().includes('\\s{2,}')) {
        // Pattern pour les espaces multiples
        cleaned = cleaned.replace(pattern, ' ');
      } else {
        // Autres patterns
        cleaned = cleaned.replace(pattern, '');
      }
    });
    
    // ÉTAPE 3: Vérification de pureté linguistique ULTRA STRICTE
    cleaned = cleaned.trim();
    
    if (cleaned.length === 0) {
      console.log(`🧹 REJET - Texte complètement nettoyé`);
      return '';
    }
    
    const arabicChars = (cleaned.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = cleaned.replace(/\s/g, '').length;
    
    if (totalChars > 0) {
      const arabicRatio = arabicChars / totalChars;
      const latinRatio = latinChars / totalChars;
      
      console.log(`🧹 Analyse linguistique: Arabic ${Math.round(arabicRatio * 100)}%, Latin ${Math.round(latinRatio * 100)}%`);
      
      // ULTRA STRICT: Si plus de 5% de mélange, rejeter
      if (arabicRatio > 0.05 && latinRatio > 0.05) {
        console.log(`🧹 REJET - Mélange linguistique détecté`);
        return '';
      }
      
      // Si moins de 20 caractères utiles, rejeter
      if (totalChars < 20) {
        console.log(`🧹 REJET - Texte trop court: ${totalChars} caractères`);
        return '';
      }
    }
    
    console.log(`🧹 SUCCÈS - Nettoyage terminé: "${cleaned.substring(0, 50)}..."`);
    return cleaned;
}

console.log('🚨 Contenu original (longueur):', userContent.length);
console.log('🚨 Contenu original (aperçu):', userContent.substring(0, 200) + '...');

const cleanedContent = cleanUIContent(userContent);

console.log('🚨 Contenu après nettoyage radical (longueur):', cleanedContent.length);
if (cleanedContent.length > 0) {
  console.log('🚨 Contenu après nettoyage radical (aperçu):', cleanedContent.substring(0, 200) + '...');
} else {
  console.log('🚨 ✅ SUCCÈS: Contenu complètement rejeté - trop contaminé');
}

// Test de détection d'indicateurs UI
const uiIndicators = [
  'محامي دي زاد', 'متصلمحامي', 'مكتب المحاماة', 'نظام إدارة قانونية',
  'لوحة التحكم', 'بحث قانوني', 'تحريرPro', 'تحليلملفات', 'ملفاتV2',
  'وثائقإجراءات سريعة', '+ ملف جديد', '+ بحث سريع', 'arوضع آمن',
  'خبرة في القانون الجزائري', 'ترجمة الرسائل', 'عرض السجل', 'نسخ رابط',
  'أنتمترجم', 'JuristDZ', '🔄إعادة تعيين', '🧹تنظيف', 'إرسال'
];

let uiCount = 0;
uiIndicators.forEach(indicator => {
  if (userContent.includes(indicator)) {
    uiCount++;
    console.log(`🚨 Indicateur UI détecté: "${indicator}"`);
  }
});

console.log(`🚨 Total d'indicateurs UI détectés: ${uiCount}`);
console.log(`🚨 Seuil de rejet: 3 indicateurs`);
console.log(`🚨 Résultat: ${uiCount > 3 ? 'REJET COMPLET' : 'NETTOYAGE PARTIEL'}`);

console.log('🚨 ✅ Test du nettoyage radical terminé');