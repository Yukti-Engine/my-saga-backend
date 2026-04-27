import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { generateAdventureName as llmGenerateAdventureName } from "../services/llmService.js";
import {
  validateUsername, validateBio, validateBoolean,
  validateBoundedText, validateHttpUrl, validateFutureTimestamp,
  validatePositiveInt, validateIntRange, validateFloatRange
} from "../validators.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

export const getOrganizerQualifications = async (req: Request, res: Response) => {
  const { oid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS category_id`, [oid, "organizer"]);

  return res.json(rows);
};

export const organizeEvent = async (req: Request, res: Response) => {
  const { oid } = req.body;
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
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, adventureIdV.value]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const queryResult = await pool.query(
    `SELECT create_event($1::text, $2::timestamptz, $3::text, $4::text, $5::int, $6::text, false)`,
    [activityV.value, timingV.value, venueV.value, venueLinkV.value, adventureIdV.value, instructionV.value]
  );
  return res.json({ success: true, eventId: queryResult.rows[0].create_event });
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
    const { rows } = await pool.query(`SELECT icon_key FROM organizers WHERE id = $1::int`, [oid]);
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
    delete updatedOrganizer.password;
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
  return res.json({
    username: organizer.username, bio: organizer.bio, gender: organizer.gender, credits: organizer.credits,
    age: calculateAge(organizer.dob), setting_1: organizer.setting_1, setting_2: organizer.setting_2,
    rating: organizer.rating, icon_key: organizer.icon_key ?? null
  });
};

export const requestMatch = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const categoryIdV = validatePositiveInt(req.body.categoryId, "categoryId");
  if (!categoryIdV.ok) return res.status(400).json({ error: categoryIdV.error });
  const badgeIdV = validatePositiveInt(req.body.badgeId, "badgeId");
  if (!badgeIdV.ok) return res.status(400).json({ error: badgeIdV.error });
  const matchRadiusV = validateIntRange(req.body.matchRadius, "matchRadius", 10, 20);
  if (!matchRadiusV.ok) return res.status(400).json({ error: matchRadiusV.error });
  const ageMinV = validateIntRange(req.body.ageRangeMin, "ageRangeMin", 18, 100);
  if (!ageMinV.ok) return res.status(400).json({ error: ageMinV.error });
  const ageMaxV = validateIntRange(req.body.ageRangeMax, "ageRangeMax", 18, 100);
  if (!ageMaxV.ok) return res.status(400).json({ error: ageMaxV.error });
  if (ageMinV.value > ageMaxV.value)
    return res.status(400).json({ error: "ageRangeMin must be <= ageRangeMax" });
  const latV = validateFloatRange(req.body.latitude, "latitude", -90, 90);
  if (!latV.ok) return res.status(400).json({ error: latV.error });
  const lngV = validateFloatRange(req.body.longitude, "longitude", -180, 180);
  if (!lngV.ok) return res.status(400).json({ error: lngV.error });
  const payV = validateIntRange(req.body.payPerHead, "payPerHead", 500, 3000);
  if (!payV.ok) return res.status(400).json({ error: payV.error });
  const roadmapV = validateBoundedText(req.body.roadmap, "roadmap", 1, 5000, { allowNewlines: true });
  if (!roadmapV.ok) return res.status(400).json({ error: roadmapV.error });

  const existing = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Already in an active lobby" });

  const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS category_id`, [oid, "organizer"]);
  console.log("[create-lobby] oid:", oid, "typeof oid:", typeof oid);
  console.log("[create-lobby] categoryIdV.value:", categoryIdV.value, "typeof:", typeof categoryIdV.value);
  console.log("[create-lobby] quals.rows:", JSON.stringify(quals.rows));
  const qualifiedCategoryIds = new Set(quals.rows.map((r: any) => Number(r.category_id)));
  console.log("[create-lobby] qualifiedCategoryIds:", [...qualifiedCategoryIds]);
  console.log("[create-lobby] has check:", qualifiedCategoryIds.has(categoryIdV.value));
  if (!qualifiedCategoryIds.has(categoryIdV.value))
    return res.status(403).json({ error: "Not qualified for this category" });

  const badgeRow = await pool.query(`SELECT category_id FROM badges WHERE id = $1::int`, [badgeIdV.value]);
  if (badgeRow.rows.length === 0)
    return res.status(404).json({ error: "Badge not found" });
  if (badgeRow.rows[0].category_id !== categoryIdV.value)
    return res.status(400).json({ error: "Badge does not belong to given category" });

  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  const result = await pool.query(
    `SELECT * FROM create_match_request($1::int, $2::int, $3::float8, $4::int, $5::int, $6::float8, $7::float8, $8::float8, $9::boolean, $10::boolean, $11::text, $12::int)`,
    [oid, categoryIdV.value, matchRadiusV.value, ageMinV.value, ageMaxV.value,
     latV.value, lngV.value, payV.value,
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
      `SELECT roadmaps FROM badges WHERE id = $1`,
      [badgeId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Badge not found" });

    const roadmaps: string[] = rows[0].roadmaps ?? [];
    if (roadmaps.length === 0)
      return res.json({ roadmap: null });

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

export const currentLobby = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

export const getLimitation = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(`SELECT get_limitation($1::int) AS max_team_members`, [oid]);
  return res.json(rows[0]);
};

export const dismissLobby = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(`SELECT dismiss_match_request($1::int) AS id`, [oid]);
  if (rows.length === 0 || rows[0].id === null)
    return res.status(404).json({ error: "No active lobby" });
  return res.json({ success: true, dismissedId: rows[0].id });
};

export const reportUser = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const targetV = validatePositiveInt(req.body.userId, "userId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `INSERT INTO tickets (type, payload) VALUES ('report_user', $1::jsonb) RETURNING id`,
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
    `INSERT INTO tickets (type, payload) VALUES ('report_boss', $1::jsonb) RETURNING id`,
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
    return res.json(result.rows[0]);
  }
  return res.json({success:false})
};
