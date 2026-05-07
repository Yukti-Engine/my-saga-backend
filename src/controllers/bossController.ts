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
import { uploadProfileIcon, deleteProfileIcon } from "../services/bucketService.js";
import { sendEmail, scheduleRequestEmail } from "../services/mailerService.js";
import { randomBytes } from "crypto";
import {
  validateUsername, validateBio, validateBoolean,
  validateBoundedText, validateHttpUrl, validateFutureTimestamp, validatePositiveInt
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
  const timingV = validateFutureTimestamp(req.body.timing, "timing");
  if (!timingV.ok) return res.status(400).json({ error: timingV.error });
  const venueV = validateBoundedText(req.body.venue, "venue", 10, 200);
  if (!venueV.ok) return res.status(400).json({ error: venueV.error });
  const venueLinkV = validateHttpUrl(req.body.venueLink, "venueLink", 100);
  if (!venueLinkV.ok) return res.status(400).json({ error: venueLinkV.error });
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
    `SELECT create_event($1::text, $2::timestamptz, $3::text, $4::text, $5::int, $6::text, true)`,
    [activityV.value, timingV.value, venueV.value, venueLinkV.value, adventureIdV.value, instructionV.value]
  );
  return res.json({ success: true, eventId: resultQuery.rows[0].create_event });
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

  return res.json({
    username: boss.username, gender: boss.gender, bio: boss.bio, credits: boss.credits,
    age: calculateAge(boss.dob), setting_1: boss.setting_1, setting_2: boss.setting_2,
    icon_key: boss.icon_key ?? null
  });
};
export const getBossQualifications = async (req: Request, res: Response) => {
  const { bid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge_id`, [bid, "boss"]);

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
  const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge_id`, [bid, "boss"]);
  const qualifiedBadgeIds = new Set(quals.rows.map((r: any) => Number(r.badge_id)));
  if (!qualifiedBadgeIds.has(matchRequest.badge_id))
    return res.status(403).json({ error: "Not qualified for this badge" });

  const result = await pool.query(
    `SELECT match_request($1::int, $2::text, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::float8, $10::int, $11::int, $12::float8, $13::float8, $14::float8, $15::boolean, $16::boolean) AS result`,
    [bid, "boss", ageRangeMin, ageRangeMax,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.match_radius, matchRequest.age_range_min,
     matchRequest.age_range_max, matchRequest.latitude, matchRequest.longitude,
     matchRequest.pay_per_head, matchRequest.all_girls, matchRequest.half_girls]
  );
  return res.json(result.rows[0].result);
};

export const logOut = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const result = await pool.query(`SELECT logout($1::int, $2::text) AS success`, [bid, "boss"]);
  return res.json({ success: result.rows[0].success });
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

export const requestSchedule = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const venueIdV = validatePositiveInt(req.body.venueId, "venueId");
  if (!venueIdV.ok) return res.status(400).json({ error: venueIdV.error });
  const startV = validateFutureTimestamp(req.body.startTime, "startTime");
  if (!startV.ok) return res.status(400).json({ error: startV.error });
  const endV = validateFutureTimestamp(req.body.endTime, "endTime");
  if (!endV.ok) return res.status(400).json({ error: endV.error });

  if (new Date(startV.value) >= new Date(endV.value))
    return res.status(400).json({ error: "startTime must be before endTime" });

  const token = randomBytes(32).toString("hex");

  try {
    const { rows } = await pool.query(
      `SELECT request_alloted_schedule($1::int, $2::timestamptz, $3::timestamptz, 'boss', $4::int, $5::varchar) AS id`,
      [venueIdV.value, startV.value, endV.value, bid, token]
    );

    pool.query(
      `SELECT * FROM get_venue_partner_by_venue($1::int)`,
      [venueIdV.value]
    ).then(({ rows: vp }) => {
      if (!vp[0]?.partner_email) return;
      const { subject, html } = scheduleRequestEmail(vp[0].venue_name, vp[0].partner_name, token, startV.value, endV.value);
      sendEmail(vp[0].partner_email, subject, html);
    }).catch((e) => console.error("schedule request email failed:", e));

    return res.json({ success: true, id: rows[0].id });
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("duration exceeds") || msg.includes("start time") || msg.includes("busy") || msg.includes("overlaps"))
      return res.status(400).json({ error: msg });
    if (err?.code === "23503")
      return res.status(400).json({ error: "Venue not found" });
    console.error("Error in requestSchedule:", err);
    return res.status(500).json({ error: "Failed to request schedule" });
  }
};

export const getVenueSchedules = async (req: Request, res: Response) => {
  const venueIdV = validatePositiveInt(req.body.venueId, "venueId");
  if (!venueIdV.ok) return res.status(400).json({ error: venueIdV.error });

  const { rows } = await pool.query(
    `SELECT * FROM get_schedules_for_venue($1::int)`,
    [venueIdV.value]
  );
  return res.json(rows);
};

export const getVenues = async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT * FROM get_venues()`);
  return res.json(rows);
};
