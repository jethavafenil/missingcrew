const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:t4wgwfedE232@db.yrnccxmxpquetyvxnnwq.supabase.co:5432/postgres';

async function run() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully!');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files.`);

  for (const file of files) {
    console.log(`\nApplying migration: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  -> OK: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  -> ERROR in ${file}:`, err.message);
      process.exit(1);
    }
  }

  // Apply seed.sql
  const seedFile = path.join(__dirname, '..', 'supabase', 'seed.sql');
  if (fs.existsSync(seedFile)) {
    console.log('\nApplying seed.sql...');
    const seedSql = fs.readFileSync(seedFile, 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(seedSql);
      await client.query('COMMIT');
      console.log('  -> OK: seed.sql');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('  -> ERROR in seed.sql:', err.message);
    }
  }

  // Verify created tables
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('\nFinal public tables:');
  console.log(res.rows.map(r => r.table_name).join(', '));

  await client.end();
  console.log('\nAll migrations applied successfully!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
