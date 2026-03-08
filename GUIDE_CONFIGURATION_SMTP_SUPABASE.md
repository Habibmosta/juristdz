# 📧 Guide: Personnaliser l'Expéditeur des Emails Supabase

## 🎯 Objectif
Changer l'expéditeur des emails de "Supabase Auth" à "JuristDZ Auth"

## ✅ Solution Recommandée: SMTP Personnalisé avec Brevo

### Pourquoi Brevo (ex-Sendinblue) ?
- ✅ **Gratuit** jusqu'à 300 emails/jour
- ✅ **Interface en français**
- ✅ **Facile à configurer**
- ✅ **Bon pour l'Algérie**
- ✅ **Statistiques détaillées**
- ✅ **Fiable et rapide**

---

## 📋 Étape 1: Créer un Compte Brevo

1. **Aller sur** https://www.brevo.com/fr/
2. **Cliquer sur "Inscription gratuite"**
3. **Remplir le formulaire:**
   - Email professionnel
   - Mot de passe
   - Nom de l'entreprise: JuristDZ
   - Pays: Algérie
4. **Confirmer votre email**
5. **Compléter le profil**

---

## 📋 Étape 2: Obtenir les Identifiants SMTP

1. **Se connecter à Brevo**
2. **Aller dans le menu:** Settings (⚙️) → SMTP & API
3. **Cliquer sur "SMTP"**
4. **Créer une nouvelle clé SMTP:**
   - Nom: "JuristDZ Supabase"
   - Cliquer sur "Generate"
5. **Copier les informations:**
   ```
   Host: smtp-relay.brevo.com
   Port: 587
   Login: votre-email@example.com
   Password: xsmtpsib-xxxxxxxxxxxxx (la clé générée)
   ```
6. **⚠️ IMPORTANT:** Sauvegarder la clé SMTP, elle ne sera plus visible après!

---

## 📋 Étape 3: Configurer Supabase

### 3.1 Aller dans Supabase Dashboard

1. **Ouvrir** https://supabase.com/dashboard
2. **Sélectionner votre projet** JuristDZ
3. **Aller dans:** Settings → Authentication

### 3.2 Configurer SMTP

1. **Scroller jusqu'à "SMTP Settings"**
2. **Cliquer sur "Enable Custom SMTP"** ✅
3. **Remplir les champs:**

```
┌─────────────────────────────────────────────────┐
│ SMTP Settings                                   │
├─────────────────────────────────────────────────┤
│ Enable Custom SMTP: ✅                          │
│                                                 │
│ Sender email:                                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ noreply@juristdz.com                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Sender name:                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ JuristDZ Auth                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Host:                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ smtp-relay.brevo.com                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Port number:                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 587                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Username:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ votre-email-brevo@example.com               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Password:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ xsmtpsib-xxxxxxxxxxxxx                      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Secure connection: TLS ▼                        │
│                                                 │
│ [Save]                                          │
└─────────────────────────────────────────────────┘
```

4. **Cliquer sur "Save"**

### 3.3 Tester la Configuration

1. **Scroller vers le bas**
2. **Cliquer sur "Send test email"**
3. **Entrer votre email**
4. **Vérifier la réception**
5. **Vérifier que l'expéditeur est "JuristDZ Auth"** ✅

---

## 📋 Étape 4: Personnaliser les Templates d'Email

### 4.1 Aller dans Email Templates

1. **Dans Supabase Dashboard:** Settings → Authentication
2. **Scroller jusqu'à "Email Templates"**
3. **Vous verrez plusieurs templates:**
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

### 4.2 Personnaliser "Reset Password"

1. **Cliquer sur "Reset Password"**
2. **Remplacer le contenu par le template fourni** (voir `email-templates/reset-password-template.html`)
3. **Cliquer sur "Save"**

### 4.3 Personnaliser "Confirm Signup"

1. **Cliquer sur "Confirm signup"**
2. **Remplacer le contenu par le template fourni** (voir `email-templates/confirm-signup-template.html`)
3. **Cliquer sur "Save"**

---

## 🎨 Personnalisation Avancée

### Variables Disponibles dans les Templates

```
{{ .Email }}              - Email de l'utilisateur
{{ .Token }}              - Token de confirmation
{{ .TokenHash }}          - Hash du token
{{ .SiteURL }}            - URL de votre site
{{ .ConfirmationURL }}    - URL complète de confirmation
{{ .RedirectTo }}         - URL de redirection
```

### Exemple d'Utilisation

```html
<p>Bonjour {{ .Email }},</p>
<a href="{{ .ConfirmationURL }}">Confirmer mon email</a>
```

---

## 🔧 Configuration URL de Redirection

### Dans Supabase Dashboard

1. **Settings → Authentication → URL Configuration**
2. **Site URL:**
   ```
   https://votre-domaine.com
   ```
   ou pour le développement:
   ```
   http://localhost:5173
   ```

3. **Redirect URLs (ajouter):**
   ```
   http://localhost:5173/**
   https://votre-domaine.com/**
   ```

---

## ✅ Vérification Finale

### Checklist

- [ ] Compte Brevo créé et vérifié
- [ ] Clé SMTP générée et sauvegardée
- [ ] SMTP configuré dans Supabase
- [ ] Email de test envoyé et reçu
- [ ] Expéditeur affiché comme "JuristDZ Auth"
- [ ] Templates personnalisés (Reset Password)
- [ ] Templates personnalisés (Confirm Signup)
- [ ] URL de redirection configurées
- [ ] Test complet du flux d'inscription
- [ ] Test complet du flux de réinitialisation

---

## 🚨 Dépannage

### Problème: Email non reçu

**Solutions:**
1. Vérifier les spams
2. Vérifier que l'email expéditeur est vérifié dans Brevo
3. Vérifier les logs dans Brevo Dashboard
4. Vérifier les logs dans Supabase Dashboard (Logs → Auth)

### Problème: Erreur SMTP

**Solutions:**
1. Vérifier le port (587 pour TLS, 465 pour SSL)
2. Vérifier le username (doit être votre email Brevo)
3. Vérifier le password (clé SMTP, pas votre mot de passe Brevo)
4. Vérifier que "Enable Custom SMTP" est activé

### Problème: Template ne s'affiche pas correctement

**Solutions:**
1. Vérifier que le HTML est valide
2. Tester avec un client email différent
3. Utiliser des styles inline (pas de CSS externe)
4. Éviter les JavaScript

---

## 📊 Alternatives à Brevo

### 1. SendGrid (Twilio)
```
Gratuit: 100 emails/jour
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: votre-api-key
```

### 2. Mailgun
```
Gratuit: 5000 emails/mois (3 mois)
Host: smtp.mailgun.org
Port: 587
Username: postmaster@votre-domaine
Password: votre-password
```

### 3. Gmail (Petits volumes)
```
Gratuit: ~500 emails/jour
Host: smtp.gmail.com
Port: 587
Username: votre-email@gmail.com
Password: App Password (pas votre mot de passe Gmail)
```

**Note:** Pour Gmail, vous devez activer l'authentification à 2 facteurs et créer un "App Password"

---

## 🎯 Résultat Final

Après configuration, vos utilisateurs recevront des emails:

**Avant:**
```
De: Supabase Auth <noreply@mail.app.supabase.io>
```

**Après:**
```
De: JuristDZ Auth <noreply@juristdz.com>
```

Avec un design professionnel aux couleurs de JuristDZ! 🎨

---

## 📞 Support

Si vous avez des questions:
- Documentation Brevo: https://help.brevo.com/
- Documentation Supabase: https://supabase.com/docs/guides/auth/auth-smtp
- Support JuristDZ: support@juristdz.com
