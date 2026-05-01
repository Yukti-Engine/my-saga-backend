/**
 * db.ts
 *
 * Creates and exports the shared PostgreSQL connection pool used by all
 * controllers and services. Reads DATABASE_URL from the environment and
 * gracefully drains the pool on SIGTERM.
 */
import dotenv from "dotenv";
dotenv.config();
import { Pool } from 'pg';

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not found in .env");
// Rewrite the default "postgres" database name to the project-specific "g1" database
if (databaseUrl.substring(databaseUrl.lastIndexOf('/')+1, databaseUrl.length)=="postgres")
  databaseUrl = databaseUrl.substring(0, databaseUrl.length-8) + "g1";
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
