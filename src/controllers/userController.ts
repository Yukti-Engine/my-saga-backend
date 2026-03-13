import type { Request, Response } from "express";
import pool from "../db.js";

export const updateUserProfile = async (req: Request, res: Response) => {
  const { uid, accessToken, updates } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const updated = await pool.query(
    `SELECT update_user($1::int, $2::text, $3::text, $4::text, $5::boolean, $6::boolean, $7::bytea)`,
    [uid, updates.username ?? null, updates.bio ?? null, updates.email ?? null,
     updates.setting_1 ?? null, updates.setting_2 ?? null,
     updates.icon ? Buffer.from(updates.icon, "base64") : null]
  );
  return res.json({updated});
};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  return res.json({
    id: user.id, username: user.username, email: user.email,
    level: user.level, star_score: user.star_score, penalties: user.penalties,
    bio: user.bio, age: user.age, gender: user.gender,
    setting_1: user.setting_1, setting_2: user.setting_2,
    icon: user.icon?.toString("base64")
  });
};

export const requestMatch = async (req: Request, res: Response) => {
  const { uid, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const age = getAge(user.dob);
  const compatible = await pool.query(
    `SELECT * FROM get_compatible_requests_user($1::int, $2::int, $3::float8, $4::float8, $5::text)`,
    [categoryId, age, latitude, longitude, user.gender]
  );

  const potentialAdventures: any[] = [];
  for (const element of compatible.rows) {
    const check = await pool.query(
      `SELECT check_reverse_compatibility($1::int, $2::float8, $3::float8, $4::float8, $5::int, $6::int, $7::boolean, $8::boolean) AS ok`,
      [element.id, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax,
       user.gender === 'F' && user.setting_1,
       user.gender === 'F' && user.setting_2]
    );
    if (check.rows[0].ok) potentialAdventures.push(element);
  }
  return res.json(potentialAdventures);
};

export const getAdventures = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_active_adventures_user($1::int)`, [uid]);
  return res.json(result.rows);
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { uid, accessToken, a, b } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures_user($1::int, $2::int, $3::int)`, [uid, a, b]);
  return res.json(result.rows);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { uid, accessToken, matchRequest, minTeamMembers, ageRangeMin, ageRangeMax } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.json({ success: false, message: "Authentication Failed" });

  const matched = await pool.query(
    `SELECT match_user($1::int, $2::int, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::float8, $10::int, $11::int, $12::int, $13::float8, $14::float8, $15::float8, $16::float8, $17::boolean, $18::boolean) AS result`,
    [uid, minTeamMembers, ageRangeMin, ageRangeMax,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.match_radius, matchRequest.min_team_members, matchRequest.age_range_min,
     matchRequest.age_range_max, matchRequest.latitude, matchRequest.longitude,
     matchRequest.pay_per_head, matchRequest.pay_per_head_2,
     matchRequest.all_girls, matchRequest.half_girls]
  );
  const result = matched.rows[0].result;
  if (result.success) {
    const deducted = await pool.query(`SELECT deduct_gems($1::int, $2::int) AS ok`, [uid, result.cost]);
    if (deducted.rows[0].ok)
      return res.json({ success: true });
    else
      return res.json({ success: false, message: "Insufficient gems" });
  }
  return res.json({ success: false, message: "Insufficient gems" });
};

export const logOut = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM logout_user($1::int)`, [uid]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM current_match_request_user($1::int)`, [uid]);
  return res.json(result.rows);
};

export const send = async (req: Request, res: Response) => {
  const { uid, accessToken, message, receiverRole, receiverId } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  await pool.query(
    `SELECT send_notification_user($1::int, $2::text, $3::int, $4::text)`,
    [uid, receiverRole, receiverId, message]
  );
  const deducted = await pool.query(`SELECT deduct_gems($1::int, 1) AS ok`, [uid]);
  if (deducted.rows[0].ok)
    return res.json({ success: true });
  else
    return res.json({ success: false, message: "Insufficient Gems" });
};

export const count = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT count_notifications_user($1::int) AS count`, [uid]);
  return res.json(result.rows[0].count);
};

export const receive = async (req: Request, res: Response) => {
  const { uid, accessToken, a, b } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  if (!user || user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM get_notifications_user($1::int, $2::int, $3::int)`, [uid, a, b]);
  return res.json(result.rows);
};

function getAge(dob: string) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hasHadBirthday) age--;
  return age;
}
