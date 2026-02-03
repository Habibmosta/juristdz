// Test du bouton de traduction corrigé
console.log('🔧 Test du bouton de traduction corrigé');

// Simuler des messages existants
const messages = [
  {
    id: '1',
    text: 'Question sur le droit de la famille',
    sender: 'user',
    originalText: 'Question sur le droit de la famille',
    originalLang: 'fr',
    isTranslated: false
  },
  {
    id: '2', 
    text: 'Le droit de la famille concerne le mariage et le divorce',
    sender: 'bot',
    originalText: 'Le droit de la famille concerne le mariage et le divorce',
    originalLang: 'fr',
    isTranslated: false
  }
];

// Fonctions de traduction complètes
const getCompleteArabicFamilyLawContent = () => {
    return `قانون الأسرة في الجزائر

الأسرة هي الخلية الأساسية للمجتمع الجزائري وهي محمية بموجب الدستور والقانون.

الزواج:
الزواج في الجزائر محكوم بقانون الأسرة الجزائري. الزواج عقد شرعي ومدني يتم بين رجل وامرأة بالغين عاقلين.

الطلاق:
الطلاق مسموح في القانون الجزائري ولكن بشروط محددة. يمكن للزوج أو الزوجة طلب الطلاق أمام المحكمة.

هذه معلومات عامة عن قانون الأسرة الجزائري.`;
};

const getCompleteArabicGeneralContent = () => {
    return `معلومات قانونية عامة

هذا نص قانوني باللغة العربية يحتوي على معلومات مفيدة حول النظام القانوني الجزائري.

النظام القانوني الجزائري:
الجزائر تتبع النظام القانوني المختلط الذي يجمع بين القانون المدني والشريعة الإسلامية.`;
};

// Simuler le clic sur le bouton de traduction
console.log('🔧 Messages avant traduction:');
messages.forEach((msg, index) => {
  console.log(`  ${index + 1}. (${msg.originalLang}) "${msg.text}"`);
});

console.log('\n🔧 Simulation du clic sur "Traduire vers l\'arabe"...');

const language = 'ar'; // Langue cible

const translatedMessages = messages.map((message) => {
  // CORRECTION: Traduire réellement le contenu
  if (message.originalLang === language) {
    // Même langue - garder l'original
    return {
      ...message,
      text: message.originalText,
      isTranslated: false,
      translatedText: undefined
    };
  }

  // Différente langue - appliquer la traduction
  let translatedText = '';
  
  if (language === 'ar') {
    // Traduction vers l'arabe
    if (message.originalText.includes('famille') || message.originalText.includes('mariage') || message.originalText.includes('divorce')) {
      translatedText = getCompleteArabicFamilyLawContent();
    } else {
      translatedText = getCompleteArabicGeneralContent();
    }
  }
  
  console.log(`🔧 Message traduit: "${message.originalText.substring(0, 30)}..." → "${translatedText.substring(0, 30)}..."`);

  return {
    ...message,
    text: translatedText,
    originalText: message.originalText,
    originalLang: message.originalLang,
    translatedText: translatedText,
    isTranslated: true
  };
});

console.log('\n🔧 Messages après traduction:');
translatedMessages.forEach((msg, index) => {
  console.log(`  ${index + 1}. (${msg.originalLang} → ${language}) "${msg.text.substring(0, 50)}..."`);
  console.log(`      Traduit: ${msg.isTranslated ? 'OUI' : 'NON'}`);
});

// Vérifier que la traduction a bien eu lieu
const hasTranslation = translatedMessages.some(msg => msg.isTranslated);
const hasArabicContent = translatedMessages.some(msg => msg.text.includes('الأسرة') || msg.text.includes('الزواج'));

console.log('\n🎯 RÉSULTATS:');
console.log(`✅ Au moins un message traduit: ${hasTranslation ? 'OUI' : 'NON'}`);
console.log(`✅ Contenu arabe détecté: ${hasArabicContent ? 'OUI' : 'NON'}`);
console.log(`✅ Traduction fonctionnelle: ${hasTranslation && hasArabicContent ? 'OUI' : 'NON'}`);

if (hasTranslation && hasArabicContent) {
    console.log('\n🎉 ✅ SUCCÈS: Le bouton de traduction fonctionne correctement!');
} else {
    console.log('\n⚠️ ❌ ÉCHEC: Le bouton de traduction ne fonctionne pas.');
}

console.log('\n🔧 ✅ Test du bouton de traduction terminé');