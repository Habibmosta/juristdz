# Test Simple JuristDZ
$baseUrl = "http://localhost:3000"

Write-Host "JURISTDZ - TEST SIMPLE" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta
Write-Host ""

# Test 1: Serveur
Write-Host "1. Test serveur..." -ForegroundColor Cyan
try {
    $server = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5
    Write-Host "   OK - Serveur operationnel - Version $($server.version)" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Serveur inaccessible" -ForegroundColor Red
    exit 1
}

# Test 2: Base de donnees
Write-Host "2. Test base de donnees..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 5
    Write-Host "   OK - Base connectee - $($health.stats.users) utilisateurs" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Probleme base de donnees" -ForegroundColor Red
}

# Test 3: Utilisateurs
Write-Host "3. Test utilisateurs..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 5
    Write-Host "   OK - $($users.count) utilisateurs trouves" -ForegroundColor Green
    
    # Afficher quelques utilisateurs
    Write-Host "   Exemples d'utilisateurs:" -ForegroundColor Yellow
    foreach ($user in $users.users | Select-Object -First 3) {
        Write-Host "     - $($user.email) ($($user.profession))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR - Probleme utilisateurs" -ForegroundColor Red
}

# Test 4: Codes algeriens
Write-Host "4. Test codes juridiques algeriens..." -ForegroundColor Cyan
try {
    $codes = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes" -TimeoutSec 5
    $totalArticles = ($codes.codes | Measure-Object articlesCount -Sum).Sum
    Write-Host "   OK - $($codes.count) codes - $totalArticles articles" -ForegroundColor Green
    
    # Afficher les codes
    Write-Host "   Codes disponibles:" -ForegroundColor Yellow
    foreach ($code in $codes.codes) {
        Write-Host "     - $($code.name): $($code.articlesCount) articles" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR - Probleme codes juridiques" -ForegroundColor Red
}

# Test 5: Tribunaux
Write-Host "5. Test tribunaux algeriens..." -ForegroundColor Cyan
try {
    $courts = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts" -TimeoutSec 5
    Write-Host "   OK - $($courts.count) tribunaux - $($courts.wilayas.Count) wilayas" -ForegroundColor Green
    
    # Afficher quelques tribunaux
    Write-Host "   Principaux tribunaux:" -ForegroundColor Yellow
    foreach ($court in $courts.courts | Select-Object -First 3) {
        Write-Host "     - $($court.name) ($($court.location))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR - Probleme tribunaux" -ForegroundColor Red
}

# Test 6: Facturation
Write-Host "6. Test facturation..." -ForegroundColor Cyan
try {
    $billing = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 5
    $professions = $billing.rates.PSObject.Properties.Name.Count
    Write-Host "   OK - Baremes pour $professions professions" -ForegroundColor Green
    
    # Afficher les professions
    Write-Host "   Professions supportees:" -ForegroundColor Yellow
    foreach ($prof in $billing.rates.PSObject.Properties.Name) {
        Write-Host "     - $prof" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR - Probleme facturation" -ForegroundColor Red
}

# Test 7: Authentification
Write-Host "7. Test authentification..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 5
    if ($users.users.Count -gt 0) {
        $testUser = $users.users[0]
        $loginBody = @{ email = $testUser.email } | ConvertTo-Json
        $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/simple-login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 5
        Write-Host "   OK - Connexion reussie pour $($login.user.email)" -ForegroundColor Green
        Write-Host "     Token: $($login.token)" -ForegroundColor Gray
    } else {
        Write-Host "   ATTENTION - Aucun utilisateur pour test" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERREUR - Probleme authentification" -ForegroundColor Red
}

Write-Host ""
Write-Host "TEST SIMPLE TERMINE!" -ForegroundColor Green
Write-Host "Tous les composants principaux ont ete testes." -ForegroundColor White
Write-Host ""