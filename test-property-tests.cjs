/**
 * Vérification des Tests de Propriétés (Property-Based Tests)
 * Compte le nombre de propriétés testées
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Vérification des Tests de Propriétés\n');
console.log('='.repeat(70));

// Fonction pour analyser un fichier de test
function analyzeTestFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { properties: [], count: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const properties = [];
  
  // Chercher les propriétés dans les commentaires et les describe
  const propertyPattern = /Property\s+(\d+):\s*([^\n*]+)/g;
  let match;
  
  while ((match = propertyPattern.exec(content)) !== null) {
    properties.push({
      number: parseInt(match[1]),
      name: match[2].trim()
    });
  }
  
  return { properties, count: properties.length };
}

// Liste des fichiers de tests de propriétés
const testFiles = [
  'tests/document-management/file-upload-pipeline.test.ts',
  'tests/document-management/virus-detection-handling.test.ts',
  'tests/document-management/data-model-validation.test.ts',
  'tests/document-management/document-organization.test.ts',
  'tests/document-management/search-functionality.test.ts',
  'tests/document-management/multi-language-processing.test.ts',
  'tests/document-management/template-engine-properties.test.ts',
  'tests/document-management/version-control-service.test.ts',
  'tests/document-management/document-sharing-service.test.ts',
  'tests/document-management/access-control-audit-models.test.ts',
  'tests/document-management/digital-signature-properties.test.ts',
  'tests/document-management/workflow-management-properties.test.ts',
  'tests/document-management/case-integration-properties.test.ts',
  'tests/document-management/multi-platform-properties.test.ts',
  'tests/document-management/api-security-properties.test.ts',
  'tests/document-management/final-integration-properties.test.ts'
];

let totalProperties = 0;
const allProperties = [];

console.log('📝 Analyse des fichiers de test...\n');

testFiles.forEach(file => {
  const result = analyzeTestFile(file);
  const fileName = path.basename(file);
  
  if (result.count > 0) {
    console.log(`✅ ${fileName}`);
    console.log(`   ${result.count} propriété(s) testée(s):`);
    result.properties.forEach(prop => {
      console.log(`   - Property ${prop.number}: ${prop.name}`);
      allProperties.push(prop.number);
    });
    console.log('');
    totalProperties += result.count;
  } else {
    console.log(`⚠️  ${fileName} - Aucune propriété trouvée\n`);
  }
});

// Trier et dédupliquer les numéros de propriétés
const uniqueProperties = [...new Set(allProperties)].sort((a, b) => a - b);

console.log('='.repeat(70));
console.log('📊 RÉSUMÉ DES PROPRIÉTÉS TESTÉES');
console.log('='.repeat(70));

console.log(`\n✅ Total de propriétés testées: ${totalProperties}`);
console.log(`🔢 Propriétés uniques: ${uniqueProperties.length}`);

if (uniqueProperties.length > 0) {
  console.log(`\n📋 Liste des propriétés (${uniqueProperties.length}):`);
  
  // Afficher par groupes de 10
  for (let i = 0; i < uniqueProperties.length; i += 10) {
    const group = uniqueProperties.slice(i, i + 10);
    console.log(`   ${group.join(', ')}`);
  }
  
  // Vérifier les propriétés manquantes (supposons qu'il y en a 56 au total)
  const expectedProperties = 56;
  const missingProperties = [];
  
  for (let i = 1; i <= expectedProperties; i++) {
    if (!uniqueProperties.includes(i)) {
      missingProperties.push(i);
    }
  }
  
  if (missingProperties.length > 0) {
    console.log(`\n⚠️  Propriétés manquantes (${missingProperties.length}):`);
    for (let i = 0; i < missingProperties.length; i += 10) {
      const group = missingProperties.slice(i, i + 10);
      console.log(`   ${group.join(', ')}`);
    }
  } else {
    console.log('\n🎉 Toutes les propriétés sont testées!');
  }
  
  const coverage = ((uniqueProperties.length / expectedProperties) * 100).toFixed(1);
  console.log(`\n📈 Couverture des propriétés: ${coverage}%`);
  
  if (coverage >= 90) {
    console.log('\n🎉 EXCELLENT! Presque toutes les propriétés sont testées!');
  } else if (coverage >= 70) {
    console.log('\n👍 BON! La plupart des propriétés sont testées.');
  } else if (coverage >= 50) {
    console.log('\n⚠️  ATTENTION! Plusieurs propriétés manquent.');
  } else {
    console.log('\n❌ CRITIQUE! Beaucoup de propriétés manquent.');
  }
}

console.log('\n' + '='.repeat(70));
console.log('✨ Analyse terminée!\n');
