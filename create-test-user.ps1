# Créer un utilisateur de test
$baseUrl = "http://localhost:3000"

Write-Host "Création d'un utilisateur de test..." -ForegroundColor Cyan

$registerBody = @{
    email = "test.avocat.new@juristdz.com"
    password = "TestPassword123!"
    firstName = "Ahmed"
    lastName = "BENALI"
    profession = "avocat"
    organizationName = "Cabinet BENALI & Associés"
    barNumber = "ALG-2024-001"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Utilisateur créé avec succès!" -ForegroundColor Green
    Write-Host "📧 Email: $($response.user.email)" -ForegroundColor White
    Write-Host "👤 Nom: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor White
    Write-Host "⚖️  Profession: $($response.user.profession)" -ForegroundColor White
    Write-Host "🏢 Organisation: $($response.user.organizationName)" -ForegroundColor White
    
    # Test de connexion immédiat
    Write-Host ""
    Write-Host "Test de connexion..." -ForegroundColor Cyan
    
    $loginBody = @{
        email = "test.avocat.new@juristdz.com"
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "🔑 Token généré: $($loginResponse.token.Substring(0,20))..." -ForegroundColor White
    
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Détails: $responseBody" -ForegroundColor Yellow
    }
}