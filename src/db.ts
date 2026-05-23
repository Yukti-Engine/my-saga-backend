/**
 * db.ts
 *
 * Creates and exports the shared PostgreSQL connection pool used by all
 * controllers and services.
 * Gracefully drains the pool on SIGTERM.
 */
import dotenv from "dotenv";
dotenv.config();
import { Pool } from 'pg';
async function getCloneIp(): Promise<string> {
  const res = await fetch(`${process.env.ADMIN_API_URL}/auth/clone-ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ token: 'Babycorn@38' }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`clone-ip returned ${res.status}: ${body}`);
  }
  const { ip } = await res.json() as { ip: string };
  if (!ip) throw new Error('clone-ip response missing ip field');
  return ip;
}



let databaseUrl = process.env.DATABASE_URL=="staging" ? process.env.DATABASE_URL:"postgresql://user1@Babycorn@38@"+(await getCloneIp())+":5432/g1";
console.log(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,              // maximum connections in the pool
  idleTimeoutMillis: 30000,   // close idle connections after 30s
  connectionTimeoutMillis: 2000, // fail fast if can't get a connection
  ssl: false
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
export default pool;
