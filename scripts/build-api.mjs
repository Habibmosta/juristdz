// Bundle le backend Express en une fonction Vercel autonome (api/index.js).
// esbuild résout l'alias "@/..." via le tsconfig du serveur (paths).
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = join(root, 'server');

await build({
  entryPoints: [join(serverDir, 'src/vercel.ts')],
  outfile: join(root, 'api/index.js'),
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  tsconfig: join(serverDir, 'tsconfig.json'),
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  external: [
    // Modules binaires / natifs à conserver en externe
    'pg-native'
  ],
  loader: { '.sql': 'text' },
  banner: {
    // Certains modules CJS bundlés font des require() à l'exécution :
    // on fournit un require fonctionnel dans la sortie ESM.
    js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);"
  }
});

console.log('Bundle API généré : api/index.js');
