/**
 * bossController.ts
 *
 * Handles all actions available to authenticated Bosses (Experts):
 *   - Profile and settings management
 *   - Joining an organizer's adventure lobby
 *   - Exam (boss-created event) scheduling
 *   - Dashboard data retrieval
 *   - Reporting organizers
 *   - Legal acceptance recording
 */
import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon, deleteKycFolder } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { createLinkedAccount } from "../services/razorpayService.js";
import {
  validateUsername, validateBio, validateBoolean,
  validateBoundedText, validatePositiveInt, validateIntRange,
  validateFutureTimestamp
} from "../validators.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [bid, "boss"]);
  return res.json(result.rows);
};

export const organizeExam = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const activityV = validateBoundedText(req.body.activity, "activity", 20, 400);
  if (!activityV.ok) return res.status(400).json({ error: activityV.error });
  const slotIdV = validatePositiveInt(req.body.slotId, "slotId");
  if (!slotIdV.ok) return res.status(400).json({ error: slotIdV.error });
  const instructionV = validateBoundedText(req.body.instruction, "instruction", 20, 200, { allowNewlines: true });
  if (!instructionV.ok) return res.status(400).json({ error: instructionV.error });
  const adventureIdV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!adventureIdV.ok) return res.status(400).json({ error: adventureIdV.error });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'boss', $2::int) AS ok`,
    [bid, adventureIdV.value]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const resultQuery = await pool.query(
    `SELECT create_event($1::text, $2::int, $3::int, $4::text, true)`,
    [activityV.value, slotIdV.value, adventureIdV.value, instructionV.value]
  );
  return res.json({ success: true, eventId: resultQuery.rows[0].create_event });
};

export const bookSlot = async (req: Request, res: Response) => {
  const spaceIdV = validatePositiveInt(req.body.spaceId, "spaceId");
  if (!spaceIdV.ok) return res.status(400).json({ error: spaceIdV.error });
  const dtV = validateFutureTimestamp(req.body.datetime, "datetime");
  if (!dtV.ok) return res.status(400).json({ error: dtV.error });
  const durationV = validateIntRange(req.body.duration, "duration", 1, 9);
  if (!durationV.ok) return res.status(400).json({ error: durationV.error });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM book_slot($1::int, $2::timestamptz, $3::int)`,
      [spaceIdV.value, dtV.value, durationV.value]
    );
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(409).json({ error: err.message ?? "Slot booking failed" });
  }
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { bid, a, b } = req.body;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [bid, "boss", a, b]);
  return res.json(result.rows);
};

export const updateBossProfile = async (req: Request, res: Response) => {
  const { bid, updates } = req.body;
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
    // Upload new icon before the DB update; keep old key so we can clean it up on success
    const { rows } = await pool.query(`SELECT get_boss_icon_key($1::int) AS icon_key`, [bid]);
    oldIconKey = rows[0]?.icon_key ?? null;
    newIconKey = randomBytes(16).toString("hex");
    await uploadProfileIcon(updates.icon, "boss", newIconKey);
  }

  try {
    const updated = await pool.query(
      `SELECT * FROM update_boss($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::text)`,
      [bid, username, setting1, setting2, bio, newIconKey]
    );
    const updatedBoss = updated.rows[0];
    // Never return the password in the API response
    delete updatedBoss.password;
    // Fire-and-forget — storage cleanup failures are non-fatal
    if (oldIconKey && oldIconKey !== newIconKey) {
      deleteProfileIcon("boss", oldIconKey).catch((e) => console.error("deleteProfileIcon failed:", e));
    }
    return res.json(updatedBoss);
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "Username already taken" });
    throw err;
  }
};

export const getBossDashboard = async (req: Request, res: Response) => {
  const { bid } = req.body;


  const { rows } = await pool.query(`SELECT * FROM get_boss($1::int)`, [bid]);
  const boss = rows[0];

  const { rows: accountRows } = await pool.query(
    `SELECT razorpay_account_id FROM bosses WHERE id = $1`, [bid]
  );

  return res.json({
    username: boss.username, gender: boss.gender, bio: boss.bio,
    age: calculateAge(boss.dob), setting_1: boss.setting_1, setting_2: boss.setting_2,
    icon_key: boss.icon_key ?? null,
    bankLinked: accountRows[0]?.razorpay_account_id != null
  });
};
export const getBossQualifications = async (req: Request, res: Response) => {
  const { bid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge`, [bid, "boss"]);

  return res.json(rows);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { bid, matchRequest, ageRangeMin, ageRangeMax} = req.body;

  if (!Number.isInteger(ageRangeMin) || !Number.isInteger(ageRangeMax)
      || ageRangeMin < 18 || ageRangeMax > 100 || ageRangeMin > ageRangeMax)
    return res.status(400).json({ error: "Invalid age range" });

  // Bosses join based on badge, not category — ensure the lobby has a badge set
  if (!matchRequest || !Number.isInteger(matchRequest.badge_id))
    return res.status(400).json({ error: "Lobby has no badge; boss cannot join" });

  const existing = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [bid, "boss"]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Already in an active lobby" });

  // Boss must hold a qualification for the badge required by the lobby
  const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge`, [bid, "boss"]);
  const qualifiedBadgeIds = new Set(quals.rows.map((r: any) => Number(r.badge.badge_id)));
  if (!qualifiedBadgeIds.has(matchRequest.badge_id))
    return res.status(403).json({ error: "Not qualified for this badge" });

  const result = await pool.query(
    `SELECT match_request($1::int, $2::text, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::int, $10::int, $11::int, $12::float8, $13::boolean, $14::boolean) AS result`,
    [bid, "boss", ageRangeMin, ageRangeMax,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.space_id, matchRequest.age_range_min, matchRequest.age_range_max,
     matchRequest.pay_per_head, matchRequest.all_girls, matchRequest.half_girls]
  );
  return res.json(result.rows[0].result);
};

export const logOut = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const result = await pool.query(`SELECT logout($1::int, $2::text) AS success`, [bid, "boss"]);
  return res.json({ success: result.rows[0].success });
};

/**
 * Soft-deletes the calling boss's account: anonymizes PII in place (keeping the
 * row so adventures and payout records stay intact) and clears credentials so the
 * account can no longer log in. Blocked while in an active lobby or adventure.
 * razorpay_account_id is retained so any in-flight held payouts can still settle.
 * Idempotent.
 */
export const deleteAccount = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const lobby = await pool.query(`SELECT 1 FROM current_match_request($1::int, $2::text) LIMIT 1`, [bid, "boss"]);
  if (lobby.rows.length > 0)
    return res.status(409).json({ error: "Leave your active lobby before deleting your account" });
  const adv = await pool.query(`SELECT count(*)::int AS c FROM get_active_adventures($1::int, $2::text)`, [bid, "boss"]);
  if (adv.rows[0].c > 0)
    return res.status(409).json({ error: "You are in an active adventure; it must conclude before you can delete your account" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`SELECT icon_key, kyc_folder, deleted_at FROM bosses WHERE id = $1 FOR UPDATE`, [bid]);
    if (rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Account not found" }); }
    if (rows[0].deleted_at) { await client.query("ROLLBACK"); return res.json({ success: true }); }
    const oldIcon: string | null = rows[0].icon_key;
    const oldKyc: string | null = rows[0].kyc_folder;

    // email is NOT NULL + UNIQUE and password is NOT NULL — scrub to safe placeholders.
    await client.query(
      `UPDATE bosses SET
         name = 'Deleted Expert',
         email = 'deleted_' || id || '@deleted.invalid',
         phone = NULL, username = 'deleted_' || id, password = '',
         bio = NULL, dob = NULL, gender = NULL,
         icon_key = NULL, kyc_folder = NULL, access_token = NULL,
         deleted_at = NOW()
       WHERE id = $1`,
      [bid]
    );
    await client.query("COMMIT");

    if (oldIcon) deleteProfileIcon("boss", oldIcon).catch((e) => console.error("deleteProfileIcon failed:", e));
    if (oldKyc) deleteKycFolder(oldKyc).catch((e) => console.error("deleteKycFolder failed:", e));
    return res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const currentLobby = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [bid, "boss"]);
  return res.json(result.rows);
};

export const reportOrganizer = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const targetV = validatePositiveInt(req.body.organizerId, "organizerId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_organizer', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: bid, reporterRole: "boss", organizerId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const reportUser = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const targetV = validatePositiveInt(req.body.userId, "userId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_user', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: bid, reporterRole: "boss", userId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const acceptLegal = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const { acceptTerms, acceptPrivacy } = req.body;
  if (acceptTerms !== undefined && typeof acceptTerms !== "boolean")
    return res.status(400).json({ error: "acceptTerms must be a boolean" });
  if (acceptPrivacy !== undefined && typeof acceptPrivacy !== "boolean")
    return res.status(400).json({ error: "acceptPrivacy must be a boolean" });

  const { fetchLegalVersions } = await import("../legalVersions.js");
  const { terms_version, privacy_version } = await fetchLegalVersions("expert");
  if (acceptTerms !== true && acceptPrivacy !== true)
    return res.status(400).json({ error: "Provide acceptTerms and/or acceptPrivacy as true" });

  await pool.query(
    `SELECT accept_legal_boss($1::int, $2::boolean, $3::boolean, $4::int, $5::int)`,
    [bid, acceptTerms === true, acceptPrivacy === true, terms_version, privacy_version]
  );
  return res.json({ success: true });
};

export const linkBankAccount = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const { ifsc, accountNumber, beneficiaryName, street, city, state, pincode } = req.body;

  if (typeof ifsc !== "string" || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))
    return res.status(400).json({ error: "Invalid IFSC code" });
  if (typeof accountNumber !== "string" || accountNumber.length < 5 || accountNumber.length > 20)
    return res.status(400).json({ error: "Invalid account number" });
  if (typeof beneficiaryName !== "string" || beneficiaryName.trim().length < 2)
    return res.status(400).json({ error: "Invalid beneficiary name" });
  if (typeof street !== "string" || street.trim().length < 2)
    return res.status(400).json({ error: "Invalid street address" });
  if (typeof city !== "string" || city.trim().length < 2)
    return res.status(400).json({ error: "Invalid city" });
  if (typeof state !== "string" || state.trim().length < 2)
    return res.status(400).json({ error: "Invalid state" });
  if (typeof pincode !== "string" || !/^\d{6}$/.test(pincode))
    return res.status(400).json({ error: "Invalid pincode (must be 6 digits)" });

  const existing = await pool.query(
    `SELECT razorpay_account_id FROM bosses WHERE id = $1`, [bid]
  );
  if (existing.rows[0]?.razorpay_account_id)
    return res.status(409).json({ error: "Bank account already linked" });

  const boss = (await pool.query(
    `SELECT name, email, phone FROM bosses WHERE id = $1`, [bid]
  )).rows[0];

  try {
    const account = await createLinkedAccount({
      name: boss.name,
      email: boss.email,
      phone: boss.phone,
      legalBusinessName: boss.name,
      ifsc,
      accountNumber,
      beneficiaryName: beneficiaryName.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode,
    });

    await pool.query(
      `UPDATE bosses SET razorpay_account_id = $1 WHERE id = $2`,
      [account.id, bid]
    );

    return res.json({ success: true, accountId: account.id });
  } catch (err: any) {
    console.error("Razorpay linked account creation failed:", err);
    return res.status(500).json({ error: "Failed to create linked account" });
  }
};

