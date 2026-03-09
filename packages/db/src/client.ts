import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;

let _db: Database | null = null;

export function createDbClient(url?: string): Database {
  if (_db) return _db;
  const connectionString = url ?? process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const client = postgres(connectionString);
  _db = drizzle(client, { schema });
  return _db;
}

export function getDb(): Database {
  if (!_db) {
    throw new Error('Database not initialized. Call createDbClient() first.');
  }
  return _db;
}
