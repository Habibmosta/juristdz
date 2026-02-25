#!/usr/bin/env node

/**
 * Script de migration pour ajouter les 69 wilayas dans la base de données
 * Usage: node database/run-migrations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'juristdz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

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

async function runMigration(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  
  log(`\n📄 Exécution de: ${filename}`, 'cyan');
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Diviser le SQL en commandes individuelles
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    log(`   ${commands.length} commandes SQL à exécuter...`, 'blue');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        // Ignorer les commentaires
        if (command.startsWith('--') || command.startsWith('/*')) {
          continue;
        }
        
        try {
          await client.query(command);
        } catch (error) {
          // Ignorer les erreurs de conflit (ON CONFLICT DO NOTHING)
          if (!error.message.includes('duplicate key') && 
              !error.message.includes('already exists')) {
            throw error;
          }
        }
      }
      
      await client.query('COMMIT');
      log(`   ✅ Migration réussie!`, 'green');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    throw error;
  }
}

async function checkDatabase() {
  log('\n🔍 Vérification de la connexion à la base de données...', 'yellow');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    log(`   ✅ Connecté à PostgreSQL`, 'green');
    log(`   Version: ${result.rows[0].version.split(',')[0]}`, 'blue');
    client.release();
    return true;
  } catch (error) {
    log(`   ❌ Impossible de se connecter à la base de données`, 'red');
    log(`   Erreur: ${error.message}`, 'red');
    log(`\n💡 Vérifiez vos variables d'environnement:`, 'yellow');
    log(`   DB_HOST=${process.env.DB_HOST || 'localhost'}`, 'blue');
    log(`   DB_PORT=${process.env.DB_PORT || '5432'}`, 'blue');
    log(`   DB_NAME=${process.env.DB_NAME || 'juristdz'}`, 'blue');
    log(`   DB_USER=${process.env.DB_USER || 'postgres'}`, 'blue');
    return false;
  }
}

async function getStats() {
  log('\n📊 Statistiques de la base de données:', 'cyan');
  
  try {
    const client = await pool.connect();
    
    // Nombre de wilayas
    const wilayasResult = await client.query('SELECT COUNT(*) as count FROM wilayas');
    log(`   Wilayas: ${wilayasResult.rows[0].count}`, 'green');
    
    // Nombre de tribunaux
    try {
      const tribunauxResult = await client.query('SELECT COUNT(*) as count FROM tribunaux');
      log(`   Tribunaux: ${tribunauxResult.rows[0].count}`, 'green');
    } catch (e) {
      log(`   Tribunaux: Table non créée`, 'yellow');
    }
    
    // Nombre de barreaux
    try {
      const barreauxResult = await client.query('SELECT COUNT(*) as count FROM barreaux');
      log(`   Barreaux: ${barreauxResult.rows[0].count}`, 'green');
    } catch (e) {
      log(`   Barreaux: Table non créée`, 'yellow');
    }
    
    // Nouvelles wilayas (59-69)
    const newWilayasResult = await client.query(
      "SELECT COUNT(*) as count FROM wilayas WHERE code::INTEGER >= 59"
    );
    log(`   Nouvelles wilayas (59-69): ${newWilayasResult.rows[0].count}`, 'green');
    
    client.release();
  } catch (error) {
    log(`   ⚠️  Impossible de récupérer les statistiques: ${error.message}`, 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 MIGRATION BASE DE DONNÉES - 69 WILAYAS D\'ALGÉRIE', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Vérifier la connexion
  const connected = await checkDatabase();
  if (!connected) {
    process.exit(1);
  }
  
  try {
    // Exécuter les migrations dans l'ordre
    log('\n📦 Exécution des migrations...', 'yellow');
    
    await runMigration('complete_all_wilayas_data.sql');
    await runMigration('add_69_wilayas.sql');
    
    // Afficher les statistiques
    await getStats();
    
    log('\n' + '='.repeat(60), 'bright');
    log('✅ MIGRATION TERMINÉE AVEC SUCCÈS!', 'green');
    log('='.repeat(60) + '\n', 'bright');
    
    log('💡 Prochaines étapes:', 'yellow');
    log('   1. Vérifier les données dans la base', 'blue');
    log('   2. Tester l\'application avec les nouvelles wilayas', 'blue');
    log('   3. Compléter les coordonnées (téléphones, emails)', 'blue');
    
  } catch (error) {
    log('\n' + '='.repeat(60), 'bright');
    log('❌ MIGRATION ÉCHOUÉE', 'red');
    log('='.repeat(60) + '\n', 'bright');
    log(`Erreur: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
