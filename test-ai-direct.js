// Test direct de l'API Groq
async function testGroqAPI() {
  console.log('🧪 Test direct de l\'API Groq...');
  
  const groqApiKey = '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';
  const testMessage = "Qu'est-ce que l'article 87 du code civil algérien ?";
  
  try {
    console.log('📤 Envoi de la question:', testMessage);
    console.log('🔑 Utilisation de la clé API Groq...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un assistant juridique spécialisé en droit algérien. Réponds en français juridique algérien et fais référence au JORA (Journal Officiel).' 
          },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    console.log('📡 Statut de la réponse:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('📥 Réponse reçue:');
    console.log('---');
    console.log(data.choices[0].message.content);
    console.log('---');
    console.log('✅ Test terminé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🌐 Problème de connexion réseau détecté');
      console.log('💡 Cela explique pourquoi vous obtenez "Erreur de connexion réseau"');
    }
  }
}

// Exécuter le test
testGroqAPI();