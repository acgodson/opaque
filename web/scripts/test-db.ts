import { config } from 'dotenv';
import { resolve } from 'path';
import { sql } from 'drizzle-orm';

// IMPORTANT: Load env vars BEFORE importing db
config({ path: resolve(__dirname, '../../.env') });

async function testConnection() {
  // Import db and schema after env vars are loaded
  const { db } = await import('../src/db');
  const {
    installedAdapters,
    executionLogs,
  } = await import('../src/db/schema');

  try {
    console.log('🔍 Testing Postgres connection...\n');
    console.log('📍 POSTGRES_URL:', process.env.POSTGRES_URL?.substring(0, 40) + '...\n');

    // Test 1: Simple query
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log('✅ Connection successful!');
    console.log('📅 Server time:', result.rows[0]);

    // Test 2: Count records in each table using Drizzle queries
    console.log('\n📈 Record counts:');


    const adapterCount = await db.select({ count: sql<number>`count(*)` }).from(installedAdapters);
    const logCount = await db.select({ count: sql<number>`count(*)` }).from(executionLogs);


    console.log(`  - installed_adapters: ${adapterCount[0].count}`);
    console.log(`  - execution_logs: ${logCount[0].count}`);

    console.log('\n✨ All tests passed! Postgres is ready to use.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure Docker is running: docker ps');
    console.error('  2. Check Postgres container: docker logs 0xvisor-postgres');
    console.error('  3. Verify POSTGRES_URL in .env file\n');
    process.exit(1);
  }
}

testConnection();
