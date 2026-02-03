// Test de la traduction PURE (sans mélange de langues)
console.log('🔧 Test de la traduction PURE');

// Fonctions de traduction complètes (copiées de ImprovedChatInterface.tsx)
const getCompleteArabicFamilyLawContent = () => {
    return `قانون الأسرة في الجزائر

الأسرة هي الخلية الأساسية للمجتمع الجزائري وهي محمية بموجب الدستور والقانون.

الزواج:
الزواج في الجزائر محكوم بقانون الأسرة الجزائري. الزواج عقد شرعي ومدني يتم بين رجل وامرأة بالغين عاقلين. يتطلب الزواج موافقة الطرفين وحضور الشهود والولي للمرأة في بعض الحالات.

الطلاق:
الطلاق مسموح في القانون الجزائري ولكن بشروط محددة. يمكن للزوج أو الزوجة طلب الطلاق أمام المحكمة. هناك أنواع مختلفة من الطلاق منها الطلاق بالتراضي والطلاق للضرر والطلاق للشقاق.

حقوق الأطفال:
الأطفال لهم حقوق محمية بموجب القانون الجزائري. هذه الحقوق تشمل الحق في النفقة والحضانة والتعليم والرعاية الصحية. الأب مسؤول عن النفقة والأم لها الأولوية في الحضانة للأطفال الصغار.

الميراث:
الميراث في الجزائر محكوم بأحكام الشريعة الإسلامية. للذكر مثل حظ الأنثيين في معظم الحالات. الوالدان والأزواج والأطفال لهم حقوق ثابتة في الميراث.

هذه معلومات عامة عن قانون الأسرة الجزائري. للحصول على استشارة قانونية مفصلة، يُنصح بالتواصل مع محامٍ مختص.`;
};

const getCompleteFrenchFamilyLawContent = () => {
    return `Le Droit de la Famille en Algérie

La famille constitue la cellule de base de la société algérienne et est protégée par la Constitution et la loi.

Le Mariage:
Le mariage en Algérie est régi par le Code de la famille algérien. Le mariage est un contrat légal et religieux entre un homme et une femme majeurs et capables. Le mariage nécessite le consentement des deux parties, la présence de témoins et du tuteur de la femme dans certains cas.

Le Divorce:
Le divorce est autorisé par la loi algérienne mais sous certaines conditions. L'époux ou l'épouse peut demander le divorce devant le tribunal. Il existe différents types de divorce notamment le divorce par consentement mutuel, le divorce pour préjudice et le divorce pour discorde.

Les Droits des Enfants:
Les enfants ont des droits protégés par la loi algérienne. Ces droits incluent le droit à la pension alimentaire, à la garde, à l'éducation et aux soins de santé. Le père est responsable de la pension alimentaire et la mère a la priorité pour la garde des jeunes enfants.

L'Héritage:
L'héritage en Algérie est régi par les dispositions de la loi islamique. L'homme hérite généralement le double de la part de la femme. Les parents, conjoints et enfants ont des droits fixes dans l'héritage.

Ces informations sont générales sur le droit de la famille algérien. Pour obtenir des conseils juridiques détaillés, il est recommandé de consulter un avocat spécialisé.`;
};

// Test de pureté linguistique
function analyzeLanguagePurity(text, expectedLang) {
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const latinChars = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    if (totalChars === 0) return { pure: false, reason: 'Texte vide' };
    
    const arabicRatio = arabicChars / totalChars;
    const latinRatio = latinChars / totalChars;
    
    console.log(`📊 Analyse linguistique:`);
    console.log(`   - Caractères arabes: ${arabicChars} (${Math.round(arabicRatio * 100)}%)`);
    console.log(`   - Caractères latins: ${latinChars} (${Math.round(latinRatio * 100)}%)`);
    console.log(`   - Total caractères: ${totalChars}`);
    
    if (expectedLang === 'ar') {
        // Pour l'arabe, on veut > 95% de caractères arabes
        const isPure = arabicRatio > 0.95 && latinRatio < 0.05;
        return { 
            pure: isPure, 
            reason: isPure ? 'Texte purement arabe' : `Mélange détecté: ${Math.round(latinRatio * 100)}% latin`,
            arabicRatio,
            latinRatio
        };
    } else {
        // Pour le français, on veut > 95% de caractères latins
        const isPure = latinRatio > 0.95 && arabicRatio < 0.05;
        return { 
            pure: isPure, 
            reason: isPure ? 'Texte purement français' : `Mélange détecté: ${Math.round(arabicRatio * 100)}% arabe`,
            arabicRatio,
            latinRatio
        };
    }
}

console.log('\n=== TEST 1: Contenu arabe pur ===');
const arabicContent = getCompleteArabicFamilyLawContent();
console.log('Contenu (aperçu):', arabicContent.substring(0, 200) + '...');
const arabicAnalysis = analyzeLanguagePurity(arabicContent, 'ar');
console.log('✅ Résultat:', arabicAnalysis.pure ? 'PURE' : 'MÉLANGÉ');
console.log('📝 Raison:', arabicAnalysis.reason);

console.log('\n=== TEST 2: Contenu français pur ===');
const frenchContent = getCompleteFrenchFamilyLawContent();
console.log('Contenu (aperçu):', frenchContent.substring(0, 200) + '...');
const frenchAnalysis = analyzeLanguagePurity(frenchContent, 'fr');
console.log('✅ Résultat:', frenchAnalysis.pure ? 'PURE' : 'MÉLANGÉ');
console.log('📝 Raison:', frenchAnalysis.reason);

console.log('\n=== TEST 3: Comparaison avec contenu mélangé ===');
const mixedContent = `La الأسرة est un sujet important en الحق algérien. Le قانون de la الأسرة est un ensemble de lois qui régissent les relations familiales en Algérie.`;
console.log('Contenu mélangé:', mixedContent);
const mixedAnalysis = analyzeLanguagePurity(mixedContent, 'fr');
console.log('❌ Résultat:', mixedAnalysis.pure ? 'PURE' : 'MÉLANGÉ');
console.log('📝 Raison:', mixedAnalysis.reason);

console.log('\n🎯 CONCLUSION:');
console.log(`✅ Contenu arabe pur: ${arabicAnalysis.pure ? 'OUI' : 'NON'}`);
console.log(`✅ Contenu français pur: ${frenchAnalysis.pure ? 'OUI' : 'NON'}`);
console.log(`❌ Contenu mélangé détecté: ${!mixedAnalysis.pure ? 'OUI' : 'NON'}`);

if (arabicAnalysis.pure && frenchAnalysis.pure && !mixedAnalysis.pure) {
    console.log('\n🎉 ✅ SUCCÈS: Les nouvelles fonctions produisent du contenu PUR dans chaque langue!');
} else {
    console.log('\n⚠️ ❌ ÉCHEC: Les fonctions ne produisent pas du contenu assez pur.');
}

console.log('\n🔧 ✅ Test de traduction pure terminé');