# Script de Réinstallation des Dépendances
# Résout les problèmes d'installation de Jest et esbuild

Write-Host "🔧 Script de Réinstallation des Dépendances" -ForegroundColor Cyan
Write-Host "=" * 70
Write-Host ""

# Étape 1: Arrêter les processus Node.js
Write-Host "📦 Étape 1: Arrêt des processus Node.js..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ Processus Node.js arrêtés" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Aucun processus Node.js à arrêter" -ForegroundColor Yellow
}
Start-Sleep -Seconds 2

# Étape 2: Supprimer node_modules
Write-Host "`n📦 Étape 2: Suppression de node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    try {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
        Write-Host "✅ node_modules supprimé" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Impossible de supprimer complètement node_modules" -ForegroundColor Yellow
        Write-Host "   Certains fichiers peuvent être verrouillés" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ node_modules n'existe pas" -ForegroundColor Green
}

# Étape 3: Supprimer package-lock.json
Write-Host "`n📦 Étape 3: Suppression de package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json supprimé" -ForegroundColor Green
} else {
    Write-Host "✅ package-lock.json n'existe pas" -ForegroundColor Green
}

# Étape 4: Nettoyer le cache npm
Write-Host "`n📦 Étape 4: Nettoyage du cache npm..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ Cache npm nettoyé" -ForegroundColor Green

# Étape 5: Réinstaller les dépendances
Write-Host "`n📦 Étape 5: Réinstallation des dépendances..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre plusieurs minutes..." -ForegroundColor Cyan

$installSuccess = $false

# Tentative 1: Installation standard avec legacy-peer-deps
Write-Host "`n   Tentative 1: Installation avec --legacy-peer-deps" -ForegroundColor Cyan
npm install --legacy-peer-deps 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation réussie!" -ForegroundColor Green
    $installSuccess = $true
} else {
    Write-Host "❌ Échec de la tentative 1" -ForegroundColor Red
    
    # Tentative 2: Installation avec force
    Write-Host "`n   Tentative 2: Installation avec --force" -ForegroundColor Cyan
    npm install --legacy-peer-deps --force 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Installation réussie!" -ForegroundColor Green
        $installSuccess = $true
    } else {
        Write-Host "❌ Échec de la tentative 2" -ForegroundColor Red
        
        # Tentative 3: Installation sans optional
        Write-Host "`n   Tentative 3: Installation sans dépendances optionnelles" -ForegroundColor Cyan
        npm install --legacy-peer-deps --omit=optional 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Installation réussie!" -ForegroundColor Green
            $installSuccess = $true
        } else {
            Write-Host "❌ Échec de la tentative 3" -ForegroundColor Red
        }
    }
}

# Résumé
Write-Host "`n" + "=" * 70
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=" * 70

if ($installSuccess) {
    Write-Host "`n🎉 Installation réussie!" -ForegroundColor Green
    Write-Host "`n📝 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Exécuter les tests: npm test" -ForegroundColor White
    Write-Host "   2. Vérifier la couverture: npm run test:coverage" -ForegroundColor White
    Write-Host "   3. Tests de propriétés: npm run test:pbt" -ForegroundColor White
} else {
    Write-Host "`n❌ L'installation a échoué" -ForegroundColor Red
    Write-Host "`n💡 Solutions alternatives:" -ForegroundColor Yellow
    Write-Host "   1. Essayer avec Yarn: npm install -g yarn ; yarn install" -ForegroundColor White
    Write-Host "   2. Essayer avec pnpm: npm install -g pnpm ; pnpm install" -ForegroundColor White
    Write-Host "   3. Utiliser les tests manuels: node run-simple-tests.cjs" -ForegroundColor White
    Write-Host "`n📖 Voir RESOLUTION_PROBLEMES_JEST.md pour plus de détails" -ForegroundColor Cyan
}

Write-Host "`n" + "=" * 70
Write-Host "✨ Script terminé!" -ForegroundColor Cyan
Write-Host ""
