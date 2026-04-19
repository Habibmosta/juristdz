import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api/groq': {
            target: 'https://api.groq.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/groq/, ''),
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        }
      },
      plugins: [react()],
      css: {
        postcss: './postcss.config.js',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              // React core
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              // Supabase
              'vendor-supabase': ['@supabase/supabase-js'],
              // UI icons
              'vendor-lucide': ['lucide-react'],
              // PDF / document generation
              'vendor-pdf': ['jspdf', 'jspdf-autotable'],
              // Markdown
              'vendor-markdown': ['react-markdown'],
              // Google AI
              'vendor-ai': ['@google/genai'],
            }
          }
        }
      }
    };
});
