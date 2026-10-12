// Placeholder committé pour que Vercel détecte la fonction serverless.
// Ce fichier est ÉCRASÉ à chaque build par `npm run build:api` (scripts/build-api.mjs)
// qui bundle le backend Express (server/src/vercel.ts).
// Ne jamais exécuter `npm run build:api` avant `git add` de ce fichier.
module.exports = async function handler(req, res) {
  res.status(503).json({
    error: 'Backend non initialisé',
    message: "Le bundle n'a pas encore été généré (lancez npm run build:api)."
  });
};
