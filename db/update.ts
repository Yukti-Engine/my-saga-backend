import { Client } from "pg";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function ensureMigrationsTable(): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        SERIAL PRIMARY KEY,
      filename  TEXT NOT NULL UNIQUE,
      ran_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getRanMigrations(): Promise<Set<string>> {
  const result = await client.query<{ filename: string }>(
    `SELECT filename FROM _migrations ORDER BY filename`
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function runMigration(filePath: string, filename: string): Promise<void> {
  const sql = await readFile(filePath, "utf-8");

  // Run the migration + record it atomically in a single transaction
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO _migrations (filename) VALUES ($1)`,
      [filename]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main(): Promise<void> {
  const migrationsDir = join(process.cwd(), "migrations");

  await client.connect();
  console.log("✅ Connected to database.\n");

  try {
    await ensureMigrationsTable();

    const ranMigrations = await getRanMigrations();

    const allFiles = await readdir(migrationsDir);
    const sqlFiles = allFiles
      .filter((f) => f.endsWith(".sql"))
      .sort(); // alphabetical / timestamp order ensures correct sequence

    const pending = sqlFiles.filter((f) => !ranMigrations.has(f));

    if (pending.length === 0) {
      console.log("✨ No pending migrations. Database is up to date.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);

    for (const filename of pending) {
      const filePath = join(migrationsDir, filename);
      process.stdout.write(`  ⏳ Running ${filename} … `);
      try {
        await runMigration(filePath, filename);
        console.log("✅ done");
      } catch (err) {
        console.log("❌ failed");
        console.error(`\n  Error in ${filename}:`, err);
        process.exit(1);
      }
    }

    console.log(`\n🎉 ${pending.length} migration(s) applied successfully.`);
  } finally {
    await client.end();
  }
}

main();