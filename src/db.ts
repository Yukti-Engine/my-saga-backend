import { Pool } from 'pg';

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL not found in .env");
if (databaseUrl.substring(databaseUrl.lastIndexOf('/')+1, databaseUrl.length)=="postgres")
  databaseUrl = databaseUrl.substring(0, databaseUrl.length-8) + "g1";
const pool = new Pool({
  connectionString: databaseUrl,
});

export default pool;
