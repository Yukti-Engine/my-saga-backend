/**
 * organizerController.ts
 *
 * Handles all actions available to authenticated Organizers (Guides):
 *   - Profile and settings management
 *   - Match request (lobby) creation, dismissal, and status
 *   - Adventure start and event scheduling
 *   - Roadmap retrieval and LLM-based adventure name generation
 *   - Reporting users and bosses
 *   - Legal acceptance recording
 */
import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon, deleteKycFolder } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { generateAdventureName as llmGenerateAdventureName } from "../services/llmService.js";
import { createHeldTransfer, createLinkedAccount } from "../services/razorpayService.js";
import {
  validateUsername, validateBio, validateBoolean,
  validateBoundedText,
  validatePositiveInt, validateIntRange,
  validateFutureTimestamp, validateNonNegativeInt
} from "../validators.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

export const getOrganizerQualifications = async (req: Request, res: Response) => {
  const { oid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS category`, [oid, "organizer"]);

  return res.json(rows);
};

export const organizeEvent = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const activityV = validateBoundedText(req.body.activity, "activity", 20, 400);
  if (!activityV.ok) return res.status(400).json({ error: activityV.error });
  const slotIdV = validatePositiveInt(req.body.slotId, "slotId");
  if (!slotIdV.ok) return res.status(400).json({ error: slotIdV.error });
  const instructionV = validateBoundedText(req.body.instruction, "instruction", 20, 200, { allowNewlines: true });
  if (!instructionV.ok) return res.status(400).json({ error: instructionV.error });
  const adventureIdV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!adventureIdV.ok) return res.status(400).json({ error: adventureIdV.error });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, adventureIdV.value]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const queryResult = await pool.query(
    `SELECT create_event($1::text, $2::int, $3::int, $4::text, false)`,
    [activityV.value, slotIdV.value, adventureIdV.value, instructionV.value]
  );
  return res.json({ success: true, eventId: queryResult.rows[0].create_event });
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
  const { oid, a, b } = req.body;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [oid, "organizer", a, b]);
  return res.json(result.rows);
};

export const updateOrganizerProfile = async (req: Request, res: Response) => {
  const { oid, updates } = req.body;
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
    // Upload the new icon before touching the DB; retain the old key for cleanup afterward
    const { rows } = await pool.query(`SELECT get_organizer_icon_key($1::int) AS icon_key`, [oid]);
    oldIconKey = rows[0]?.icon_key ?? null;
    newIconKey = randomBytes(16).toString("hex");
    await uploadProfileIcon(updates.icon, "organizer", newIconKey);
  }

  try {
    const updated = await pool.query(
      `SELECT * FROM update_organizer($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::text)`,
      [oid, username, setting1, setting2, bio, newIconKey]
    );
    const updatedOrganizer = updated.rows[0];
    // Never expose the password hash in the response
    delete updatedOrganizer.password;
    // Fire-and-forget — storage cleanup failures are non-fatal
    if (oldIconKey && oldIconKey !== newIconKey) {
      deleteProfileIcon("organizer", oldIconKey).catch((e) => console.error("deleteProfileIcon failed:", e));
    }
    return res.json(updatedOrganizer);
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "Username already taken" });
    throw err;
  }
};

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  const { rows: accountRows } = await pool.query(
    `SELECT razorpay_account_id FROM organizers WHERE id = $1`, [oid]
  );

  return res.json({
    username: organizer.username, bio: organizer.bio, gender: organizer.gender,
    age: calculateAge(organizer.dob), setting_1: organizer.setting_1, setting_2: organizer.setting_2,
    rating: organizer.rating, icon_key: organizer.icon_key ?? null,
    bankLinked: accountRows[0]?.razorpay_account_id != null
  });
};

export const requestMatch = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const categoryIdV = validatePositiveInt(req.body.categoryId, "categoryId");
  if (!categoryIdV.ok) return res.status(400).json({ error: categoryIdV.error });
  const badgeIdV = validatePositiveInt(req.body.badgeId, "badgeId");
  if (!badgeIdV.ok) return res.status(400).json({ error: badgeIdV.error });
  const spaceIdV = validatePositiveInt(req.body.spaceId, "spaceId");
  if (!spaceIdV.ok) return res.status(400).json({ error: spaceIdV.error });
  const ageMinV = validateIntRange(req.body.ageRangeMin, "ageRangeMin", 18, 100);
  if (!ageMinV.ok) return res.status(400).json({ error: ageMinV.error });
  const ageMaxV = validateIntRange(req.body.ageRangeMax, "ageRangeMax", 18, 100);
  if (!ageMaxV.ok) return res.status(400).json({ error: ageMaxV.error });
  if (ageMinV.value > ageMaxV.value)
    return res.status(400).json({ error: "ageRangeMin must be <= ageRangeMax" });
  const payV = validateIntRange(req.body.payPerHead, "payPerHead", 500, 3000);
  if (!payV.ok) return res.status(400).json({ error: payV.error });
  const roadmapV = validateBoundedText(req.body.roadmap, "roadmap", 1, 5000, { allowNewlines: true });
  if (!roadmapV.ok) return res.status(400).json({ error: roadmapV.error });

  const existing = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Already in an active lobby" });

  // Organizer must be qualified in the requested category before they can open a lobby
  const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS category`, [oid, "organizer"]);
  const qualifiedCategoryIds = new Set(quals.rows.map((r: any) => Number(r.category.category_id)));
  if (!qualifiedCategoryIds.has(categoryIdV.value))
    return res.status(403).json({ error: "Not qualified for this category" });

  // Validate that the chosen badge actually belongs to the requested category
  const badgeRow = await pool.query(`SELECT get_badge_category_id($1::int) AS category_id`, [badgeIdV.value]);
  if (badgeRow.rows[0]?.category_id == null)
    return res.status(404).json({ error: "Badge not found" });
  if (badgeRow.rows[0].category_id !== categoryIdV.value)
    return res.status(400).json({ error: "Badge does not belong to given category" });

  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  // all_girls / half_girls flags are derived from the organizer's gender and privacy settings
  const result = await pool.query(
    `SELECT * FROM create_match_request($1::int, $2::int, $3::int, $4::int, $5::int, $6::float8, $7::boolean, $8::boolean, $9::text, $10::int)`,
    [oid, categoryIdV.value, spaceIdV.value, ageMinV.value, ageMaxV.value,
     payV.value,
     organizer.gender === "F" && organizer.setting_1 === true,
     organizer.gender === "F" && organizer.setting_2 === true,
     roadmapV.value, badgeIdV.value]
  );
  return res.json(result.rows[0]);
};

export const retrieveRoadmap = async (req: Request, res: Response) => {
  const badgeIdV = validatePositiveInt(req.body.badgeId, "badgeId");
  if (!badgeIdV.ok) return res.status(400).json({ error: badgeIdV.error });
  const badgeId = badgeIdV.value;

  try {
    const { rows } = await pool.query(
      `SELECT get_badge_roadmaps($1::int) AS roadmaps`,
      [badgeId]
    );
    const roadmaps: string[] = rows[0]?.roadmaps ?? [];
    if (rows.length === 0)
      return res.status(404).json({ error: "Badge not found" });
    if (roadmaps.length === 0)
      return res.json({ roadmap: null });

    // Return a random roadmap from the badge's stored list as a suggestion
    const roadmap = roadmaps[Math.floor(Math.random() * roadmaps.length)];
    return res.json({ roadmap });
  } catch (err) {
    console.error("Error in retrieveRoadmap:", err);
    return res.status(500).json({ error: "Failed to retrieve roadmap" });
  }
};

export const generateAdventureName = async (req: Request, res: Response) => {
  const roadmapV = validateBoundedText(req.body.roadmap, "roadmap", 1, 5000, { allowNewlines: true });
  if (!roadmapV.ok) return res.status(400).json({ error: roadmapV.error });
  const roadmap = roadmapV.value;

  try {
    const suggestion = await llmGenerateAdventureName(roadmap);
    if (!suggestion)
      return res.status(500).json({ error: "Failed to generate name" });
    return res.json({ suggestion });
  } catch (err) {
    console.error("Error in generateAdventureName:", err);
    return res.status(500).json({ error: "Failed to generate adventure name" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM logout($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows[0]);
};

/**
 * Soft-deletes the calling organizer's account: anonymizes PII in place (keeping
 * the row so adventures and payout records stay intact) and clears credentials so
 * the account can no longer log in. Blocked while in an active lobby or adventure.
 * razorpay_account_id is retained so any in-flight held payouts can still settle.
 * Idempotent.
 */
export const deleteAccount = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const lobby = await pool.query(`SELECT 1 FROM current_match_request($1::int, $2::text) LIMIT 1`, [oid, "organizer"]);
  if (lobby.rows.length > 0)
    return res.status(409).json({ error: "Dismiss your active lobby before deleting your account" });
  const adv = await pool.query(`SELECT count(*)::int AS c FROM get_active_adventures($1::int, $2::text)`, [oid, "organizer"]);
  if (adv.rows[0].c > 0)
    return res.status(409).json({ error: "You are leading an active adventure; it must conclude before you can delete your account" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`SELECT icon_key, kyc_folder, deleted_at FROM organizers WHERE id = $1 FOR UPDATE`, [oid]);
    if (rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Account not found" }); }
    if (rows[0].deleted_at) { await client.query("ROLLBACK"); return res.json({ success: true }); }
    const oldIcon: string | null = rows[0].icon_key;
    const oldKyc: string | null = rows[0].kyc_folder;

    // email is NOT NULL + UNIQUE and password is NOT NULL — scrub to safe placeholders.
    await client.query(
      `UPDATE organizers SET
         name = 'Deleted Organizer',
         email = 'deleted_' || id || '@deleted.invalid',
         phone = NULL, username = 'deleted_' || id, password = '',
         bio = NULL, dob = NULL, gender = NULL,
         icon_key = NULL, kyc_folder = NULL, access_token = NULL,
         deleted_at = NOW()
       WHERE id = $1`,
      [oid]
    );
    await client.query("COMMIT");

    if (oldIcon) deleteProfileIcon("organizer", oldIcon).catch((e) => console.error("deleteProfileIcon failed:", e));
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
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

/**
 * Marks notifications read up to `readTill` (notifications 1..readTill seen).
 * Only ever advances — a stale/out-of-order value never rolls the marker back.
 */
export const notifiedTill = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const v = validateNonNegativeInt(req.body.readTill, "readTill");
  if (!v.ok) return res.status(400).json({ error: v.error });

  const { rows } = await pool.query(
    `UPDATE organizers SET read_till = GREATEST(read_till, $1) WHERE id = $2 RETURNING read_till`,
    [v.value, oid]
  );
  return res.json({ success: true, readTill: rows[0].read_till });
};

export const getLimitation = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(`SELECT get_limitation($1::int) AS max_team_members`, [oid]);
  return res.json(rows[0]);
};

export const dismissLobby = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(
    `SELECT * FROM dismiss_match_request($1::int)`, [oid]
  );
  if (rows.length === 0 || rows[0].id === null)
    return res.status(404).json({ error: "No active lobby" });

  const dismissed = rows[0];
  const userIds: number[] = dismissed.user_ids || [];
  const payPerHead: number = dismissed.pay_per_head || 0;

  if (userIds.length > 0 && payPerHead > 0) {
    const taxRate = parseFloat(process.env.PLATFORM_TAX_RATE || "0");
    const costRupees = payPerHead * 1.25 + 200 + taxRate * payPerHead * 0.25;
    const costPaise = Math.round(costRupees * 100);

    for (const userId of userIds) {
      await pool.query(`SELECT credit_wallet($1::int, $2::bigint)`, [userId, costPaise]);
      await pool.query(
        `INSERT INTO wallet_transactions (user_id, type, amount_paise, match_request_id, status)
         VALUES ($1, 'lobby_refund', $2, $3, 'success')`,
        [userId, costPaise, dismissed.id]
      );
    }
  }

  return res.json({ success: true, dismissedId: dismissed.id, refundedUsers: userIds.length });
};

export const reportUser = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const targetV = validatePositiveInt(req.body.userId, "userId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_user', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: oid, reporterRole: "organizer", userId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const reportBoss = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const targetV = validatePositiveInt(req.body.bossId, "bossId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_boss', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: oid, reporterRole: "organizer", bossId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const startAdventure = async (req: Request, res: Response) => {
  const { oid, name } = req.body;

  const lobby = (await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"])).rows[0];
  const matchId = lobby.id;
  if (lobby.boss_id && lobby.user_ids.length >= 4){
    const result = await pool.query(`SELECT * FROM complete_match($1::text, $2::int)`, [name, matchId]);
    await pool.query(`SELECT bump_limitation($1::int)`, [oid]);

    const adventureId = result.rows[0].id;
    const n = lobby.user_ids.length;
    const payPerHead = lobby.pay_per_head;
    const taxRate = parseFloat(process.env.PLATFORM_TAX_RATE || "0");

    const bossPayoutPaise = 200 * n * 100;
    const guidePayoutPaise = payPerHead * n * 100;
    const totalPerUser = payPerHead * 1.25 + 200 + taxRate * payPerHead * 0.25;
    // Promo discounts are absorbed entirely by the platform — boss and guide are
    // paid in full. Subtract the discounts granted on this lobby so the platform
    // payout reflects what was actually collected.
    const discountRow = await pool.query(
      `SELECT COALESCE(SUM(discount_paise), 0)::bigint AS total
       FROM promo_code_redemptions WHERE match_request_id = $1`,
      [matchId]
    );
    const totalDiscountPaise = Number(discountRow.rows[0].total);
    const platformPayoutPaise = Math.round(totalPerUser * n * 100) - bossPayoutPaise - guidePayoutPaise - totalDiscountPaise;

    const holdUntil = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

    await pool.query(
      `SELECT create_payout($1::int, 'boss'::payout_recipient, $2::int, $3::bigint, $4::timestamptz)`,
      [adventureId, lobby.boss_id, bossPayoutPaise, holdUntil]
    );
    await pool.query(
      `SELECT create_payout($1::int, 'organizer'::payout_recipient, $2::int, $3::bigint, $4::timestamptz)`,
      [adventureId, oid, guidePayoutPaise, holdUntil]
    );
    if (platformPayoutPaise > 0) {
      await pool.query(
        `SELECT create_payout($1::int, 'platform'::payout_recipient, $2::int, $3::bigint, $4::timestamptz)`,
        [adventureId, 0, platformPayoutPaise, holdUntil]
      );
    }

    const bossAccount = (await pool.query(
      `SELECT razorpay_account_id FROM bosses WHERE id = $1`, [lobby.boss_id]
    )).rows[0]?.razorpay_account_id;
    const orgAccount = (await pool.query(
      `SELECT razorpay_account_id FROM organizers WHERE id = $1`, [oid]
    )).rows[0]?.razorpay_account_id;

    const holdUntilUnix = Math.floor((Date.now() + 28 * 24 * 60 * 60 * 1000) / 1000);

    if (bossAccount) {
      createHeldTransfer(bossAccount, bossPayoutPaise, holdUntilUnix).catch((e) =>
        console.error("Boss transfer failed:", e)
      );
    }
    if (orgAccount) {
      createHeldTransfer(orgAccount, guidePayoutPaise, holdUntilUnix).catch((e) =>
        console.error("Organizer transfer failed:", e)
      );
    }

    return res.json(result.rows[0]);
  }
  return res.json({success:false})
};

export const acceptLegal = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { acceptTerms, acceptPrivacy } = req.body;
  if (acceptTerms !== undefined && typeof acceptTerms !== "boolean")
    return res.status(400).json({ error: "acceptTerms must be a boolean" });
  if (acceptPrivacy !== undefined && typeof acceptPrivacy !== "boolean")
    return res.status(400).json({ error: "acceptPrivacy must be a boolean" });

  const { fetchLegalVersions } = await import("../legalVersions.js");
  const { terms_version, privacy_version } = await fetchLegalVersions("guide");
  if (acceptTerms !== true && acceptPrivacy !== true)
    return res.status(400).json({ error: "Provide acceptTerms and/or acceptPrivacy as true" });

  await pool.query(
    `SELECT accept_legal_organizer($1::int, $2::boolean, $3::boolean, $4::int, $5::int)`,
    [oid, acceptTerms === true, acceptPrivacy === true, terms_version, privacy_version]
  );
  return res.json({ success: true });
};

export const linkBankAccount = async (req: Request, res: Response) => {
  const { oid } = req.body;
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
    `SELECT razorpay_account_id FROM organizers WHERE id = $1`, [oid]
  );
  if (existing.rows[0]?.razorpay_account_id)
    return res.status(409).json({ error: "Bank account already linked" });

  const org = (await pool.query(
    `SELECT name, email, phone FROM organizers WHERE id = $1`, [oid]
  )).rows[0];

  try {
    const account = await createLinkedAccount({
      name: org.name,
      email: org.email,
      phone: org.phone,
      legalBusinessName: org.name,
      ifsc,
      accountNumber,
      beneficiaryName: beneficiaryName.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode,
    });

    await pool.query(
      `UPDATE organizers SET razorpay_account_id = $1 WHERE id = $2`,
      [account.id, oid]
    );

    return res.json({ success: true, accountId: account.id });
  } catch (err: any) {
    const detail = err?.error?.description || err?.message || "Unknown error";
    console.error("Razorpay linked account creation failed:", JSON.stringify(err?.error ?? { message: err?.message }));
    return res.status(502).json({ error: "Failed to create linked account", detail });
  }
};

