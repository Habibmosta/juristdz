/**
 * Test pour vérifier que le nettoyage fonctionne aussi pour les traductions français
 */

const testFrenchCleanup = () => {
  console.log('🧹 TEST NETTOYAGE FRANÇAIS - Début');
  
  // Simuler une réponse de Gemini avec du texte parasite français
  const contaminatedFrenchResponse = `Voici la traduction du texte : Bien sûr. Le Code de la Famille algérien est une partie du Code Civil algérien. Certaines des principes fondamentaux du Code de la Famille algérien comprennent :

Le mariage
* Le mariage est considéré comme un contrat juridique entre les époux (Article 1 du Code de la Famille).
* Les époux sont l'époux et l'épouse (Article 2 du Code de la Famille).

Le divorce
* Le divorce est considéré comme une solution aux conflits conjugaux (Article 50 du Code de la Famille).
* Le divorce est divisé en divorce total et divorce partiel (Article 51 du Code de la Famille).

La naissance
* La naissance est l'état dans lequel un individu est considéré comme né (Article 62 du Code de la Famille).
* La naissance est considérée du point de vue du sexe (Article 63 du Code de la Famille).

Voici quelques-uns des principes fondamentaux du Code de la Famille algérien. Si vous avez besoin de plus d'informations, il est préférable de vérifier le Code de la Famille algérien ou d'autres sources juridiques.`;

  console.log('📝 Réponse française contaminée:');
  console.log(contaminatedFrenchResponse.substring(0, 150) + '...');
  
  // Appliquer le nettoyage amélioré
  let cleanedText = contaminatedFrenchResponse.trim();
  
  const instructionPatterns = [
    // Instructions en français
    /RÈGLES IMPORTANTES:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Traduis UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Garde la même structure.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Traduis tous les termes.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Ne mélange JAMAIS.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /- Réponds UNIQUEMENT.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    /TEXTE À TRADUIRE:.*?(?=\n\n|\n[A-Za-zأ-ي]|$)/gs,
    
    // Préfixes parasites français
    /^Voici la traduction du texte\s*:\s*/gm,
    /^Voici la traduction\s*:\s*/gm,
    /^Traduction\s*:\s*/gm,
    /^La traduction est\s*:\s*/gm,
    /^Bien sûr\.\s*/gm,
    /^Certainement\.\s*/gm,
    
    // Préfixes parasites arabes
    /^ترجمر.*?(?=\n|$)/gm,
    /^إليك الترجمة\s*:\s*/gm,
    /^الترجمة هي\s*:\s*/gm,
    /^بالطبع\.\s*/gm,
    
    // Instructions génériques
    /^Traduis.*?(?=\n|$)/gm,
    /^RÈGLES.*?(?=\n|$)/gm,
    
    // Nettoyage des phrases d'introduction
    /^(Voici|Here is|إليك|هنا).*?traduction.*?:\s*/gmi
  ];
  
  instructionPatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Nettoyer les espaces multiples et les sauts de ligne excessifs
  cleanedText = cleanedText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  console.log('✅ Traduction française nettoyée:');
  console.log(cleanedText);
  
  // Vérifier que les préfixes parasites ont été supprimés
  const hasParasites = cleanedText.includes('Voici la traduction du texte') || 
                      cleanedText.includes('Bien sûr.') ||
                      cleanedText.startsWith('Voici la traduction');
  
  if (hasParasites) {
    console.error('❌ ÉCHEC: Préfixes parasites encore présents!');
    return false;
  }
  
  // Vérifier que le contenu utile est préservé
  const hasContent = cleanedText.includes('Code de la Famille algérien') && 
                    cleanedText.includes('Le mariage') &&
                    cleanedText.includes('Le divorce');
  
  if (!hasContent) {
    console.error('❌ ÉCHEC: Contenu utile supprimé!');
    return false;
  }
  
  // Vérifier que ça commence directement par le contenu
  const startsClean = cleanedText.startsWith('Le Code de la Famille algérien') ||
                     cleanedText.startsWith('Code de la Famille algérien');
  
  if (!startsClean) {
    console.error('❌ ÉCHEC: Ne commence pas proprement!');
    console.error('Début actuel:', cleanedText.substring(0, 50));
    return false;
  }
  
  console.log('✅ SUCCÈS: Traduction française propre et complète!');
  return true;
};

// Exécuter le test
const success = testFrenchCleanup();
if (success) {
  console.log('🎉 TEST RÉUSSI: Le nettoyage français fonctionne correctement');
} else {
  console.log('💥 TEST ÉCHOUÉ: Problème avec le nettoyage français');
}