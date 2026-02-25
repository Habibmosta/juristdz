#!/usr/bin/env node

/**
 * Script de migration pour Supabase - 69 wilayas d'Algérie
 * Usage: node database/run-supabase-migrations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQLFile(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  
  log(`\n📄 Lecture de: ${filename}`, 'cyan');
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    log(`   ✅ Fichier lu (${sql.length} caractères)`, 'green');
    return sql;
  } catch (error) {
    log(`   ❌ Erreur de lecture: ${error.message}`, 'red');
    throw error;
  }
}

async function checkConnection() {
  log('\n🔍 Vérification de la connexion à Supabase...', 'yellow');
  
  try {
    const { data, error } = await supabase.from('wilayas').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      throw error;
    }
    
    log(`   ✅ Connecté à Supabase`, 'green');
    log(`   URL: ${supabaseUrl}`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Impossible de se connecter à Supabase`, 'red');
    log(`   Erreur: ${error.message}`, 'red');
    return false;
  }
}

async function getStats() {
  log('\n📊 Statistiques de la base de données:', 'cyan');
  
  try {
    // Nombre de wilayas
    const { count: wilayasCount, error: wilayasError } = await supabase
      .from('wilayas')
      .select('*', { count: 'exact', head: true });
    
    if (!wilayasError) {
      log(`   Wilayas: ${wilayasCount}`, 'green');
    } else {
      log(`   Wilayas: Table non créée`, 'yellow');
    }
    
    // Nombre de tribunaux
    const { count: tribunauxCount, error: tribunauxError } = await supabase
      .from('tribunaux')
      .select('*', { count: 'exact', head: true });
    
    if (!tribunauxError) {
      log(`   Tribunaux: ${tribunauxCount}`, 'green');
    } else {
      log(`   Tribunaux: Table non créée`, 'yellow');
    }
    
    // Nombre de barreaux
    const { count: barreauxCount, error: barreauxError } = await supabase
      .from('barreaux')
      .select('*', { count: 'exact', head: true });
    
    if (!barreauxError) {
      log(`   Barreaux: ${barreauxCount}`, 'green');
    } else {
      log(`   Barreaux: Table non créée`, 'yellow');
    }
    
    // Nouvelles wilayas (59-69)
    const { data: newWilayas, error: newWilayasError } = await supabase
      .from('wilayas')
      .select('code')
      .gte('code', '59');
    
    if (!newWilayasError && newWilayas) {
      log(`   Nouvelles wilayas (59-69): ${newWilayas.length}`, 'green');
    }
    
  } catch (error) {
    log(`   ⚠️  Impossible de récupérer les statistiques: ${error.message}`, 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 MIGRATION SUPABASE - 69 WILAYAS D\'ALGÉRIE', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Vérifier la connexion
  const connected = await checkConnection();
  if (!connected) {
    process.exit(1);
  }
  
  log('\n⚠️  IMPORTANT: Exécution des migrations SQL', 'yellow');
  log('   Les migrations SQL doivent être exécutées manuellement dans le SQL Editor de Supabase', 'yellow');
  log('   car l\'API Supabase ne permet pas d\'exécuter du SQL arbitraire.', 'yellow');
  
  log('\n📋 Fichiers de migration à exécuter dans l\'ordre:', 'cyan');
  
  const migrations = [
    'complete_all_wilayas_data.sql',
    'add_69_wilayas.sql',
    'add_code_postal_prefix.sql'
  ];
  
  for (let i = 0; i < migrations.length; i++) {
    const filename = migrations[i];
    log(`\n${i + 1}. ${filename}`, 'bright');
    
    try {
      const sql = await executeSQLFile(filename);
      
      log('\n   📝 Contenu du fichier:', 'blue');
      log('   ' + '-'.repeat(58), 'blue');
      
      // Afficher les premières lignes
      const lines = sql.split('\n').slice(0, 10);
      lines.forEach(line => {
        if (line.trim()) {
          log(`   ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`, 'blue');
        }
      });
      
      log('   ' + '-'.repeat(58), 'blue');
      log(`   Total: ${sql.split('\n').length} lignes`, 'blue');
      
    } catch (error) {
      log(`   ❌ Erreur: ${error.message}`, 'red');
    }
  }
  
  log('\n' + '='.repeat(60), 'bright');
  log('📖 INSTRUCTIONS POUR EXÉCUTER LES MIGRATIONS', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  log('1. Ouvrir le dashboard Supabase:', 'yellow');
  log(`   ${supabaseUrl.replace('/rest/v1', '')}`, 'blue');
  
  log('\n2. Aller dans "SQL Editor" (menu de gauche)', 'yellow');
  
  log('\n3. Créer une nouvelle requête et copier-coller le contenu de chaque fichier:', 'yellow');
  migrations.forEach((file, i) => {
    log(`   ${i + 1}. database/migrations/${file}`, 'blue');
  });
  
  log('\n4. Exécuter chaque requête en cliquant sur "Run"', 'yellow');
  
  log('\n5. Vérifier les résultats avec cette requête:', 'yellow');
  log('   SELECT COUNT(*) FROM wilayas; -- Devrait retourner 69', 'blue');
  
  log('\n' + '='.repeat(60), 'bright');
  log('💡 ALTERNATIVE: Utiliser l\'API Supabase Management', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  log('Si tu as accès à la clé de service (service_role_key):', 'yellow');
  log('1. Ajouter SUPABASE_SERVICE_ROLE_KEY dans .env.local', 'blue');
  log('2. Modifier ce script pour utiliser la clé de service', 'blue');
  log('3. Exécuter les migrations via l\'API', 'blue');
  
  // Afficher les statistiques actuelles
  await getStats();
  
  log('\n' + '='.repeat(60), 'bright');
  log('✅ PRÉPARATION TERMINÉE', 'green');
  log('='.repeat(60) + '\n', 'bright');
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
