/**
 * Test pour vérifier que la traduction nettoyée fonctionne sans instructions parasites
 */

const testCleanTranslation = () => {
  console.log('🧹 TEST NETTOYAGE TRADUCTION - Début');
  
  // Simuler une réponse de Gemini avec des instructions parasites
  const contaminatedResponse = `ترجمرÈGLES IMPORTANTES:
- Traduis UNIQUEMENT le contenu, ne pas ajouter d'explications
- Garde la même structure et formatage
- Traduis tous les termes juridiques de manière précise
- Ne mélange JAMAIS les deux langues dans la réponse
- Réponds UNIQUEMENT avec la traduction, rien d'autre

السجل التجاري هو وثيقة رسمية تحتوي على المعلومات المتعلقة بالشركات المسجلة في السجل التجاري.

في الجزائر، يتم إدارة السجل التجاري من قبل المكتب الوطني للتجارة (ONC).

التسجيل في السجل التجاري:
* التسجيل في السجل التجاري إلزامي لجميع الشركات التي تمارس نشاطاً تجارياً (المادة 1 من المرسوم رقم 97-309 المؤرخ في 7 أغسطس 1997).`;

  console.log('📝 Réponse contaminée:');
  console.log(contaminatedResponse.substring(0, 200) + '...');
  
  // Appliquer le nettoyage
  let cleanedText = contaminatedResponse.trim();
  
  const instructionPatterns = [
    /RÈGLES IMPORTANTES:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Traduis UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Garde la même structure.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Traduis tous les termes.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Ne mélange JAMAIS.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Réponds UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /TEXTE À TRADUIRE:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /^ترجمر.*?(?=\n|$)/gm,
    /^Traduis.*?(?=\n|$)/gm,
    /^RÈGLES.*?(?=\n|$)/gm
  ];
  
  instructionPatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Nettoyer les espaces multiples et les sauts de ligne excessifs
  cleanedText = cleanedText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  console.log('✅ Traduction nettoyée:');
  console.log(cleanedText);
  
  // Vérifier que les instructions ont été supprimées
  const hasInstructions = cleanedText.includes('RÈGLES IMPORTANTES') || 
                         cleanedText.includes('Traduis UNIQUEMENT') ||
                         cleanedText.includes('ترجمر');
  
  if (hasInstructions) {
    console.error('❌ ÉCHEC: Instructions encore présentes!');
    return false;
  }
  
  // Vérifier que le contenu utile est préservé
  const hasContent = cleanedText.includes('السجل التجاري') && 
                    cleanedText.includes('المكتب الوطني للتجارة');
  
  if (!hasContent) {
    console.error('❌ ÉCHEC: Contenu utile supprimé!');
    return false;
  }
  
  console.log('✅ SUCCÈS: Traduction propre et complète!');
  return true;
};

// Exécuter le test
const success = testCleanTranslation();
if (success) {
  console.log('🎉 TEST RÉUSSI: Le nettoyage de traduction fonctionne correctement');
} else {
  console.log('💥 TEST ÉCHOUÉ: Problème avec le nettoyage');
}