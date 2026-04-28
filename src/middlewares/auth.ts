import type { Request, Response, NextFunction } from "express";
import pool from "../db.js";
import { verifyRecaptchaToken } from "../services/captchaService.js";
import { MYSAGA_TERMS_VERSION, MYSAGA_PRIVACY_VERSION, MYSAGAGUIDE_TERMS_VERSION, MYSAGAGUIDE_PRIVACY_VERSION, MYGUILD_TERMS_VERSION, MYGUILD_PRIVACY_VERSION } from "../legalVersions.js";

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

export const authSuperToken = (req: Request, res: Response, next: NextFunction) => {
  const { superToken } = req.body;
  if (!superToken || superToken !== process.env.SUPER_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

const TERMS_VERSION = { user: MYSAGA_TERMS_VERSION, organizer: MYSAGAGUIDE_TERMS_VERSION, boss: MYGUILD_TERMS_VERSION };
const PRIVACY_VERSION = { user: MYSAGA_PRIVACY_VERSION, organizer: MYSAGAGUIDE_PRIVACY_VERSION, boss: MYGUILD_PRIVACY_VERSION };

export const requireLegalAcceptance = (role: "user" | "organizer" | "boss") =>
  async (req: Request, res: Response, next: NextFunction) => {
    const idField = role === "user" ? "uid" : role === "organizer" ? "oid" : "bid";
    const id = req.body[idField];
    const table = role === "user" ? "users" : role === "organizer" ? "organizers" : "bosses";
    const { rows } = await pool.query(
      `SELECT terms_accepted_version, privacy_accepted_version FROM ${table} WHERE id = $1::int`,
      [id]
    );
    if (rows.length === 0) return res.status(401).json({ error: "Authentication Error" });
    const { terms_accepted_version, privacy_accepted_version } = rows[0];
    const currentTermsVersion = TERMS_VERSION[role];
    const currentPrivacyVersion = PRIVACY_VERSION[role];
    const requiresTerms = terms_accepted_version < currentTermsVersion;
    const requiresPrivacy = privacy_accepted_version < currentPrivacyVersion;
    if (requiresTerms || requiresPrivacy)
      return res.status(403).json({
        error: "Legal acceptance required",
        requiresTerms,
        requiresPrivacy,
        currentTermsVersion,
        currentPrivacyVersion,
      });
    next();
  };

export const authAny = async (req: Request, res: Response, next: NextFunction) => {
  const { id, role, accessToken } = req.body;

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
