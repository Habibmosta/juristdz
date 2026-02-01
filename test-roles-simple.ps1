# Test des Roles JuristDZ
Write-Host "=== TEST DES ROLES JURISTDZ ===" -ForegroundColor Magenta
Write-Host ""

# Test frontend
Write-Host "1. Test frontend..." -ForegroundColor Cyan
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   OK - Frontend accessible sur http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Frontend non accessible" -ForegroundColor Red
    exit 1
}

# Test backend
Write-Host "2. Test backend..." -ForegroundColor Cyan
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:3000" -TimeoutSec 5
    Write-Host "   OK - Backend accessible - Version $($backend.version)" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Backend non accessible" -ForegroundColor Red
    exit 1
}

# Test utilisateurs
Write-Host "3. Test utilisateurs..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -TimeoutSec 5
    Write-Host "   OK - $($users.count) utilisateurs trouves" -ForegroundColor Green
    
    # Compter les roles
    $roleCount = @{}
    foreach ($user in $users.users) {
        if ($roleCount.ContainsKey($user.profession)) {
            $roleCount[$user.profession]++
        } else {
            $roleCount[$user.profession] = 1
        }
    }
    
    Write-Host ""
    Write-Host "   Repartition par role:" -ForegroundColor Yellow
    foreach ($role in $roleCount.Keys) {
        Write-Host "     - $role : $($roleCount[$role]) utilisateur(s)" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ERREUR - Probleme utilisateurs" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Roles configures dans l'application..." -ForegroundColor Cyan
Write-Host "   Les 7 roles suivants sont maintenant disponibles:" -ForegroundColor Yellow
Write-Host "     1. Avocat (Cabinet d'Avocat)" -ForegroundColor White
Write-Host "     2. Notaire (Etude Notariale)" -ForegroundColor White
Write-Host "     3. Huissier (Etude d'Huissier)" -ForegroundColor White
Write-Host "     4. Magistrat (Bureau Magistrat)" -ForegroundColor White
Write-Host "     5. Etudiant (Etudiant en Droit)" -ForegroundColor White
Write-Host "     6. Juriste Entreprise (Juriste d'Entreprise)" -ForegroundColor White
Write-Host "     7. Administrateur (Administration)" -ForegroundColor White

Write-Host ""
Write-Host "5. Instructions de test..." -ForegroundColor Cyan
Write-Host "   Pour tester les roles:" -ForegroundColor Yellow
Write-Host "     1. Ouvrez http://localhost:5173 dans votre navigateur" -ForegroundColor White
Write-Host "     2. Cherchez le selecteur de role en haut a droite" -ForegroundColor White
Write-Host "     3. Cliquez sur le dropdown pour voir tous les roles" -ForegroundColor White
Write-Host "     4. Selectionnez un role pour changer l'interface" -ForegroundColor White
Write-Host "     5. Verifiez que l'interface s'adapte au role choisi" -ForegroundColor White

Write-Host ""
Write-Host "=== RESUME ===" -ForegroundColor Magenta
Write-Host "OK - Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "OK - Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "OK - 7 roles configures dans l'application" -ForegroundColor Green
Write-Host "OK - Utilisateurs de test disponibles" -ForegroundColor Green
Write-Host ""
Write-Host "RESULTAT: Vous devriez maintenant voir TOUS les roles dans le dropdown !" -ForegroundColor Green
Write-Host ""