# Configuration Supabase Authentication

## Configuration dans Supabase Dashboard

### 1. Authentication → Providers → Email

**Chemin :** Dashboard → Authentication → Providers → Email

#### Paramètres recommandés pour votre système :

```
┌─────────────────────────────────────────────────────────────┐
│ Email Provider Settings                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ☑ Enable Email provider                                     │
│   Permet la connexion par email/mot de passe                │
│                                                              │
│ ☐ Confirm email                                             │
│   ❌ DÉSACTIVER - Validation par admin uniquement           │
│                                                              │
│ ☑ Enable email confirmations                                │
│   ⚠️ Si activé, l'utilisateur doit confirmer son email     │
│   ET attendre la validation admin (double validation)       │
│                                                              │
│ ☐ Secure email change                                       │
│   Optionnel - Demande confirmation pour changer email       │
│                                                              │
│ ☑ Enable password recovery                                  │
│   ✅ ACTIVER - Pour "Mot de passe oublié"                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Configuration Recommandée selon votre besoin :

#### Option A : Validation Admin UNIQUEMENT (Recommandé)

```yaml
Enable Email provider: ✅ OUI
Confirm email: ❌ NON
Enable password recovery: ✅ OUI
```

**Flux :**
1. Utilisateur s'inscrit
2. Compte créé avec `is_active = false`
3. Admin valide le compte
4. Utilisateur peut se connecter

**Avantages :**
- ✅ Contrôle total par l'admin
- ✅ Pas de spam possible
- ✅ Vérification manuelle de chaque compte
- ✅ Plus simple pour l'utilisateur (1 seule étape)

**Inconvénients :**
- ⚠️ Admin doit valider manuellement
- ⚠️ Pas de vérification automatique de l'email

---

#### Option B : Confirmation Email + Validation Admin (Double sécurité)

```yaml
Enable Email provider: ✅ OUI
Confirm email: ✅ OUI
Enable password recovery: ✅ OUI
```

**Flux :**
1. Utilisateur s'inscrit
2. Email de confirmation envoyé
3. Utilisateur clique sur le lien de confirmation
4. Compte confirmé mais `is_active = false`
5. Admin valide le compte
6. Utilisateur peut se connecter

**Avantages :**
- ✅ Vérification automatique de l'email
- ✅ Contrôle admin en plus
- ✅ Double sécurité
- ✅ Évite les faux emails

**Inconvénients :**
- ⚠️ 2 étapes pour l'utilisateur (email + admin)
- ⚠️ Plus complexe
- ⚠️ Risque que l'utilisateur oublie de confirmer

---

#### Option C : Confirmation Email UNIQUEMENT (Sans validation admin)

```yaml
Enable Email provider: ✅ OUI
Confirm email: ✅ OUI
Enable password recovery: ✅ OUI
```

**+ Modifier le code pour activer automatiquement :**

```typescript
// Dans AuthForm.tsx, après création du profil
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    profession,
    is_admin: false,
    is_active: true, // ← Changer à true
  });
```

**Flux :**
1. Utilisateur s'inscrit
2. Email de confirmation envoyé
3. Utilisateur clique sur le lien
4. Compte activé automatiquement
5. Utilisateur peut se connecter

**Avantages :**
- ✅ Activation automatique
- ✅ Vérification de l'email
- ✅ Pas d'intervention admin nécessaire

**Inconvénients :**
- ⚠️ Pas de contrôle admin
- ⚠️ N'importe qui peut s'inscrire
- ⚠️ Risque d'abus

---

## 2. Configuration Email Templates

**Chemin :** Dashboard → Authentication → Email Templates

### Template "Confirm Signup"

**Si vous activez "Confirm email" :**

```html
<h2>Confirmez votre inscription à JuristDZ</h2>

<p>Bonjour {{ .Name }},</p>

<p>Merci de vous être inscrit sur JuristDZ, l'assistant IA juridique algérien.</p>

<p>Pour confirmer votre adresse email, veuillez cliquer sur le lien ci-dessous :</p>

<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>

<p><strong>Note importante :</strong> Après confirmation de votre email, votre compte sera soumis à validation par notre équipe. Vous recevrez un email une fois votre compte activé.</p>

<p>Si vous n'avez pas créé de compte sur JuristDZ, vous pouvez ignorer cet email.</p>

<p>Cordialement,<br>L'équipe JuristDZ</p>
```

### Template "Reset Password"

**Toujours actif (pour "Mot de passe oublié") :**

```html
<h2>Réinitialisation de votre mot de passe JuristDZ</h2>

<p>Bonjour,</p>

<p>Vous avez demandé à réinitialiser votre mot de passe sur JuristDZ.</p>

<p>Pour créer un nouveau mot de passe, veuillez cliquer sur le lien ci-dessous :</p>

<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>

<p>Ce lien est valable pendant 1 heure.</p>

<p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>

<p>Cordialement,<br>L'équipe JuristDZ</p>
```

---

## 3. URL Configuration

**Chemin :** Dashboard → Authentication → URL Configuration

```yaml
Site URL: https://votre-domaine.com
# ou pour développement: http://localhost:5173

Redirect URLs:
  - https://votre-domaine.com/**
  - http://localhost:5173/**
  - https://votre-domaine.com/reset-password
  - http://localhost:5173/reset-password
```

---

## 4. Recommandation pour votre cas

### Configuration Recommandée : Option A (Validation Admin uniquement)

```yaml
┌─────────────────────────────────────────────────────────────┐
│ Configuration Recommandée                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Enable Email provider:        ✅ OUI                        │
│ Confirm email:                ❌ NON                        │
│ Enable password recovery:     ✅ OUI                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi ?**

1. **Contrôle total** : Vous validez chaque compte manuellement
2. **Simplicité** : L'utilisateur n'a qu'une seule étape (inscription)
3. **Flexibilité** : Vous pouvez vérifier les informations avant activation
4. **Modèle SaaS** : Correspond à votre modèle où l'admin gère les abonnements

**Workflow :**
```
Inscription → En attente → Admin valide → Utilisateur actif
```

---

## 5. Si vous voulez changer plus tard

### Passer de "Admin uniquement" à "Email + Admin"

1. **Dans Supabase Dashboard :**
   - Activer "Confirm email"

2. **Dans le code :**
   - Aucun changement nécessaire
   - Le système gérera automatiquement les 2 validations

3. **Comportement :**
   - Nouveaux utilisateurs : Email + Admin
   - Anciens utilisateurs : Déjà validés, pas d'impact

### Passer de "Admin uniquement" à "Email uniquement"

1. **Dans Supabase Dashboard :**
   - Activer "Confirm email"

2. **Dans le code (`src/components/auth/AuthForm.tsx`) :**
   ```typescript
   // Ligne ~120, changer is_active à true
   is_active: true, // Au lieu de false
   ```

3. **Dans le code (`src/components/auth/AuthForm.tsx`) :**
   ```typescript
   // Ligne ~150, changer status à 'active'
   status: 'active', // Au lieu de 'pending'
   ```

---

## 6. Configuration actuelle du code

Le code est actuellement configuré pour **Option A (Validation Admin uniquement)** :

```typescript
// AuthForm.tsx - Ligne ~120
is_active: false, // En attente de validation admin

// AuthForm.tsx - Ligne ~150
status: 'pending', // Abonnement en attente
```

**Pour activer une autre option, suivez les instructions ci-dessus.**

---

## 7. Test de la configuration

### Test 1 : Inscription sans confirmation email

1. Désactiver "Confirm email" dans Supabase
2. S'inscrire avec un nouveau compte
3. ✅ Pas d'email de confirmation reçu
4. ✅ Message "En attente de validation admin"
5. Admin active le compte
6. ✅ Connexion réussie

### Test 2 : Inscription avec confirmation email

1. Activer "Confirm email" dans Supabase
2. S'inscrire avec un nouveau compte
3. ✅ Email de confirmation reçu
4. Cliquer sur le lien de confirmation
5. ✅ Email confirmé
6. ✅ Message "En attente de validation admin"
7. Admin active le compte
8. ✅ Connexion réussie

### Test 3 : Mot de passe oublié

1. Activer "Enable password recovery" dans Supabase
2. Cliquer "Mot de passe oublié ?"
3. Entrer email
4. ✅ Email de réinitialisation reçu
5. Cliquer sur le lien
6. ✅ Page de réinitialisation affichée
7. Entrer nouveau mot de passe
8. ✅ Connexion avec nouveau mot de passe réussie

---

## 8. Résumé des paramètres

| Paramètre | Option A (Recommandé) | Option B | Option C |
|-----------|----------------------|----------|----------|
| Enable Email provider | ✅ | ✅ | ✅ |
| Confirm email | ❌ | ✅ | ✅ |
| Enable password recovery | ✅ | ✅ | ✅ |
| is_active dans code | false | false | true |
| status dans code | pending | pending | active |
| Validation admin | ✅ | ✅ | ❌ |
| Confirmation email | ❌ | ✅ | ✅ |

---

**Recommandation finale :** Utilisez **Option A** pour commencer, vous pourrez toujours activer la confirmation email plus tard si nécessaire.

---

**Date :** 2 mars 2026  
**Version :** 1.0
