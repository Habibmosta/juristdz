# Couche IA JuristeDZ

> Architecture, services, et flux d'indexation pour la partie IA de la plateforme.

## Vue d'ensemble

La couche IA combine **2 providers LLM** (Gemini 2.5/3.5 Flash + Groq GPT-OSS/Qwen) avec un **RAG (Retrieval-Augmented Generation)** basé sur `pgvector`. Le RAG indexe la jurisprudence algérienne, les articles de loi, le JORA, les références légales et les règles de conformité. Avant chaque appel LLM, on récupère les chunks les plus pertinents et on les injecte dans le prompt.

> **Chaînes de fallback (oct. 2026)** — Gemini : `gemini-3.5-flash` → `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-3.8-flash`. Groq : `openai/gpt-oss-20b` → `qwen/qwen3.8-27b` → `llama-3.3-70b-versatile`. Les anciens modèles (`gemini-2.0-flash`, `llama-3.1-8b-instant`, `text-embedding-004`) sont éteints et ne sont plus utilisés. Note : sur un compte Gemini récent, les modèles 2.5 renvoient 404 — d'où `gemini-3.5-flash` en tête de chaîne.

```
┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Client API  │───▶│  aiRoutes   │───▶│ aiLegalService│
└──────────────┘    └─────────────┘    └──────┬───────┘
                                              │
                            ┌─────────────────┼─────────────────┐
                            ▼                 ▼                 ▼
                     ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                     │  aiClient   │   │  ragService │   │   database  │
                     │ (Gemini/    │   │ (pgvector)  │   │             │
                     │  Groq)      │   └──────┬──────┘   └─────────────┘
                     └─────────────┘          │
                                              ▼
                                       ┌─────────────┐
                                       │  Embeddings │
                                       │ (Gemini)    │
                                       └─────────────┘
```

## Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `services/aiClient.ts` | Wrapper HTTP pour Gemini + Groq avec routing auto |
| `services/embeddingService.ts` | Calcul d'embeddings via `gemini-embedding-001` + chunking |
| `services/ragService.ts` | Recherche vectorielle hybride (cosinus + filtres metadata) |
| `services/ragIngestionService.ts` | Découpage + embedding + insertion dans `rag_documents` |
| `services/ragPromptHelper.ts` | Injection de contexte + extraction des sources citées |
| `services/aiLegalService.ts` | Orchestration : 10 routes IA, RAG + JSON forcé |
| `utils/jsonForcer.ts` | Extraction JSON robuste (fence, prose, repair) |
| `database/migrations/019_create_rag_tables.sql` | Schéma pgvector + index IVFFlat |
| `scripts/ingestRag.ts` | Indexation batch des sources |

## Installation / démarrage

### 1. Appliquer la migration

```bash
# La migration est idempotente (CREATE EXTENSION IF NOT EXISTS, etc.)
psql -f src/database/migrations/019_create_rag_tables.sql
```

### 2. Variables d'environnement

```env
GEMINI_API_KEY=...   # obligatoire (embeddings + génération)
GROQ_API_KEY=...     # optionnel (fallback rapide)
```

### 3. Indexer les sources juridiques

```bash
# Indexe tout ce qui n'a pas encore été indexé
npm run rag:ingest

# Réindexe tout (DROP + réinsertion)
npm run rag:ingest -- --all

# Indexe un seul type de source
npm run rag:ingest -- --type jurisprudence_case
```

## API publique (inchangée)

Les 10 routes IA existantes fonctionnent comme avant. En interne, elles utilisent maintenant le RAG :

| Route | Endpoint | RAG activé | JSON forcé |
|-------|----------|------------|------------|
| Generate document | `POST /api/ai/generate-document` | ✅ | ✅ (POC) |
| Analyze compliance | `POST /api/ai/analyze-compliance` | ✅ | – |
| Suggest improvements | `POST /api/ai/suggest-improvements` | – | – |
| Explain concept | `POST /api/ai/explain-concept` | ✅ | – |
| Validate reasoning | `POST /api/ai/validate-reasoning` | ✅ | – |
| Generate clause | `POST /api/ai/generate-clause` | ✅ | – |
| Review contract | `POST /api/ai/review-contract` | ✅ | ✅ |
| Extract entities | `POST /api/ai/extract-entities` | – | ✅ |
| Summarize document | `POST /api/ai/summarize-document` | – | ✅ |
| Translate text | `POST /api/ai/translate-text` | – | ✅ |

## RAG — détails techniques

### Modèle d'embedding
- **Provider** : Google Gemini `gemini-embedding-001`
- **Dimensions** : 768 (via `outputDimensionality` pour rester compatible avec le schéma `vector(768)`)
- **Tâche** : `RETRIEVAL_DOCUMENT` pour l'indexation, retrieval standard pour les requêtes
- **Note** : `text-embedding-004` a été éteint par Google le 14/01/2026 ; les anciens vecteurs restent exploitables mais doivent être réindexés avec le nouveau modèle.

### Découpage (chunking)
- ~500 tokens par chunk (2000 caractères)
- Overlap de 50 tokens (200 caractères)
- Préserve les frontières sémantiques (espaces normalisés)

### Recherche
- **Distance** : cosinus (`<=>` operator de pgvector)
- **Index** : IVFFlat avec `lists=100` (optimal pour ~10k chunks, ajuster à `sqrt(total)`)
- **Filtres supportés** : `domain`, `jurisdiction`, `language`, `sourceType`
- **Seuil de score minimum** : 0.5 (configurable)
- **Top-k** : 5 par défaut (configurable)

### Schéma `rag_documents`
```sql
id                  UUID PRIMARY KEY
source_type         VARCHAR(50)  -- jurisprudence_case, legal_article, jora_publication, ...
source_id           UUID
title               TEXT
domain              VARCHAR(50)  -- civil, penal, commercial, ...
jurisdiction        VARCHAR(100) DEFAULT 'Algeria'
language            VARCHAR(5)   -- fr, ar
reference_code      VARCHAR(255) -- ex: "Article 124 du Code civil"
keywords            TEXT[]
metadata            JSONB
chunk_index         INTEGER
chunk_text          TEXT
chunk_tokens        INTEGER
embedding           VECTOR(768)
created_at, updated_at TIMESTAMP
UNIQUE(source_type, source_id, chunk_index)
```

### Flux d'ingestion
```
Source (PostgreSQL) → Découpage → Embeddings Gemini → INSERT rag_documents
                       ↓
                   2000 char/chunk, 200 char overlap
```

## JSON forcé — POC

Au lieu de parser des regex fragiles sur du texte libre, on force le LLM à répondre en JSON valide via :

1. **Prompt système** : "RÉPONDS UNIQUEMENT EN JSON VALIDE..."
2. **Schéma fourni en langage naturel** dans le prompt
3. **Extraction robuste** : `extractJsonString` gère les fences ```json, la prose avant/après, les objets/tableaux
4. **Repair léger** : trailing commas, quotes simples, NaN/undefined
5. **Fallback gracieux** : si le parse échoue, on garde le contenu brut + warning

## Tests

```bash
npm test                  # tous les tests
npm test -- jsonForcer    # tests du helper JSON
npm test -- embeddingService
npm test -- ragPromptHelper
npm test -- ragService
```

Les tests Jest mockent :
- `db` (connexion PostgreSQL)
- `aiClient` (appels LLM)
- `embeddingService` (calcul d'embeddings)
- `ragService` (recherche vectorielle)

→ Pas besoin de Gemini ni de PostgreSQL pour lancer les tests.

## Limites connues & prochaines étapes

| Limite | Solution future |
|--------|-----------------|
| Pas de streaming SSE | Implémenter `res.write` sur les routes génération |
| Pas de rate limiting par user | Middleware basé sur `Subscription.creditsRemaining` |
| Pas de cache sémantique | Ajouter Redis avec hash de prompt normalisé |
| Pas de tracking des coûts en BDD | Remplir `ai_service_usage` après chaque appel |
| Validation anti-hallucination faible | Vérifier que les articles cités existent en base |
| Pas de test E2E avec vraie Gemini | Ajouter test d'intégration séparé |

## Métriques cibles

- **Latence P50** (draft) : < 3s (Gemini + RAG)
- **Recall@5** sur jeu de test : > 80%
- **Coût moyen** par draft : < $0.01
- **Hallucination rate** (références inventées) : < 5%
