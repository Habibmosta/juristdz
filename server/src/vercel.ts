import { createApp } from './app';

// L'app Express est initialisée une fois (cold start) puis mise en cache.
const appPromise = createApp().catch((err) => {
  // Message explicite dans les logs Vercel si l'initialisation échoue
  console.error('Erreur initialisation backend (createApp):', err);
  throw err;
});

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
