import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../utils/env.js';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../sql/schema.sql');

async function runMigrations() {
  const connectionString =
    process.env.DIRECT_URL && !process.env.DIRECT_URL.includes('[YOUR-PASSWORD]')
      ? process.env.DIRECT_URL
      : process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
    console.error(
      'ERROR: Please replace [YOUR-PASSWORD] in backend/.env DATABASE_URL with your real Supabase password before running migrations.',
    );
    process.exit(1);
  }

  const sql = await fs.readFile(schemaPath, 'utf8');
  const pgModule = await import('pg');
  const Client = pgModule.default?.Client || pgModule.Client;
  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase.com')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL. Running schema migration...');
    await client.query(sql);
    console.log('Migration complete: all FixMyBuddy tables and indexes are ready.');
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
