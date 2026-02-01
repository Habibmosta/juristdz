# Test Rapide JuristDZ - Validation des fonctionnalités principales
$baseUrl = "http://localhost:3000"

Write-Host "🚀 JURISTDZ - TEST RAPIDE" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta
Write-Host ""

# Test 1: Serveur
Write-Host "1. Test serveur..." -ForegroundColor Cyan
try {
    $server = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5
    Write-Host "   ✅ Serveur opérationnel - Version $($server.version)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Serveur inaccessible" -ForegroundColor Red
    exit 1
}

# Test 2: Base de données
Write-Host "2. Test base de données..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 5
    Write-Host "   ✅ Base de données connectée - $($health.stats.users) utilisateurs" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Problème base de données" -ForegroundColor Red
}

# Test 3: Utilisateurs
Write-Host "3. Test utilisateurs..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 5
    Write-Host "   ✅ $($users.count) utilisateurs trouvés" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur récupération utilisateurs" -ForegroundColor Red
}

# Test 4: Codes algériens
Write-Host "4. Test codes juridiques..." -ForegroundColor Cyan
try {
    $codes = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes" -TimeoutSec 5
    $totalArticles = ($codes.codes | Measure-Object articlesCount -Sum).Sum
    Write-Host "   ✅ $($codes.count) codes - $totalArticles articles" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur codes juridiques" -ForegroundColor Red
}

# Test 5: Tribunaux
Write-Host "5. Test tribunaux..." -ForegroundColor Cyan
try {
    $courts = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts" -TimeoutSec 5
    Write-Host "   ✅ $($courts.count) tribunaux - $($courts.wilayas.Count) wilayas" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur tribunaux" -ForegroundColor Red
}

# Test 6: Facturation
Write-Host "6. Test facturation..." -ForegroundColor Cyan
try {
    $billing = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 5
    $professions = $billing.rates.PSObject.Properties.Name.Count
    Write-Host "   ✅ Barèmes pour $professions professions" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur facturation" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 TEST RAPIDE TERMINE!" -ForegroundColor Green
Write-Host "📋 Pour des tests detailles, utilisez: .\test-interactif-juristdz.ps1" -ForegroundColor Yellow
Write-Host ""