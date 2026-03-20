import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// ESM doesn't have __dirname, so we recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
let pool = new Pool({ connectionString: databaseUrl });

async function seed() {
  if(databaseUrl.substring(databaseUrl.lastIndexOf('/')+1,databaseUrl.length) == 'postgres'){
      const adminClient = await pool.connect();
      const { rows: pg_database_rows } = await adminClient.query(   // <-- fixed destructuring
        `SELECT 1 FROM pg_database WHERE datname = 'g1'`
      );
      if (pg_database_rows.length === 0) {
        await adminClient.query(`CREATE DATABASE g1`);
      }
      adminClient.release();
      await pool.end();
      pool = new Pool({ connectionString: databaseUrl.substring(0, databaseUrl.length-8)+"g1" });
  }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Schema already exists, skipping...');
      return;
    }

    await client.query('BEGIN');
    const schema = readFileSync(join(__dirname, './schema.sql')).toString( 'utf8');
    await client.query(schema); 
    await client.query('COMMIT');
    console.log('✅ Database seeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
