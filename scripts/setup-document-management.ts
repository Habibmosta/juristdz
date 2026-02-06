#!/usr/bin/env tsx
// Document Management System - Setup Script
// This script initializes the document management system database and configuration
// Requirements: 8.6, 7.1

import { databaseInitService } from '../src/document-management/services/databaseInitService';
import { supabaseService } from '../src/document-management/services/supabaseService';
import { getDMSConfig, validateConfig, testConnection } from '../src/document-management/config';

async function main() {
  console.log('🚀 JuristDZ Document Management System Setup');
  console.log('============================================\n');

  try {
    // Step 1: Validate configuration
    console.log('1️⃣ Validating configuration...');
    const config = getDMSConfig();
    const configErrors = validateConfig(config);
    
    if (configErrors.length > 0) {
      console.error('❌ Configuration validation failed:');
      configErrors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
    console.log('✅ Configuration is valid\n');

    // Step 2: Test Supabase connection
    console.log('2️⃣ Testing Supabase connection...');
    const connectionTest = await testConnection();
    if (!connectionTest) {
      console.error('❌ Supabase connection failed');
      console.error('Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
      process.exit(1);
    }
    console.log('✅ Supabase connection successful\n');

    // Step 3: Check current initialization status
    console.log('3️⃣ Checking initialization status...');
    const initStatus = await databaseInitService.getInitializationStatus();
    console.log(`   Tables exist: ${initStatus.tablesExist ? '✅' : '❌'}`);
    console.log(`   Storage bucket exists: ${initStatus.bucketExists ? '✅' : '❌'}`);
    console.log(`   Has data: ${initStatus.hasData ? '✅' : '❌'}`);
    console.log(`   Fully initialized: ${initStatus.initialized ? '✅' : '❌'}\n`);

    // Step 4: Initialize schema if needed
    if (!initStatus.initialized) {
      console.log('4️⃣ Initializing database schema...');
      const schemaResult = await databaseInitService.initializeSchema();
      
      if (!schemaResult.success) {
        console.error('❌ Schema initialization failed:', schemaResult.message);
        if (schemaResult.errors) {
          schemaResult.errors.forEach(error => console.error(`   - ${error}`));
        }
        
        // Provide manual setup instructions
        console.log('\n📋 Manual Setup Instructions:');
        console.log('1. Open your Supabase dashboard');
        console.log('2. Go to the SQL Editor');
        console.log('3. Execute the SQL file: database/document-management-complete-schema.sql');
        console.log('4. Run this setup script again');
        process.exit(1);
      }
      console.log('✅ Schema initialization completed\n');
    } else {
      console.log('4️⃣ Schema already initialized ✅\n');
    }

    // Step 5: Create sample data (optional)
    const args = process.argv.slice(2);
    if (args.includes('--sample-data')) {
      console.log('5️⃣ Creating sample data...');
      const sampleResult = await databaseInitService.createSampleData();
      
      if (!sampleResult.success) {
        console.warn('⚠️ Sample data creation failed:', sampleResult.message);
        if (sampleResult.errors) {
          sampleResult.errors.forEach(error => console.warn(`   - ${error}`));
        }
      } else {
        console.log('✅ Sample data created successfully\n');
      }
    }

    // Step 6: Final verification
    console.log('6️⃣ Final verification...');
    const finalStatus = await databaseInitService.getInitializationStatus();
    
    if (finalStatus.initialized) {
      console.log('✅ Document Management System setup completed successfully!\n');
      
      // Display configuration summary
      console.log('📊 Configuration Summary:');
      console.log(`   Max file size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)} MB`);
      console.log(`   Allowed file types: ${config.allowedFileTypes.join(', ')}`);
      console.log(`   Max folder depth: ${config.maxFolderDepth} levels`);
      console.log(`   Encryption: ${config.encryptionAlgorithm}`);
      console.log(`   Storage bucket: ${config.storageBucket}`);
      console.log(`   RLS enabled: ${config.enableRLS ? 'Yes' : 'No'}`);
      console.log(`   Audit trail: ${config.auditTrailEnabled ? 'Enabled' : 'Disabled'}\n`);
      
      console.log('🎉 You can now start using the Document Management System!');
    } else {
      console.error('❌ Setup verification failed');
      console.error('Please check the manual setup instructions above');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Setup failed with error:', error);
    process.exit(1);
  }
}

// Handle command line arguments
function showHelp() {
  console.log('JuristDZ Document Management System Setup');
  console.log('Usage: npm run setup:dms [options]');
  console.log('');
  console.log('Options:');
  console.log('  --sample-data    Create sample data for testing');
  console.log('  --help          Show this help message');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  VITE_SUPABASE_URL      Your Supabase project URL');
  console.log('  VITE_SUPABASE_ANON_KEY Your Supabase anonymous key');
}

// Check for help flag
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the setup
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});