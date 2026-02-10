/**
 * Exemples de génération de documents
 * Démontre l'utilisation complète du système intégré
 */

import { wilayaTemplateService } from '../services/wilayaTemplateService';
import { clauseService } from '../services/clauseService';

// ============================================
// EXEMPLE 1: Acte de Vente Immobilière - Alger
// ============================================

export function generateActeVenteAlger() {
  console.log('📄 Génération: Acte de Vente Immobilière - Alger\n');
  
  // 1. Configuration
  const wilayaCode = '16'; // Alger
  const tribunalName = 'Tribunal de Sidi M\'Hamed';
  const language = 'fr';
  
  // 2. Générer l'en-tête
  const header = wilayaTemplateService.generateDocumentHeader(
    wilayaCode,
    tribunalName,
    language
  );
  
  console.log('✅ En-tête généré:');
  console.log(header);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // 3. Sélectionner les clauses
  const selectedClauses = [
    'id_personne_physique',
    'objet_vente_immobiliere',
    'prix_vente_comptant',
    'garantie_eviction',
    'garantie_vices_caches'
  ];
  
  // 4. Variables
  const variables = {
    // Vendeur
    NOM: 'BENALI',
    PRENOM: 'Ahmed',
    DATE_NAISSANCE: '15/03/1980',
    LIEU_NAISSANCE: 'Alger',
    CIN: '123456789',
    DATE_CIN: '01/01/2015',
    LIEU_CIN: 'Alger',
    ADRESSE: '10 Rue Didouche Mourad, Alger',
    PROFESSION: 'Commerçant',
    
    // Bien
    NATURE_BIEN: 'Appartement F3',
    SUPERFICIE: '85',
    ADRESSE_BIEN: '25 Rue Larbi Ben M\'hidi, Alger',
    NUMERO_TITRE_FONCIER: '12345/16',
    SECTION_CADASTRALE: 'A-123',
    
    // Prix
    PRIX_VENTE: '5000000',
    PRIX_LETTRES: 'Cinq millions',
    
    // Délais
    DELAI_DELIVRANCE: '30'
  };
  
  // 5. Générer les clauses
  const clauseTemplate = {
    documentType: 'acte_vente_immobiliere',
    selectedClauseIds: selectedClauses,
    variables: variables
  };
  
  const clausesText = clauseService.generateDocumentWithClauses(
    clauseTemplate,
    language
  );
  
  console.log('✅ Clauses générées:');
  console.log(clausesText);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // 6. Combiner tout
  const finalDocument = header + '\n\n' + clausesText;
  
  // 7. Appliquer les variables de wilaya
  const populatedDocument = wilayaTemplateService.populateTemplate(
    finalDocument,
    wilayaCode,
    tribunalName
  );
  
  console.log('✅ Document final:');
  console.log(populatedDocument);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // 8. Validation
  console.log('🔍 Validations:');
  
  // Valider RC
  const rcValidation = wilayaTemplateService.validateRC('16/12345678', '16');
  console.log(`RC 16/12345678: ${rcValidation.valid ? '✅ Valide' : '❌ Invalide'}`);
  
  // Valider NIF
  const nifValidation = wilayaTemplateService.validateNIF('099916123456789', '16');
  console.log(`NIF 099916123456789: ${nifValidation.valid ? '✅ Valide' : '❌ Invalide'}`);
  
  // Valider clauses obligatoires
  const clauseValidation = clauseService.validateMandatoryClauses(
    'acte_vente_immobiliere',
    selectedClauses
  );
  console.log(`Clauses obligatoires: ${clauseValidation.valid ? '✅ Complètes' : '❌ Manquantes'}`);
  if (!clauseValidation.valid) {
    console.log(`  Manquantes: ${clauseValidation.missingClauses.map(c => c.name_fr).join(', ')}`);
  }
  
  console.log('\n✅ Exemple 1 terminé!\n');
  
  return populatedDocument;
}

// ============================================
// EXEMPLE 2: Requête de Divorce - Oran (Arabe)
// ============================================

export function generateRequeteDivorceOran() {
  console.log('📄 Génération: Requête de Divorce - Oran (Arabe)\n');
  
  const wilayaCode = '31'; // Oran
  const tribunalName = 'Tribunal d\'Oran';
  const language = 'ar';
  
  // En-tête en arabe
  const header = wilayaTemplateService.generateDocumentHeader(
    wilayaCode,
    tribunalName,
    language
  );
  
  console.log('✅ En-tête généré (Arabe):');
  console.log(header);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Clauses famille
  const selectedClauses = [
    'id_personne_physique',
    'pension_alimentaire',
    'garde_enfants'
  ];
  
  const variables = {
    NOM: 'بن علي',
    PRENOM: 'أحمد',
    DATE_NAISSANCE: '15/03/1980',
    LIEU_NAISSANCE: 'وهران',
    CIN: '987654321',
    ADRESSE: 'شارع الأمير عبد القادر، وهران',
    PROFESSION: 'تاجر',
    MONTANT_PENSION: '15000',
    BENEFICIAIRE: 'الأطفال القصر',
    JOUR_PAIEMENT: '1',
    NOMS_ENFANTS: 'ياسمين وكريم',
    PARENT_GARDIEN: 'الأم',
    MODALITES_VISITE: 'نهاية أسبوع من كل اثنين ونصف العطل المدرسية'
  };
  
  const clauseTemplate = {
    documentType: 'requete_divorce',
    selectedClauseIds: selectedClauses,
    variables: variables
  };
  
  const clausesText = clauseService.generateDocumentWithClauses(
    clauseTemplate,
    language
  );
  
  console.log('✅ Clauses générées (Arabe):');
  console.log(clausesText);
  console.log('\n' + '='.repeat(80) + '\n');
  
  const finalDocument = header + '\n\n' + clausesText;
  
  console.log('✅ Document final (Arabe):');
  console.log(finalDocument);
  console.log('\n✅ Exemple 2 terminé!\n');
  
  return finalDocument;
}

// ============================================
// EXEMPLE 3: Bail d'Habitation - Constantine
// ============================================

export function generateBailConstantine() {
  console.log('📄 Génération: Bail d\'Habitation - Constantine\n');
  
  const wilayaCode = '25'; // Constantine
  const tribunalName = 'Tribunal de Constantine';
  const language = 'fr';
  
  const header = wilayaTemplateService.generateDocumentHeader(
    wilayaCode,
    tribunalName,
    language
  );
  
  const selectedClauses = [
    'id_personne_physique', // Bailleur
    'objet_bail_habitation',
    'loyer_mensuel',
    'depot_garantie',
    'obligation_entretien_bailleur',
    'obligation_usage_locataire'
  ];
  
  const variables = {
    // Bailleur
    NOM: 'KHELIFI',
    PRENOM: 'Rachid',
    DATE_NAISSANCE: '20/05/1975',
    LIEU_NAISSANCE: 'Constantine',
    CIN: '456789123',
    ADRESSE: '15 Rue Larbi Ben M\'hidi, Constantine',
    PROFESSION: 'Propriétaire',
    
    // Logement
    ADRESSE_LOGEMENT: '30 Boulevard de la République, Constantine',
    NOMBRE_PIECES: '4',
    SUPERFICIE: '95',
    
    // Loyer
    MONTANT_LOYER: '30000',
    LOYER_LETTRES: 'Trente mille',
    JOUR_PAIEMENT: '5',
    
    // Garantie
    MONTANT_DEPOT: '60000',
    NOMBRE_MOIS: '2'
  };
  
  const clauseTemplate = {
    documentType: 'bail_habitation',
    selectedClauseIds: selectedClauses,
    variables: variables
  };
  
  const document = clauseService.generateDocumentWithClauses(
    clauseTemplate,
    language
  );
  
  const finalDocument = header + '\n\n' + document;
  
  console.log('✅ Document final:');
  console.log(finalDocument);
  console.log('\n✅ Exemple 3 terminé!\n');
  
  return finalDocument;
}

// ============================================
// EXEMPLE 4: Export dans différents formats
// ============================================

export function demonstrateExportFormats() {
  console.log('📤 Démonstration des formats d\'export\n');
  
  const template = {
    documentType: 'acte_vente_immobiliere',
    selectedClauseIds: ['id_personne_physique', 'prix_vente_comptant'],
    variables: {
      NOM: 'TEST',
      PRENOM: 'User',
      DATE_NAISSANCE: '01/01/1990',
      LIEU_NAISSANCE: 'Alger',
      CIN: '123456789',
      DATE_CIN: '01/01/2015',
      LIEU_CIN: 'Alger',
      ADRESSE: 'Test Address',
      PROFESSION: 'Test',
      PRIX_VENTE: '1000000',
      PRIX_LETTRES: 'Un million'
    }
  };
  
  // Format texte
  console.log('📄 Format TEXTE:');
  const textExport = clauseService.exportClauses(template, 'fr', 'text');
  console.log(textExport);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Format JSON
  console.log('📄 Format JSON:');
  const jsonExport = clauseService.exportClauses(template, 'fr', 'json');
  console.log(jsonExport);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Format Markdown
  console.log('📄 Format MARKDOWN:');
  const mdExport = clauseService.exportClauses(template, 'fr', 'markdown');
  console.log(mdExport);
  console.log('\n✅ Démonstration des exports terminée!\n');
}

// ============================================
// EXEMPLE 5: Suggestions de clauses
// ============================================

export function demonstrateClauseSuggestions() {
  console.log('💡 Démonstration des suggestions de clauses\n');
  
  const selectedClauses = ['objet_vente_immobiliere', 'prix_vente_comptant'];
  
  const suggestions = clauseService.suggestComplementaryClauses(
    'acte_vente_immobiliere',
    selectedClauses
  );
  
  console.log(`Clauses sélectionnées: ${selectedClauses.join(', ')}`);
  console.log(`\nSuggestions (${suggestions.length}):`);

  suggestions.forEach((clause, index) => {
    console.log(`  ${index + 1}. ${clause.name_fr} (${clause.category})`);
  });
  
  console.log('\n✅ Démonstration des suggestions terminée!\n');
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

export function runAllExamples() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 DÉMONSTRATION COMPLÈTE DU SYSTÈME DE GÉNÉRATION DE DOCUMENTS');
  console.log('='.repeat(80) + '\n');
  
  try {
    // Exemple 1
    generateActeVenteAlger();
    
    // Exemple 2
    generateRequeteDivorceOran();
    
    // Exemple 3
    generateBailConstantine();
    
    // Exemple 4
    demonstrateExportFormats();
    
    // Exemple 5
    demonstrateClauseSuggestions();
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TOUS LES EXEMPLES ONT ÉTÉ GÉNÉRÉS AVEC SUCCÈS!');
    console.log('='.repeat(80) + '\n');
    
    return true;
  } catch (error) {
    console.error('\n❌ ERREUR lors de la génération:', error);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runAllExamples();
}
