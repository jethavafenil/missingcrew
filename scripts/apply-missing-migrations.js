/**
 * Apply only the migrations that are safe to re-run (CREATE OR REPLACE / ALTER TABLE IF NOT SET).
 * Handles the case where 0000-0008 are already applied but 0009+ were added later.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL (or SUPABASE_DB_URL) to the database connection string. Never hard-code it in this file.');
  process.exit(1);
}

// Only migrations that use CREATE OR REPLACE or are safe to apply multiple times.
// 0009: uses CREATE OR REPLACE FUNCTION — safe
// 0010: uses ALTER TABLE ... SET DEFAULT — safe (idempotent in Postgres)
const SAFE_MIGRATIONS = ['0009_oauth_email_link.sql', '0010_id_defaults.sql'];

async function run() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  for (const file of SAFE_MIGRATIONS) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }
    console.log(`\nApplying: ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  -> OK`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  -> ERROR:`, err.message);
    }
  }

  // Verify the trigger function is the latest version (0009)
  const res = await client.query(`
    SELECT prosrc FROM pg_proc
    WHERE proname = 'handle_new_auth_user'
    LIMIT 1;
  `);
  const hasEmailLink = res.rows[0]?.prosrc?.includes('lazy backfill') || res.rows[0]?.prosrc?.includes('existing_id');
  console.log('\n--- Verification ---');
  console.log(`handle_new_auth_user has email-link logic: ${hasEmailLink}`);

  // Check id defaults
  const idRes = await client.query(`
    SELECT c.table_name, c.column_name, c.column_default
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'id'
      AND c.column_default IS NOT NULL
    ORDER BY c.table_name;
  `);
  console.log('\nTables with id defaults:');
  idRes.rows.forEach(r => console.log(`  ${r.table_name}: ${r.column_default}`));

  await client.end();
  console.log('\nDone!');
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
