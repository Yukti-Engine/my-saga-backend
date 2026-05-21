/**
 * db/seed.ts — Local DB sync from Cloud SQL clone
 *
 * Fetches the clone's public IP from the admin API, dumps it, and restores
 * it into a local `g1` database. Auto-detects whether `g1` exists: drops and
 * recreates if it does, creates fresh if not.
 *
 * Required env vars:
 *   DATABASE_URL   — local postgres connection (used to admin DROP/CREATE)
 *   ADMIN_API_URL  — deployed API base URL, e.g. https://api.mysaga.in
 *   SUPER_TOKEN    — shared secret for admin/moderator routes
 *
 * Clone credentials are fixed: user1 / Babycorn@38 (set by refresh-clone).
 *
 * Usage:
 *   npx tsx db/seed.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

if (process.env.NODE_ENV === 'production') {
  console.error('❌  Refusing to run seed in production.');
  process.exit(1);
}

const DATABASE_URL  = process.env.DATABASE_URL  ?? '';
const ADMIN_API_URL = process.env.ADMIN_API_URL ?? '';

if (!DATABASE_URL)  { console.error('❌  DATABASE_URL is not set.');   process.exit(1); }
if (!ADMIN_API_URL) { console.error('❌  ADMIN_API_URL is not set.'); process.exit(1); }

/** Swap the database name in a connection URL */
function withDb(url: string, dbName: string): string {
  const u = new URL(url);
  u.pathname = `/${dbName}`;
  return u.toString();
}

const ADMIN_URL = withDb(DATABASE_URL, 'postgres');
const LOCAL_G1  = withDb(DATABASE_URL, 'g1');
const DUMP_PATH = join(tmpdir(), 'g1_clone_dump.dump');

// Fixed credentials set by /admin/refresh-clone
const CLONE_USER     = 'user1';
const CLONE_PASSWORD = 'Babycorn@38';

async function getCloneIp(): Promise<string> {
  console.log('🌐  Fetching clone IP from admin API…');
  const res = await fetch(`${ADMIN_API_URL}/auth/clone-ip`, {
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
  console.log(`     Clone IP: ${ip}`);
  return ip;
}

async function resync() {
  const cloneIp  = await getCloneIp();
  const CLONE_URL = `postgresql://${CLONE_USER}@${cloneIp}:5432/g1`;

  // ── 1. Drop (if exists) and recreate local g1 ─────────────────────────────
  const adminPool = new Pool({ connectionString: ADMIN_URL, ssl: false });
  const client    = await adminPool.connect();

  try {
    const { rows } = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'g1'`
    );

    if (rows.length > 0) {
      console.log('\n🗑️   g1 exists — terminating connections and dropping…');
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM   pg_stat_activity
        WHERE  datname = 'g1' AND pid <> pg_backend_pid()
      `);
      await client.query('DROP DATABASE g1');
      console.log('     Dropped.');
    } else {
      console.log('\nℹ️   g1 does not exist — will create fresh.');
    }

    await client.query('CREATE DATABASE g1');
    console.log('✅  Created g1.');
  } finally {
    client.release();
    await adminPool.end();
  }

  // ── 2. Dump from clone ─────────────────────────────────────────────────────
  console.log('\n📦  Dumping clone database…');
  try {
    execSync(
      `pg_dump "${CLONE_URL}" --no-owner --no-acl -Fc -f "${DUMP_PATH}"`,
      { stdio: 'inherit', env: { ...process.env, PGPASSWORD: CLONE_PASSWORD } }
    );
    console.log('✅  Dump complete.');
  } catch {
    console.error('❌  pg_dump failed.');
    process.exit(1);
  }

  // ── 3. Restore into local g1 ───────────────────────────────────────────────
  console.log('\n🔄  Restoring into local g1…');
  try {
    execSync(
      `pg_restore --no-owner --no-acl -d "${LOCAL_G1}" "${DUMP_PATH}"`,
      { stdio: 'inherit' }
    );
    console.log('✅  Restore complete.');
  } catch {
    // pg_restore exits non-zero for harmless extension-ownership warnings.
    if (!existsSync(DUMP_PATH)) {
      console.error('❌  pg_restore failed and dump file is missing.');
      process.exit(1);
    }
    console.warn('⚠️   pg_restore finished with warnings (usually harmless).');
  }

  // ── 4. Cleanup ─────────────────────────────────────────────────────────────
  if (existsSync(DUMP_PATH)) unlinkSync(DUMP_PATH);
  console.log('\n🎉  Local g1 is now in sync with the clone!');
}

resync().catch((err) => {
  console.error('❌  Unexpected error:', err);
  process.exit(1);
});
