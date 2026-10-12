// Bundle le backend Express en une fonction Vercel autonome (api/index.js).
// esbuild résout l'alias "@/..." via le tsconfig du serveur (paths).
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = join(root, 'server');

await build({
  entryPoints: [join(serverDir, 'src/vercel.ts')],
  outfile: join(root, 'api/index.cjs'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  tsconfig: join(serverDir, 'tsconfig.json'),
  sourcemap: process.env.NODE_ENV !== 'production' ? 'inline' : false,
  minify: false,
  logLevel: 'info',
  external: [
    // Modules binaires / natifs à conserver en externe
    'pg-native'
  ],
  loader: { '.sql': 'text' }
});

console.log('Bundle API généré : api/index.cjs');
