# 🎯 Comment accéder à l'interface Admin SaaS

## 📍 Vous êtes actuellement ici:

```
Mode actuel: RÉDACTION (Drafting)
Interface affichée: Formulaires de rédaction d'actes
```

## ✅ Pour accéder à l'interface Admin:

### Méthode 1: Via le Sidebar (recommandé)

1. **Regardez le sidebar à gauche**
2. **Scrollez vers le bas** jusqu'à voir la section séparée par une ligne
3. **Cliquez sur "Administration"** (avec l'icône ⚙️)

```
┌─────────────────────────────┐
│  JuristDZ                   │
│  En ligne                   │
├─────────────────────────────┤
│  📊 Tableau de Bord         │
│                             │
│  SUITE MÉTIER               │
│  💼 Dossiers                │
│  📝 Rédaction (actuel)      │ ← Vous êtes ici
│  🛡️ Analyse                 │
│                             │
│  ASSISTANT IA               │
│  🔍 Recherche Juridique     │
│                             │
│  ─────────────────────      │
│  ⚙️ Administration          │ ← CLIQUEZ ICI!
│  🔗 Partager                │
│  🌙 Theme  FR              │
└─────────────────────────────┘
```

### Méthode 2: Via l'URL directe

Si le bouton n'est pas visible, vous pouvez forcer le mode Admin en modifiant le code temporairement:

1. Ouvrir la console du navigateur (F12)
2. Taper:
```javascript
// Cette commande n'existe pas directement, utilisez le sidebar
```

## 🎯 Ce qui va se passer:

### Avant (mode Rédaction):
```
Sidebar: Menu complet avec toutes les options
Interface: Formulaires de rédaction d'actes
```

### Après (mode Admin):
```
Sidebar: Menu simplifié avec "Retour au Dashboard" + "Gestion SaaS"
Interface: 3 onglets (Vue d'ensemble, Organisations, Abonnements)
```

## 📊 Interface Admin attendue:

```
┌────────────────────────────────────────────────────────┐
│  ⚙️ Administration Plateforme SaaS                     │
│  Gestion complète des organisations et abonnements     │
├────────────────────────────────────────────────────────┤
│  [Vue d'ensemble]  [Organisations]  [Abonnements]      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ 🏢 7     │  │ 👥 1     │  │ 🖥️ 99.8% │  │ 💰 ARR ││
│  │ Orgs     │  │ Users    │  │ Uptime   │  │ 512K   ││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
│                                                         │
└────────────────────────────────────────────────────────┘
```

## 🔍 Vérification que vous êtes Admin:

Pour vérifier que vous avez les droits Admin, regardez dans le sidebar:

- ✅ **Si vous voyez "Administration"** → Vous êtes admin, cliquez dessus
- ❌ **Si vous ne voyez PAS "Administration"** → Votre compte n'est pas admin

## 🛠️ Si vous ne voyez pas le bouton "Administration":

Votre compte n'a pas le rôle "admin". Pour le corriger:

### Option 1: Via le code (temporaire pour test)

Modifier `App.tsx` ligne où `userStats` est défini:

```typescript
const [userStats, setUserStats] = useState<UserStats>({
  name: 'Test User',
  credits: 100,
  plan: 'Pro',
  role: 'admin', // ← Changer en 'admin'
  lastActivity: new Date()
});
```

### Option 2: Via la base de données (permanent)

Si vous avez une table `users` ou `user_profiles`:

```sql
-- Mettre à jour votre utilisateur
UPDATE users 
SET role = 'admin' 
WHERE email = 'votre-email@example.com';
```

## 📸 Capture d'écran de référence:

Vous devriez voir exactement ceci dans le sidebar en mode Admin:

```
┌─────────────────────────────┐
│  JuristDZ                   │
│  En ligne                   │
├─────────────────────────────┤
│                             │
│  ← Retour au Dashboard      │
│                             │
│  ADMINISTRATION             │
│  ⚙️ Gestion SaaS (rouge)   │
│                             │
│  ┌───────────────────────┐ │
│  │ 🛡️ Mode Administrateur│ │
│  │ Accès complet...      │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

## ✅ Checklist:

- [ ] Je vois le bouton "Administration" dans le sidebar
- [ ] J'ai cliqué sur "Administration"
- [ ] Le sidebar a changé (menu simplifié)
- [ ] Je vois 3 onglets: Vue d'ensemble, Organisations, Abonnements
- [ ] Je vois les statistiques (7 organisations, MRR, ARR)

## 🐛 Problèmes courants:

### "Je ne vois pas le bouton Administration"
→ Votre compte n'est pas admin. Modifier le rôle dans le code ou la base de données.

### "J'ai cliqué mais rien ne se passe"
→ Vérifier la console (F12) pour voir les erreurs.

### "Je vois l'interface mais pas de données"
→ Vérifier que le script SQL a bien été exécuté:
```sql
SELECT COUNT(*) FROM organizations;
-- Doit retourner: 7
```

## 📞 Besoin d'aide?

Si après avoir cliqué sur "Administration" vous ne voyez toujours pas l'interface SaaS:

1. Ouvrir la console (F12)
2. Regarder les erreurs
3. Vérifier que `currentMode === AppMode.ADMIN`
4. Vérifier que `AdminDashboard` est bien chargé

---

**CLIQUEZ SUR "ADMINISTRATION" DANS LE SIDEBAR! 🎯**
