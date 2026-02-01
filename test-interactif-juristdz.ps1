# Script de Test Interactif JuristDZ
# Ce script vous guide à travers tous les tests de la plateforme

$baseUrl = "http://localhost:3000"

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "    JURISTDZ - TESTS INTERACTIFS        " -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Choisissez un test à effectuer :" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1.  Test de base - Informations serveur" -ForegroundColor White
    Write-Host "2.  Test santé système et statistiques" -ForegroundColor White
    Write-Host "3.  Test gestion des utilisateurs" -ForegroundColor White
    Write-Host "4.  Test authentification simple" -ForegroundColor White
    Write-Host "5.  Test recherche juridique" -ForegroundColor White
    Write-Host "6.  Test codes juridiques algériens" -ForegroundColor White
    Write-Host "7.  Test tribunaux et juridictions" -ForegroundColor White
    Write-Host "8.  Test barèmes de facturation" -ForegroundColor White
    Write-Host "9.  Test complet automatique" -ForegroundColor Yellow
    Write-Host "10. Test par rôle professionnel" -ForegroundColor Green
    Write-Host "11. Créer un nouvel utilisateur test" -ForegroundColor Cyan
    Write-Host "0.  Quitter" -ForegroundColor Red
    Write-Host ""
}

function Test-ServerInfo {
    Write-Host "=== TEST 1: INFORMATIONS SERVEUR ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 10
        Write-Host "✅ Serveur accessible" -ForegroundColor Green
        Write-Host "📋 Message: $($response.message)" -ForegroundColor White
        Write-Host "🔢 Version: $($response.version)" -ForegroundColor White
        Write-Host "⚡ Status: $($response.status)" -ForegroundColor White
        Write-Host "🕒 Timestamp: $($response.timestamp)" -ForegroundColor White
        Write-Host ""
        Write-Host "🔧 Fonctionnalités disponibles:" -ForegroundColor Yellow
        foreach ($feature in $response.features) {
            Write-Host "   • $feature" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Health {
    Write-Host "=== TEST 2: SANTÉ SYSTÈME ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 10
        Write-Host "✅ Système en bonne santé" -ForegroundColor Green
        Write-Host "📊 Status: $($response.status)" -ForegroundColor White
        Write-Host "🗄️  Base de données: $($response.database)" -ForegroundColor White
        Write-Host "🕒 Timestamp: $($response.timestamp)" -ForegroundColor White
        Write-Host ""
        Write-Host "📈 Statistiques:" -ForegroundColor Yellow
        Write-Host "   👥 Utilisateurs: $($response.stats.users)" -ForegroundColor Gray
        Write-Host "   📄 Documents: $($response.stats.documents)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Users {
    Write-Host "=== TEST 3: GESTION UTILISATEURS ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 10
        Write-Host "✅ Utilisateurs récupérés: $($response.count)" -ForegroundColor Green
        Write-Host ""
        Write-Host "👥 Liste des utilisateurs:" -ForegroundColor Yellow
        foreach ($user in $response.users) {
            Write-Host "   📧 Email: $($user.email)" -ForegroundColor White
            Write-Host "   👤 Nom: $($user.first_name) $($user.last_name)" -ForegroundColor Gray
            Write-Host "   ⚖️  Profession: $($user.profession)" -ForegroundColor Gray
            Write-Host "   🏢 Organisation: $($user.organization_name)" -ForegroundColor Gray
            Write-Host "   📅 Créé le: $($user.created_at)" -ForegroundColor DarkGray
            Write-Host "   ---" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Authentication {
    Write-Host "=== TEST 4: AUTHENTIFICATION ===" -ForegroundColor Cyan
    try {
        # D'abord récupérer la liste des utilisateurs
        $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 10
        if ($users.users.Count -gt 0) {
            $testUser = $users.users[0]
            Write-Host "🧪 Test de connexion avec: $($testUser.email)" -ForegroundColor Yellow
            
            $loginBody = @{ email = $testUser.email } | ConvertTo-Json
            $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/simple-login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
            
            Write-Host "✅ Connexion réussie!" -ForegroundColor Green
            Write-Host "🎫 Token: $($loginResponse.token)" -ForegroundColor White
            Write-Host "👤 Utilisateur connecté:" -ForegroundColor Yellow
            Write-Host "   📧 Email: $($loginResponse.user.email)" -ForegroundColor Gray
            Write-Host "   👤 Nom: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
            Write-Host "   ⚖️  Profession: $($loginResponse.user.profession)" -ForegroundColor Gray
            Write-Host "   🏢 Organisation: $($loginResponse.user.organization)" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Aucun utilisateur disponible pour test" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Search {
    Write-Host "=== TEST 5: RECHERCHE JURIDIQUE ===" -ForegroundColor Cyan
    $searchTerms = @("contrat", "civil", "penal", "tribunal", "avocat", "notaire")
    
    foreach ($term in $searchTerms) {
        try {
            Write-Host "🔍 Recherche pour: '$term'" -ForegroundColor Yellow
            $response = Invoke-RestMethod -Uri "$baseUrl/api/search/suggestions?q=$term" -TimeoutSec 10
            Write-Host "✅ $($response.suggestions.Count) suggestions trouvées" -ForegroundColor Green
            foreach ($suggestion in $response.suggestions) {
                Write-Host "   • $suggestion" -ForegroundColor Gray
            }
            Write-Host ""
        } catch {
            Write-Host "❌ Erreur pour '$term': $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-AlgerianCodes {
    Write-Host "=== TEST 6: CODES JURIDIQUES ALGÉRIENS ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes" -TimeoutSec 10
        Write-Host "✅ $($response.count) codes juridiques intégrés" -ForegroundColor Green
        Write-Host "🔄 Dernière synchronisation: $($response.lastSync)" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 Codes disponibles:" -ForegroundColor Yellow
        
        $totalArticles = 0
        foreach ($code in $response.codes) {
            Write-Host "   📖 $($code.name)" -ForegroundColor White
            Write-Host "      📝 Description: $($code.description)" -ForegroundColor Gray
            Write-Host "      📊 Articles: $($code.articlesCount)" -ForegroundColor Gray
            Write-Host "      📅 Dernière MAJ: $($code.lastUpdate)" -ForegroundColor Gray
            Write-Host "      ⚡ Status: $($code.status)" -ForegroundColor Gray
            $totalArticles += $code.articlesCount
            Write-Host ""
        }
        Write-Host "📊 TOTAL: $totalArticles articles juridiques algériens" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Courts {
    Write-Host "=== TEST 7: TRIBUNAUX ET JURIDICTIONS ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts" -TimeoutSec 10
        Write-Host "✅ $($response.count) tribunaux référencés" -ForegroundColor Green
        Write-Host "🏛️  Wilayas couvertes: $($response.wilayas -join ', ')" -ForegroundColor White
        Write-Host ""
        Write-Host "⚖️  Tribunaux par type:" -ForegroundColor Yellow
        
        $courtsByType = $response.courts | Group-Object type
        foreach ($group in $courtsByType) {
            Write-Host "   🏛️  $($group.Name.ToUpper()) ($($group.Count) tribunaux)" -ForegroundColor White
            foreach ($court in $group.Group) {
                Write-Host "      • $($court.name)" -ForegroundColor Gray
                Write-Host "        📍 $($court.location) - $($court.jurisdiction)" -ForegroundColor DarkGray
                Write-Host "        📞 $($court.phone)" -ForegroundColor DarkGray
            }
            Write-Host ""
        }
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Billing {
    Write-Host "=== TEST 8: BARÈMES DE FACTURATION ===" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 10
        Write-Host "✅ Barèmes récupérés" -ForegroundColor Green
        Write-Host "💰 Devise: $($response.currency)" -ForegroundColor White
        Write-Host "📅 Dernière MAJ: $($response.lastUpdate)" -ForegroundColor White
        Write-Host "📝 Note: $($response.note)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚖️  Barèmes par profession:" -ForegroundColor Yellow
        
        foreach ($profession in $response.rates.PSObject.Properties.Name) {
            Write-Host "   👨‍⚖️ $($profession.ToUpper())" -ForegroundColor White
            $profRates = $response.rates.$profession
            
            if ($profRates.note) {
                Write-Host "      📝 $($profRates.note)" -ForegroundColor Gray
            } else {
                foreach ($service in $profRates.PSObject.Properties.Name) {
                    $serviceRate = $profRates.$service
                    Write-Host "      • $service" -ForegroundColor Gray
                    if ($serviceRate.min -and $serviceRate.max) {
                        Write-Host "        💰 $($serviceRate.min) - $($serviceRate.max) $($serviceRate.unit)" -ForegroundColor DarkGray
                    } elseif ($serviceRate.rate) {
                        Write-Host "        💰 $($serviceRate.rate) $($serviceRate.unit)" -ForegroundColor DarkGray
                    } elseif ($serviceRate.base) {
                        Write-Host "        💰 $($serviceRate.base) $($serviceRate.unit)" -ForegroundColor DarkGray
                    }
                }
            }
            Write-Host ""
        }
    } catch {
        Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-Complete {
    Write-Host "=== TEST 9: TEST COMPLET AUTOMATIQUE ===" -ForegroundColor Cyan
    Write-Host "🚀 Exécution de tous les tests..." -ForegroundColor Yellow
    Write-Host ""
    
    Test-ServerInfo
    Test-Health
    Test-Users
    Test-Authentication
    Test-Search
    Test-AlgerianCodes
    Test-Courts
    Test-Billing
    
    Write-Host "🎉 TOUS LES TESTS TERMINÉS!" -ForegroundColor Green
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Test-ByRole {
    Write-Host "=== TEST 10: TEST PAR RÔLE PROFESSIONNEL ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Choisissez un rôle à tester :" -ForegroundColor Yellow
    Write-Host "1. Avocat" -ForegroundColor White
    Write-Host "2. Notaire" -ForegroundColor White
    Write-Host "3. Huissier" -ForegroundColor White
    Write-Host "4. Magistrat" -ForegroundColor White
    Write-Host "5. Étudiant en Droit" -ForegroundColor White
    Write-Host "6. Juriste Entreprise" -ForegroundColor White
    Write-Host "7. Administrateur" -ForegroundColor White
    Write-Host ""
    
    $roleChoice = Read-Host "Votre choix (1-7)"
    
    $roles = @{
        "1" = @{ name = "avocat"; display = "Avocat" }
        "2" = @{ name = "notaire"; display = "Notaire" }
        "3" = @{ name = "huissier"; display = "Huissier" }
        "4" = @{ name = "magistrat"; display = "Magistrat" }
        "5" = @{ name = "etudiant"; display = "Étudiant en Droit" }
        "6" = @{ name = "juriste_entreprise"; display = "Juriste Entreprise" }
        "7" = @{ name = "administrateur"; display = "Administrateur" }
    }
    
    if ($roles.ContainsKey($roleChoice)) {
        $selectedRole = $roles[$roleChoice]
        Write-Host ""
        Write-Host "🧪 Test spécifique pour: $($selectedRole.display)" -ForegroundColor Green
        
        # Test des barèmes pour ce rôle
        try {
            $billing = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 10
            $roleRates = $billing.rates.($selectedRole.name)
            
            Write-Host "💰 Barèmes de facturation pour $($selectedRole.display):" -ForegroundColor Yellow
            if ($roleRates.note) {
                Write-Host "   📝 $($roleRates.note)" -ForegroundColor Gray
            } else {
                foreach ($service in $roleRates.PSObject.Properties.Name) {
                    $rate = $roleRates.$service
                    Write-Host "   • $service" -ForegroundColor White
                    if ($rate.min -and $rate.max) {
                        Write-Host "     💰 $($rate.min) - $($rate.max) $($rate.unit)" -ForegroundColor Gray
                    } elseif ($rate.rate) {
                        Write-Host "     💰 $($rate.rate) $($rate.unit)" -ForegroundColor Gray
                    } elseif ($rate.base) {
                        Write-Host "     💰 $($rate.base) $($rate.unit)" -ForegroundColor Gray
                    }
                }
            }
        } catch {
            Write-Host "❌ Erreur lors du test du rôle: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

function Create-TestUser {
    Write-Host "=== TEST 11: CRÉER UTILISATEUR TEST ===" -ForegroundColor Cyan
    Write-Host "⚠️  Cette fonctionnalité nécessiterait l'endpoint POST /api/users" -ForegroundColor Yellow
    Write-Host "📝 Pour l'instant, vous pouvez ajouter des utilisateurs directement en base" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemple de requête SQL pour ajouter un utilisateur :" -ForegroundColor Gray
    Write-Host "INSERT INTO users (id, email, first_name, last_name, is_active) VALUES" -ForegroundColor DarkGray
    Write-Host "(gen_random_uuid(), 'test@example.com', 'Test', 'User', true);" -ForegroundColor DarkGray
    Write-Host ""
    Read-Host "Appuyez sur Entrée pour continuer"
}

# Boucle principale
do {
    Show-Menu
    $choice = Read-Host "Votre choix"
    
    switch ($choice) {
        "1" { Test-ServerInfo }
        "2" { Test-Health }
        "3" { Test-Users }
        "4" { Test-Authentication }
        "5" { Test-Search }
        "6" { Test-AlgerianCodes }
        "7" { Test-Courts }
        "8" { Test-Billing }
        "9" { Test-Complete }
        "10" { Test-ByRole }
        "11" { Create-TestUser }
        "0" { 
            Write-Host "Au revoir !" -ForegroundColor Green
            break
        }
        default { 
            Write-Host "Choix invalide. Appuyez sur Entrée pour continuer." -ForegroundColor Red
            Read-Host
        }
    }
} while ($choice -ne "0")