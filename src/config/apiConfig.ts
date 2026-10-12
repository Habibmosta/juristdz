// URL de base de l'API backend.
// En dev : http://localhost:3000 par défaut.
// En prod (Vercel etc.) : définir la variable d'environnement VITE_API_URL
// (ex: https://api.juristdz.com). Un slash final est toléré et retiré.
const rawBaseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export const API_URL = `${API_BASE_URL}/api`;
