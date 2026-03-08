# ⚡ GUIDE D'INTÉGRATION RAPIDE - SYSTÈME DE LIMITES

## 🎯 En 5 Minutes

Ce guide vous permet d'intégrer le système de limites dans n'importe quel composant en moins de 5 minutes.

---

## 📦 ÉTAPE 1: Installation Base de Données (1 fois)

### Dans Supabase Dashboard

1. Allez sur **SQL Editor**
2. Copiez le contenu de `supabase-migrations-limites.sql`
3. Cliquez sur **Run**
4. Vérifiez: `SELECT * FROM usage_stats LIMIT 1;`

✅ **Fait!** Les tables, fonctions et CRON jobs sont créés.

---

## 🔧 ÉTAPE 2: Intégration dans un Composant

### Template de Base

```typescript
import React from 'react';
import { useUsageLimits } from '../hooks/useUsageLimits';
import LimitReachedModal from './LimitReachedModal';
import { useLanguage } from '../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

const MonComposant = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  // 1. Importer le hook
  const { 
    checkLimits, 
    deductCredits, 
    limitResult, 
    showLimitModal, 
    closeLimitModal,
    isChecking
  } = useUsageLimits();
  
  // 2. Fonction avec vérification
  const handleAction = async () => {
    // Vérifier AVANT l'action
    const allowed = await checkLimits('research');
    
    if (!allowed) {
      console.log('Action bloquée par les limites');
      return; // Le modal s'affiche automatiquement
    }
    
    // Effectuer l'action
    try {
      const result = await faireQuelqueChose();
      
      // Déduire les crédits APRÈS succès
      await deductCredits(1);
      
      // Afficher le résultat
      console.log('Action réussie:', result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  return (
    <>
      {/* Votre interface */}
      <button 
        onClick={handleAction}
        disabled={isChecking}
      >
        {isChecking ? 'Vérification...' : 'Lancer l\'action'}
      </button>
      
      {/* 3. Ajouter le modal */}
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};

export default MonComposant;
```

---

## 📝 EXEMPLES CONCRETS

### Exemple 1: ChatInterface (Recherche Juridique)

```typescript
const ChatInterface = () => {
  const { checkLimits, deductCredits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // ✅ Vérifier les limites
    const allowed = await checkLimits('research');
    if (!allowed) return;
    
    // Envoyer le message
    const response = await sendMessageToGemini(input);
    
    // ✅ Déduire 1 crédit
    await deductCredits(1);
    
    // Afficher la réponse
    setMessages([...messages, response]);
  };
  
  return (
    <>
      <div className="chat-container">
        {/* Messages */}
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Envoyer</button>
      </div>
      
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

---

### Exemple 2: DraftingInterface (Rédaction)

```typescript
const DraftingInterface = () => {
  const { checkLimits, deductCredits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const handleGenerate = async () => {
    // ✅ Vérifier les limites
    const allowed = await checkLimits('drafting');
    if (!allowed) return;
    
    setIsGenerating(true);
    
    try {
      // Générer le document
      const document = await generateDocument(template, formData);
      
      // ✅ Déduire 2 crédits (rédaction coûte plus cher)
      await deductCredits(2);
      
      setGeneratedDoc(document);
    } catch (error) {
      console.error('Erreur génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <>
      <div className="drafting-container">
        {/* Formulaire */}
        <button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? 'Génération...' : 'Générer le Document'}
        </button>
      </div>
      
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

---

### Exemple 3: DocumentUpload (Upload avec vérification stockage)

```typescript
const DocumentUpload = () => {
  const { checkLimits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const handleUpload = async (file: File) => {
    // ✅ Vérifier le stockage
    const allowed = await checkLimits('upload');
    if (!allowed) return;
    
    // Uploader le fichier
    try {
      await uploadDocument(file);
      console.log('Upload réussi');
    } catch (error) {
      console.error('Erreur upload:', error);
    }
  };
  
  return (
    <>
      <input 
        type="file" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

---

### Exemple 4: AnalysisInterface (Analyse)

```typescript
const AnalysisInterface = () => {
  const { checkLimits, deductCredits, limitResult, showLimitModal, closeLimitModal } = useUsageLimits();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const handleAnalyze = async () => {
    // ✅ Vérifier les limites
    const allowed = await checkLimits('analysis');
    if (!allowed) return;
    
    setIsAnalyzing(true);
    
    try {
      // Analyser le document
      const analysis = await analyzeDocument(documentText);
      
      // ✅ Déduire 3 crédits (analyse coûte le plus cher)
      await deductCredits(3);
      
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <>
      <div className="analysis-container">
        <textarea value={documentText} onChange={(e) => setDocumentText(e.target.value)} />
        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'Audit'}
        </button>
      </div>
      
      {showLimitModal && limitResult && (
        <LimitReachedModal
          limitResult={limitResult}
          language={language}
          onClose={closeLimitModal}
          onUpgrade={() => navigate('/billing')}
        />
      )}
    </>
  );
};
```

---

## 💰 COÛT EN CRÉDITS PAR ACTION

| Action | Crédits | Justification |
|--------|---------|---------------|
| Recherche juridique | 1 | Action simple |
| Rédaction document | 2 | Génération complexe |
| Analyse contrat | 3 | Traitement lourd |
| Traduction | 1 | Action simple |
| Upload document | 0 | Vérifie juste le stockage |

---

## 🎨 PERSONNALISATION DU MODAL

### Changer les couleurs

```typescript
// Dans LimitReachedModal.tsx
const getStatusColor = () => {
  switch (limitResult.status) {
    case LimitStatus.WARNING:
      return 'bg-yellow-50 border-yellow-200'; // Modifier ici
    case LimitStatus.CRITICAL:
      return 'bg-orange-50 border-orange-200'; // Modifier ici
    case LimitStatus.EXCEEDED:
      return 'bg-red-50 border-red-200'; // Modifier ici
    default:
      return 'bg-gray-50 border-gray-200';
  }
};
```

### Changer les messages

```typescript
// Dans usageLimitService.ts
// Modifier les messages dans chaque fonction check*()
message: {
  fr: 'Votre message personnalisé en français',
  ar: 'رسالتك المخصصة بالعربية'
}
```

---

## 🧪 TESTER LE SYSTÈME

### Test 1: Simuler crédits épuisés

```sql
-- Dans Supabase SQL Editor
UPDATE subscriptions 
SET credits_remaining = 0 
WHERE user_id = 'votre-user-id';
```

Puis essayez une action → Le modal devrait bloquer

---

### Test 2: Simuler quota journalier dépassé

```sql
UPDATE usage_stats 
SET credits_used_today = 10 
WHERE user_id = 'votre-user-id';
```

Puis essayez une action (plan free) → Le modal devrait bloquer

---

### Test 3: Simuler expiration

```sql
UPDATE subscriptions 
SET expires_at = NOW() - INTERVAL '1 day' 
WHERE user_id = 'votre-user-id';
```

Puis essayez une action → Le modal devrait bloquer

---

### Test 4: Simuler stockage plein

```sql
UPDATE usage_stats 
SET storage_used_gb = 1.0 
WHERE user_id = 'votre-user-id';
```

Puis essayez un upload → Le modal devrait bloquer

---

## 🔍 DÉBOGUER

### Voir les logs dans la console

```typescript
const handleAction = async () => {
  console.log('🔍 Vérification des limites...');
  const allowed = await checkLimits('research');
  console.log('✅ Autorisé:', allowed);
  
  if (!allowed) {
    console.log('❌ Action bloquée');
    return;
  }
  
  console.log('🚀 Action en cours...');
  // ...
};
```

### Vérifier l'état dans React DevTools

```typescript
// Le hook expose ces valeurs
{
  limitResult: {...},      // Résultat de la vérification
  showLimitModal: true,    // Modal affiché?
  isChecking: false        // Vérification en cours?
}
```

---

## ⚠️ ERREURS COURANTES

### Erreur 1: "Cannot read property 'id' of undefined"

**Cause**: L'utilisateur n'est pas connecté

**Solution**:
```typescript
const { user } = useAuth();

if (!user) {
  return <div>Veuillez vous connecter</div>;
}
```

---

### Erreur 2: Modal ne s'affiche pas

**Cause**: Oublié d'ajouter le composant `<LimitReachedModal />`

**Solution**: Vérifier que le modal est bien dans le JSX

---

### Erreur 3: "Function deduct_credits does not exist"

**Cause**: Migrations SQL pas exécutées

**Solution**: Exécuter `supabase-migrations-limites.sql`

---

## 📊 MONITORING

### Voir les utilisateurs proches des limites

```sql
SELECT * FROM v_users_near_limits;
```

### Voir l'usage global

```sql
SELECT * FROM v_usage_overview LIMIT 10;
```

### Statistiques par plan

```sql
SELECT 
  plan,
  COUNT(*) as users,
  AVG(credits_remaining) as avg_credits,
  SUM(credits_used_today) as total_used_today
FROM v_usage_overview
GROUP BY plan;
```

---

## ✅ CHECKLIST D'INTÉGRATION

- [ ] Migrations SQL exécutées dans Supabase
- [ ] Hook `useUsageLimits` importé
- [ ] `checkLimits()` appelé AVANT l'action
- [ ] `deductCredits()` appelé APRÈS succès
- [ ] `<LimitReachedModal />` ajouté au JSX
- [ ] Testé avec crédits épuisés
- [ ] Testé avec quota dépassé
- [ ] Testé avec expiration
- [ ] Messages traduits en arabe
- [ ] Logs de débogage ajoutés

---

## 🚀 PROCHAINES ÉTAPES

1. Intégrer dans tous les composants principaux
2. Ajouter analytics des limites atteintes
3. Créer page de gestion d'abonnement
4. Implémenter notifications email
5. Ajouter dashboard admin

---

## 📞 BESOIN D'AIDE?

Consultez:
- `GESTION_LIMITES_UTILISATION.md` - Documentation complète
- `EXEMPLES_MESSAGES_LIMITES.md` - Tous les messages
- `RESUME_GESTION_LIMITES.md` - Résumé visuel

---

**Temps d'intégration**: 5 minutes par composant
**Difficulté**: ⭐⭐☆☆☆ (Facile)
**Date**: 8 Mars 2026
