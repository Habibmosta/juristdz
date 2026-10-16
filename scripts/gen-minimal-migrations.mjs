// Génère _MINIMAL_MIGRATIONS.sql : noyau fonctionnel uniquement.
// 001 (users/organizations/sessions) + 004 (RBAC) + 018 (tables front) + 020 (reset MDP) + 021 (vérif email).
// Ces 4 fichiers n'ont aucun conflit de tables entre eux.
// Les migrations 002-017/019 (documents, recherche, RAG, IA) seront traitées
// séparément : elles contiennent des définitions de tables dupliquées.
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'server/src/database/migrations');

const keep = [
  '001_create_users_table.sql',
  '004_create_rbac_tables.sql',
  '018_add_frontend_tables.sql',
  '020_create_password_reset_tokens.sql',
  '021_create_email_verification_tokens.sql'
];

let out = `-- ====================================================================
-- MIGRATIONS MINIMALES JuristDZ (une seule execution Alt+X)
-- 001 users/organizations/sessions + 004 RBAC + 018 tables front + 020 reset MDP + 021 verification email
-- ====================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
`;

let tables = 0;
let enums = 0;

for (const f of keep) {
  let sql = readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n');

  // 018 : `cases` référence `clients(id)` mais clients est créé après.
  // On déplace le bloc de création de `clients` avant celui de `cases`.
  if (f.startsWith('018')) {
    const clientsMatch = sql.match(/CREATE TABLE IF NOT EXISTS clients \([\s\S]*?\);/i);
    if (clientsMatch) {
      sql = sql.replace(clientsMatch[0], '');
      sql = sql.replace(
        /(CREATE TABLE IF NOT EXISTS cases )/i,
        `${clientsMatch[0]}\n\n$1`
      );
    }
  }

  sql = sql.replace(/CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/gi, 'CREATE $1INDEX IF NOT EXISTS ');
  sql = sql.replace(/CREATE TABLE (?!IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS ');
  const beforeTypes = sql;
  sql = sql.replace(
    /CREATE TYPE ("[^"]+"|[\w]+) AS ENUM \(([\s\S]*?)\);/gi,
    (_m, name, vals) => {
      enums++;
      return `DO $$ BEGIN CREATE TYPE ${name} AS ENUM (${vals}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`;
    }
  );
  void beforeTypes;
  tables += (sql.match(/CREATE TABLE IF NOT EXISTS/gi) || []).length;

  out += `\n-- ============ ${f} ============\n${sql}\n`;
}

out += `
-- ============ VERIFICATION ============
SELECT count(*) AS tables_creees FROM information_schema.tables WHERE table_schema = 'public';
`;

writeFileSync(join(root, '_MINIMAL_MIGRATIONS.sql'), out);
console.log('OK - _MINIMAL_MIGRATIONS.sql genere');
console.log('tables:', tables, '| types enum (DO blocs):', enums);
