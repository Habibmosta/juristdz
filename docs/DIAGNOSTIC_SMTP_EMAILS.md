# 🔍 Diagnostic: Emails Non Reçus Après Configuration SMTP

## 📋 Checklist de Vérification

### 1. Vérifier la Configuration SMTP

Dans Supabase Dashboard → Settings → Auth → SMTP Settings:

#### ✅ Champs Obligatoires
- [ ] **Enable custom SMTP**: Activé (coché)
- [ ] **Sender email address**: Rempli (ex: noreply@juristdz.com)
- [ ] **Sender name**: Rempli (ex: JuristDZ Auth)
- [ ] **Host**: Correct (ex: smtp-relay.brevo.com)
- [ ] **Port number**: Correct (587 pour TLS, 465 pour SSL)
- [ ] **Username**: Correct (votre email Brevo)
- [ ] **Password**: Correct (clé SMTP, pas votre mot de passe Brevo)
- [ ] **Bouton "Save changes"**: Cliqué

#### ⚠️ Erreurs Courantes

**Port Incorrect:**
```
❌ Port 25 (souvent bloqué)
✅ Port 587 (TLS - recommandé)
✅ Port 465 (SSL)
```

**Username Incorrect:**
```
❌ Votre nom d'utilisateur Brevo
✅ Votre EMAIL Brevo complet
```

**Password Incorrect:**
```
❌ Votre mot de passe Brevo
✅ La clé SMTP générée (commence par xsmtpsib-)
```

---

## 🧪 Test 1: Email de Test Supabase

### Dans Supabase Dashboard

1. **Aller dans:** Settings → Auth → SMTP Settings
2. **Scroller vers le bas**
3. **Trouver:** "Send test email"
4. **Entrer votre email**
5. **Cliquer sur "Send test email"**

### Résultats Possibles

**✅ Succès:**
```
"Test email sent successfully"
→ Vérifier votre boîte email (et spams)
```

**❌ Échec:**
```
"Failed to send test email"
→ Problème de configuration SMTP
```

---

## 🔍 Test 2: Vérifier les Logs Supabase

### Dashboard → Logs → Auth Logs

1. **Filtrer par:** "email"
2. **Chercher les erreurs récentes**
3. **Messages à surveiller:**

```
✅ "Email sent successfully"
❌ "SMTP connection failed"
❌ "Authentication failed"
❌ "Invalid credentials"
❌ "Connection timeout"
```

### Interpréter les Erreurs

**"SMTP connection failed":**
- Vérifier le host et le port
- Vérifier que le port n'est pas bloqué par votre firewall

**"Authentication failed":**
- Vérifier le username (doit être votre email complet)
- Vérifier le password (clé SMTP, pas mot de passe)

**"Connection timeout":**
- Problème réseau
- Port bloqué
- Host incorrect

---

## 🔍 Test 3: Vérifier dans Brevo

### Dashboard Brevo → Statistics → Email

1. **Aller sur:** https://app.brevo.com
2. **Menu:** Statistics → Email
3. **Vérifier:**
   - Nombre d'emails envoyés aujourd'hui
   - Statut des emails (delivered, bounced, etc.)

### Si Aucun Email dans Brevo

**Cause:** Supabase n'envoie pas les emails à Brevo
**Solution:** Problème de configuration SMTP dans Supabase

### Si Emails dans Brevo mais Non Reçus

**Causes possibles:**
1. Email dans les spams
2. Email bloqué par le serveur destinataire
3. Adresse email invalide

---

## 🔧 Solutions par Problème

### Problème 1: "Authentication failed"

**Solution:**

1. **Aller dans Brevo:** Settings → SMTP & API
2. **Vérifier la clé SMTP:**
   - Elle commence par `xsmtpsib-`
   - Elle est longue (environ 60 caractères)
3. **Régénérer une nouvelle clé si nécessaire:**
   - Cliquer sur "Create a new SMTP key"
   - Copier la nouvelle clé
   - La coller dans Supabase
4. **Vérifier le username:**
   - Doit être votre EMAIL complet (ex: votre-email@example.com)
   - PAS juste votre nom d'utilisateur

### Problème 2: "Connection failed" ou "Timeout"

**Solution:**

1. **Vérifier le host:**
   ```
   ✅ smtp-relay.brevo.com (correct)
   ❌ smtp.brevo.com (incorrect)
   ❌ api.brevo.com (incorrect)
   ```

2. **Vérifier le port:**
   ```
   ✅ 587 (TLS - recommandé)
   ✅ 465 (SSL)
   ❌ 25 (souvent bloqué)
   ```

3. **Tester la connexion SMTP:**
   ```bash
   # Dans un terminal (si vous avez telnet)
   telnet smtp-relay.brevo.com 587
   
   # Résultat attendu:
   220 smtp-relay.brevo.com ESMTP
   ```

### Problème 3: Emails dans les Spams

**Solution:**

1. **Vérifier les spams** dans votre boîte email
2. **Marquer comme "Non spam"**
3. **Ajouter l'expéditeur aux contacts:**
   - Ajouter noreply@juristdz.com à vos contacts

4. **Configurer SPF/DKIM (Avancé):**
   - Nécessite un domaine personnalisé
   - Configuration DNS requise

### Problème 4: Sender Email Non Vérifié

**Dans Brevo:**

1. **Aller dans:** Settings → Senders & IP
2. **Vérifier que votre email expéditeur est validé**
3. **Si non validé:**
   - Cliquer sur "Add a sender"
   - Entrer: noreply@juristdz.com (ou votre domaine)
   - Vérifier l'email de confirmation

**Note:** Avec un email gratuit (Gmail, etc.), vous ne pouvez pas utiliser un domaine personnalisé comme expéditeur.

---

## 📊 Configuration Recommandée

### Pour Brevo (Sendinblue)

```
Enable custom SMTP: ✅ Activé

Sender email address: votre-email-verifie@example.com
Sender name: JuristDZ Auth

Host: smtp-relay.brevo.com
Port number: 587
Minimum interval per user: 60 (secondes)

Username: votre-email@example.com
Password: xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Secure connection: TLS
```

### Pour Gmail (Tests uniquement)

```
Enable custom SMTP: ✅ Activé

Sender email address: votre-email@gmail.com
Sender name: JuristDZ Auth

Host: smtp.gmail.com
Port number: 587
Minimum interval per user: 60

Username: votre-email@gmail.com
Password: xxxx xxxx xxxx xxxx (App Password, pas votre mot de passe Gmail)

Secure connection: TLS
```

**⚠️ Important pour Gmail:**
- Activer l'authentification à 2 facteurs
- Créer un "App Password" dans les paramètres Google
- Ne PAS utiliser votre mot de passe Gmail normal

---

## 🧪 Test Complet: Nouvelle Inscription

### Étapes

1. **Se déconnecter** de l'application
2. **Vider le cache** (Ctrl+Shift+Delete)
3. **Aller sur la page d'inscription**
4. **Utiliser un NOUVEL email** (jamais utilisé)
5. **Remplir le formulaire**
6. **Cliquer sur "Créer mon compte"**

### Vérifications

**Dans la Console (F12):**
```javascript
✅ User created successfully
✅ Pas d'erreur d'envoi d'email
```

**Dans Supabase Logs (Auth):**
```
✅ "signup" event
✅ "email_confirmation_sent" event
```

**Dans Brevo Dashboard:**
```
✅ +1 email envoyé
✅ Statut: "delivered"
```

**Dans votre Boîte Email:**
```
✅ Email reçu (vérifier spams)
✅ Expéditeur: JuristDZ Auth
✅ Lien de confirmation présent
```

---

## 🔍 Diagnostic Avancé

### Vérifier les Templates d'Email

**Dashboard → Settings → Auth → Email Templates**

1. **Cliquer sur "Confirm signup"**
2. **Vérifier que le template contient:**
   ```
   {{ .ConfirmationURL }}
   ```
3. **Tester le template:**
   - Cliquer sur "Preview"
   - Vérifier que le lien s'affiche

### Vérifier les URL de Redirection

**Dashboard → Settings → Auth → URL Configuration**

1. **Site URL:**
   ```
   http://localhost:5173 (développement)
   https://votre-domaine.com (production)
   ```

2. **Redirect URLs:**
   ```
   http://localhost:5173/**
   https://votre-domaine.com/**
   ```

### Vérifier les Rate Limits

**Dashboard → Settings → Auth → Rate Limits**

```
Email signups per hour: 30 (minimum)
```

Si vous avez fait beaucoup de tests, vous avez peut-être atteint la limite.

---

## 📝 Script de Diagnostic SQL

Exécutez dans SQL Editor pour voir les tentatives d'inscription:

```sql
-- Voir les utilisateurs récents
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  confirmation_sent_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Voir si des emails sont en attente
SELECT 
  id,
  email,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Non confirmé'
    ELSE '✅ Confirmé'
  END as status,
  created_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## ✅ Checklist Finale

Avant de contacter le support:

- [ ] SMTP activé dans Supabase
- [ ] Tous les champs SMTP remplis correctement
- [ ] Test email Supabase envoyé avec succès
- [ ] Clé SMTP Brevo valide et récente
- [ ] Email expéditeur vérifié dans Brevo
- [ ] Port 587 (TLS) utilisé
- [ ] Username = email complet
- [ ] Password = clé SMTP (commence par xsmtpsib-)
- [ ] Logs Supabase vérifiés (pas d'erreur)
- [ ] Brevo dashboard vérifié (emails envoyés)
- [ ] Spams vérifiés
- [ ] Nouvelle inscription testée
- [ ] Rate limits non atteints

---

## 🆘 Si Rien Ne Fonctionne

### Option 1: Réinitialiser la Configuration

1. **Désactiver** "Enable custom SMTP"
2. **Sauvegarder**
3. **Attendre 1 minute**
4. **Réactiver** "Enable custom SMTP"
5. **Remplir à nouveau** tous les champs
6. **Sauvegarder**
7. **Tester**

### Option 2: Utiliser un Autre Fournisseur

**SendGrid (Alternative à Brevo):**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: votre-api-key-sendgrid
```

**Mailgun:**
```
Host: smtp.mailgun.org
Port: 587
Username: postmaster@votre-domaine.mailgun.org
Password: votre-password-mailgun
```

### Option 3: Désactiver SMTP Temporairement

Pour tester si le problème vient du SMTP:

1. **Désactiver** "Enable custom SMTP"
2. **Sauvegarder**
3. **Tester une inscription**
4. **Vérifier si l'email arrive** (avec le SMTP par défaut de Supabase)

Si ça marche, le problème vient de votre configuration SMTP.

---

## 📞 Informations pour le Support

Si vous devez contacter le support Brevo ou Supabase:

**Informations à fournir:**
1. Capture d'écran de la configuration SMTP (masquer le password)
2. Logs d'erreur de Supabase
3. Email de test envoyé ou non
4. Statut dans Brevo dashboard
5. Message d'erreur exact

**Support Brevo:** https://help.brevo.com/
**Support Supabase:** https://supabase.com/support

---

## 🎯 Solution Rapide (90% des cas)

Le problème vient souvent de:

1. **Password incorrect** → Utiliser la clé SMTP, pas le mot de passe
2. **Username incorrect** → Utiliser l'email complet
3. **Email expéditeur non vérifié** → Vérifier dans Brevo
4. **Port incorrect** → Utiliser 587 (TLS)

Vérifiez ces 4 points en premier! 🚀
