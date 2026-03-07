# 🔍 Diagnostic: Emails Non Reçus - Guide Étape par Étape

## 🎯 Votre Situation
Vous avez configuré SMTP dans Supabase mais les emails ne sont pas reçus après une nouvelle inscription.

---

## ✅ ÉTAPE 1: Vérifier la Configuration SMTP (5 min)

### Dans Supabase Dashboard

1. **Aller sur:** https://supabase.com/dashboard
2. **Sélectionner votre projet** JuristDZ
3. **Aller dans:** Settings → Auth → SMTP Settings

### Vérifier CHAQUE Champ

```
┌─────────────────────────────────────────────────┐
│ ✅ Enable custom SMTP: DOIT ÊTRE COCHÉ         │
│                                                 │
│ ✅ Sender email address:                        │
│    Exemple: noreply@juristdz.com               │
│    ⚠️ Doit être vérifié dans Brevo             │
│                                                 │
│ ✅ Sender name:                                 │
│    Exemple: JuristDZ Auth                      │
│                                                 │
│ ✅ Host:                                        │
│    smtp-relay.brevo.com                        │
│    ⚠️ PAS smtp.brevo.com                       │
│                                                 │
│ ✅ Port number:                                 │
│    587 (TLS recommandé)                        │
│    ⚠️ PAS 25 (souvent bloqué)                  │
│                                                 │
│ ✅ Minimum interval per user:                   │
│    60 secondes (par défaut)                    │
│                                                 │
│ ✅ Username:                                    │
│    Votre EMAIL COMPLET Brevo                   │
│    Exemple: votre-email@example.com            │
│    ⚠️ PAS juste un nom d'utilisateur           │
│                                                 │
│ ✅ Password:                                    │
│    Votre CLÉ SMTP Brevo                        │
│    Commence par: xsmtpsib-                     │
│    ⚠️ PAS votre mot de passe Brevo             │
└─────────────────────────────────────────────────┘
```

### ⚠️ Erreurs Courantes

**Erreur #1: Password Incorrect**
```
❌ Vous avez mis votre mot de passe Brevo
✅ Vous devez mettre la CLÉ SMTP (xsmtpsib-...)
```

**Erreur #2: Username Incorrect**
```
❌ Vous avez mis un nom d'utilisateur
✅ Vous devez mettre votre EMAIL complet
```

**Erreur #3: Host Incorrect**
```
❌ smtp.brevo.com
❌ api.brevo.com
✅ smtp-relay.brevo.com
```

**Erreur #4: Port Incorrect**
```
❌ 25 (souvent bloqué)
❌ 465 (SSL, peut causer des problèmes)
✅ 587 (TLS, recommandé)
```

### 🔧 Si Vous Avez un Doute

1. **Cliquer sur "Save changes"** (même si vous n'avez rien changé)
2. **Attendre 30 secondes**
3. **Rafraîchir la page** (F5)
4. **Vérifier que les changements sont sauvegardés**

---

## ✅ ÉTAPE 2: Test Email Supabase (2 min)

### Dans la Même Page (SMTP Settings)

1. **Scroller vers le bas**
2. **Trouver:** "Send test email"
3. **Entrer VOTRE email personnel** (Gmail, Outlook, etc.)
4. **Cliquer sur "Send test email"**

### Résultats Possibles

**✅ Cas 1: "Test email sent successfully"**
```
→ Vérifier votre boîte email (et SPAMS)
→ Si reçu: Configuration SMTP OK ✅
→ Si non reçu: Problème avec Brevo (voir Étape 3)
```

**❌ Cas 2: "Failed to send test email"**
```
→ Configuration SMTP incorrecte
→ Retourner à l'Étape 1
→ Vérifier TOUS les champs
```

**❌ Cas 3: Aucun message (rien ne se passe)**
```
→ Rafraîchir la page (F5)
→ Réessayer
→ Vérifier la console (F12) pour les erreurs
```

---

## ✅ ÉTAPE 3: Vérifier dans Brevo (3 min)

### Aller sur Brevo Dashboard

1. **Se connecter:** https://app.brevo.com
2. **Aller dans:** Statistics → Email
3. **Regarder les statistiques d'aujourd'hui**

### Que Chercher?

**✅ Cas 1: Vous voyez des emails envoyés**
```
→ Supabase envoie bien les emails à Brevo ✅
→ Problème: Les emails n'arrivent pas
→ Solutions:
   1. Vérifier les spams
   2. Vérifier que l'email expéditeur est vérifié (voir ci-dessous)
   3. Attendre 5-10 minutes (délai de livraison)
```

**❌ Cas 2: Aucun email envoyé (0)**
```
→ Supabase n'envoie PAS les emails à Brevo
→ Problème: Configuration SMTP incorrecte
→ Retourner à l'Étape 1
```

### Vérifier l'Email Expéditeur

1. **Dans Brevo:** Settings → Senders & IP
2. **Vérifier que votre email expéditeur est dans la liste**
3. **Vérifier le statut:**
   ```
   ✅ Verified (vert) → OK
   ⚠️ Pending (orange) → Vérifier votre email
   ❌ Not verified (rouge) → Problème
   ```

### Si Email Non Vérifié

**Option A: Utiliser votre email Brevo**
```
Dans Supabase SMTP Settings:
Sender email address: votre-email-brevo@example.com
(L'email que vous avez utilisé pour créer le compte Brevo)
```

**Option B: Ajouter un nouvel expéditeur**
```
1. Dans Brevo: Settings → Senders & IP
2. Cliquer sur "Add a sender"
3. Entrer: noreply@juristdz.com
4. Vérifier l'email de confirmation
⚠️ Nécessite un domaine personnalisé
```

---

## ✅ ÉTAPE 4: Vérifier la Clé SMTP (2 min)

### Régénérer une Nouvelle Clé

1. **Dans Brevo:** Settings → SMTP & API
2. **Cliquer sur "SMTP"**
3. **Cliquer sur "Create a new SMTP key"**
4. **Nom:** JuristDZ Supabase 2024
5. **Cliquer sur "Generate"**
6. **COPIER la clé** (commence par xsmtpsib-)
7. **⚠️ IMPORTANT:** Sauvegarder la clé, elle ne sera plus visible!

### Mettre à Jour dans Supabase

1. **Retourner dans Supabase:** Settings → Auth → SMTP Settings
2. **Dans le champ "Password":**
   - Effacer l'ancien password
   - Coller la NOUVELLE clé SMTP
3. **Cliquer sur "Save changes"**
4. **Attendre 30 secondes**
5. **Refaire le test email** (Étape 2)

---

## ✅ ÉTAPE 5: Test Complet avec Inscription (5 min)

### Préparer le Test

1. **Utiliser un NOUVEL email** (jamais utilisé avant)
2. **Utiliser votre email personnel** (Gmail, Outlook, etc.)
3. **Ouvrir la console** (F12) dans le navigateur

### Faire une Inscription

1. **Aller sur votre application:** http://localhost:5173
2. **Cliquer sur "Inscription"**
3. **Remplir le formulaire:**
   ```
   Prénom: Test
   Nom: Diagnostic
   Email: votre-email-test@gmail.com
   Mot de passe: test123456
   Profession: Avocat
   ```
4. **Cliquer sur "Créer mon compte"**

### Vérifier la Console (F12)

**✅ Succès:**
```javascript
✅ User created in auth.users: [ID]
✅ Profile will be created automatically by trigger
```

**❌ Erreur:**
```javascript
❌ Profile creation error: {...}
❌ new row violates row-level security policy
```

### Vérifier l'Email

1. **Attendre 1-2 minutes**
2. **Vérifier votre boîte de réception**
3. **Vérifier les SPAMS** ⚠️
4. **Chercher un email de:** JuristDZ Auth

**✅ Email Reçu:**
```
→ Configuration SMTP fonctionne parfaitement! ✅
→ Problème résolu!
```

**❌ Email Non Reçu:**
```
→ Aller à l'Étape 6 (Diagnostic Avancé)
```

---

## ✅ ÉTAPE 6: Diagnostic Avancé (10 min)

### Vérifier les Logs Supabase

1. **Dans Supabase Dashboard:** Logs → Auth Logs
2. **Filtrer par:** "email" ou "signup"
3. **Chercher les logs récents** (dernières 10 minutes)

**Messages à Chercher:**

```
✅ "email_confirmation_sent" → Email envoyé
✅ "signup" → Inscription réussie
❌ "smtp_error" → Erreur SMTP
❌ "authentication_failed" → Erreur d'authentification
❌ "connection_timeout" → Timeout de connexion
```

### Vérifier les Rate Limits

1. **Dans Supabase:** Settings → Auth → Rate Limits
2. **Vérifier:** "Rate limit for sending emails"
3. **Valeur recommandée:** 30 emails/heure minimum

**Si vous avez fait beaucoup de tests:**
```
→ Vous avez peut-être atteint la limite
→ Attendre 1 heure
→ Réessayer
```

### Vérifier les Templates d'Email

1. **Dans Supabase:** Settings → Auth → Email Templates
2. **Cliquer sur "Confirm signup"**
3. **Vérifier que le template contient:**
   ```html
   {{ .ConfirmationURL }}
   ```
4. **Cliquer sur "Preview"** pour tester

---

## 🆘 SOLUTIONS PAR PROBLÈME

### Problème A: "Authentication failed"

**Cause:** Username ou Password incorrect

**Solution:**
1. Vérifier que Username = votre EMAIL complet
2. Vérifier que Password = clé SMTP (xsmtpsib-...)
3. Régénérer une nouvelle clé SMTP (Étape 4)

---

### Problème B: "Connection timeout"

**Cause:** Host ou Port incorrect

**Solution:**
1. Vérifier Host: `smtp-relay.brevo.com`
2. Vérifier Port: `587`
3. Essayer Port: `465` (si 587 ne marche pas)

---

### Problème C: Emails dans les Spams

**Cause:** Email expéditeur non vérifié ou nouveau domaine

**Solution:**
1. Vérifier les spams dans votre boîte email
2. Marquer comme "Non spam"
3. Ajouter l'expéditeur aux contacts
4. Utiliser votre email Brevo comme expéditeur

---

### Problème D: "Sender not verified"

**Cause:** Email expéditeur non vérifié dans Brevo

**Solution:**
1. Dans Brevo: Settings → Senders & IP
2. Vérifier que l'email est dans la liste
3. Si non vérifié: Utiliser votre email Brevo
4. Ou: Ajouter et vérifier le nouvel email

---

## 🎯 SOLUTION RAPIDE (90% des cas)

### Checklist de 5 Minutes

```
□ Enable custom SMTP: COCHÉ
□ Host: smtp-relay.brevo.com
□ Port: 587
□ Username: VOTRE EMAIL COMPLET
□ Password: CLÉ SMTP (xsmtpsib-...)
□ Sender email: VÉRIFIÉ dans Brevo
□ Test email: ENVOYÉ avec succès
```

### Si Tout Est Coché

1. **Attendre 5-10 minutes** (délai de livraison)
2. **Vérifier les SPAMS**
3. **Vérifier Brevo Dashboard** (Statistics → Email)
4. **Faire une nouvelle inscription** avec un nouvel email

---

## 📊 Configuration Recommandée (Copier-Coller)

### Pour Brevo

```
Enable custom SMTP: ✅ COCHÉ

Sender email address: votre-email@example.com
Sender name: JuristDZ Auth

Host: smtp-relay.brevo.com
Port number: 587
Minimum interval per user: 60

Username: votre-email@example.com
Password: xsmtpsib-[VOTRE CLÉ ICI]
```

### Comment Obtenir la Clé SMTP

1. https://app.brevo.com
2. Settings → SMTP & API
3. SMTP → Create a new SMTP key
4. Copier la clé (xsmtpsib-...)

---

## 🔍 Vérification Finale

### Script SQL pour Vérifier les Inscriptions

Exécutez dans SQL Editor:

```sql
-- Voir les utilisateurs récents
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  confirmation_sent_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Non confirmé'
    ELSE '✅ Confirmé'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

**Résultat Attendu:**
```
- confirmation_sent_at: DOIT avoir une date
- email_confirmed_at: NULL (normal, pas encore confirmé)
```

**Si confirmation_sent_at est NULL:**
```
→ L'email n'a PAS été envoyé
→ Problème de configuration SMTP
→ Retourner à l'Étape 1
```

---

## 📞 Besoin d'Aide?

### Informations à Fournir

Si vous devez contacter le support:

1. **Capture d'écran** de la configuration SMTP (masquer le password)
2. **Message d'erreur** exact (si affiché)
3. **Résultat du test email** Supabase
4. **Statistiques Brevo** (nombre d'emails envoyés)
5. **Logs Supabase** (Auth Logs)

### Support

- **Brevo:** https://help.brevo.com/
- **Supabase:** https://supabase.com/support

---

## ✅ Checklist Finale

Avant de dire que ça ne marche pas:

- [ ] Configuration SMTP vérifiée (Étape 1)
- [ ] Test email Supabase envoyé avec succès (Étape 2)
- [ ] Brevo Dashboard vérifié (Étape 3)
- [ ] Clé SMTP régénérée (Étape 4)
- [ ] Nouvelle inscription testée (Étape 5)
- [ ] Spams vérifiés
- [ ] Attendu 5-10 minutes
- [ ] Logs Supabase vérifiés (Étape 6)
- [ ] Email expéditeur vérifié dans Brevo

---

## 🚀 Prochaines Étapes

Une fois que les emails fonctionnent:

1. ✅ Tester le flux complet d'inscription
2. ✅ Tester la réinitialisation de mot de passe
3. ✅ Personnaliser les templates d'email
4. ✅ Configurer un domaine personnalisé (optionnel)

---

**Bonne chance! 🎯**
