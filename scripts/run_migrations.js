/**
 * HOUSE OF JEWELUX — Migration Runner
 * Connects to PostgreSQL / Supabase, tracks applied migrations in _migrations,
 * and executes new SQL migrations transactionally.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) {
    console.log('✦ [MIGRATION INFO] No DATABASE_URL or SUPABASE_DATABASE_URL configured.');
    console.log('✦ Skipping remote database migrations. The app will continue using resilient local JSON storage.');
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
  console.log('✦ Connected to PostgreSQL / Supabase for migrations.');

  try {
    await client.query('BEGIN');

    // Ensure _migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve(__dirname, '../server/db/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.includes('_down'))
      .sort();

    const appliedRes = await client.query('SELECT name FROM _migrations');
    const appliedNames = new Set(appliedRes.rows.map(r => r.name));

    let count = 0;
    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`✦ Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        console.log(`✓ Applied: ${file}`);
        count++;
      } else {
        console.log(`· Migration already applied: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log(`✦ All migrations complete. (${count} applied)`);
    return { success: true, appliedCount: count };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed and was rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runMigrations;
