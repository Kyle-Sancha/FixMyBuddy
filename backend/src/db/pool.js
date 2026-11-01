import process from 'node:process';
import { loadEnv } from '../utils/env.js';

loadEnv();

let poolPromise = null;

export function getConnectionConfig() {
  const connectionString = process.env.DATABASE_URL || '';
  if (connectionString && !connectionString.includes('[YOUR-PASSWORD]')) {
    const isSupabase = connectionString.includes('supabase.com');
    return {
      connectionString,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    };
  }
  if (
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    !process.env.DB_PASSWORD.includes('[YOUR-PASSWORD]')
  ) {
    const isSupabase = process.env.DB_HOST.includes('supabase.com');
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    };
  }
  return null;
}

export function isDbConfigured() {
  return Boolean(getConnectionConfig());
}

export async function getPool() {
  const config = getConnectionConfig();
  if (!config) {
    throw new Error(
      'DATABASE_URL is not configured or still contains the [YOUR-PASSWORD] placeholder. Update backend/.env with your Supabase database password.',
    );
  }
  if (!poolPromise) {
    poolPromise = (async () => {
      const pgModule = await import('pg');
      const Pool = pgModule.default?.Pool || pgModule.Pool;
      return new Pool({
        ...config,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    })();
  }
  return poolPromise;
}

export async function query(text, params = []) {
  const db = await getPool();
  return db.query(text, params);
}

export async function withTransaction(callback) {
  const db = await getPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
