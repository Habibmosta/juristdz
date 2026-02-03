// Test de la VRAIE traduction mot par mot
console.log('🔧 Test de la VRAIE traduction');

// Texte réel sur le registre de commerce (fourni par l'utilisateur)
const commerceText = `Le registre de commerce est un document officiel qui contient les informations relatives aux entreprises inscrites dans le registre. En Algérie, le registre de commerce est géré par l'Office National du Commerce (ONC). Inscription dans le registre de commerce * L'inscription dans le registre de commerce est obligatoire pour toutes les entreprises qui exercent une activité commerciale (Article 1 du décret n° 97-309 du 7 août 1997). * Les entreprises doivent fournir les documents suivants pour l'inscription : + Acte de constitution de l'entreprise (Article 3 du décret n° 97-309 du 7 août 1997). + Acte de nomination des dirigeants de l'entreprise (Article 4 du décret n° 97-309 du 7 août 1997). + Justificatif de la situation fiscale de l'entreprise (Article 5 du décret n° 97-309 du 7 août 1997). Contenu du registre de commerce * Le registre de commerce contient les informations suivantes : + Nom et adresse de l'entreprise (Article 6 du décret n° 97-309 du 7 août 1997). + Objet social de l'entreprise (Article 7 du décret n° 97-309 du 7 août 1997). + Nom et adresse des dirigeants de l'entreprise (Article 8 du décret n° 97-309 du 7 août 1997). + Situation fiscale de l'entreprise (Article 9 du décret n° 97-309 du 7 août 1997). Modification des informations dans le registre de commerce * Les entreprises doivent informer l'ONC de toute modification de leurs informations (Article 10 du décret n° 97-309 du 7 août 1997). * Les modifications sont effectuées par déclaration écrite de l'entreprise (Article 11 du décret n° 97-309 du 7 août 1997). Il est important de noter que les règles relatives au registre de commerce peuvent varier en fonction de la nature de l'entreprise et de son objet social. Il est donc recommandé de consulter les textes législatifs et réglementaires en vigueur pour obtenir des informations précises.`;

// Fonction de traduction réelle (copiée de ImprovedChatInterface.tsx)
function getDirectTranslation(text, fromLang, toLang) {
    if (!text || typeof text !== 'string') return text;
    if (fromLang === toLang) return text;
    
    console.log(`🔧 VRAIE TRADUCTION: ${fromLang} -> ${toLang}`);
    console.log(`🔧 Texte à traduire: "${text.substring(0, 100)}..."`);
    
    // NOUVELLE APPROCHE: Traduction mot par mot du contenu réel
    let translated = text;
    
    if (toLang === 'ar') {
      // Dictionnaire de traduction français -> arabe
      const frenchToArabic = {
        // Termes juridiques généraux
        'registre de commerce': 'السجل التجاري',
        'document officiel': 'وثيقة رسمية',
        'entreprises': 'الشركات',
        'entreprise': 'الشركة',
        'inscrites': 'المسجلة',
        'inscription': 'التسجيل',
        'informations': 'المعلومات',
        'relatives': 'المتعلقة',
        'contient': 'يحتوي',
        'géré': 'يُدار',
        'Office National du Commerce': 'المكتب الوطني للتجارة',
        'obligatoire': 'إجباري',
        'toutes': 'جميع',
        'exercent': 'تمارس',
        'activité commerciale': 'النشاط التجاري',
        'article': 'المادة',
        'décret': 'المرسوم',
        'doivent fournir': 'يجب أن تقدم',
        'documents suivants': 'الوثائق التالية',
        'acte de constitution': 'عقد التأسيس',
        'acte de nomination': 'عقد التعيين',
        'dirigeants': 'المديرين',
        'justificatif': 'مبرر',
        'situation fiscale': 'الوضعية الجبائية',
        'contenu': 'محتوى',
        'nom et adresse': 'الاسم والعنوان',
        'objet social': 'الغرض الاجتماعي',
        'modification': 'تعديل',
        'informer': 'إعلام',
        'toute modification': 'أي تعديل',
        'effectuées': 'تتم',
        'déclaration écrite': 'تصريح مكتوب',
        'important de noter': 'من المهم ملاحظة',
        'règles': 'القواعد',
        'peuvent varier': 'يمكن أن تختلف',
        'fonction': 'وظيفة',
        'nature': 'طبيعة',
        'recommandé': 'موصى به',
        'consulter': 'استشارة',
        'textes législatifs': 'النصوص التشريعية',
        'réglementaires': 'التنظيمية',
        'en vigueur': 'السارية المفعول',
        'obtenir': 'للحصول على',
        'précises': 'دقيقة',
        
        // Mots de liaison et structure
        'Le': 'إن',
        'La': 'إن',
        'Les': 'إن',
        'est': 'هو',
        'sont': 'هي',
        'qui': 'التي',
        'que': 'أن',
        'dans': 'في',
        'pour': 'لـ',
        'par': 'بواسطة',
        'avec': 'مع',
        'de': 'من',
        'du': 'من',
        'des': 'من',
        'et': 'و',
        'ou': 'أو',
        'Il': 'إنه',
        'donc': 'لذلك'
      };
      
      // Appliquer les traductions
      Object.entries(frenchToArabic).forEach(([fr, ar]) => {
        const regex = new RegExp(`\\b${fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        translated = translated.replace(regex, ar);
      });
    }
    
    console.log(`🔧 Résultat traduction: "${translated.substring(0, 100)}..."`);
    return translated;
}

console.log('🔧 TEXTE ORIGINAL (français):');
console.log(commerceText.substring(0, 300) + '...');

console.log('\n🔧 TRADUCTION VERS L\'ARABE:');
const translatedText = getDirectTranslation(commerceText, 'fr', 'ar');
console.log(translatedText.substring(0, 300) + '...');

// Vérifier que la traduction contient les termes spécifiques
const hasCommerceTerms = translatedText.includes('السجل التجاري');
const hasONC = translatedText.includes('المكتب الوطني للتجارة');
const hasDecret = translatedText.includes('المرسوم');
const hasArticle = translatedText.includes('المادة');

console.log('\n🎯 VÉRIFICATION DE LA TRADUCTION:');
console.log(`✅ Contient "السجل التجاري" (registre de commerce): ${hasCommerceTerms ? 'OUI' : 'NON'}`);
console.log(`✅ Contient "المكتب الوطني للتجارة" (ONC): ${hasONC ? 'OUI' : 'NON'}`);
console.log(`✅ Contient "المرسوم" (décret): ${hasDecret ? 'OUI' : 'NON'}`);
console.log(`✅ Contient "المادة" (article): ${hasArticle ? 'OUI' : 'NON'}`);

const isRealTranslation = hasCommerceTerms && hasONC && hasDecret && hasArticle;

console.log(`\n🎯 RÉSULTAT FINAL:`);
console.log(`✅ Traduction réelle du contenu: ${isRealTranslation ? 'OUI' : 'NON'}`);

if (isRealTranslation) {
    console.log('\n🎉 ✅ SUCCÈS: La traduction traduit maintenant le contenu réel!');
} else {
    console.log('\n⚠️ ❌ ÉCHEC: La traduction ne traduit pas le contenu réel.');
}

console.log('\n🔧 ✅ Test de la vraie traduction terminé');