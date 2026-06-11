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


import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';


async function getCloneIp(): Promise<string> {
  const rl = readline.createInterface({ input, output });
  
  const superToken = await rl.question('Enter Super Token: ');
  
  rl.close();

  const res = await fetch(`${process.env.ADMIN_API_URL}/admin/clone-ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ superToken: superToken }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`clone-ip returned ${res.status}: ${body}`);
  }
  const { ip } = await res.json() as { ip: string };
  if (!ip) throw new Error('clone-ip response missing ip field');
  return ip;
}



let databaseUrl;
if (process.env.DATABASE_URL=="staging")
  databaseUrl="postgresql://user1:Password#2@"+(await getCloneIp())+":5432/g1";
else
  databaseUrl=process.env.DATABASE_URL

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
