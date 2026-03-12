import type { Request, Response } from "express";
import pool from "../db.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { bid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_active_adventures_boss($1)`, [bid]);
  return res.json(result.rows);
};

export const organizeExam = async (req: Request, res: Response) => {
  const { bid, accessToken, activity, timing, venue, venueLink, adventureId, instruction } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  try {
    const check = await pool.query(
      `SELECT is_related_to_adventure($1, 'boss', $2) AS ok`,
      [bid, adventureId]
    );
    if (check.rows[0].ok) {
      await pool.query(
        `SELECT create_event($1, $2, $3, $4, $5, $6, true)`,
        [activity, timing, venue, venueLink, adventureId, instruction]
      );
      return res.json({ success: true });
    }
    return res.json({ success: false });
  } catch {
    return res.json({ success: false });
  }
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { bid, accessToken, a, b } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures_boss($1, $2, $3)`, [bid, a, b]);
  return res.json(result.rows);
};

export const updateBossProfile = async (req: Request, res: Response) => {
  const { bid, accessToken, updates } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const updated = await pool.query(
    `SELECT * FROM update_boss($1, $2, $3, $4, $5, $6)`,
    [bid, updates.username ?? null, updates.setting_1 ?? null, updates.setting_2 ?? null,
     updates.bio ?? null, updates.icon ? Buffer.from(updates.icon, "base64") : null]
  );
  const updatedBoss = updated.rows[0];
  delete updatedBoss.password;
  return res.json(updatedBoss);
};

export const getBossDashboard = async (req: Request, res: Response) => {
  const { bid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  return res.json({
    username: boss.username, gender: boss.gender, bio: boss.bio,
    dob: boss.dob, setting_1: boss.setting_1, setting_2: boss.setting_2,
    icon: boss.icon?.toString("base64")
  });
};

export const findAdventures = async (req: Request, res: Response) => {
  const { bid, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss)
    return res.status(500).json({ error: "No such boss" });
  if (boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const age = getAge(boss.dob);
  const compatible = await pool.query(
    `SELECT * FROM get_compatible_requests_boss($1, $2, $3, $4, $5)`,
    [categoryId, age, latitude, longitude, boss.gender]
  );

  const potentialAdventures: any[] = [];
  for (const element of compatible.rows) {
    if (element.boss_id) continue;
    const check = await pool.query(
      `SELECT check_reverse_compatibility_boss($1, $2, $3, $4, $5, $6, $7, $8) AS ok`,
      [element.id, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax,
       boss.gender === 'F' && boss.setting_1,
       boss.gender === 'F' && boss.setting_2]
    );
    if (check.rows[0].ok) potentialAdventures.push(element);
  }
  return res.json(potentialAdventures);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { bid, accessToken, matchRequest, minTeamMembers, ageRangeMin, ageRangeMax, payPerHead2 } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss || boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(
    `SELECT match_boss($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) AS result`,
    [bid, minTeamMembers, ageRangeMin, ageRangeMax, payPerHead2,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.match_radius, matchRequest.min_team_members, matchRequest.age_range_min,
     matchRequest.age_range_max, matchRequest.latitude, matchRequest.longitude,
     matchRequest.pay_per_head, matchRequest.pay_per_head_2,
     matchRequest.all_girls, matchRequest.half_girls]
  );
  return res.json(result.rows[0].result);
};

export const logOut = async (req: Request, res: Response) => {
  const { bid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss || boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM logout_boss($1)`, [bid]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { bid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_boss($1)`, [bid]);
  const boss = rows[0];
  if (!boss || boss.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM current_match_request_boss($1)`, [bid]);
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
