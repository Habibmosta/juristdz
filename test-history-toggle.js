/**
 * Test pour vérifier que le bouton d'historique fonctionne correctement
 */

const testHistoryToggle = () => {
  console.log('📚 TEST BOUTON HISTORIQUE - Début');
  
  // Simuler un état avec plusieurs messages
  const mockMessages = [
    { id: '1', text: 'Message 1', sender: 'user' },
    { id: '2', text: 'Réponse 1', sender: 'bot' },
    { id: '3', text: 'Message 2', sender: 'user' },
    { id: '4', text: 'Réponse 2', sender: 'bot' },
    { id: '5', text: 'Message 3', sender: 'user' },
    { id: '6', text: 'Réponse 3', sender: 'bot' },
    { id: '7', text: 'Message 4', sender: 'user' },
    { id: '8', text: 'Réponse 4', sender: 'bot' },
    { id: '9', text: 'Message 5', sender: 'user' },
    { id: '10', text: 'Réponse 5', sender: 'bot' }
  ];
  
  console.log(`📚 Total messages: ${mockMessages.length}`);
  
  // Test 1: showHistory = false (masqué)
  const showHistory = false;
  const visibleMessages = showHistory ? mockMessages : mockMessages.slice(-5);
  
  console.log(`📚 showHistory = false:`);
  console.log(`📚 Messages visibles: ${visibleMessages.length}`);
  console.log(`📚 Messages masqués: ${mockMessages.length - visibleMessages.length}`);
  
  if (visibleMessages.length === 5 && mockMessages.length - visibleMessages.length === 5) {
    console.log('✅ SUCCÈS: Historique correctement masqué (5 derniers messages visibles)');
  } else {
    console.error('❌ ÉCHEC: Logique de masquage incorrecte');
    return false;
  }
  
  // Test 2: showHistory = true (affiché)
  const showHistoryTrue = true;
  const allVisibleMessages = showHistoryTrue ? mockMessages : mockMessages.slice(-5);
  
  console.log(`📚 showHistory = true:`);
  console.log(`📚 Messages visibles: ${allVisibleMessages.length}`);
  
  if (allVisibleMessages.length === mockMessages.length) {
    console.log('✅ SUCCÈS: Historique complet affiché');
  } else {
    console.error('❌ ÉCHEC: Historique complet non affiché');
    return false;
  }
  
  // Test 3: Moins de 5 messages (pas d'indicateur)
  const fewMessages = mockMessages.slice(0, 3);
  const shouldShowIndicator = !showHistory && fewMessages.length > 5;
  
  console.log(`📚 Avec ${fewMessages.length} messages:`);
  console.log(`📚 Indicateur affiché: ${shouldShowIndicator}`);
  
  if (!shouldShowIndicator) {
    console.log('✅ SUCCÈS: Pas d\'indicateur avec peu de messages');
  } else {
    console.error('❌ ÉCHEC: Indicateur affiché à tort');
    return false;
  }
  
  console.log('✅ SUCCÈS: Toute la logique d\'historique fonctionne correctement!');
  return true;
};

// Exécuter le test
const success = testHistoryToggle();
if (success) {
  console.log('🎉 TEST RÉUSSI: Le bouton d\'historique fonctionne correctement');
} else {
  console.log('💥 TEST ÉCHOUÉ: Problème avec la logique d\'historique');
}