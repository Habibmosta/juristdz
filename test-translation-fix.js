// Test de la correction de traduction
console.log('🔧 Test de la correction de traduction');

// Simuler le contenu dupliqué rapporté par l'utilisateur
const duplicatedContent = `محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونيةلوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائقإجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمنجميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.بحث قانونيخبرة في القانون الجزائريترجمة الرسائلعرض السجلنسخ رابطأنتمترجمالحقوق في الجزائرتريد معرفة الحقوق التي تتمتع بها في الجزائر. إليك بعض المعلومات العامة:الحقوق الأساسية: • الحق في الحياة والحرية والأمان (المادة 24 من الدستور) • الحق في المساواة (المادة 29 من الدستور) • الحق في حرية التعبير (المادة 32 من الدستور) • الحق في حرية التجمع والتنظيم (المادة 34 من الدستور) • الحق في حرية الضمير والدين (المادة 36 من الدستور)الحقوق المدنية: • الحق في الملكية (المادة 34 من القانون المدني) • الحق في حرية التعاقد (المادة 1107 من القانون المدني) • الحق في حماية الحياة الخاصة (المادة 19 من القانون المدني) • الحق في حماية الممتلكات (المادة 123 من القانون المدني)الحقوق الجنائية: • الحق في البراءة (المادة 14 من القانون الجنائي) • الحق في الدفاع (المادة 17 من القانون الجنائي) • الحق في الحرية الشخصية (المادة 20 من القانون الجنائي) • الحق في الحماية من أعمال العنف (المادة 96 من القانون الجنائي)حقوق الأسرة: • الحق في الأسرة (المادة 39 من قانون الأسرة) • الحق في تعليم الأطفال (المادة 43 من قانون الأسرة) • الحق في حماية الأمومة (المادة 51 من قانون الأسرة) • الحق في حماية الأبوة (المادة 53 من قانون الأسرة)هذه الحقوق مذكورة بشكل غير شامل. من المهم الرجوع إلى النصوص التشريعية والتنظيمية للحصول على معلومات أكثر دقة وتفصيلاً.JuristDZمترجمالحقوق في الجزائرتريد معرفة الحقوق التي تتمتع بها في الجزائر. إليك بعض المعلومات العامة:الحقوق الأساسية: • الحق في الحياة والحرية والأمان (المادة 24 من الدستور) • الحق في المساواة (المادة 29 من الدستور) • الحق في حرية التعبير (المادة 32 من الدستور) • الحق في حرية التجمع والتنظيم (المادة 34 من الدستور) • الحق في حرية الضمير والدين (المادة 36 من الدستور)الحقوق المدنية: • الحق في الملكية (المادة 34 من القانون المدني) • الحق في حرية التعاقد (المادة 1107 من القانون المدني) • الحق في حماية الحياة الخاصة (المادة 19 من القانون المدني) • الحق في حماية الممتلكات (المادة 123 من القانون المدني)الحقوق الجنائية: • الحق في البراءة (المادة 14 من القانون الجنائي) • الحق في الدفاع (المادة 17 من القانون الجنائي) • الحق في الحرية الشخصية (المادة 20 من القانون الجنائي) • الحق في الحماية من أعمال العنف (المادة 96 من القانون الجنائي)حقوق الأسرة: • الحق في الأسرة (المادة 39 من قانون الأسرة) • الحق في تعليم الأطفال (المادة 43 من قانون الأسرة) • الحق في حماية الأمومة (المادة 51 من قانون الأسرة) • الحق في حماية الأبوة (المادة 53 من قانون الأسرة)هذه الحقوق مذكورة بشكل غير شامل. من المهم الرجوع إلى النصوص التشريعية والتنظيمية للحصول على معلومات أكثر دقة وتفصيلاً.إرسال`;

// Fonction de nettoyage (copiée de ImprovedChatInterface.tsx)
function cleanUIContent(text) {
    if (!text || typeof text !== 'string') return text;
    
    // NETTOYAGE ULTRA AGRESSIF - Supprimer tout le contenu de l'interface utilisateur
    let cleaned = text;
    
    // ÉTAPE 1: Supprimer les patterns exacts du rapport utilisateur
    const exactUIPatterns = [
      // Interface utilisateur en arabe - patterns exacts
      'محامي دي زادمتصلمحاميمكتب المحاماةمكتب المحاماةنظام إدارة قانونية',
      'لوحة التحكمبحث قانونيتحريرProتحليلملفاتV2وثائق',
      'إجراءات سريعة+ ملف جديد+ بحث سريعarوضع آمن',
      'جميع البيانات محمية ومشفرة. تحقق دائماً من الجريدة الرسمية.',
      'بحث قانونيخبرة في القانون الجزائريترجمة الرسائل',
      'عرض السجلنسخ رابطأنتمترجم',
      
      // Éléments individuels problématiques
      'محامي دي زاد',
      'متصلمحامي',
      'مكتب المحاماة',
      'نظام إدارة قانونية',
      'لوحة التحكم',
      'بحث قانوني',
      'تحريرPro',
      'تحليلملفات',
      'ملفاتV2',
      'وثائقإجراءات سريعة',
      '+ ملف جديد',
      '+ بحث سريع',
      'arوضع آمن',
      'خبرة في القانون الجزائري',
      'ترجمة الرسائل',
      'عرض السجل',
      'نسخ رابط',
      'أنتمترجم',
      
      // Artifacts techniques
      'JuristDZ',
      'AUTO-TRANSLATE',
      'Defined',
      'процедة'
    ];
    
    // Supprimer tous les patterns exacts
    exactUIPatterns.forEach(pattern => {
      cleaned = cleaned.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    });
    
    // ÉTAPE 2: Patterns regex pour les mélanges de langues
    const mixedPatterns = [
      // Mélange arabe-latin
      /[أ-ي]+[A-Za-z]+[أ-ي]*/g,
      /[A-Za-z]+[أ-ي]+[A-Za-z]*/g,
      
      // Patterns spécifiques de contamination
      /Pro(?=[أ-ي])/g,
      /V2(?=[أ-ي])/g,
      /ar(?=[أ-ي])/g,
      
      // Suppression des doublons de mots
      /(\b\w+\b)(\s+\1\b)+/g, // Supprime les répétitions de mots
      
      // Nettoyage des espaces et caractères
      /\s{2,}/g, // Espaces multiples
      /[\r\n\t]+/g, // Sauts de ligne et tabulations
      /[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u200C-\u200F.,!?;:()\-]/g // Caractères non désirés
    ];
    
    mixedPatterns.forEach(pattern => {
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
    
    // ÉTAPE 3: Nettoyage final
    cleaned = cleaned.trim();
    
    // ÉTAPE 4: Vérification de qualité - si le texte est trop contaminé, le rejeter
    const arabicChars = (cleaned.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = cleaned.replace(/\s/g, '').length;
    
    if (totalChars > 0) {
      const arabicRatio = arabicChars / totalChars;
      const latinRatio = latinChars / totalChars;
      
      // Si le texte est trop mélangé (plus de 30% de l'autre langue), le rejeter
      if (arabicRatio > 0.1 && latinRatio > 0.1 && Math.abs(arabicRatio - latinRatio) < 0.6) {
        console.log(`🧹 Texte rejeté - trop mélangé: Arabic ${Math.round(arabicRatio * 100)}%, Latin ${Math.round(latinRatio * 100)}%`);
        return '';
      }
    }
    
    console.log(`🧹 Nettoyage: "${text.substring(0, 50)}..." -> "${cleaned.substring(0, 50)}..."`);
    return cleaned;
}

console.log('🔧 Contenu original (longueur):', duplicatedContent.length);
console.log('🔧 Contenu original (aperçu):', duplicatedContent.substring(0, 200) + '...');

const cleanedContent = cleanUIContent(duplicatedContent);

console.log('🔧 Contenu nettoyé (longueur):', cleanedContent.length);
console.log('🔧 Contenu nettoyé (aperçu):', cleanedContent.substring(0, 200) + '...');

// Test de détection de doublons
const messages = [
  { sender: 'bot', text: duplicatedContent },
  { sender: 'bot', text: duplicatedContent }, // Doublon exact
  { sender: 'user', text: 'Question sur le droit de la famille' },
  { sender: 'bot', text: 'Réponse sur le droit de la famille' }
];

console.log('🔧 Messages avant dédoublonnage:', messages.length);

// Simulation du dédoublonnage
const uniqueMessages = [];
const seenMessages = new Set();
const seenContent = new Set();

messages.forEach(message => {
  const cleanedText = cleanUIContent(message.text);
  
  if (!cleanedText || cleanedText.length < 10) {
    console.log(`🧹 Message ignoré (contenu UI): "${message.text.substring(0, 50)}..."`);
    return;
  }
  
  const messageKey = `${message.sender}-${cleanedText.trim().substring(0, 200)}`;
  const contentHash = `${message.sender}-${cleanedText.trim()}`;
  
  if (!seenMessages.has(messageKey) && !seenContent.has(contentHash)) {
    seenMessages.add(messageKey);
    seenContent.add(contentHash);
    uniqueMessages.push({
      ...message,
      text: cleanedText
    });
  } else {
    console.log(`🧹 Message dupliqué ignoré: "${cleanedText.substring(0, 50)}..."`);
  }
});

console.log('🔧 Messages après dédoublonnage:', uniqueMessages.length);
uniqueMessages.forEach((msg, index) => {
  console.log(`🔧 Message ${index + 1} (${msg.sender}): "${msg.text.substring(0, 100)}..."`);
});

console.log('🔧 ✅ Test terminé');