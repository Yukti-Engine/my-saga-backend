/**
 * legalVersions.ts
 *
 * Provides cached access to the current Terms & Conditions and Privacy Policy
 * version numbers stored in the `legal_versions` database table.
 *
 * Results are cached in-process with a 60-second TTL to avoid hitting the DB
 * on every authenticated request. The cache is invalidated automatically on
 * expiry; there is no manual invalidation — version bumps take effect within
 * one TTL window (≤ 60 seconds).
 */
import pool from "./db.js";

export type LegalApp = "user" | "guide" | "expert";

interface LegalVersion { terms_version: number; privacy_version: number; }

// In-memory cache: app → { value, expiresAt }
const cache = new Map<LegalApp, { value: LegalVersion; expiresAt: number }>();
const TTL = 60_000; // cache entries expire after 60 seconds

export async function fetchLegalVersions(app: LegalApp): Promise<LegalVersion> {
  const cached = cache.get(app);
  // Return the cached value if it has not expired
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const { rows } = await pool.query(
    `SELECT * FROM get_legal_versions($1::text)`,
    [app]
  );
  const value: LegalVersion = rows[0];
  cache.set(app, { value, expiresAt: Date.now() + TTL });
  return value;
}

/** Maps the internal role name to the corresponding legal app identifier. */
export const ROLE_APP: Record<"user" | "organizer" | "boss", LegalApp> = {
  user:      "user",
  organizer: "guide",
  boss:      "expert",
};
