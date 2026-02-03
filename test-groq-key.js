// Test direct de votre clé Groq API
async function testYourGroqKey() {
  console.log('🧪 Test de votre clé Groq API...');
  
  const groqApiKey = 'YOUR_GROQ_API_KEY_HERE';
  const testMessage = "Bonjour, pouvez-vous m'aider avec le droit algérien ?";
  
  try {
    console.log('📤 Test avec votre clé:', groqApiKey.substring(0, 20) + '...');
    console.log('📤 Question:', testMessage);
    
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
            content: 'Tu es un assistant juridique spécialisé en droit algérien. Réponds en français juridique algérien.' 
          },
          { role: 'user', content: testMessage }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    console.log('📡 Statut HTTP:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API Groq:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      
      if (response.status === 401) {
        console.log('🔑 Problème d\'authentification - clé API invalide ou expirée');
      } else if (response.status === 429) {
        console.log('⏰ Limite de taux dépassée - trop de requêtes');
      } else if (response.status === 403) {
        console.log('🚫 Accès interdit - vérifiez les permissions de la clé');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ SUCCÈS ! Réponse de Groq:');
    console.log('---');
    console.log(data.choices[0].message.content);
    console.log('---');
    console.log('📊 Utilisation:', data.usage);
    
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('🌐 Problème de connexion réseau ou CORS');
    }
  }
}

// Exécuter le test
testYourGroqKey();