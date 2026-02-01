#!/usr/bin/env node

/**
 * Setup validation script for JuristDZ server infrastructure
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  '.eslintrc.json',
  '.prettierrc',
  'jest.config.js',
  'src/index.ts',
  'src/config/environment.ts',
  'src/database/connection.ts',
  'src/database/migrate.ts',
  'src/database/migrations/001_create_users_table.sql',
  'src/database/migrations/002_create_documents_table.sql',
  'src/database/migrations/003_create_legal_database.sql',
  'src/utils/logger.ts',
  'src/middleware/errorHandler.ts',
  'src/middleware/requestLogger.ts',
  'src/routes/auth.ts',
  'src/routes/users.ts',
  'src/routes/documents.ts',
  'src/routes/search.ts',
  'src/routes/billing.ts',
  'src/routes/admin.ts',
  'src/test/setup.ts'
];

const requiredRootFiles = [
  'docker-compose.yml',
  '.env.example',
  'Dockerfile.frontend.dev'
];

console.log('🔍 Validating JuristDZ server infrastructure setup...\n');

let allValid = true;

// Check server files
console.log('📁 Checking server files:');
for (const file of requiredFiles) {
  const filePath = join(process.cwd(), file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allValid = false;
  }
}

// Check root files
console.log('\n📁 Checking root files:');
for (const file of requiredRootFiles) {
  const filePath = join(process.cwd(), '..', file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allValid = false;
  }
}

// Validate package.json structure
console.log('\n📦 Validating package.json:');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  const requiredScripts = [
    'dev', 'build', 'start', 'test', 'lint', 'format', 'db:migrate'
  ];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Script: ${script} - MISSING`);
      allValid = false;
    }
  }
  
  const requiredDeps = [
    'express', 'cors', 'helmet', 'jsonwebtoken', 'bcryptjs', 
    'pg', 'redis', 'winston', 'joi', 'dotenv'
  ];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ Dependency: ${dep}`);
    } else {
      console.log(`❌ Dependency: ${dep} - MISSING`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  allValid = false;
}

// Validate TypeScript configuration
console.log('\n🔧 Validating TypeScript configuration:');
try {
  const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.baseUrl) {
    console.log('✅ TypeScript path mapping configured');
  } else {
    console.log('❌ TypeScript path mapping not configured');
    allValid = false;
  }
  
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.strict) {
    console.log('✅ TypeScript strict mode enabled');
  } else {
    console.log('❌ TypeScript strict mode not enabled');
    allValid = false;
  }
  
} catch (error) {
  console.log(`❌ Error reading tsconfig.json: ${error.message}`);
  allValid = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('🎉 Infrastructure setup validation PASSED!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env and configure your environment variables');
  console.log('2. Run: npm install');
  console.log('3. Start services: docker-compose up -d');
  console.log('4. Run migrations: npm run db:migrate');
  console.log('5. Start development: npm run dev');
  process.exit(0);
} else {
  console.log('❌ Infrastructure setup validation FAILED!');
  console.log('\nPlease fix the missing files and configurations above.');
  process.exit(1);
}