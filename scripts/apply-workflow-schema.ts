/**
 * Script to apply workflow management database schema enhancements
 * 
 * This script reads the workflow-management-enhancement.sql file and
 * applies it to the Supabase database to add missing tables and columns
 * required for complete workflow management functionality.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
  try {
    console.log('🔧 Applying workflow management schema enhancements...\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/workflow-management-enhancement.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Some errors are expected (e.g., column already exists)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Warning: ${error.message}`);
          } else {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err: any) {
        console.error(`❌ Error executing statement: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n✅ Schema application complete!');
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All schema enhancements applied successfully!');
    } else {
      console.log('\n⚠️  Some errors occurred. Please review the output above.');
    }

  } catch (error: any) {
    console.error('❌ Fatal error applying schema:', error.message);
    process.exit(1);
  }
}

// Run the script
applySchema().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
