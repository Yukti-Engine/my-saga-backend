import pool from "./db.js";

export type LegalApp = "user" | "guide" | "expert";

interface LegalVersion { terms_version: number; privacy_version: number; }

const cache = new Map<LegalApp, { value: LegalVersion; expiresAt: number }>();
const TTL = 60_000;

export async function fetchLegalVersions(app: LegalApp): Promise<LegalVersion> {
  const cached = cache.get(app);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const { rows } = await pool.query(
    `SELECT terms_version, privacy_version FROM legal_versions WHERE app = $1`,
    [app]
  );
  const value: LegalVersion = rows[0];
  cache.set(app, { value, expiresAt: Date.now() + TTL });
  return value;
}

export const ROLE_APP: Record<"user" | "organizer" | "boss", LegalApp> = {
  user:      "user",
  organizer: "guide",
  boss:      "expert",
};
