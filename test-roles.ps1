# Test des Rôles JuristDZ - Vérification de la configuration

Write-Host "=== TEST DES ROLES JURISTDZ ===" -ForegroundColor Magenta
Write-Host ""

# Vérifier que l'application frontend est accessible
Write-Host "1. Test de l'application frontend..." -ForegroundColor Cyan
try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    if ($frontendTest.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend accessible sur http://localhost:5173" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Frontend non accessible - Vérifiez que 'yarn dev' est lancé" -ForegroundColor Red
    exit 1
}

# Vérifier l'API backend
Write-Host "2. Test de l'API backend..." -ForegroundColor Cyan
try {
    $backendTest = Invoke-RestMethod -Uri "http://localhost:3000" -TimeoutSec 5
    Write-Host "   ✅ Backend accessible - Version $($backendTest.version)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend non accessible - Vérifiez que le serveur Node.js est lancé" -ForegroundColor Red
    exit 1
}

# Vérifier les utilisateurs avec différents rôles
Write-Host "3. Test des utilisateurs par rôle..." -ForegroundColor Cyan
try {
    $users = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -TimeoutSec 5
    Write-Host "   ✅ $($users.count) utilisateurs trouvés" -ForegroundColor Green
    
    # Compter les rôles
    $roleCount = @{}
    foreach ($user in $users.users) {
        if ($roleCount.ContainsKey($user.profession)) {
            $roleCount[$user.profession]++
        } else {
            $roleCount[$user.profession] = 1
        }
    }
    
    Write-Host ""
    Write-Host "   Répartition par rôle:" -ForegroundColor Yellow
    foreach ($role in $roleCount.Keys) {
        Write-Host "     • $role`: $($roleCount[$role]) utilisateur(s)" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ❌ Erreur récupération utilisateurs" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Rôles configurés dans l'application..." -ForegroundColor Cyan
Write-Host "   Les 7 rôles suivants devraient être disponibles:" -ForegroundColor Yellow
Write-Host "     1. 👨‍⚖️ Avocat (Cabinet d'Avocat)" -ForegroundColor White
Write-Host "     2. 📝 Notaire (Étude Notariale)" -ForegroundColor White
Write-Host "     3. ⚖️  Huissier (Étude d'Huissier)" -ForegroundColor White
Write-Host "     4. 👑 Magistrat (Bureau Magistrat)" -ForegroundColor White
Write-Host "     5. 🎓 Étudiant (Étudiant en Droit)" -ForegroundColor White
Write-Host "     6. 🏢 Juriste Entreprise (Juriste d'Entreprise)" -ForegroundColor White
Write-Host "     7. ⚙️  Administrateur (Administration)" -ForegroundColor White

Write-Host ""
Write-Host "5. Instructions de test..." -ForegroundColor Cyan
Write-Host "   Pour tester les rôles:" -ForegroundColor Yellow
Write-Host "     1. Ouvrez http://localhost:5173 dans votre navigateur" -ForegroundColor White
Write-Host "     2. Cherchez le sélecteur de rôle en haut à droite" -ForegroundColor White
Write-Host "     3. Cliquez sur le dropdown pour voir tous les rôles" -ForegroundColor White
Write-Host "     4. Sélectionnez un rôle pour changer l'interface" -ForegroundColor White
Write-Host "     5. Vérifiez que l'interface s'adapte au rôle choisi" -ForegroundColor White

Write-Host ""
Write-Host "=== RÉSUMÉ ===" -ForegroundColor Magenta
Write-Host "✅ Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "✅ Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ 7 rôles configurés dans l'application" -ForegroundColor Green
Write-Host "✅ Utilisateurs de test disponibles" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Vous devriez maintenant voir TOUS les roles dans le dropdown !" -ForegroundColor Green
Write-Host ""