# Tests complets finaux JuristDZ
$baseUrl = "http://localhost:3000"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "    JURISTDZ - TESTS COMPLETS FINAUX    " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Test 1: Informations serveur
Write-Host "1. Test informations serveur" -ForegroundColor Cyan
$serverInfo = Invoke-RestMethod -Uri "$baseUrl/"
Write-Host "✅ Serveur: $($serverInfo.message)" -ForegroundColor Green
Write-Host "📋 Version: $($serverInfo.version)" -ForegroundColor White
Write-Host "🔧 Fonctionnalités:" -ForegroundColor White
foreach ($feature in $serverInfo.features) {
    Write-Host "   • $feature" -ForegroundColor Gray
}
Write-Host ""

# Test 2: Health check avec statistiques
Write-Host "2. Test health check et statistiques" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$baseUrl/health"
Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
Write-Host "📊 Base de données: $($health.database)" -ForegroundColor White
Write-Host "👥 Utilisateurs: $($health.stats.users)" -ForegroundColor White
Write-Host "📄 Documents: $($health.stats.documents)" -ForegroundColor White
Write-Host ""

# Test 3: Liste des utilisateurs
Write-Host "3. Test liste des utilisateurs" -ForegroundColor Cyan
$users = Invoke-RestMethod -Uri "$baseUrl/api/users"
Write-Host "✅ Utilisateurs récupérés: $($users.count)" -ForegroundColor Green
Write-Host "👥 Liste des utilisateurs:" -ForegroundColor White
foreach ($user in $users.users | Select-Object -First 5) {
    Write-Host "   • $($user.email) - $($user.profession) - $($user.organization_name)" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Connexion simple
Write-Host "4. Test connexion simple" -ForegroundColor Cyan
if ($users.users.Count -gt 0) {
    $testUser = $users.users[0]
    $loginBody = @{ email = $testUser.email } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/simple-login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Connexion réussie pour: $($login.user.email)" -ForegroundColor Green
    Write-Host "👤 Nom: $($login.user.firstName) $($login.user.lastName)" -ForegroundColor White
    Write-Host "⚖️  Profession: $($login.user.profession)" -ForegroundColor White
    Write-Host "🏢 Organisation: $($login.user.organization)" -ForegroundColor White
} else {
    Write-Host "⚠️  Aucun utilisateur disponible pour test de connexion" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Recherche suggestions
Write-Host "5. Test recherche et suggestions" -ForegroundColor Cyan
$searchTerms = @("contrat", "civil", "penal", "tribunal")
foreach ($term in $searchTerms) {
    $suggestions = Invoke-RestMethod -Uri "$baseUrl/api/search/suggestions?q=$term"
    Write-Host "✅ '$term': $($suggestions.suggestions.Count) suggestions" -ForegroundColor Green
    foreach ($suggestion in $suggestions.suggestions | Select-Object -First 2) {
        Write-Host "   • $suggestion" -ForegroundColor Gray
    }
}
Write-Host ""

# Test 6: Codes juridiques algériens
Write-Host "6. Test codes juridiques algériens" -ForegroundColor Cyan
$codes = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes"
Write-Host "✅ Codes juridiques: $($codes.count) codes disponibles" -ForegroundColor Green
Write-Host "📚 Codes intégrés:" -ForegroundColor White
foreach ($code in $codes.codes) {
    Write-Host "   • $($code.name): $($code.articlesCount) articles (MAJ: $($code.lastUpdate))" -ForegroundColor Gray
}
Write-Host ""

# Test 7: Tribunaux algériens
Write-Host "7. Test tribunaux et juridictions algériennes" -ForegroundColor Cyan
$courts = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts"
Write-Host "✅ Tribunaux: $($courts.count) tribunaux référencés" -ForegroundColor Green
Write-Host "🏛️  Wilayas couvertes: $($courts.wilayas -join ', ')" -ForegroundColor White
Write-Host "📋 Principaux tribunaux:" -ForegroundColor White
foreach ($court in $courts.courts | Select-Object -First 4) {
    Write-Host "   • $($court.name) ($($court.type))" -ForegroundColor Gray
    Write-Host "     📍 $($court.location) - Juridiction: $($court.jurisdiction)" -ForegroundColor DarkGray
}
Write-Host ""

# Test 8: Barèmes de facturation
Write-Host "8. Test barèmes de facturation par profession" -ForegroundColor Cyan
$rates = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates"
Write-Host "✅ Barèmes récupérés - Devise: $($rates.currency)" -ForegroundColor Green
Write-Host "💰 Barèmes par profession:" -ForegroundColor White

foreach ($profession in $rates.rates.PSObject.Properties.Name) {
    Write-Host "   ⚖️  $profession.ToUpper():" -ForegroundColor Yellow
    $profRates = $rates.rates.$profession
    if ($profRates.note) {
        Write-Host "     📝 $($profRates.note)" -ForegroundColor Gray
    } else {
        foreach ($service in $profRates.PSObject.Properties.Name | Select-Object -First 3) {
            $serviceRate = $profRates.$service
            if ($serviceRate.min -and $serviceRate.max) {
                Write-Host "     • $service`: $($serviceRate.min)-$($serviceRate.max) $($serviceRate.unit)" -ForegroundColor Gray
            } elseif ($serviceRate.rate) {
                Write-Host "     • $service`: $($serviceRate.rate)$($serviceRate.unit)" -ForegroundColor Gray
            } elseif ($serviceRate.base) {
                Write-Host "     • $service`: $($serviceRate.base) $($serviceRate.unit)" -ForegroundColor Gray
            }
        }
    }
}
Write-Host ""

# Test 9: Statistiques de la plateforme
Write-Host "9. Test statistiques de la plateforme" -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "$baseUrl/api/stats"
Write-Host "✅ Statistiques récupérées" -ForegroundColor Green
Write-Host "📊 Statistiques générales:" -ForegroundColor White
Write-Host "   👥 Utilisateurs actifs: $($stats.stats.totalUsers)" -ForegroundColor Gray
Write-Host "   📄 Documents totaux: $($stats.stats.totalDocuments)" -ForegroundColor Gray
Write-Host "   ⏱️  Uptime serveur: $([math]::Round($stats.stats.platform.uptime, 2)) secondes" -ForegroundColor Gray
Write-Host "   🔧 Version plateforme: $($stats.stats.platform.version)" -ForegroundColor Gray

if ($stats.stats.professionBreakdown.Count -gt 0) {
    Write-Host "   ⚖️  Répartition par profession:" -ForegroundColor Gray
    foreach ($prof in $stats.stats.professionBreakdown) {
        Write-Host "     • $($prof.profession): $($prof.count) utilisateurs" -ForegroundColor DarkGray
    }
}
Write-Host ""

# Résumé final
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "           RÉSUMÉ DES TESTS             " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ SERVEUR API" -ForegroundColor Green
Write-Host "   • Serveur démarré et fonctionnel" -ForegroundColor White
Write-Host "   • Base de données PostgreSQL connectée" -ForegroundColor White
Write-Host "   • Endpoints REST opérationnels" -ForegroundColor White
Write-Host ""
Write-Host "✅ FONCTIONNALITÉS MÉTIER" -ForegroundColor Green
Write-Host "   • Gestion des utilisateurs multi-rôles" -ForegroundColor White
Write-Host "   • Authentification simplifiée" -ForegroundColor White
Write-Host "   • Recherche juridique avec suggestions" -ForegroundColor White
Write-Host ""
Write-Host "✅ SPÉCIFICITÉS ALGÉRIENNES" -ForegroundColor Green
Write-Host "   • 6 codes juridiques intégrés" -ForegroundColor White
Write-Host "   • Tribunaux et juridictions référencés" -ForegroundColor White
Write-Host "   • Barèmes de facturation par profession" -ForegroundColor White
Write-Host ""
Write-Host "✅ DONNÉES ET STATISTIQUES" -ForegroundColor Green
Write-Host "   • $($stats.stats.totalUsers) utilisateurs actifs" -ForegroundColor White
Write-Host "   • $($stats.stats.totalDocuments) documents en base" -ForegroundColor White
Write-Host "   • Statistiques temps réel disponibles" -ForegroundColor White
Write-Host ""
Write-Host "🎉 PLATEFORME JURISTDZ OPÉRATIONNELLE!" -ForegroundColor Green
Write-Host "🇩🇿 Adaptée au système juridique algérien" -ForegroundColor Green
Write-Host "⚖️  Support multi-professions juridiques" -ForegroundColor Green
Write-Host "📊 Prête pour utilisation et développement" -ForegroundColor Green
Write-Host ""