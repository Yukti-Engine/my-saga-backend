import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon } from "../services/bucketService.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { bid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [bid, "boss"]);
  return res.json(result.rows);
};

export const organizeExam = async (req: Request, res: Response) => {
  const { bid, activity, timing, venue, venueLink, adventureId, instruction } = req.body;

  try {
    const check = await pool.query(
      `SELECT is_related_to_adventure($1::int, 'boss', $2::int) AS ok`,
      [bid, adventureId]
    );
    if (check.rows[0].ok) {
      const resultQuery = await pool.query(
        `SELECT create_event($1::text, $2::timestamptz, $3::text, $4::text, $5::int, $6::text, true)`,
        [activity, timing, venue, venueLink, adventureId, instruction]
      );
      return res.json({ success: true, eventId: resultQuery.rows[0].create_event });
    }
    return res.json({ success: false });
  } catch {
    return res.json({ success: false });
  }
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { bid, a, b } = req.body;

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [bid, "boss", a, b]);
  return res.json(result.rows);
};

export const updateBossProfile = async (req: Request, res: Response) => {
  const { bid, updates } = req.body;

  let iconUrl: string | null = null;
  if (updates.icon)
    iconUrl = await uploadProfileIcon(updates.icon, "boss", bid);

  const updated = await pool.query(
    `SELECT * FROM update_boss($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::text)`,
    [bid, updates.username ?? null, updates.setting1 ?? null, updates.setting2 ?? null,
     updates.bio ?? null, iconUrl]
  );
  const updatedBoss = updated.rows[0];
  delete updatedBoss.password;
  return res.json(updatedBoss);
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
