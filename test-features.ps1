# Tests des fonctionnalités JuristDZ
$baseUrl = "http://localhost:3000"

Write-Host "=== Tests Fonctionnalités JuristDZ ===" -ForegroundColor Magenta

# Test 1: Serveur
Write-Host "1. Test serveur..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/"
    Write-Host "✅ Serveur OK - Version: $($response.version)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur serveur" -ForegroundColor Red
    exit 1
}

# Test 2: Inscription avocat
Write-Host "2. Test inscription avocat..." -ForegroundColor Cyan
$registerBody = @{
    email = "avocat.test@juristdz.com"
    password = "SecurePass123!"
    firstName = "Ahmed"
    lastName = "BENALI"
    profession = "avocat"
    organizationName = "Cabinet BENALI"
    barNumber = "ALG-2020-001"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Avocat créé: $($response.user.email)" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Avocat existe déjà" -ForegroundColor Yellow
}

# Test 3: Connexion
Write-Host "3. Test connexion..." -ForegroundColor Cyan
$loginBody = @{
    email = "avocat.test@juristdz.com"
    password = "SecurePass123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Connexion OK" -ForegroundColor Green
    $token = $loginResponse.token
    $headers = @{ Authorization = "Bearer $token" }
    
    # Test 4: Profil
    Write-Host "4. Test profil..." -ForegroundColor Cyan
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Headers $headers
    Write-Host "✅ Profil: $($profileResponse.user.profession)" -ForegroundColor Green
    
    # Test 5: Recherche suggestions
    Write-Host "5. Test recherche..." -ForegroundColor Cyan
    $suggestionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/search/suggestions?q=contrat"
    Write-Host "✅ Suggestions: $($suggestionsResponse.suggestions.Count) résultats" -ForegroundColor Green
    
    # Test 6: Codes juridiques
    Write-Host "6. Test codes juridiques..." -ForegroundColor Cyan
    $codesResponse = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes"
    Write-Host "✅ Codes: $($codesResponse.count) codes disponibles" -ForegroundColor Green
    
    # Test 7: Tribunaux
    Write-Host "7. Test tribunaux..." -ForegroundColor Cyan
    $courtsResponse = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts"
    Write-Host "✅ Tribunaux: $($courtsResponse.count) tribunaux" -ForegroundColor Green
    
    # Test 8: Barèmes
    Write-Host "8. Test barèmes..." -ForegroundColor Cyan
    $ratesResponse = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -Headers $headers
    Write-Host "✅ Barèmes pour: $($ratesResponse.profession)" -ForegroundColor Green
    
    # Test 9: Calcul facturation
    Write-Host "9. Test calcul facturation..." -ForegroundColor Cyan
    $calculationBody = @{
        type = "consultation"
        hours = 2
        complexity = "normal"
    } | ConvertTo-Json
    
    $calcResponse = Invoke-RestMethod -Uri "$baseUrl/api/billing/calculate" -Method POST -Body $calculationBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Calcul: $($calcResponse.calculation.total) DZD" -ForegroundColor Green
    
    # Test 10: Documents
    Write-Host "10. Test documents..." -ForegroundColor Cyan
    $documentsResponse = Invoke-RestMethod -Uri "$baseUrl/api/documents" -Headers $headers
    Write-Host "✅ Documents: $($documentsResponse.count) documents" -ForegroundColor Green
    
}
catch {
    Write-Host "❌ Erreur tests authentifiés: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Tests terminés!" -ForegroundColor Green