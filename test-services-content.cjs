/**
 * Test Détaillé du Contenu des Services
 * Vérifie que les services contiennent les fonctions attendues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Test Détaillé des Services\n');
console.log('='.repeat(70));

// Fonction pour lire et analyser un fichier
function analyzeService(filePath, expectedFunctions) {
  console.log(`\n📄 ${path.basename(filePath)}`);
  console.log('-'.repeat(70));
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Fichier non trouvé');
    return { found: 0, missing: expectedFunctions.length };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let found = 0;
  let missing = 0;
  
  expectedFunctions.forEach(func => {
    // Chercher la fonction dans le contenu
    const patterns = [
      new RegExp(`async\\s+${func}\\s*\\(`),
      new RegExp(`${func}\\s*:\\s*async\\s*\\(`),
      new RegExp(`${func}\\s*=\\s*async\\s*\\(`),
      new RegExp(`function\\s+${func}\\s*\\(`),
      new RegExp(`${func}\\s*\\(`),
    ];
    
    const foundPattern = patterns.some(pattern => pattern.test(content));
    
    if (foundPattern) {
      console.log(`  ✅ ${func}`);
      found++;
    } else {
      console.log(`  ❌ ${func} - MANQUANT`);
      missing++;
    }
  });
  
  const percentage = ((found / expectedFunctions.length) * 100).toFixed(1);
  console.log(`\n  📊 ${found}/${expectedFunctions.length} fonctions trouvées (${percentage}%)`);
  
  return { found, missing, total: expectedFunctions.length };
}

// Tests des services principaux
const serviceTests = [
  {
    file: 'src/document-management/services/documentService.ts',
    functions: [
      'createDocument',
      'getDocument',
      'updateDocument',
      'deleteDocument',
      'listDocuments',
      'searchDocuments'
    ]
  },
  {
    file: 'src/document-management/services/folderService.ts',
    functions: [
      'createFolder',
      'getFolder',
      'updateFolder',
      'deleteFolder',
      'moveFolder',
      'getFolderHierarchy'
    ]
  },
  {
    file: 'src/document-management/services/fileStorageService.ts',
    functions: [
      'uploadFile',
      'downloadFile',
      'deleteFile',
      'getFileMetadata'
    ]
  },
  {
    file: 'src/document-management/services/encryptionService.ts',
    functions: [
      'encrypt',
      'decrypt',
      'generateKey',
      'encryptFile',
      'decryptFile'
    ]
  },
  {
    file: 'src/document-management/services/searchService.ts',
    functions: [
      'search',
      'advancedSearch',
      'indexDocument',
      'searchByTags'
    ]
  },
  {
    file: 'src/document-management/services/templateManagementService.ts',
    functions: [
      'createTemplate',
      'getTemplate',
      'updateTemplate',
      'deleteTemplate',
      'listTemplates'
    ]
  },
  {
    file: 'src/document-management/services/versionControlService.ts',
    functions: [
      'createVersion',
      'getVersion',
      'listVersions',
      'compareVersions',
      'restoreVersion'
    ]
  },
  {
    file: 'src/document-management/services/documentSharingService.ts',
    functions: [
      'shareDocument',
      'revokeAccess',
      'getSharedDocuments',
      'updatePermissions'
    ]
  },
  {
    file: 'src/document-management/services/workflowService.ts',
    functions: [
      'createWorkflow',
      'startWorkflow',
      'completeStep',
      'getWorkflow',
      'getWorkflowProgress',
      'cancelWorkflow'
    ]
  },
  {
    file: 'src/document-management/services/accessControlService.ts',
    functions: [
      'checkPermission',
      'grantPermission',
      'revokePermission',
      'getUserPermissions'
    ]
  }
];

let totalFound = 0;
let totalMissing = 0;
let totalFunctions = 0;

serviceTests.forEach(test => {
  const result = analyzeService(test.file, test.functions);
  totalFound += result.found;
  totalMissing += result.missing;
  totalFunctions += result.total;
});

// Résumé final
console.log('\n' + '='.repeat(70));
console.log('📊 RÉSUMÉ GLOBAL');
console.log('='.repeat(70));

console.log(`\n✅ Fonctions trouvées: ${totalFound}/${totalFunctions}`);
console.log(`❌ Fonctions manquantes: ${totalMissing}/${totalFunctions}`);

const globalPercentage = ((totalFound / totalFunctions) * 100).toFixed(1);
console.log(`\n📈 Taux d'implémentation: ${globalPercentage}%`);

if (globalPercentage >= 90) {
  console.log('\n🎉 EXCELLENT! Les services sont très bien implémentés!');
  console.log('✨ Le système est prêt pour les tests unitaires.');
} else if (globalPercentage >= 70) {
  console.log('\n👍 BON! La plupart des fonctions sont implémentées.');
  console.log('⚠️  Quelques fonctions manquent encore.');
} else if (globalPercentage >= 50) {
  console.log('\n⚠️  ATTENTION! Plusieurs fonctions manquent.');
  console.log('🔧 Travail supplémentaire nécessaire.');
} else {
  console.log('\n❌ CRITIQUE! Beaucoup de fonctions manquent.');
  console.log('🚧 Implémentation incomplète.');
}

console.log('\n' + '='.repeat(70));
console.log('✨ Analyse terminée!\n');
