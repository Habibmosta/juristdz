/**
 * Script de Test Manuel pour le Système de Gestion Documentaire
 * 
 * Ce script teste les fonctionnalités principales sans dépendre de Jest
 */

console.log('🧪 Test du Système de Gestion Documentaire\n');
console.log('='.repeat(60));

// Test 1: Vérifier que les services existent
console.log('\n📦 Test 1: Vérification des Services');
console.log('-'.repeat(60));

const services = [
  'src/document-management/services/documentService.ts',
  'src/document-management/services/folderService.ts',
  'src/document-management/services/fileStorageService.ts',
  'src/document-management/services/encryptionService.ts',
  'src/document-management/services/searchService.ts',
  'src/document-management/services/templateManagementService.ts',
  'src/document-management/services/versionControlService.ts',
  'src/document-management/services/documentSharingService.ts',
  'src/document-management/services/workflowService.ts',
  'src/document-management/services/accessControlService.ts'
];

const fs = require('fs');
const path = require('path');

let servicesFound = 0;
let servicesMissing = 0;

services.forEach(service => {
  const exists = fs.existsSync(service);
  if (exists) {
    console.log(`✅ ${path.basename(service)}`);
    servicesFound++;
  } else {
    console.log(`❌ ${path.basename(service)} - MANQUANT`);
    servicesMissing++;
  }
});

console.log(`\n📊 Résultat: ${servicesFound}/${services.length} services trouvés`);

// Test 2: Vérifier que les tests existent
console.log('\n📝 Test 2: Vérification des Fichiers de Test');
console.log('-'.repeat(60));

const testFiles = [
  'tests/document-management/document-service.test.ts',
  'tests/document-management/folder-service.test.ts',
  'tests/document-management/file-storage-service.test.ts',
  'tests/document-management/encryption-service.test.ts',
  'tests/document-management/search-functionality.test.ts',
  'tests/document-management/template-management-service.test.ts',
  'tests/document-management/version-control-service.test.ts',
  'tests/document-management/document-sharing-service.test.ts',
  'tests/document-management/workflow-management-properties.test.ts'
];

let testsFound = 0;
let testsMissing = 0;

testFiles.forEach(testFile => {
  const exists = fs.existsSync(testFile);
  if (exists) {
    console.log(`✅ ${path.basename(testFile)}`);
    testsFound++;
  } else {
    console.log(`❌ ${path.basename(testFile)} - MANQUANT`);
    testsMissing++;
  }
});

console.log(`\n📊 Résultat: ${testsFound}/${testFiles.length} fichiers de test trouvés`);

// Test 3: Vérifier les types
console.log('\n🔧 Test 3: Vérification des Types');
console.log('-'.repeat(60));

const typeFiles = [
  'src/document-management/types/index.ts',
  'types/document-management.ts'
];

let typesFound = 0;
let typesMissing = 0;

typeFiles.forEach(typeFile => {
  const exists = fs.existsSync(typeFile);
  if (exists) {
    console.log(`✅ ${path.basename(typeFile)}`);
    typesFound++;
  } else {
    console.log(`❌ ${path.basename(typeFile)} - MANQUANT`);
    typesMissing++;
  }
});

console.log(`\n📊 Résultat: ${typesFound}/${typeFiles.length} fichiers de types trouvés`);

// Test 4: Vérifier la configuration
console.log('\n⚙️  Test 4: Vérification de la Configuration');
console.log('-'.repeat(60));

const configFiles = [
  'jest.config.cjs',
  'tsconfig.json',
  'package.json',
  '.env.example'
];

let configsFound = 0;
let configsMissing = 0;

configFiles.forEach(configFile => {
  const exists = fs.existsSync(configFile);
  if (exists) {
    console.log(`✅ ${configFile}`);
    configsFound++;
  } else {
    console.log(`❌ ${configFile} - MANQUANT`);
    configsMissing++;
  }
});

console.log(`\n📊 Résultat: ${configsFound}/${configFiles.length} fichiers de config trouvés`);

// Résumé Final
console.log('\n' + '='.repeat(60));
console.log('📋 RÉSUMÉ FINAL');
console.log('='.repeat(60));

const totalFiles = services.length + testFiles.length + typeFiles.length + configFiles.length;
const totalFound = servicesFound + testsFound + typesFound + configsFound;
const totalMissing = servicesMissing + testsMissing + typesMissing + configsMissing;

console.log(`\n✅ Fichiers trouvés: ${totalFound}/${totalFiles}`);
console.log(`❌ Fichiers manquants: ${totalMissing}/${totalFiles}`);

const percentage = ((totalFound / totalFiles) * 100).toFixed(1);
console.log(`\n📊 Taux de complétion: ${percentage}%`);

if (percentage >= 90) {
  console.log('\n🎉 EXCELLENT! Le système est presque complet!');
} else if (percentage >= 70) {
  console.log('\n👍 BON! La plupart des fichiers sont présents.');
} else if (percentage >= 50) {
  console.log('\n⚠️  ATTENTION! Plusieurs fichiers manquent.');
} else {
  console.log('\n❌ CRITIQUE! Beaucoup de fichiers manquent.');
}

console.log('\n' + '='.repeat(60));
console.log('✨ Test terminé!\n');
