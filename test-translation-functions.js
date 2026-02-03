// Test des fonctions de traduction réelles
console.log('🔧 Test des fonctions de traduction réelles');

// Fonctions de traduction (copiées de ImprovedChatInterface.tsx)
const translateFamilyLawToArabic = (text) => {
    console.log(`🔧 Traduction famille FR->AR: "${text.substring(0, 50)}..."`);
    
    let translated = text;
    
    const familyTranslations = {
      'famille': 'الأسرة',
      'mariage': 'الزواج', 
      'divorce': 'الطلاق',
      'enfant': 'الطفل',
      'enfants': 'الأطفال',
      'parent': 'الوالد',
      'parents': 'الوالدين',
      'époux': 'الزوج',
      'épouse': 'الزوجة',
      'mari': 'الزوج',
      'femme': 'الزوجة',
      'droit': 'الحق',
      'droits': 'الحقوق',
      'loi': 'القانون',
      'code': 'قانون',
      'article': 'المادة',
      'protection': 'الحماية',
      'garde': 'الحضانة',
      'pension': 'النفقة',
      'alimentaire': 'الغذائية',
      'autorité': 'السلطة',
      'parentale': 'الأبوية',
      'tutelle': 'الوصاية',
      'adoption': 'التبني',
      'filiation': 'النسب',
      'succession': 'الميراث',
      'héritage': 'الميراث'
    };
    
    Object.entries(familyTranslations).forEach(([fr, ar]) => {
      const regex = new RegExp(`\\b${fr}\\b`, 'gi');
      translated = translated.replace(regex, ar);
    });
    
    console.log(`🔧 Résultat traduction famille: "${translated.substring(0, 50)}..."`);
    return translated;
};

const translateRightsToArabic = (text) => {
    console.log(`🔧 Traduction droits FR->AR: "${text.substring(0, 50)}..."`);
    
    let translated = text;
    
    const rightsTranslations = {
      'droits': 'الحقوق',
      'droit': 'الحق', 
      'liberté': 'الحرية',
      'égalité': 'المساواة',
      'justice': 'العدالة',
      'constitution': 'الدستور',
      'loi': 'القانون',
      'article': 'المادة',
      'citoyen': 'المواطن',
      'citoyens': 'المواطنين',
      'personne': 'الشخص',
      'individu': 'الفرد',
      'société': 'المجتمع',
      'état': 'الدولة',
      'gouvernement': 'الحكومة',
      'tribunal': 'المحكمة',
      'juge': 'القاضي',
      'avocat': 'المحامي',
      'défense': 'الدفاع',
      'accusé': 'المتهم',
      'victime': 'الضحية',
      'procès': 'المحاكمة',
      'jugement': 'الحكم'
    };
    
    Object.entries(rightsTranslations).forEach(([fr, ar]) => {
      const regex = new RegExp(`\\b${fr}\\b`, 'gi');
      translated = translated.replace(regex, ar);
    });
    
    console.log(`🔧 Résultat traduction droits: "${translated.substring(0, 50)}..."`);
    return translated;
};

// Tests avec du contenu réel
console.log('\n=== TEST 1: Traduction du droit de la famille ===');
const familyText = "Le droit de la famille concerne le mariage, le divorce, les enfants et la garde. Les parents ont des droits et des obligations envers leurs enfants.";
console.log('Texte original:', familyText);
const translatedFamily = translateFamilyLawToArabic(familyText);
console.log('Texte traduit:', translatedFamily);

console.log('\n=== TEST 2: Traduction des droits généraux ===');
const rightsText = "Les droits de l'homme incluent la liberté, l'égalité et la justice. Chaque citoyen a le droit à un procès équitable devant un tribunal.";
console.log('Texte original:', rightsText);
const translatedRights = translateRightsToArabic(rightsText);
console.log('Texte traduit:', translatedRights);

console.log('\n=== TEST 3: Détection de contenu ===');
const testTexts = [
  "Question sur le mariage et le divorce", // Devrait être détecté comme famille
  "Quels sont mes droits en tant que citoyen?", // Devrait être détecté comme droits
  "Comment faire une demande de passeport?" // Devrait être traduction générale
];

testTexts.forEach((text, index) => {
  console.log(`\nTest ${index + 1}: "${text}"`);
  
  if (text.includes('famille') || text.includes('mariage') || text.includes('divorce')) {
    console.log('→ Détecté: droit de la famille');
    console.log('→ Traduction:', translateFamilyLawToArabic(text));
  } else if (text.includes('droits') && !text.includes('famille')) {
    console.log('→ Détecté: droits généraux');
    console.log('→ Traduction:', translateRightsToArabic(text));
  } else {
    console.log('→ Détecté: traduction générale');
    console.log('→ Traduction: [traduction générale appliquée]');
  }
});

console.log('\n🔧 ✅ Test des fonctions de traduction terminé');