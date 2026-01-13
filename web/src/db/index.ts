import * as schema from './schema';

// Automatically detect environment and use appropriate driver:
// - Production (Vercel): Uses @vercel/postgres (Neon serverless driver)
// - Local development: Uses standard pg driver for Docker Postgres
let db: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> | ReturnType<typeof import('drizzle-orm/vercel-postgres').drizzle>;

const isProduction = process.env.VERCEL || process.env.POSTGRES_URL?.includes('neon.tech');

if (isProduction) {
  // Production: Use Vercel Postgres (Neon)
  const { drizzle } = require('drizzle-orm/vercel-postgres');
  const { sql } = require('@vercel/postgres');
  db = drizzle(sql, { schema });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Using Vercel Postgres (Neon) driver');
  }
} else {
  // Local development: Use standard postgres driver for Docker Postgres
  const { drizzle } = require('drizzle-orm/node-postgres');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/opaque',
  });
  db = drizzle(pool, { schema });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Using standard pg driver for local Docker Postgres');
  }
}

export { db };
export * from './schema';
