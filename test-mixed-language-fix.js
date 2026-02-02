/**
 * Test rapide pour vérifier la correction du mélange de langues
 */

// Simuler le service de traduction amélioré
class TestTranslationService {
  translateFrenchToArabicCompletely(text) {
    const wordTranslations = {
      "marché noir": "السوق السوداء",
      "phénomène économique": "ظاهرة اقتصادية",
      "achat et vente": "الشراء والبيع",
      "biens ou services": "السلع أو الخدمات",
      "illégalement": "بطريقة غير قانونية",
      "lois et réglementations": "القوانين واللوائح",
      "en vigueur": "المعمول بها",
      "Code de Commerce": "القانون التجاري",
      "transactions commerciales": "المعاملات التجارية",
      "informations clés": "المعلومات الأساسية"
    };

    let result = text;
    for (const [french, arabic] of Object.entries(wordTranslations)) {
      const regex = new RegExp(`\\b${french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      result = result.replace(regex, arabic);
    }

    // Nettoyer les articles français restants
    result = result
      .replace(/\ble\b/gi, '')
      .replace(/\bla\b/gi, '')
      .replace(/\bles\b/gi, '')
      .replace(/\bde\b/gi, 'من')
      .replace(/\bdu\b/gi, 'من')
      .replace(/\bdes\b/gi, 'من')
      .replace(/\bet\b/gi, 'و')
      .replace(/\bou\b/gi, 'أو')
      .replace(/\s+/g, ' ')
      .trim();

    return result;
  }

  validateTranslation(text) {
    // Détecter le mélange français-arabe
    const mixedPattern = /ال\s+[a-zA-Z]+|[a-zA-Z]+\s+ال/g;
    if (mixedPattern.test(text)) {
      return { isValid: false, reason: 'Mélange français-arabe détecté' };
    }
    return { isValid: true };
  }
}

// Tests
const service = new TestTranslationService();

console.log('🧪 Test de correction du mélange de langues\n');

const testText = "Le marché noir est un phénomène économique";
console.log(`Texte original: "${testText}"`);

const translated = service.translateFrenchToArabicCompletely(testText);
console.log(`Texte traduit: "${translated}"`);

const validation = service.validateTranslation(translated);
console.log(`Validation: ${validation.isValid ? '✅ VALIDE' : '❌ INVALIDE - ' + validation.reason}`);

// Test du texte problématique de l'utilisateur
const problematicText = "ال marché noir est un phénomène économique";
console.log(`\nTexte problématique: "${problematicText}"`);

const problematicValidation = service.validateTranslation(problematicText);
console.log(`Validation: ${problematicValidation.isValid ? '✅ VALIDE' : '❌ INVALIDE - ' + problematicValidation.reason}`);

console.log('\n🧪 Test terminé');