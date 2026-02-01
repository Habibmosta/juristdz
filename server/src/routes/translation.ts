import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Translation API endpoint
 * Handles automatic translation of text content
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
        toLanguage: to
      });
    }

    // For demo purposes, we'll use a comprehensive legal translation mapping
    const translatedText = await translateLegalText(text, from, to);

    res.json({
      success: true,
      translatedText,
      originalText: text,
      fromLanguage: from,
      toLanguage: to
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
 * Comprehensive legal text translation
 */
async function translateLegalText(text: string, from: string, to: string): Promise<string> {
  // Comprehensive legal terms dictionary
  const legalDictionary: { [key: string]: { fr: string; ar: string } } = {
    // Basic legal terms
    'divorce': { fr: 'divorce', ar: 'طلاق' },
    'mariage': { fr: 'mariage', ar: 'زواج' },
    'contrat': { fr: 'contrat', ar: 'عقد' },
    'tribunal': { fr: 'tribunal', ar: 'محكمة' },
    'avocat': { fr: 'avocat', ar: 'محامي' },
    'juge': { fr: 'juge', ar: 'قاضي' },
    'loi': { fr: 'loi', ar: 'قانون' },
    'article': { fr: 'article', ar: 'مادة' },
    'procédure': { fr: 'procédure', ar: 'إجراء' },
    'jugement': { fr: 'jugement', ar: 'حكم' },
    
    // Legal codes
    'code civil': { fr: 'Code Civil', ar: 'القانون المدني' },
    'code pénal': { fr: 'Code Pénal', ar: 'قانون العقوبات' },
    'code de la famille': { fr: 'Code de la Famille', ar: 'قانون الأسرة' },
    'code de commerce': { fr: 'Code de Commerce', ar: 'القانون التجاري' },
    'code de procédure civile': { fr: 'Code de Procédure Civile', ar: 'قانون الإجراءات المدنية' },
    'code de procédure pénale': { fr: 'Code de Procédure Pénale', ar: 'قانون الإجراءات الجزائية' },
    
    // Family law terms
    'khol': { fr: 'khol', ar: 'خلع' },
    'mubarat': { fr: 'mubarat', ar: 'مبارات' },
    'talaq': { fr: 'talaq', ar: 'طلاق' },
    'nafaqah': { fr: 'pension alimentaire', ar: 'نفقة' },
    'hadanah': { fr: 'garde des enfants', ar: 'حضانة' },
    'mahr': { fr: 'dot', ar: 'مهر' },
    'iddah': { fr: 'délai de viduité', ar: 'عدة' },
    'wilayah': { fr: 'tutelle', ar: 'ولاية' },
    'wasayah': { fr: 'testament', ar: 'وصية' },
    'mirath': { fr: 'héritage', ar: 'ميراث' },
    
    // Civil law terms
    'propriété': { fr: 'propriété', ar: 'ملكية' },
    'usufruit': { fr: 'usufruit', ar: 'حق الانتفاع' },
    'hypothèque': { fr: 'hypothèque', ar: 'رهن' },
    'servitude': { fr: 'servitude', ar: 'ارتفاق' },
    'prescription': { fr: 'prescription', ar: 'تقادم' },
    'responsabilité civile': { fr: 'responsabilité civile', ar: 'المسؤولية المدنية' },
    'dommages-intérêts': { fr: 'dommages-intérêts', ar: 'تعويضات' },
    'force majeure': { fr: 'force majeure', ar: 'القوة القاهرة' },
    
    // Criminal law terms
    'crime': { fr: 'crime', ar: 'جناية' },
    'délit': { fr: 'délit', ar: 'جنحة' },
    'contravention': { fr: 'contravention', ar: 'مخالفة' },
    'préméditation': { fr: 'préméditation', ar: 'سبق الإصرار' },
    'légitime défense': { fr: 'légitime défense', ar: 'الدفاع الشرعي' },
    'circonstances atténuantes': { fr: 'circonstances atténuantes', ar: 'ظروف مخففة' },
    'récidive': { fr: 'récidive', ar: 'عود' },
    'amnistie': { fr: 'amnistie', ar: 'عفو' },
    
    // Commercial law terms
    'société': { fr: 'société', ar: 'شركة' },
    'sarl': { fr: 'SARL', ar: 'ش.ذ.م.م' },
    'spa': { fr: 'SPA', ar: 'ش.م.أ' },
    'fonds de commerce': { fr: 'fonds de commerce', ar: 'المحل التجاري' },
    'brevet': { fr: 'brevet', ar: 'براءة اختراع' },
    'marque': { fr: 'marque', ar: 'علامة تجارية' },
    'faillite': { fr: 'faillite', ar: 'إفلاس' },
    'liquidation': { fr: 'liquidation', ar: 'تصفية' },
    
    // Procedural terms
    'assignation': { fr: 'assignation', ar: 'تكليف بالحضور' },
    'citation': { fr: 'citation', ar: 'استدعاء' },
    'exploit': { fr: 'exploit', ar: 'ورقة تبليغ' },
    'signification': { fr: 'signification', ar: 'تبليغ' },
    'exécution': { fr: 'exécution', ar: 'تنفيذ' },
    'saisie': { fr: 'saisie', ar: 'حجز' },
    'opposition': { fr: 'opposition', ar: 'معارضة' },
    'appel': { fr: 'appel', ar: 'استئناف' },
    'cassation': { fr: 'cassation', ar: 'نقض' },
    'pourvoi': { fr: 'pourvoi', ar: 'طعن' },
    
    // Court system
    'cour suprême': { fr: 'Cour Suprême', ar: 'المحكمة العليا' },
    'conseil d\'état': { fr: 'Conseil d\'État', ar: 'مجلس الدولة' },
    'cour d\'appel': { fr: 'Cour d\'Appel', ar: 'مجلس قضاء' },
    'tribunal de première instance': { fr: 'Tribunal de Première Instance', ar: 'محكمة أول درجة' },
    'tribunal administratif': { fr: 'Tribunal Administratif', ar: 'المحكمة الإدارية' },
    'tribunal de commerce': { fr: 'Tribunal de Commerce', ar: 'المحكمة التجارية' },
    'tribunal du travail': { fr: 'Tribunal du Travail', ar: 'محكمة العمل' },
    
    // Common phrases
    'selon la loi': { fr: 'selon la loi', ar: 'وفقاً للقانون' },
    'en vertu de': { fr: 'en vertu de', ar: 'بموجب' },
    'conformément à': { fr: 'conformément à', ar: 'طبقاً لـ' },
    'par conséquent': { fr: 'par conséquent', ar: 'وبالتالي' },
    'il s\'ensuit que': { fr: 'il s\'ensuit que', ar: 'يترتب على ذلك أن' },
    'attendu que': { fr: 'attendu que', ar: 'حيث أن' },
    'considérant que': { fr: 'considérant que', ar: 'اعتباراً أن' },
    'par ces motifs': { fr: 'par ces motifs', ar: 'لهذه الأسباب' },
    'le tribunal décide': { fr: 'le tribunal décide', ar: 'تقرر المحكمة' },
    'il est ordonné': { fr: 'il est ordonné', ar: 'يُؤمر' }
  };

  let translatedText = text;

  // Apply translations
  Object.entries(legalDictionary).forEach(([key, translations]) => {
    const fromText = translations[from as 'fr' | 'ar'];
    const toText = translations[to as 'fr' | 'ar'];
    
    if (fromText && toText && fromText !== toText) {
      // Case-insensitive replacement
      const regex = new RegExp(escapeRegExp(fromText), 'gi');
      translatedText = translatedText.replace(regex, toText);
    }
  });

  // Handle common sentence structures
  if (from === 'fr' && to === 'ar') {
    translatedText = translateFrenchToArabicStructure(translatedText);
  } else if (from === 'ar' && to === 'fr') {
    translatedText = translateArabicToFrenchStructure(translatedText);
  }

  return translatedText;
}

/**
 * Translate French sentence structures to Arabic
 */
function translateFrenchToArabicStructure(text: string): string {
  // Common French to Arabic structural translations
  const structuralTranslations = [
    { fr: /La cafala est/gi, ar: 'الكفالة هي' },
    { fr: /Il existe/gi, ar: 'يوجد' },
    { fr: /Il faut/gi, ar: 'يجب' },
    { fr: /Il est important de noter que/gi, ar: 'من المهم ملاحظة أن' },
    { fr: /Voici les informations clés/gi, ar: 'إليك المعلومات الأساسية' },
    { fr: /Les conditions suivantes/gi, ar: 'الشروط التالية' },
    { fr: /La procédure est la suivante/gi, ar: 'الإجراء كما يلي' },
    { fr: /Il est recommandé de/gi, ar: 'يُنصح بـ' },
    { fr: /Pour être nommé/gi, ar: 'ليتم تعيينه' },
    { fr: /Âge : être âgé d'au moins/gi, ar: 'العمر: أن يكون عمره على الأقل' },
    { fr: /Capacité : avoir la capacité/gi, ar: 'الأهلية: أن تكون له القدرة' },
    { fr: /Intégrité : être d'une intégrité/gi, ar: 'النزاهة: أن يكون ذا نزاهة' }
  ];

  let result = text;
  structuralTranslations.forEach(({ fr, ar }) => {
    result = result.replace(fr, ar);
  });

  return result;
}

/**
 * Translate Arabic sentence structures to French
 */
function translateArabicToFrenchStructure(text: string): string {
  // Common Arabic to French structural translations
  const structuralTranslations = [
    { ar: /الكفالة هي/gi, fr: 'La cafala est' },
    { ar: /يوجد/gi, fr: 'Il existe' },
    { ar: /يجب/gi, fr: 'Il faut' },
    { ar: /من المهم ملاحظة أن/gi, fr: 'Il est important de noter que' },
    { ar: /إليك المعلومات الأساسية/gi, fr: 'Voici les informations clés' },
    { ar: /الشروط التالية/gi, fr: 'les conditions suivantes' },
    { ar: /الإجراء كما يلي/gi, fr: 'la procédure est la suivante' },
    { ar: /يُنصح بـ/gi, fr: 'il est recommandé de' },
    { ar: /ليتم تعيينه/gi, fr: 'pour être nommé' },
    { ar: /العمر: أن يكون عمره على الأقل/gi, fr: 'Âge : être âgé d\'au moins' },
    { ar: /الأهلية: أن تكون له القدرة/gi, fr: 'Capacité : avoir la capacité' },
    { ar: /النزاهة: أن يكون ذا نزاهة/gi, fr: 'Intégrité : être d\'une intégrité' }
  ];

  let result = text;
  structuralTranslations.forEach(({ ar, fr }) => {
    result = result.replace(ar, fr);
  });

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;