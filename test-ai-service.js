// Test simple du service AI
import { sendMessageToGemini } from './services/geminiService.js';

async function testAIService() {
  console.log('🧪 Test du service AI...');
  
  try {
    const testMessage = "Qu'est-ce que l'article 87 du code civil algérien ?";
    const history = [];
    
    console.log('📤 Envoi de la question:', testMessage);
    
    const response = await sendMessageToGemini(
      testMessage,
      history,
      'RESEARCH', // AppMode.RESEARCH
      'fr'        // Language français
    );
    
    console.log('📥 Réponse reçue:');
    console.log('---');
    console.log(response.text);
    console.log('---');
    
    if (response.citations) {
      console.log('📚 Citations:', response.citations);
    }
    
    console.log('✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testAIService();