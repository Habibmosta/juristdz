# 📋 Aide-Mémoire: Configuration SMTP Brevo

## 🎯 Configuration Correcte

```
┌─────────────────────────────────────────────────┐
│ SUPABASE → Settings → Auth → SMTP Settings     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Enable custom SMTP: ✅ COCHÉ                   │
│                                                 │
│ Sender email address:                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ votre-email@example.com                     │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ Doit être vérifié dans Brevo                │
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
│ ⚠️ PAS smtp.brevo.com                          │
│                                                 │
│ Port number:                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 587                                         │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ PAS 25 (bloqué)                             │
│                                                 │
│ Minimum interval per user:                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ 60                                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Username:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ votre-email@example.com                     │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ EMAIL COMPLET (pas juste un nom)            │
│                                                 │
│ Password:                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ xsmtpsib-xxxxxxxxxxxxxxxxxxxxxxxxxx         │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ CLÉ SMTP (pas votre mot de passe Brevo)     │
│                                                 │
│ [Save changes] ← CLIQUER ICI                    │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ Les 4 Erreurs les Plus Courantes

### ❌ Erreur #1: Password Incorrect
```
Vous avez mis: votre_mot_de_passe_brevo
Vous devez mettre: xsmtpsib-xxxxxxxxxxxxx (la clé SMTP)
```

**Comment obtenir la clé SMTP:**
1. https://app.brevo.com
2. Settings → SMTP & API
3. SMTP → Create a new SMTP key
4. Copier la clé (commence par xsmtpsib-)

---

### ❌ Erreur #2: Username Incorrect
```
Vous avez mis: votre_nom_utilisateur
Vous devez mettre: votre-email@example.com (EMAIL COMPLET)
```

---

### ❌ Erreur #3: Host Incorrect
```
❌ smtp.brevo.com
❌ api.brevo.com
❌ mail.brevo.com
✅ smtp-relay.brevo.com
```

---

### ❌ Erreur #4: Port Incorrect
```
❌ 25 (souvent bloqué par les FAI)
❌ 465 (SSL, peut causer des problèmes)
✅ 587 (TLS, recommandé)
```

---

## 🧪 Test Rapide (2 minutes)

### Dans Supabase

1. **Aller dans:** Settings → Auth → SMTP Settings
2. **Scroller vers le bas**
3. **Trouver:** "Send test email"
4. **Entrer votre email**
5. **Cliquer sur "Send test email"**

### Résultats

**✅ "Test email sent successfully"**
```
→ Configuration OK!
→ Vérifier votre boîte email (et spams)
```

**❌ "Failed to send test email"**
```
→ Configuration incorrecte
→ Vérifier les 4 erreurs ci-dessus
```

---

## 🔍 Vérifier dans Brevo

### Dashboard Brevo

1. **Se connecter:** https://app.brevo.com
2. **Aller dans:** Statistics → Email
3. **Regarder:** Nombre d'emails envoyés aujourd'hui

**Si vous voyez des emails:**
```
✅ Supabase envoie bien à Brevo
→ Vérifier les spams
→ Vérifier que l'email expéditeur est vérifié
```

**Si vous ne voyez AUCUN email:**
```
❌ Supabase n'envoie PAS à Brevo
→ Configuration SMTP incorrecte
→ Vérifier les 4 erreurs ci-dessus
```

---

## 📧 Vérifier l'Email Expéditeur

### Dans Brevo

1. **Aller dans:** Settings → Senders & IP
2. **Vérifier que votre email est dans la liste**
3. **Vérifier le statut:**

```
✅ Verified (vert) → OK, vous pouvez l'utiliser
⚠️ Pending (orange) → Vérifier votre email
❌ Not verified (rouge) → Ne peut pas être utilisé
```

### Si Non Vérifié

**Solution Rapide:**
```
Dans Supabase SMTP Settings:
Sender email address: votre-email-brevo@example.com

Utilisez l'email avec lequel vous avez créé le compte Brevo
(il est automatiquement vérifié)
```

---

## 🚀 Checklist de 5 Minutes

```
□ Enable custom SMTP: COCHÉ
□ Host: smtp-relay.brevo.com (pas smtp.brevo.com)
□ Port: 587 (pas 25)
□ Username: EMAIL COMPLET
□ Password: CLÉ SMTP (xsmtpsib-...)
□ Sender email: VÉRIFIÉ dans Brevo
□ Cliquer sur "Save changes"
□ Attendre 30 secondes
□ Test email: ENVOYÉ avec succès
□ Email reçu (vérifier spams)
```

---

## 🔧 Réinitialisation Complète

Si rien ne marche, réinitialiser:

### 1. Désactiver SMTP
```
Dans Supabase:
- Décocher "Enable custom SMTP"
- Cliquer sur "Save changes"
- Attendre 1 minute
```

### 2. Régénérer la Clé SMTP
```
Dans Brevo:
- Settings → SMTP & API
- Create a new SMTP key
- Copier la nouvelle clé
```

### 3. Réactiver SMTP
```
Dans Supabase:
- Cocher "Enable custom SMTP"
- Remplir TOUS les champs
- Username: EMAIL COMPLET
- Password: NOUVELLE CLÉ SMTP
- Cliquer sur "Save changes"
- Attendre 30 secondes
```

### 4. Tester
```
- Send test email
- Vérifier la réception
```

---

## 📊 Valeurs à Copier-Coller

### Host
```
smtp-relay.brevo.com
```

### Port
```
587
```

### Sender Name
```
JuristDZ Auth
```

---

## 🆘 Aide Rapide

### Problème: "Authentication failed"
```
→ Vérifier Username (EMAIL complet)
→ Vérifier Password (CLÉ SMTP, pas mot de passe)
→ Régénérer une nouvelle clé SMTP
```

### Problème: "Connection timeout"
```
→ Vérifier Host: smtp-relay.brevo.com
→ Vérifier Port: 587
→ Essayer Port: 465
```

### Problème: Email non reçu
```
→ Vérifier les spams
→ Vérifier Brevo Dashboard (Statistics)
→ Vérifier que l'email expéditeur est vérifié
→ Attendre 5-10 minutes
```

---

## 📞 Support

- **Brevo:** https://help.brevo.com/
- **Supabase:** https://supabase.com/support
- **Guide complet:** Voir `DIAGNOSTIC_EMAILS_ETAPE_PAR_ETAPE.md`

---

**Bonne chance! 🎯**
