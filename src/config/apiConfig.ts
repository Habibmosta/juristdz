// URL de base de l'API backend.
// En dev : http://localhost:3000 par défaut.
// En prod, si VITE_API_URL n'est pas défini : même origine que le front
// (déploiement Vercel avec la fonction serverless dans /api).
const rawBaseUrl: string = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD && typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const API_URL = `${API_BASE_URL}/api`;
