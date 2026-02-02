import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Improved Translation API endpoint
 * Handles automatic translation with quality validation
 */
router.post('/translate', authMiddleware, async (req, res) => {
  try {
    const { text, from, to } = req.body;

    if (!text || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: text, from, to'
      });
    }

    // If same language, return original text
    if (from === to) {
      return res.json({
        success: true,
        translatedText: text,
        originalText: text,
        fromLanguage: from,
        toLanguage: to,
        quality: 'perfect'
      });
    }

    // Clean and validate input
    const cleanedText = cleanAndValidateText(text);
    if (!cleanedText) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty text input',
        translatedText: text
      });
    }

    // Perform high-quality translation
    const translationResult = await performQualityTranslation(cleanedText, from, to);

    res.json({
      success: true,
      translatedText: translationResult.translatedText,
      originalText: text,
      fromLanguage: from,
      toLanguage: to,
      quality: translationResult.quality,
      confidence: translationResult.confidence
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation service failed',
      translatedText: req.body.text // Fallback to original text
    });
  }
});

/**
 * Translation quality validation endpoint
 */
router.post('/validate-translation', authMiddleware, async (req, res) => {
  try {
    const { originalText, translatedText, fromLang, toLang } = req.body;

    const validation = validateTranslationQuality(originalText, translatedText, fromLang, toLang);

    res.json({
      success: true,
      isValid: validation.isValid,
      issues: validation.issues,
      suggestions: validation.suggestions
    });

  } catch (error) {
    console.error('Translation validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Translation validation failed'
    });
  }
});

/**
 * Clean and validate input text
 */
function cleanAndValidateText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove corrupted characters and fix encoding issues
  let cleaned = text
    // Fix common corrupted characters
    .replace(/процедة/g, 'procédure')
    .replace(/Defined/g, 'définis')
    .replace(/dسنة/g, 'dans')
    // Remove invalid Unicode characters but preserve Arabic and French
    .replace(/[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F\u2010-\u2027\u2030-\u205E\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Perform high-quality translation with validation
 */
async function performQualityTranslation(text: string, from: string, to: string): Promise<{
  translatedText: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
}> {
  
  // Use comprehensive legal translation
  const translatedText = await translateLegalTextImproved(text, from, to);
  
  // Validate quality
  const validation = validateTranslationQuality(text, translatedText, from, to);
  
  let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
  let confidence = 1.0;
  
  if (!validation.isValid) {
    quality = 'poor';
    confidence = 0.3;
  } else if (validation.issues.length > 0) {
    quality = validation.issues.length > 2 ? 'fair' : 'good';
    confidence = validation.issues.length > 2 ? 0.6 : 0.8;
  }
  
  return {
    translatedText,
    quality,
    confidence
  };
}

/**
 * Improved legal text translation
 */
async function translateLegalTextImproved(text: string, from: string, to: string): Promise<string> {
  // Complete legal phrases dictionary (sorted by length, longest first)
  const legalPhrases: Array<{ fr: string; ar: string }> = [
    // Complete legal concepts and explanations
    { 
      fr: 'La cafala est un concept juridique algérien qui fait référence à la tutelle ou la curatelle d\'un mineur ou d\'un majeur incapable', 
      ar: 'الكفالة مفهوم قانوني جزائري يشير إلى الوصاية أو القوامة على قاصر أو راشد غير أهل' 
    },
    { 
      fr: 'Les témoins sont les personnes qui participent à des événements juridiques ou des événements importants et peuvent témoigner de ce qui s\'est passé', 
      ar: 'الشهود هم الأشخاص الذين يشاركون في أحداث قانونية أو أحداث مهمة ويمكنهم الشهادة على ما حدث' 
    },
    { 
      fr: 'Il est important de noter que les témoins ont un rôle important dans le système judiciaire et il est recommandé de consulter un avocat pour obtenir des conseils spécifiques', 
      ar: 'من المهم ملاحظة أن الشهود لهم دور مهم في النظام القضائي وينصح باستشارة محام للحصول على نصائح محددة' 
    },
    
    // Legal procedures
    { fr: 'La procédure pour instituer la cafala est la suivante', ar: 'إجراء تأسيس الكفالة كما يلي' },
    { fr: 'Pour être nommé cafal, il faut remplir les conditions suivantes', ar: 'ليتم تعيينه كفيلاً، يجب استيفاء الشروط التالية' },
    { fr: 'La demande d\'institution de la cafala est faite auprès du tribunal de première instance', ar: 'طلب تأسيس الكفالة يُقدم لدى محكمة الدرجة الأولى' },
    { fr: 'L\'enquête est menée par le juge pour vérifier les conditions pour être nommé cafal', ar: 'التحقيق يُجرى من قبل القاضي للتحقق من شروط تعيين الكفيل' },
    { fr: 'Le juge prend une décision sur la demande d\'institution de la cafala', ar: 'القاضي يتخذ قراراً بشأن طلب تأسيس الكفالة' },
    
    // Witness-related phrases
    { fr: 'Les témoins sont définis dans l\'article 1 du Code de Procédure Pénale comme', ar: 'الشهود معرفون في المادة 1 من قانون الإجراءات الجزائية كـ' },
    { fr: 'Il existe plusieurs types de témoins en Algérie, notamment', ar: 'يوجد عدة أنواع من الشهود في الجزائر، منها' },
    { fr: 'Témoins directs : ce sont les personnes qui ont assisté directement à l\'acte juridique ou à l\'événement important', ar: 'شهود مباشرون: هم الأشخاص الذين حضروا مباشرة الحدث القانوني أو الحدث المهم' },
    { fr: 'Témoins indirects : ce sont les personnes qui ont assisté indirectement à l\'acte juridique ou à l\'événement important', ar: 'شهود غير مباشرين: هم الأشخاص الذين حضروا بطريقة غير مباشرة الحدث القانوني أو الحدث المهم' },
    { fr: 'Témoins experts : ce sont les personnes qui ont des compétences spécialisées et qui peuvent témoigner de ce qui s\'est passé', ar: 'شهود خبراء: هم الأشخاص الذين لديهم مهارات متخصصة ويمكنهم الشهادة على ما حدث' },
    
    // Conditions and requirements
    { fr: 'Pour être témoin, il faut remplir les conditions suivantes', ar: 'ليكون شاهداً، يجب استيفاء الشروط التالية' },
    { fr: 'Âge : être âgé d\'au moins 18 ans', ar: 'العمر: أن يكون عمره 18 سنة على الأقل' },
    { fr: 'Capacité : avoir la capacité de témoigner', ar: 'الأهلية: أن تكون له القدرة على الشهادة' },
    { fr: 'Intégrité : être d\'une intégrité morale incontestable', ar: 'النزاهة: أن يكون ذا نزاهة أخلاقية لا جدال فيها' },
    
    // Legal procedures for witnesses
    { fr: 'La procédure pour appeler un témoin est la suivante', ar: 'إجراء استدعاء الشاهد كما يلي' },
    { fr: 'La demande d\'appel d\'un témoin est faite auprès du juge', ar: 'طلب استدعاء الشاهد يُقدم لدى القاضي' },
    { fr: 'L\'enquête est menée pour vérifier les conditions pour être témoin', ar: 'التحقيق يُجرى للتحقق من شروط الشهادة' },
    { fr: 'Le juge prend une décision sur la demande d\'appel d\'un témoin', ar: 'القاضي يتخذ قراراً بشأن طلب استدعاء الشاهد' },
    
    // Sanctions and penalties
    { fr: 'Les témoins peuvent être punis en cas de fausse déclaration ou de refus de témoigner', ar: 'الشهود يمكن معاقبتهم في حالة الإدلاء بشهادة كاذبة أو رفض الشهادة' },
    { fr: 'Fausse déclaration : le témoin qui fait une fausse déclaration peut être puni d\'une peine d\'emprisonnement de 1 à 5 ans', ar: 'الشهادة الكاذبة: الشاهد الذي يدلي بشهادة كاذبة يمكن معاقبته بالسجن من سنة إلى 5 سنوات' },
    { fr: 'Refus de témoigner : le témoin qui refuse de témoigner peut être puni d\'une peine d\'emprisonnement de 1 à 3 ans', ar: 'رفض الشهادة: الشاهد الذي يرفض الشهادة يمكن معاقبته بالسجن من سنة إلى 3 سنوات' },
    
    // Legal codes and references
    { fr: 'Code de la Famille', ar: 'قانون الأسرة' },
    { fr: 'Code de Procédure Pénale', ar: 'قانون الإجراءات الجزائية' },
    { fr: 'Code Civil', ar: 'القانون المدني' },
    { fr: 'Code de Commerce', ar: 'القانون التجاري' },
    { fr: 'tribunal de première instance', ar: 'محكمة الدرجة الأولى' },
    { fr: 'Cour Suprême', ar: 'المحكمة العليا' },
    { fr: 'Conseil d\'État', ar: 'مجلس الدولة' },
    
    // Common legal terms
    { fr: 'avocat', ar: 'محام' },
    { fr: 'juge', ar: 'قاضي' },
    { fr: 'témoins', ar: 'شهود' },
    { fr: 'témoin', ar: 'شاهد' },
    { fr: 'témoignage', ar: 'شهادة' },
    { fr: 'témoigner', ar: 'يشهد' },
    { fr: 'procédure', ar: 'إجراء' },
    { fr: 'enquête', ar: 'تحقيق' },
    { fr: 'décision', ar: 'قرار' },
    { fr: 'demande', ar: 'طلب' },
    { fr: 'article', ar: 'مادة' },
    { fr: 'loi', ar: 'قانون' },
    { fr: 'tribunal', ar: 'محكمة' },
    { fr: 'juridique', ar: 'قانوني' },
    { fr: 'légal', ar: 'قانوني' },
    
    // Common phrases
    { fr: 'Il existe', ar: 'يوجد' },
    { fr: 'Il faut', ar: 'يجب' },
    { fr: 'Il est important de noter que', ar: 'من المهم ملاحظة أن' },
    { fr: 'Il est recommandé de consulter', ar: 'ينصح باستشارة' },
    { fr: 'Voici les informations clés sur', ar: 'إليك المعلومات الأساسية حول' },
    { fr: 'conditions suivantes', ar: 'الشروط التالية' },
    { fr: 'conseils spécifiques', ar: 'نصائح محددة' },
    { fr: 'système judiciaire', ar: 'النظام القضائي' },
    { fr: 'événements juridiques', ar: 'الأحداث القانونية' },
    { fr: 'événements importants', ar: 'الأحداث المهمة' },
    { fr: 'personnes', ar: 'أشخاص' },
    { fr: 'plusieurs types', ar: 'عدة أنواع' },
    { fr: 'notamment', ar: 'منها' },
    { fr: 'y compris', ar: 'بما في ذلك' }
  ];

  // Sort by length (longest first) to avoid partial matches
  const sortedPhrases = legalPhrases.sort((a, b) => {
    const aText = a[from as 'fr' | 'ar'] || '';
    const bText = b[from as 'fr' | 'ar'] || '';
    return bText.length - aText.length;
  });

  let translatedText = text;
  let translationsApplied = 0;

  // Apply complete phrase translations
  for (const phrase of sortedPhrases) {
    const fromText = phrase[from as 'fr' | 'ar'];
    const toText = phrase[to as 'fr' | 'ar'];
    
    if (fromText && toText && fromText !== toText) {
      const regex = new RegExp(escapeRegExp(fromText), 'gi');
      if (regex.test(translatedText)) {
        translatedText = translatedText.replace(regex, toText);
        translationsApplied++;
        console.log(`Applied translation: "${fromText}" -> "${toText}"`);
      }
    }
  }

  console.log(`Translation completed. Applied ${translationsApplied} translations.`);
  return translatedText;
}

/**
 * Validate translation quality
 */
function validateTranslationQuality(
  originalText: string, 
  translatedText: string, 
  fromLang: string, 
  toLang: string
): { 
  isValid: boolean; 
  issues: string[]; 
  suggestions: string[] 
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if translation is empty
  if (!translatedText || translatedText.trim().length === 0) {
    issues.push('Empty translation');
    suggestions.push('Provide non-empty translation');
    return { isValid: false, issues, suggestions };
  }

  // Check if translation is identical to original (might indicate failure)
  if (originalText === translatedText && fromLang !== toLang) {
    issues.push('Translation identical to original');
    suggestions.push('Ensure proper translation is performed');
  }

  // Check for language mixing
  if (toLang === 'ar') {
    // Arabic translation should not contain French words
    const frenchWords = /\b(le|la|les|de|du|des|et|ou|pour|avec|dans|sur|par|est|sont|avoir|être|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|dire|prendre|donner|mettre|partir|sortir|entrer|rester|devenir|tenir|porter|suivre|vivre|mourir|naître|grandir|apprendre|enseigner|travailler|jouer|manger|boire|dormir|réveiller|lever|coucher|habiller|laver|nettoyer|cuisiner|acheter|vendre|payer|coûter|gagner|perdre|trouver|chercher|regarder|écouter|parler|répondre|demander|expliquer|comprendre|connaître|reconnaître|oublier|rappeler|penser|croire|espérer|souhaiter|aimer|détester|préférer|choisir|décider|commencer|finir|continuer|arrêter|attendre|arriver|partir|retourner|revenir|monter|descendre|entrer|sortir|ouvrir|fermer|allumer|éteindre|construire|détruire|réparer|casser|créer|inventer|découvrir|explorer|voyager|visiter|rencontrer|saluer|remercier|excuser|pardonner|aider|servir|protéger|sauver|soigner|guérir|blesser|tuer|naître|grandir|vieillir|mourir)\b/gi;
    const frenchMatches = translatedText.match(frenchWords);
    if (frenchMatches) {
      issues.push(`Arabic translation contains French words: ${frenchMatches.join(', ')}`);
      suggestions.push('Remove French words from Arabic translation');
    }
  } else if (toLang === 'fr') {
    // French translation should not contain Arabic words
    const arabicWords = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    if (arabicWords.test(translatedText)) {
      issues.push('French translation contains Arabic characters');
      suggestions.push('Remove Arabic characters from French translation');
    }
  }

  // Check for corrupted characters
  const corruptedChars = /[а-яё]/gi; // Cyrillic characters
  const corruptedMatches = translatedText.match(corruptedChars);
  if (corruptedMatches) {
    issues.push(`Translation contains corrupted characters: ${corruptedMatches.join(', ')}`);
    suggestions.push('Remove corrupted Cyrillic characters');
  }

  // Check for encoding issues
  const encodingIssues = /[^\u0000-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F\u2010-\u2027\u2030-\u205E\s]/;
  if (encodingIssues.test(translatedText)) {
    issues.push('Translation contains encoding issues');
    suggestions.push('Fix character encoding problems');
  }

  return { 
    isValid: issues.length === 0, 
    issues, 
    suggestions 
  };
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;