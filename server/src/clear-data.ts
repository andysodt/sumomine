import { db, pool } from './db/connection.js';
import { sql } from 'drizzle-orm';

async function clearData() {
  console.log('🧹 Clearing all data from database...');

  try {
    // Clear all tables (order matters due to foreign keys)
    await db.execute(sql`TRUNCATE TABLE rikishi CASCADE`);
    await db.execute(sql`TRUNCATE TABLE basho CASCADE`);

    console.log('✅ All data cleared successfully!');
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearData();