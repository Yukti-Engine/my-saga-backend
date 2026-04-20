import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon } from "../services/bucketService.js";
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

  let iconUrl: string | null = null;
  if (updates.icon)
    iconUrl = await uploadProfileIcon(updates.icon, "boss", bid);

  try {
    const updated = await pool.query(
      `SELECT * FROM update_boss($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::text)`,
      [bid, username, setting1, setting2, bio, iconUrl]
    );
    const updatedBoss = updated.rows[0];
    delete updatedBoss.password;
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
    icon: boss.icon ?? null
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

  if (!matchRequest || !Number.isInteger(matchRequest.badge_id))
    return res.status(400).json({ error: "Lobby has no badge; boss cannot join" });

  const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge_id`, [bid, "boss"]);
  const qualifiedBadgeIds = new Set(quals.rows.map((r: any) => r.badge_id));
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
