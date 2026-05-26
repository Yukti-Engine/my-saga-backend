import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { validateUsername, validateBio, validateEmail, validateBoolean, validatePositiveInt, validateBoundedText, validateIntRange } from "../validators.js";
import { generateChapterConclusion, generateProceedChunk, generateIntroduction, generateChapterOpening, type EventSummary, type StatChanges, type Theme } from "../services/llmService.js";

export const updateUserProfile = async (req: Request, res: Response) => {
  const { uid, updates } = req.body;
  if (!updates || typeof updates !== "object")
    return res.status(400).json({ error: "Missing updates" });

  let username: string | null = null;
  if (updates.username !== undefined) {
    const v = validateUsername(updates.username);
    if (!v.ok) return res.status(400).json({ error: v.error });
    username = v.value;
  }

  let bio: string | null = null;
  if (updates.bio !== undefined) {
    const v = validateBio(updates.bio);
    if (!v.ok) return res.status(400).json({ error: v.error });
    bio = v.value;
  }

  let email: string | null = null;
  if (updates.email !== undefined) {
    const v = validateEmail(updates.email, false);
    if (!v.ok) return res.status(400).json({ error: v.error });
    email = v.value;
  }

  let setting1: boolean | null = null;
  if (updates.setting1 !== undefined) {
    const v = validateBoolean(updates.setting1, "setting1");
    if (!v.ok) return res.status(400).json({ error: v.error });
    setting1 = v.value;
  }

  let setting2: boolean | null = null;
  if (updates.setting2 !== undefined) {
    const v = validateBoolean(updates.setting2, "setting2");
    if (!v.ok) return res.status(400).json({ error: v.error });
    setting2 = v.value;
  }

  let newIconKey: string | null = null;
  let oldIconKey: string | null = null;
  if (updates.icon) {
    // Upload new icon first; the old key is kept so it can be deleted after a successful DB update
    const { rows } = await pool.query(`SELECT get_user_icon_key($1::int) AS icon_key`, [uid]);
    oldIconKey = rows[0]?.icon_key ?? null;
    newIconKey = randomBytes(16).toString("hex");
    await uploadProfileIcon(updates.icon, "user", newIconKey);
  }

  try {
    const updated = await pool.query(
      `SELECT update_user($1::int, $2::text, $3::text, $4::text, $5::boolean, $6::boolean, $7::text)`,
      [uid, username, bio, email, setting1, setting2, newIconKey]
    );
    // Fire-and-forget old icon deletion — storage cleanup failures are non-fatal
    if (oldIconKey && oldIconKey !== newIconKey) {
      deleteProfileIcon("user", oldIconKey).catch((e) => console.error("deleteProfileIcon failed:", e));
    }
    return res.json(updated.rows[0]);
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "Username already taken" });
    throw err;
  }
};

export const getUserQualifications = async (req: Request, res: Response) => {
  const { uid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge`, [uid, "user"]);

  return res.json(rows);
};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  return res.json({
    id: user.id, username: user.username, email: user.email,
    level: user.level, penalties: user.penalties,
    intellect_index: user.intellect_index, drive_index: user.drive_index,
    adaptability_index: user.adaptability_index,
    empathy_index: user.empathy_index, creativity_index: user.creativity_index,
    bio: user.bio, age: calculateAge(user.dob), gender: user.gender,
    setting_1: user.setting_1, setting_2: user.setting_2,
    icon_key: user.icon_key ?? null
  });
};

export const getAdventures = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { uid, a, b } = req.body;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [uid, "user", a, b]);
  return res.json(result.rows);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { uid,  matchRequest, ageRangeMin, ageRangeMax } = req.body;

  if (!Number.isInteger(ageRangeMin) || !Number.isInteger(ageRangeMax)
      || ageRangeMin < 18 || ageRangeMax > 100 || ageRangeMin > ageRangeMax)
    return res.status(400).json({ error: "Invalid age range" });

  const existing = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [uid, "user"]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Already in an active lobby" });

  const matched = await pool.query(
    `SELECT match_request($1::int, $2::text, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::int, $10::int, $11::int, $12::float8, $13::boolean, $14::boolean) AS result`,
    [uid, "user", ageRangeMin, ageRangeMax,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.space_id, matchRequest.age_range_min, matchRequest.age_range_max,
     matchRequest.pay_per_head, matchRequest.all_girls, matchRequest.half_girls]
  );
  const result = matched.rows[0].result;
  if (result.success)
    return res.json({ success: true });
  return res.json({ success: false, message: "Error" });
};

export const logOut = async (req: Request, res: Response) => {
  const { uid, } = req.body;

  const result = await pool.query(`SELECT * FROM logout($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { uid, } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};


export const getThemes = async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT * FROM get_all_themes()`);
  return res.json(rows);
};

export const getBook = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const bookRow = await pool.query(
    `SELECT * FROM get_book_with_theme($1::int)`,
    [uid]
  );
  if (bookRow.rows.length === 0)
    return res.status(404).json({ error: "no book found" });

  const book = bookRow.rows[0];

  const { rows: chunks } = await pool.query(
    `SELECT * FROM get_book_chunks($1::int)`,
    [book.id]
  );

  return res.json({
    id: book.id,
    title: book.title,
    chapter: book.chapter,
    status: book.status,
    theme: { name: book.theme_name, description: book.theme_description },
    chunks,
  });
};

export const rateOrganizer = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const organizerIdV = validatePositiveInt(req.body.organizerId, "organizerId");
  if (!organizerIdV.ok) return res.status(400).json({ error: organizerIdV.error });
  const ratingV = validateIntRange(req.body.rating, "rating", 1, 5);
  if (!ratingV.ok) return res.status(400).json({ error: ratingV.error });

  await pool.query(
    `SELECT upsert_rating($1::int, $2::int, $3::int)`,
    [organizerIdV.value, uid, ratingV.value]
  );
  return res.json({ success: true });
};

export const reportOrganizer = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const targetV = validatePositiveInt(req.body.organizerId, "organizerId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_organizer', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: uid, reporterRole: "user", organizerId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const acceptLegal = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { acceptTerms, acceptPrivacy } = req.body;
  if (acceptTerms !== undefined && typeof acceptTerms !== "boolean")
    return res.status(400).json({ error: "acceptTerms must be a boolean" });
  if (acceptPrivacy !== undefined && typeof acceptPrivacy !== "boolean")
    return res.status(400).json({ error: "acceptPrivacy must be a boolean" });

  const { fetchLegalVersions } = await import("../legalVersions.js");
  const { terms_version, privacy_version } = await fetchLegalVersions("user");
  if (!acceptTerms && !acceptPrivacy)
    return res.status(400).json({ error: "Provide acceptTerms and/or acceptPrivacy as true" });

  await pool.query(
    `SELECT accept_legal_user($1::int, $2::boolean, $3::boolean, $4::int, $5::int)`,
    [uid, acceptTerms === true, acceptPrivacy === true, terms_version, privacy_version]
  );
  return res.json({ success: true });
};

export const myBadges = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { rows } = await pool.query(
    `SELECT * FROM get_ob_assertions_by_user($1::int)`,
    [uid]
  );
  return res.json(
    rows.map((a) => ({
      assertionId: a.id,
      badgeId: a.badge_id,
      adventureId: a.adventure_id,
      issuedOn: a.issued_on,
      verificationUrl: `https://api.mysaga.in/ob/assertions/${a.id}`,
      credentialJson: a.credential_json,
    }))
  );
};
