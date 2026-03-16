import type { Request, Response } from "express";
import pool from "../db.js";

export const updateUserProfile = async (req: Request, res: Response) => {
  const { uid, accessToken, updates } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const updated = await pool.query(
    `SELECT update_user($1::int, $2::text, $3::text, $4::text, $5::boolean, $6::boolean, $7::bytea)`,
    [uid, updates.username ?? null, updates.bio ?? null, updates.email ?? null,
     updates.setting1 ?? null, updates.setting2 ?? null,
     updates.icon ? Buffer.from(updates.icon, "base64") : null]
  );
  return res.json(updated.rows[0]);
};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  return res.json({
    id: user.id, username: user.username, email: user.email,
    level: user.level, star_score: user.star_score, penalties: user.penalties,
    bio: user.bio, age: user.age, gender: user.gender,
    setting_1: user.setting_1, setting_2: user.setting_2,
    icon: user.icon?.toString("base64")
  });
};

export const getAdventures = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { uid, accessToken, a, b } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [uid, "user", a, b]);
  return res.json(result.rows);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { uid, accessToken, matchRequest, minTeamMembers, ageRangeMin, ageRangeMax } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const matched = await pool.query(
`SELECT match_request(
$1::int,
$2::text,
$3::int,
$4::int,
$5::int,
$6::float8,
$7::int,
$8::int,
$9::int,
$10::int,
$11::float8,
$12::int,
$13::int,
$14::int,
$15::float8,
$16::float8,
$17::float8,
$18::float8,
$19::boolean,
$20::boolean
) AS result`,
[
uid,
"user",
minTeamMembers,
ageRangeMin,
ageRangeMax,
matchRequest.pay_per_head_2,   
matchRequest.id,
matchRequest.boss_id,
matchRequest.org_id,
matchRequest.category_id,
matchRequest.match_radius,
matchRequest.min_team_members,
matchRequest.age_range_min,
matchRequest.age_range_max,
matchRequest.latitude,
matchRequest.longitude,
matchRequest.pay_per_head,
matchRequest.pay_per_head_2,
matchRequest.all_girls,
matchRequest.half_girls
]
);
  const result = matched.rows[0].result;
  if (result.success) {
    const deducted = await pool.query(`SELECT deduct_gems($1::int, $2::int) AS ok`, [uid, result.cost]);
    if (deducted.rows[0].ok)
      return res.json({ success: true });
    else
      return res.json({ success: false, message: "Insufficient gems" });
  }
  return res.json({ success: false, message: "Error" });
};

export const logOut = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM logout($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [uid, "user", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};
