# Déploiement Vercel (frontend + backend serverless gratuit)

Depuis ce déploiement, le backend Express tourne comme **fonction serverless Vercel** (`api/index.cjs`, bundlé par `scripts/build-api.mjs` depuis `server/src/`). Le frontend et l'API partagent le même domaine : plus besoin de `VITE_API_URL`.

## Étape 1 — Base de données PostgreSQL (Neon, gratuit)

1. Créer un compte sur https://neon.tech (gratuit, sans carte bancaire)
2. Créer un projet → copier la **connection string** (format `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/juristdz?sslmode=require`)
3. Conserver cette URL : ce sera `DATABASE_URL`

## Étape 2 — Variables d'environnement Vercel

Vercel → projet → **Settings → Environment Variables** (Production) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Neon de l'étape 1 |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | *(voir `server/.env` — 48 caractères)* |
| `JWT_REFRESH_SECRET` | *(voir `server/.env`)* |
| `JWT_EXPIRES_IN` | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `ENCRYPTION_KEY` | *(voir `server/.env` — exactement 32 caractères)* |
| `GEMINI_API_KEY` | clé Gemini (`AQ.` ou `AIza…`) |
| `GROQ_API_KEY` | clé Groq (`gsk_…`) |
| `FRONTEND_URL` | `https://juristdz-ia-juridique-algerienne.vercel.app` |
| `SMTP_HOST` / `SMTP_PORT` | `smtp-relay.brevo.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | identifiants SMTP Brevo |
| `MAIL_FROM` | `JuristDZ <no-reply@juristdz.com>` |
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |

> Ne **pas** définir `VITE_API_URL` : le front utilisera automatiquement le même domaine que le site (la fonction `/api/*`).

## Étape 3 — Appliquer les migrations SQL

Depuis un terminal local (PowerShell), en pointant vers Neon :

```powershell
cd server
$env:DATABASE_URL = "postgresql://user:pass@ep-xxx.neon.tech/juristdz?sslmode=require"
$env:DATABASE_SSL = "true"
npx tsx src/database/migrate.ts
```

Le runner exécute les fichiers `src/database/migrations/*.sql` dans l'ordre et garde une trace dans la table `migrations` (idempotent).

## Étape 4 — Déploiement

Chaque `git push origin main` déclenche automatiquement :
1. `yarn install` (+ dépendances du serveur)
2. `npm run build` (frontend Vite → `dist/`)
3. `npm run build:api` (backend Express bundlé → `api/index.cjs`)

Vérifier dans les logs de build Vercel que les 3 étapes passent, puis ouvrir `https://juristdz-ia-juridique-algerienne.vercel.app/api/health` — doit répondre `{"status":"healthy"}`.

## Limites connues du mode serverless (gratuit)

- **Tâches planifiées désactivées** : le nettoyage des sessions et le scheduler de notifications (qui tournent en `setInterval` sur un serveur classique) ne démarrent pas dans les fonctions serverless. À réactiver via un cron (Vercel Cron ou service externe) le cas échéant.
- **Uploads de fichiers** : le filesystem serverless est éphémère (seul `/tmp` est accessible) — les uploads via `multer` ne persistent pas. Prévu : stockage objet (S3/R2/Bunny) si besoin.
- **Cold start** : la première requête après une période d'inactivité est plus lente (quelques secondes), le temps que la fonction s'initialise.

## Bascule vers un serveur dédié plus tard

Le code reste compatible : `server/src/index.ts` (mode serveur classique avec `app.listen`) et `server/src/app.ts` (app réutilisable) sont inchangés fonctionnellement. Il suffira de déployer le dossier `server/` sur un VPS/Railway et de définir `VITE_API_URL` côté Vercel.
