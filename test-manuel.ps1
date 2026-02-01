# Test Manuel JuristDZ - Interface Interactive
$baseUrl = "http://localhost:3000"

function Show-Welcome {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                    JURISTDZ - TESTS MANUELS                  ║" -ForegroundColor Magenta
    Write-Host "║              Plateforme Juridique Multi-Roles                ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Bienvenue dans l'interface de test de JuristDZ !" -ForegroundColor Green
    Write-Host "Cette plateforme supporte 7 roles professionnels algeriens." -ForegroundColor White
    Write-Host ""
}

function Test-Connection {
    Write-Host "Test de connexion au serveur..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5
        Write-Host "✓ Serveur accessible - Version $($response.version)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Serveur inaccessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Show-UserMenu {
    Write-Host ""
    Write-Host "=== GESTION DES UTILISATEURS ===" -ForegroundColor Cyan
    Write-Host "1. Lister tous les utilisateurs" -ForegroundColor White
    Write-Host "2. Tester la connexion d'un utilisateur" -ForegroundColor White
    Write-Host "3. Voir les statistiques utilisateurs" -ForegroundColor White
    Write-Host "0. Retour au menu principal" -ForegroundColor Gray
    Write-Host ""
}

function Show-LegalMenu {
    Write-Host ""
    Write-Host "=== SYSTEME JURIDIQUE ALGERIEN ===" -ForegroundColor Cyan
    Write-Host "1. Voir les codes juridiques" -ForegroundColor White
    Write-Host "2. Voir les tribunaux et juridictions" -ForegroundColor White
    Write-Host "3. Rechercher dans la jurisprudence" -ForegroundColor White
    Write-Host "0. Retour au menu principal" -ForegroundColor Gray
    Write-Host ""
}

function Show-BillingMenu {
    Write-Host ""
    Write-Host "=== FACTURATION PAR PROFESSION ===" -ForegroundColor Cyan
    Write-Host "1. Voir tous les baremes" -ForegroundColor White
    Write-Host "2. Baremes Avocat" -ForegroundColor White
    Write-Host "3. Baremes Notaire" -ForegroundColor White
    Write-Host "4. Baremes Huissier" -ForegroundColor White
    Write-Host "5. Baremes Juriste Entreprise" -ForegroundColor White
    Write-Host "0. Retour au menu principal" -ForegroundColor Gray
    Write-Host ""
}

function List-Users {
    Write-Host "=== LISTE DES UTILISATEURS ===" -ForegroundColor Yellow
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 10
        Write-Host "Total: $($users.count) utilisateurs" -ForegroundColor Green
        Write-Host ""
        
        $i = 1
        foreach ($user in $users.users) {
            Write-Host "$i. $($user.email)" -ForegroundColor White
            Write-Host "   Nom: $($user.first_name) $($user.last_name)" -ForegroundColor Gray
            Write-Host "   Profession: $($user.profession)" -ForegroundColor Cyan
            Write-Host "   Organisation: $($user.organization_name)" -ForegroundColor Gray
            Write-Host ""
            $i++
        }
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Test-UserLogin {
    Write-Host "=== TEST DE CONNEXION ===" -ForegroundColor Yellow
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 10
        Write-Host "Utilisateurs disponibles:" -ForegroundColor White
        
        $i = 1
        foreach ($user in $users.users) {
            Write-Host "$i. $($user.email) ($($user.profession))" -ForegroundColor Cyan
            $i++
        }
        
        Write-Host ""
        $choice = Read-Host "Choisissez un utilisateur (1-$($users.users.Count))"
        
        if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $users.users.Count) {
            $selectedUser = $users.users[[int]$choice - 1]
            Write-Host ""
            Write-Host "Test de connexion pour: $($selectedUser.email)" -ForegroundColor Yellow
            
            $loginBody = @{ email = $selectedUser.email } | ConvertTo-Json
            $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/simple-login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
            
            Write-Host "✓ Connexion reussie!" -ForegroundColor Green
            Write-Host "Token: $($login.token)" -ForegroundColor Gray
            Write-Host "Utilisateur: $($login.user.firstName) $($login.user.lastName)" -ForegroundColor White
            Write-Host "Profession: $($login.user.profession)" -ForegroundColor Cyan
        } else {
            Write-Host "Choix invalide." -ForegroundColor Red
        }
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Show-UserStats {
    Write-Host "=== STATISTIQUES UTILISATEURS ===" -ForegroundColor Yellow
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -TimeoutSec 10
        $stats = Invoke-RestMethod -Uri "$baseUrl/api/stats" -TimeoutSec 10
        
        Write-Host "Total utilisateurs: $($users.count)" -ForegroundColor Green
        Write-Host ""
        
        # Repartition par profession
        $professionStats = $users.users | Group-Object profession
        Write-Host "Repartition par profession:" -ForegroundColor White
        foreach ($group in $professionStats) {
            Write-Host "  $($group.Name): $($group.Count) utilisateurs" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "Informations systeme:" -ForegroundColor White
        Write-Host "  Version plateforme: $($stats.stats.platform.version)" -ForegroundColor Gray
        Write-Host "  Uptime: $([math]::Round($stats.stats.platform.uptime, 2)) secondes" -ForegroundColor Gray
        Write-Host "  Documents: $($stats.stats.totalDocuments)" -ForegroundColor Gray
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Show-LegalCodes {
    Write-Host "=== CODES JURIDIQUES ALGERIENS ===" -ForegroundColor Yellow
    try {
        $codes = Invoke-RestMethod -Uri "$baseUrl/api/algerian-legal/codes" -TimeoutSec 10
        Write-Host "Nombre de codes: $($codes.count)" -ForegroundColor Green
        
        $totalArticles = 0
        foreach ($code in $codes.codes) {
            Write-Host ""
            Write-Host "📖 $($code.name)" -ForegroundColor White
            Write-Host "   Articles: $($code.articlesCount)" -ForegroundColor Cyan
            Write-Host "   Description: $($code.description)" -ForegroundColor Gray
            Write-Host "   Derniere MAJ: $($code.lastUpdate)" -ForegroundColor Gray
            $totalArticles += $code.articlesCount
        }
        
        Write-Host ""
        Write-Host "TOTAL: $totalArticles articles juridiques algeriens" -ForegroundColor Green
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Show-Courts {
    Write-Host "=== TRIBUNAUX ET JURIDICTIONS ===" -ForegroundColor Yellow
    try {
        $courts = Invoke-RestMethod -Uri "$baseUrl/api/algerian-specificities/courts" -TimeoutSec 10
        Write-Host "Nombre de tribunaux: $($courts.count)" -ForegroundColor Green
        Write-Host "Wilayas couvertes: $($courts.wilayas -join ', ')" -ForegroundColor White
        Write-Host ""
        
        # Grouper par type
        $courtsByType = $courts.courts | Group-Object type
        foreach ($group in $courtsByType) {
            Write-Host "🏛️ $($group.Name.ToUpper()) ($($group.Count) tribunaux)" -ForegroundColor Cyan
            foreach ($court in $group.Group) {
                Write-Host "   • $($court.name)" -ForegroundColor White
                Write-Host "     📍 $($court.location) - $($court.jurisdiction)" -ForegroundColor Gray
            }
            Write-Host ""
        }
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Test-Search {
    Write-Host "=== RECHERCHE JURIDIQUE ===" -ForegroundColor Yellow
    Write-Host "Entrez un terme de recherche (ou appuyez sur Entree pour des exemples):" -ForegroundColor White
    $searchTerm = Read-Host
    
    if ([string]::IsNullOrWhiteSpace($searchTerm)) {
        $searchTerms = @("contrat", "civil", "penal", "tribunal")
        Write-Host "Test avec des termes d'exemple:" -ForegroundColor Cyan
        foreach ($term in $searchTerms) {
            try {
                $search = Invoke-RestMethod -Uri "$baseUrl/api/search/suggestions?q=$term" -TimeoutSec 5
                Write-Host ""
                Write-Host "Terme: '$term'" -ForegroundColor White
                if ($search.suggestions.Count -gt 0) {
                    foreach ($suggestion in $search.suggestions) {
                        Write-Host "  • $suggestion" -ForegroundColor Green
                    }
                } else {
                    Write-Host "  Aucune suggestion" -ForegroundColor Gray
                }
            } catch {
                Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        try {
            $search = Invoke-RestMethod -Uri "$baseUrl/api/search/suggestions?q=$searchTerm" -TimeoutSec 5
            Write-Host ""
            Write-Host "Resultats pour: '$searchTerm'" -ForegroundColor White
            if ($search.suggestions.Count -gt 0) {
                foreach ($suggestion in $search.suggestions) {
                    Write-Host "  • $suggestion" -ForegroundColor Green
                }
            } else {
                Write-Host "  Aucune suggestion trouvee" -ForegroundColor Gray
            }
        } catch {
            Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Show-AllBilling {
    Write-Host "=== TOUS LES BAREMES DE FACTURATION ===" -ForegroundColor Yellow
    try {
        $billing = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 10
        Write-Host "Devise: $($billing.currency)" -ForegroundColor Green
        Write-Host "Derniere MAJ: $($billing.lastUpdate)" -ForegroundColor Gray
        Write-Host ""
        
        foreach ($profession in $billing.rates.PSObject.Properties.Name) {
            Write-Host "⚖️ $($profession.ToUpper())" -ForegroundColor Cyan
            $profRates = $billing.rates.$profession
            
            if ($profRates.note) {
                Write-Host "   📝 $($profRates.note)" -ForegroundColor Gray
            } else {
                foreach ($service in $profRates.PSObject.Properties.Name) {
                    $rate = $profRates.$service
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
            Write-Host ""
        }
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

function Show-ProfessionBilling($profession) {
    Write-Host "=== BAREMES $($profession.ToUpper()) ===" -ForegroundColor Yellow
    try {
        $billing = Invoke-RestMethod -Uri "$baseUrl/api/billing/rates" -TimeoutSec 10
        $profRates = $billing.rates.$profession
        
        if ($profRates.note) {
            Write-Host "📝 $($profRates.note)" -ForegroundColor Gray
        } else {
            Write-Host "Services et tarifs:" -ForegroundColor White
            foreach ($service in $profRates.PSObject.Properties.Name) {
                $rate = $profRates.$service
                Write-Host ""
                Write-Host "• $service" -ForegroundColor Cyan
                if ($rate.min -and $rate.max) {
                    Write-Host "  Fourchette: $($rate.min) - $($rate.max) $($rate.unit)" -ForegroundColor White
                } elseif ($rate.rate) {
                    Write-Host "  Taux: $($rate.rate) $($rate.unit)" -ForegroundColor White
                } elseif ($rate.base) {
                    Write-Host "  Base: $($rate.base) $($rate.unit)" -ForegroundColor White
                }
                if ($rate.frais) {
                    Write-Host "  Frais supplementaires: $($rate.frais)" -ForegroundColor Gray
                }
            }
        }
        
    } catch {
        Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Read-Host "Appuyez sur Entree pour continuer"
}

# Programme principal
Show-Welcome

if (-not (Test-Connection)) {
    Write-Host "Impossible de continuer sans connexion au serveur." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit
}

do {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                      MENU PRINCIPAL                         ║" -ForegroundColor Magenta
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Choisissez une categorie de tests :" -ForegroundColor White
    Write-Host ""
    Write-Host "1. 👥 Gestion des utilisateurs" -ForegroundColor Cyan
    Write-Host "2. ⚖️  Systeme juridique algerien" -ForegroundColor Cyan
    Write-Host "3. 💰 Facturation par profession" -ForegroundColor Cyan
    Write-Host "4. 📊 Statistiques globales" -ForegroundColor Cyan
    Write-Host "5. 🔍 Test de sante systeme" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "0. Quitter" -ForegroundColor Red
    Write-Host ""
    
    $mainChoice = Read-Host "Votre choix"
    
    switch ($mainChoice) {
        "1" {
            do {
                Clear-Host
                Show-UserMenu
                $userChoice = Read-Host "Votre choix"
                
                switch ($userChoice) {
                    "1" { List-Users }
                    "2" { Test-UserLogin }
                    "3" { Show-UserStats }
                    "0" { break }
                    default { Write-Host "Choix invalide" -ForegroundColor Red; Start-Sleep 1 }
                }
            } while ($userChoice -ne "0")
        }
        
        "2" {
            do {
                Clear-Host
                Show-LegalMenu
                $legalChoice = Read-Host "Votre choix"
                
                switch ($legalChoice) {
                    "1" { Show-LegalCodes }
                    "2" { Show-Courts }
                    "3" { Test-Search }
                    "0" { break }
                    default { Write-Host "Choix invalide" -ForegroundColor Red; Start-Sleep 1 }
                }
            } while ($legalChoice -ne "0")
        }
        
        "3" {
            do {
                Clear-Host
                Show-BillingMenu
                $billingChoice = Read-Host "Votre choix"
                
                switch ($billingChoice) {
                    "1" { Show-AllBilling }
                    "2" { Show-ProfessionBilling "avocat" }
                    "3" { Show-ProfessionBilling "notaire" }
                    "4" { Show-ProfessionBilling "huissier" }
                    "5" { Show-ProfessionBilling "juriste_entreprise" }
                    "0" { break }
                    default { Write-Host "Choix invalide" -ForegroundColor Red; Start-Sleep 1 }
                }
            } while ($billingChoice -ne "0")
        }
        
        "4" {
            Clear-Host
            Write-Host "=== STATISTIQUES GLOBALES ===" -ForegroundColor Yellow
            try {
                $stats = Invoke-RestMethod -Uri "$baseUrl/api/stats" -TimeoutSec 10
                Write-Host "Utilisateurs totaux: $($stats.stats.totalUsers)" -ForegroundColor Green
                Write-Host "Documents totaux: $($stats.stats.totalDocuments)" -ForegroundColor Green
                Write-Host "Version: $($stats.stats.platform.version)" -ForegroundColor White
                Write-Host "Uptime: $([math]::Round($stats.stats.platform.uptime, 2)) secondes" -ForegroundColor White
                Write-Host "Environnement: $($stats.stats.platform.environment)" -ForegroundColor Gray
            } catch {
                Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
            }
            Read-Host "Appuyez sur Entree pour continuer"
        }
        
        "5" {
            Clear-Host
            Write-Host "=== TEST DE SANTE SYSTEME ===" -ForegroundColor Yellow
            try {
                $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 10
                Write-Host "Status: $($health.status)" -ForegroundColor Green
                Write-Host "Base de donnees: $($health.database)" -ForegroundColor Green
                Write-Host "Utilisateurs: $($health.stats.users)" -ForegroundColor White
                Write-Host "Documents: $($health.stats.documents)" -ForegroundColor White
                Write-Host "Timestamp: $($health.timestamp)" -ForegroundColor Gray
            } catch {
                Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
            }
            Read-Host "Appuyez sur Entree pour continuer"
        }
        
        "0" {
            Write-Host "Au revoir !" -ForegroundColor Green
            break
        }
        
        default {
            Write-Host "Choix invalide" -ForegroundColor Red
            Start-Sleep 1
        }
    }
} while ($mainChoice -ne "0")