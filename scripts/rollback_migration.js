/**
 * HOUSE OF JEWELUX — Migration Rollback Script
 * Rolls back the latest applied migration or completely reverses schema down.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function rollbackMigrations() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.log('✦ [ROLLBACK INFO] No DATABASE_URL configured.');
    return { skipped: true, reason: 'NO_DATABASE_URL' };
  }

  const isSupabase = dbUrl.includes('supabase.co') || dbUrl.includes('pooler.supabase.com');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isSupabase || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  });

  const client = await pool.connect();
  console.log('✦ Connected to PostgreSQL / Supabase for rollback.');

  try {
    await client.query('BEGIN');

    const downSqlPath = path.resolve(__dirname, '../server/db/migrations/001_initial_schema_down.sql');
    if (fs.existsSync(downSqlPath)) {
      console.log('✦ Executing 001_initial_schema_down.sql...');
      const sql = fs.readFileSync(downSqlPath, 'utf8');
      await client.query(sql);
      console.log('✓ Successfully rolled back initial schema tables.');
    }

    await client.query('COMMIT');
    console.log('✦ Rollback transaction committed successfully.');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  rollbackMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = rollbackMigrations;
