#!/usr/bin/env node

/**
 * Complete infrastructure setup validation for JuristDZ Multi-Role Platform
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 JuristDZ Multi-Role Legal Platform - Infrastructure Setup Validation\n');

// Check if we're in the right directory
if (!existsSync('package.json') || !existsSync('server/package.json')) {
  console.log('❌ Please run this script from the project root directory');
  process.exit(1);
}

let allValid = true;

// 1. Validate project structure
console.log('📁 Validating project structure:');
const requiredStructure = [
  'server/src/index.ts',
  'server/src/config/environment.ts',
  'server/src/database/connection.ts',
  'server/src/database/migrations',
  'server/src/routes',
  'server/src/middleware',
  'server/src/utils',
  'server/package.json',
  'server/tsconfig.json',
  'server/.eslintrc.json',
  'server/.prettierrc',
  'server/jest.config.js',
  'docker-compose.yml',
  '.env.example'
];

for (const path of requiredStructure) {
  if (existsSync(path)) {
    console.log(`✅ ${path}`);
  } else {
    console.log(`❌ ${path} - MISSING`);
    allValid = false;
  }
}

// 2. Validate package.json scripts
console.log('\n📦 Validating root package.json scripts:');
try {
  const rootPackage = JSON.parse(readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    'server:install', 'server:dev', 'server:build', 'server:test', 
    'server:migrate', 'docker:up', 'docker:down', 'setup'
  ];
  
  for (const script of requiredScripts) {
    if (rootPackage.scripts && rootPackage.scripts[script]) {
      console.log(`✅ ${script}`);
    } else {
      console.log(`❌ ${script} - MISSING`);
      allValid = false;
    }
  }
} catch (error) {
  console.log(`❌ Error reading root package.json: ${error.message}`);
  allValid = false;
}

// 3. Validate server package.json
console.log('\n🔧 Validating server package.json:');
try {
  const serverPackage = JSON.parse(readFileSync('server/package.json', 'utf8'));
  
  const requiredDeps = [
    'express', 'cors', 'helmet', 'jsonwebtoken', 'bcryptjs', 
    'pg', 'redis', 'winston', 'joi', 'dotenv', 'uuid', 'multer'
  ];
  
  const requiredDevDeps = [
    'typescript', 'tsx', 'jest', 'ts-jest', 'eslint', 'prettier', 'fast-check'
  ];
  
  for (const dep of requiredDeps) {
    if (serverPackage.dependencies && serverPackage.dependencies[dep]) {
      console.log(`✅ Dependency: ${dep}`);
    } else {
      console.log(`❌ Dependency: ${dep} - MISSING`);
      allValid = false;
    }
  }
  
  for (const dep of requiredDevDeps) {
    if (serverPackage.devDependencies && serverPackage.devDependencies[dep]) {
      console.log(`✅ DevDependency: ${dep}`);
    } else {
      console.log(`❌ DevDependency: ${dep} - MISSING`);
      allValid = false;
    }
  }
} catch (error) {
  console.log(`❌ Error reading server package.json: ${error.message}`);
  allValid = false;
}

// 4. Validate database migrations
console.log('\n🗄️ Validating database migrations:');
const migrationFiles = [
  'server/src/database/migrations/001_create_users_table.sql',
  'server/src/database/migrations/002_create_documents_table.sql',
  'server/src/database/migrations/003_create_legal_database.sql'
];

for (const migration of migrationFiles) {
  if (existsSync(migration)) {
    console.log(`✅ ${migration.split('/').pop()}`);
  } else {
    console.log(`❌ ${migration.split('/').pop()} - MISSING`);
    allValid = false;
  }
}

// 5. Validate Docker configuration
console.log('\n🐳 Validating Docker configuration:');
try {
  const dockerCompose = readFileSync('docker-compose.yml', 'utf8');
  
  const requiredServices = ['postgres', 'redis', 'server', 'frontend', 'mailhog', 'elasticsearch'];
  
  for (const service of requiredServices) {
    if (dockerCompose.includes(service + ':')) {
      console.log(`✅ Service: ${service}`);
    } else {
      console.log(`❌ Service: ${service} - MISSING`);
      allValid = false;
    }
  }
} catch (error) {
  console.log(`❌ Error reading docker-compose.yml: ${error.message}`);
  allValid = false;
}

// 6. Validate environment configuration
console.log('\n🔐 Validating environment configuration:');
if (existsSync('.env.example')) {
  console.log('✅ .env.example exists');
  
  try {
    const envExample = readFileSync('.env.example', 'utf8');
    const requiredEnvVars = [
      'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (envExample.includes(envVar + '=')) {
        console.log(`✅ Environment variable: ${envVar}`);
      } else {
        console.log(`❌ Environment variable: ${envVar} - MISSING`);
        allValid = false;
      }
    }
  } catch (error) {
    console.log(`❌ Error reading .env.example: ${error.message}`);
    allValid = false;
  }
} else {
  console.log('❌ .env.example - MISSING');
  allValid = false;
}

// Final result
console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('🎉 INFRASTRUCTURE SETUP VALIDATION PASSED!');
  console.log('\n✨ JuristDZ Multi-Role Legal Platform is ready for development!');
  console.log('\n📋 Next Steps:');
  console.log('1. Install server dependencies: npm run server:install');
  console.log('2. Copy environment file: cp .env.example .env');
  console.log('3. Update .env with your API keys');
  console.log('4. Start services: npm run docker:up');
  console.log('5. Run database migrations: npm run server:migrate');
  console.log('6. Start development: npm run server:dev (backend) + npm run dev (frontend)');
  console.log('\n🔗 Service URLs:');
  console.log('   • Backend API: http://localhost:3000');
  console.log('   • Frontend: http://localhost:5173');
  console.log('   • Database: localhost:5432');
  console.log('   • Redis: localhost:6379');
  console.log('   • Email Testing: http://localhost:8025');
  console.log('   • Elasticsearch: http://localhost:9200');
  
  console.log('\n🏗️ Architecture Features Implemented:');
  console.log('   ✅ Modular TypeScript/Node.js backend');
  console.log('   ✅ PostgreSQL database with migrations');
  console.log('   ✅ Redis caching layer');
  console.log('   ✅ Docker development environment');
  console.log('   ✅ ESLint + Prettier code quality');
  console.log('   ✅ Jest testing framework');
  console.log('   ✅ Winston logging system');
  console.log('   ✅ Express.js API server');
  console.log('   ✅ Multi-role user system schema');
  console.log('   ✅ Document management schema');
  console.log('   ✅ Legal database schema');
  console.log('   ✅ Elasticsearch for search');
  console.log('   ✅ Email testing with MailHog');
  
  process.exit(0);
} else {
  console.log('❌ INFRASTRUCTURE SETUP VALIDATION FAILED!');
  console.log('\n🔧 Please fix the missing components listed above.');
  console.log('   Run this script again after making the necessary changes.');
  process.exit(1);
}