// Doit être importé EN PREMIER (ESM évalue les imports dans l'ordre source).
// Enregistre les garde-fous AVANT que les autres modules (et leurs promesses
// flottantes) ne s'évaluent. Sans ça, un rejet non géré au boot crash le
// process sous Node 15+ → réponse 500 vide sur Vercel.
const log = (...args: any[]) => console.error('[BOOT-SAFETY]', ...args);

process.on('unhandledRejection', (reason: any) => {
  log('unhandledRejection (non fatale):', reason?.message || reason);
});

process.on('uncaughtException', (err: any) => {
  log('uncaughtException (non fatale):', err?.message || err);
});

export {};
