# 📧 Désactiver la Confirmation d'Email dans Supabase

## 🎯 POURQUOI FAIRE ÇA?

Par défaut, Supabase envoie un email de confirmation à chaque nouvel utilisateur. Pour une application SaaS où VOUS créez les comptes, ce n'est pas nécessaire.

---

## 📍 OÙ TROUVER LE SETTING

### Étape 1: Aller dans Authentication

1. Ouvrir votre projet Supabase: https://supabase.com/dashboard
2. Sélectionner votre projet
3. Dans le menu de gauche, cliquer sur **"Authentication"**

### Étape 2: Aller dans Providers

1. Dans le sous-menu Authentication, cliquer sur **"Providers"**
2. Chercher la section **"Email"**
3. Cliquer sur **"Email"** pour ouvrir les paramètres

### Étape 3: Désactiver la Confirmation

1. Trouver l'option **"Confirm email"**
2. **Décocher** cette option
3. Cliquer sur **"Save"**

---

## 🔍 CHEMIN COMPLET

```
Dashboard Supabase
└── Votre Projet
    └── Authentication (menu gauche)
        └── Providers (sous-menu)
            └── Email (cliquer dessus)
                └── Confirm email (décocher)
                    └── Save
```

---

## ✅ RÉSULTAT

Après avoir désactivé:
- ✅ Les utilisateurs créés peuvent se connecter immédiatement
- ✅ Pas d'email de confirmation envoyé
- ✅ Pas besoin de cliquer sur un lien
- ✅ Parfait pour un système SaaS où l'admin crée les comptes

---

## ⚠️ ALTERNATIVE

Si vous ne trouvez toujours pas l'option, ce n'est PAS grave:
- Les utilisateurs peuvent déjà se connecter
- L'email de confirmation n'empêche pas la connexion
- Vous pouvez ignorer ce paramètre

---

**Date**: 2 mars 2026  
**Statut**: Optionnel - Pas bloquant pour votre application
