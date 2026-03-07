#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement pour Vercel
 * Usage: node verifier-env-vercel.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification des variables d\'environnement...\n');

// Lire le fichier .env.local
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Fichier .env.local introuvable!');
  console.log('📝 Créez un fichier .env.local à la racine du projet\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

console.log('📋 Variables trouvées dans .env.local:\n');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GROQ_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_OPENAI_API_KEY'
];

const foundVars = {};
let hasErrors = false;

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  if (key && value) {
    foundVars[key.trim()] = value;
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

requiredVars.forEach(varName => {
  const value = foundVars[varName];
  
  if (!value) {
    console.log(`❌ ${varName}`);
    console.log(`   Status: MANQUANT`);
    console.log(`   Action: Ajouter cette variable\n`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}`);
    
    // Vérifications spécifiques
    if (varName === 'VITE_SUPABASE_URL') {
      if (!value.startsWith('https://')) {
        console.log(`   ⚠️  Devrait commencer par https://`);
        hasErrors = true;
      }
      if (!value.includes('.supabase.co')) {
        console.log(`   ⚠️  Devrait contenir .supabase.co`);
        hasErrors = true;
      }
      console.log(`   Value: ${value}`);
    } else if (varName === 'VITE_SUPABASE_ANON_KEY') {
      if (!value.startsWith('eyJ')) {
        console.log(`   ⚠️  La clé JWT devrait commencer par eyJ`);
        hasErrors = true;
      }
      console.log(`   Value: ${value.substring(0, 30)}...`);
    } else {
      console.log(`   Value: ${value.substring(0, 20)}...`);
    }
    console.log(`   Status: OK\n`);
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (hasErrors) {
  console.log('❌ Des problèmes ont été détectés!\n');
  console.log('📝 Actions à effectuer:');
  console.log('   1. Corrigez les variables dans .env.local');
  console.log('   2. Ajoutez ces MÊMES variables sur Vercel');
  console.log('   3. Redéployez votre application\n');
  console.log('📖 Consultez CONFIGURATION_VERCEL_URGENT.md pour les instructions détaillées\n');
  process.exit(1);
} else {
  console.log('✅ Toutes les variables sont correctes!\n');
  console.log('📝 Prochaines étapes:');
  console.log('   1. Copiez ces variables sur Vercel (Settings > Environment Variables)');
  console.log('   2. Assurez-vous de cocher les 3 environnements (Production, Preview, Development)');
  console.log('   3. Redéployez votre application\n');
  console.log('💡 Commande rapide pour redéployer:');
  console.log('   git commit --allow-empty -m "chore: trigger redeploy"');
  console.log('   git push origin main\n');
  console.log('📖 Guide complet: CONFIGURATION_VERCEL_URGENT.md\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Générer un fichier de commandes Vercel CLI
const vercelCommands = `#!/bin/bash
# Commandes pour configurer Vercel via CLI
# Usage: chmod +x configure-vercel.sh && ./configure-vercel.sh

echo "🚀 Configuration des variables d'environnement sur Vercel..."
echo ""

# Installer Vercel CLI si nécessaire
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm i -g vercel
fi

# Se connecter
echo "🔐 Connexion à Vercel..."
vercel login

# Ajouter les variables
echo "📝 Ajout des variables d'environnement..."

${requiredVars.map(varName => {
  const value = foundVars[varName] || 'VALEUR_MANQUANTE';
  return `echo "Ajout de ${varName}..."
vercel env add ${varName} production <<EOF
${value}
EOF

vercel env add ${varName} preview <<EOF
${value}
EOF

vercel env add ${varName} development <<EOF
${value}
EOF
`;
}).join('\n')}

echo ""
echo "✅ Variables configurées!"
echo "🚀 Redéploiement..."
vercel --prod

echo ""
echo "✅ Configuration terminée!"
echo "🌐 Votre application sera disponible dans quelques minutes"
`;

fs.writeFileSync('configure-vercel.sh', vercelCommands);
console.log('📄 Fichier configure-vercel.sh créé (LOCAL SEULEMENT)!');
console.log('   ⚠️  Ce fichier contient vos clés API - NE PAS COMMITER');
console.log('   Vous pouvez l\'utiliser localement pour configurer Vercel:');
console.log('   chmod +x configure-vercel.sh && ./configure-vercel.sh\n');
