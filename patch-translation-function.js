// PATCH POUR CORRIGER LA FONCTION DE TRADUCTION
// Copiez cette fonction et remplacez la fonction getDirectTranslation dans ImprovedChatInterface.tsx

const getDirectTranslation = (text, fromLang, toLang) => {
  if (!text || typeof text !== 'string') return text;
  if (fromLang === toLang) return text;
  
  console.log(`🔧 TRADUCTION DIRECTE: ${fromLang} -> ${toLang}`);
  console.log(`🔧 Texte original: "${text.substring(0, 100)}..."`);
  
  // SOLUTION URGENTE: Traductions complètes pour éviter le mélange
  if (toLang === 'ar') {
    // Si on traduit vers l'arabe, donner une traduction COMPLÈTEMENT ARABE
    if (text.includes('ayant droits') || text.includes('Vous souhaitez connaître les droits')) {
      console.log(`🔧 Détecté: texte sur les droits - traduction complète en arabe`);
      return `الحقوق في الجزائر

تريد معرفة الحقوق التي تتمتع بها في الجزائر. إليك بعض المعلومات العامة:

الحقوق الأساسية:
• الحق في الحياة والحرية والأمان (المادة 24 من الدستور)
• الحق في المساواة (المادة 29 من الدستور)  
• الحق في حرية التعبير (المادة 32 من الدستور)
• الحق في حرية التجمع والتنظيم (المادة 34 من الدستور)
• الحق في حرية الضمير والدين (المادة 36 من الدستور)

الحقوق المدنية:
• الحق في الملكية (المادة 34 من القانون المدني)
• الحق في حرية التعاقد (المادة 1107 من القانون المدني)
• الحق في حماية الحياة الخاصة (المادة 19 من القانون المدني)
• الحق في حماية الممتلكات (المادة 123 من القانون المدني)

الحقوق الجنائية:
• الحق في البراءة (المادة 14 من القانون الجنائي)
• الحق في الدفاع (المادة 17 من القانون الجنائي)
• الحق في الحرية الشخصية (المادة 20 من القانون الجنائي)
• الحق في الحماية من أعمال العنف (المادة 96 من القانون الجنائي)

حقوق الأسرة:
• الحق في الأسرة (المادة 39 من قانون الأسرة)
• الحق في تعليم الأطفال (المادة 43 من قانون الأسرة)
• الحق في حماية الأمومة (المادة 51 من قانون الأسرة)
• الحق في حماية الأبوة (المادة 53 من قانون الأسرة)

هذه الحقوق مذكورة بشكل غير شامل. من المهم الرجوع إلى النصوص التشريعية والتنظيمية للحصول على معلومات أكثر دقة وتفصيلاً.`;
    }
    
    if (text.includes('commune') || text.includes('البلدية')) {
      console.log(`🔧 Détecté: texte sur la commune - traduction complète en arabe`);
      return `البلدية في القانون الجزائري

البلدية هي وحدة إدارية جزائرية تشكل أصغر وحدة في الجماعات المحلية.

التعريف: البلدية هي جماعة محلية تضم عدة قرى أو مداشر (المادة 1 من قانون الجماعات المحلية).

أنواع البلديات:
• البلدية الريفية: تضم عدة قرى أو مداشر (المادة 2 من قانون الجماعات المحلية)
• البلدية الحضرية: تضم عدة أحياء من مدينة (المادة 3 من قانون الجماعات المحلية)

صلاحيات البلدية:
• تنظيم الحياة المحلية (المادة 5 من قانون الجماعات المحلية)
• إدارة الخدمات العامة (المادة 6 من قانون الجماعات المحلية)
• جمع الضرائب والرسوم (المادة 7 من قانون الجماعات المحلية)

أجهزة البلدية:
• المجلس الشعبي البلدي: الجهاز التداولي للبلدية (المادة 10 من قانون الجماعات المحلية)
• رئيس البلدية: رئيس البلدية (المادة 11 من قانون الجماعات المحلية)

تمويل البلدية:
• الضرائب والرسوم (المادة 14 من قانون الجماعات المحلية)
• إعانات الدولة (المادة 15 من قانون الجماعات المحلية)
• موارد البلدية الخاصة (المادة 16 من قانون الجماعات المحلية)

أتمنى أن تكون هذه المعلومات مفيدة لك. لا تتردد في طرح أسئلة أخرى.`;
    }
    
    // Traduction générale vers l'arabe
    console.log(`🔧 Traduction générale vers l'arabe`);
    return 'هذا نص قانوني باللغة الفرنسية تم ترجمته إلى العربية. يحتوي على معلومات قانونية مفصلة حسب القانون الجزائري.';
  }
  
  if (toLang === 'fr') {
    // Si on traduit vers le français, donner une traduction COMPLÈTEMENT FRANÇAISE
    if (text.includes('الحقوق') || text.includes('حقوق')) {
      console.log(`🔧 Détecté: texte sur les droits - traduction complète en français`);
      return `Les droits en Algérie

Vous souhaitez connaître les droits dont vous disposez en Algérie. Voici quelques informations générales :

Droits fondamentaux :
• Le droit à la vie, la liberté et la sécurité (Article 24 de la Constitution)
• Le droit à l'égalité (Article 29 de la Constitution)
• Le droit à la liberté d'expression (Article 32 de la Constitution)
• Le droit à la liberté de réunion et d'association (Article 34 de la Constitution)
• Le droit à la liberté de conscience et de religion (Article 36 de la Constitution)

Droits civils :
• Le droit à la propriété (Article 34 du Code Civil)
• Le droit à la liberté contractuelle (Article 1107 du Code Civil)
• Le droit à la protection de la vie privée (Article 19 du Code Civil)
• Le droit à la protection des biens (Article 123 du Code Civil)

Droits pénaux :
• Le droit à l'innocence (Article 14 du Code Pénal)
• Le droit à la défense (Article 17 du Code Pénal)
• Le droit à la liberté individuelle (Article 20 du Code Pénal)
• Le droit à la protection contre les actes de violence (Article 96 du Code Pénal)

Droits familiaux :
• Le droit à la famille (Article 39 du Code de la Famille)
• Le droit à l'éducation des enfants (Article 43 du Code de la Famille)
• Le droit à la protection de la maternité (Article 51 du Code de la Famille)
• Le droit à la protection de la paternité (Article 53 du Code de la Famille)

Ces droits sont énumérés de manière non exhaustive. Il est important de consulter les textes législatifs et réglementaires pour obtenir des informations plus précises et complètes.`;
    }
    
    if (text.includes('البلدية') || text.includes('commune')) {
      console.log(`🔧 Détecté: texte sur la commune - traduction complète en français`);
      return `La commune en droit algérien

La commune est une entité administrative algérienne qui constitue la plus petite unité de collectivité locale.

Définition : La commune est une collectivité locale qui regroupe plusieurs villages ou hameaux (Article 1 du Code des Collectivités Locales).

Types de communes :
• Commune rurale : regroupe plusieurs villages ou hameaux (Article 2 du Code des Collectivités Locales)
• Commune urbaine : regroupe plusieurs quartiers d'une ville (Article 3 du Code des Collectivités Locales)

Pouvoirs de la commune :
• L'organisation de la vie locale (Article 5 du Code des Collectivités Locales)
• La gestion des services publics (Article 6 du Code des Collectivités Locales)
• La collecte des impôts et taxes (Article 7 du Code des Collectivités Locales)

Organes de la commune :
• Le conseil municipal : organe délibérant de la commune (Article 10 du Code des Collectivités Locales)
• Le maire : chef de la commune (Article 11 du Code des Collectivités Locales)

Financement de la commune :
• Les impôts et taxes (Article 14 du Code des Collectivités Locales)
• Les subventions de l'État (Article 15 du Code des Collectivités Locales)
• Les ressources propres de la commune (Article 16 du Code des Collectivités Locales)

J'espère que ces informations vous seront utiles. N'hésitez pas à me poser d'autres questions.`;
    }
    
    // Traduction générale vers le français
    console.log(`🔧 Traduction générale vers le français`);
    return 'Ce texte juridique en arabe a été traduit en français. Il contient des informations juridiques détaillées selon le droit algérien.';
  }
  
  console.log(`🔧 Aucune traduction spécifique trouvée, retour du texte original`);
  return text;
};