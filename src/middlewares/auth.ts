/**
 * middlewares/auth.ts
 *
 * Express middleware for authentication and authorization across all My Saga roles.
 * Exports:
 *   authUser          — verifies uid + accessToken for regular users
 *   authBoss          — verifies bid + accessToken for bosses (experts)
 *   authOrganizer     — verifies oid + accessToken for organizers (guides)
 *   authSuperToken    — static shared secret check used for moderator endpoints
 *   authAny           — generic multi-role auth; also accepts the super token as "moderator"
 *   verifyRecaptcha   — validates a Google reCAPTCHA v3 token from the request body
 *   requireLegalAcceptance — factory that returns a middleware ensuring the caller has
 *                            accepted the latest Terms & Privacy for their role
 */
import type { Request, Response, NextFunction } from "express";
import pool from "../db.js";
import { verifyRecaptchaToken } from "../services/captchaService.js";
import { fetchLegalVersions, ROLE_APP } from "../legalVersions.js";

/** Authenticates a regular user via uid + accessToken. Delegates to the DB `authenticate` function. */
export const authUser = async (req: Request, res: Response, next: NextFunction) => {
  const { uid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [uid, "user", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

/** Authenticates a boss (expert) via bid + accessToken. */
export const authBoss = async (req: Request, res: Response, next: NextFunction) => {
  const { bid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [bid, "boss", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

/** Authenticates an organizer (guide) via oid + accessToken. */
export const authOrganizer = async (req: Request, res: Response, next: NextFunction) => {
  const { oid, accessToken } = req.body;
  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [oid, "organizer", accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};

/** Validates the Google reCAPTCHA v3 token sent in `req.body.recaptchaToken`. */
export const verifyRecaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const { recaptchaToken } = req.body;
  if (!recaptchaToken)
    return res.status(400).json({ error: "reCAPTCHA token missing" });

  try {
    const passed = await verifyRecaptchaToken(recaptchaToken);
    if (!passed)
      return res.status(403).json({ error: "reCAPTCHA verification failed" });
    next();
  } catch (err) {
    console.error("reCAPTCHA error:", err);
    return res.status(500).json({ error: "reCAPTCHA check failed" });
  }
};

/**
 * Validates a static super token sent in `req.body.superToken`.
 * Used to protect all moderator/admin routes.
 */
export const authSuperToken = (req: Request, res: Response, next: NextFunction) => {
  const { superToken } = req.body;
  if (!superToken || superToken !== process.env.SUPER_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

/**
 * Factory middleware that blocks requests where the caller has not accepted
 * the current version of the Terms or Privacy Policy for their role.
 * Returns a 403 with `requiresTerms` and `requiresPrivacy` flags so the
 * client can prompt the user to accept only what is outstanding.
 */
export const requireLegalAcceptance = (role: "user" | "organizer" | "boss") =>
  async (req: Request, res: Response, next: NextFunction) => {
    const idField = role === "user" ? "uid" : role === "organizer" ? "oid" : "bid";
    const id = req.body[idField];
    const table = role === "user" ? "users" : role === "organizer" ? "organizers" : "bosses";
    // Fetch the user's accepted versions and the current published versions in parallel
    const [{ rows }, { terms_version, privacy_version }] = await Promise.all([
      pool.query(`SELECT terms_accepted_version, privacy_accepted_version FROM ${table} WHERE id = $1::int`, [id]),
      fetchLegalVersions(ROLE_APP[role]),
    ]);
    if (rows.length === 0) return res.status(401).json({ error: "Authentication Error" });
    const { terms_accepted_version, privacy_accepted_version } = rows[0];
    const requiresTerms = terms_accepted_version < terms_version;
    const requiresPrivacy = privacy_accepted_version < privacy_version;
    if (requiresTerms || requiresPrivacy)
      return res.status(403).json({
        error: "Legal acceptance required",
        requiresTerms,
        requiresPrivacy,
        currentTermsVersion: terms_version,
        currentPrivacyVersion: privacy_version,
      });
    next();
  };

/**
 * Generic multi-role authentication middleware.
 * Accepts `{ id, role, accessToken }` in the request body.
 * Also allows the super token to act as a moderator identity (id=0, role="moderator").
 */
export const authAny = async (req: Request, res: Response, next: NextFunction) => {
  const { id, role, accessToken } = req.body;

  // Allow moderator access via the super token without a real user account
  if (id === 0 && role === "moderator" && accessToken === process.env.SUPER_TOKEN)
    return next();

  const result = await pool.query(
    `SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`,
    [id, role, accessToken]
  );
  if (!result.rows[0].is_authenticated)
    return res.status(401).json({ error: "Authentication Error" });
  next();
};
