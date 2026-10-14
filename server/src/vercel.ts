// Filet de sécurité serverless : un rejet non géré (promesse flottante
// dans un service initialisé au boot) crasherait la fonction entière.
process.on('unhandledRejection', (reason: any) => {
  console.error('unhandledRejection (non fatale):', reason?.message || reason);
});

import { createApp } from './app';

// L'app Express est initialisée une fois (cold start) puis mise en cache.
const appPromise = createApp().catch((err: any) => {
  console.error('Erreur initialisation backend (createApp):', err);
  throw err;
});

export default async function handler(req: any, res: any) {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    // Diagnostic explicite (visible dans la réponse ET les logs Vercel)
    const env = process.env;
    res.status(503).json({
      error: 'backend_init_failed',
      message: err?.message || String(err),
      code: err?.code || null,
      config: {
        DATABASE_URL_set: Boolean(env.DATABASE_URL),
        DATABASE_SSL: env.DATABASE_SSL ?? null,
        JWT_SECRET_len: env.JWT_SECRET ? env.JWT_SECRET.length : 0,
        JWT_REFRESH_SECRET_len: env.JWT_REFRESH_SECRET ? env.JWT_REFRESH_SECRET.length : 0,
        ENCRYPTION_KEY_len: env.ENCRYPTION_KEY ? env.ENCRYPTION_KEY.length : 0,
        GEMINI_API_KEY_set: Boolean(env.GEMINI_API_KEY),
        GROQ_API_KEY_set: Boolean(env.GROQ_API_KEY),
        FRONTEND_URL: env.FRONTEND_URL ?? null,
        NODE_ENV: env.NODE_ENV ?? null
      }
    });
  }
}
