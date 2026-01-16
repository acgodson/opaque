import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { sql as vercelSql } from '@vercel/postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Automatically detect environment and use appropriate driver:
// - Production (Vercel): Uses @vercel/postgres (Neon serverless driver)
// - Local development: Uses standard pg driver for Docker Postgres
let db: ReturnType<typeof drizzleNode> | ReturnType<typeof drizzleVercel>;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isProduction = process.env.VERCEL || databaseUrl?.includes('neon.tech');

if (isProduction) {
  // Production: Use Vercel Postgres (Neon)
  db = drizzleVercel(vercelSql, { schema });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Using Vercel Postgres (Neon) driver');
  }
} else {
  // Local development: Use standard postgres driver for Docker Postgres
  const pool = new Pool({
    connectionString: databaseUrl || 'postgresql://opaque:opaque@localhost:5432/opaque',
  });
  db = drizzleNode(pool, { schema });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Using standard pg driver for local Docker Postgres');
    console.log('[DB] Connection string:', databaseUrl?.replace(/:[^:@]+@/, ':****@'));
  }
}

export { db };
export * from './schema';
export { eq, and, or, desc, asc, sql, inArray, isNull } from 'drizzle-orm';
