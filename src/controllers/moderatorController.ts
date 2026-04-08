import type { Request, Response } from "express";
import pool from "../db.js";
import { archiveFile, deleteAdventureFiles } from "../services/bucketService.js";
import fs from "fs";
import path from "path";
import os from "os";

export const archiveMatchRequests = async () => {
  const data = (
    await pool.query(`SELECT * FROM cut_inactive_match_requests();`)
  ).rows;

  if (data.length === 0) return false;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `match_requests_${timestamp}.json`;
  const tmpFile = path.join(os.tmpdir(), fileName);

  fs.writeFileSync(tmpFile, JSON.stringify(data));
  await archiveFile(tmpFile, `match_requests/${fileName}`, "application/json");
  fs.unlinkSync(tmpFile);

  return true;
};

export const cleanupExpiredPendingUsers = async () => {
  
    await pool.query(`SELECT cleanup_expired_pending_users();`);
  
};

export const logoutAbsentees = async () => {
  
    await pool.query(`SELECT logout_absentees();`);
  
};

export const addBoss = async (req: Request, res: Response) => {
  const { name, email, password, username, phone, dob, gender } = req.body;

  if (!name || !email || !password || !username)
    return res.status(400).json({ error: "name, email, password, username are required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_boss($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text)`,
      [name, email, password, username, phone ?? null, dob ?? null, gender ?? null]
    );
    return res.json({ message: "Boss created", id: rows[0].create_boss });
  } catch (err) {
    console.error("Error in addBoss:", err);
    return res.status(500).json({ error: "Failed to create boss" });
  }
};

export const addOrganizer = async (req: Request, res: Response) => {
  const { name, email, password, username, phone, dob, gender } = req.body;

  if (!name || !email || !password || !username)
    return res.status(400).json({ error: "name, email, password, username are required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_organizer($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text)`,
      [name, email, password, username, phone ?? null, dob ?? null, gender ?? null]
    );
    return res.json({ message: "Organizer created", id: rows[0].create_organizer });
  } catch (err) {
    console.error("Error in addOrganizer:", err);
    return res.status(500).json({ error: "Failed to create organizer" });
  }
};

export const createNewBadge = async (req: Request, res: Response) => {
  const { title, categoryId, league, description } = req.body;

  if (!title)
    return res.status(400).json({ error: "title is required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_badge($1::text, $2::int, $3::smallint, $4::text)`,
      [title, categoryId ?? null, league ?? null, description ?? null]
    );
    return res.json({ message: "Badge created", id: rows[0].create_badge });
  } catch (err) {
    console.error("Error in createNewBadge:", err);
    return res.status(500).json({ error: "Failed to create badge" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { category, subCategory, word2s } = req.body;

  if (!category)
    return res.status(400).json({ error: "category is required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_category($1::text, $2::text, $3::text[])`,
      [category, subCategory ?? null, word2s ?? null]
    );
    return res.json({ message: "Category created", id: rows[0].create_category });
  } catch (err) {
    console.error("Error in createCategory:", err);
    return res.status(500).json({ error: "Failed to create category" });
  }
};

export const createTournament = async (req: Request, res: Response) => {
  const { name, badgeId, sponsoredBy, venue, timing, instructions, thirdPartyRewardDetail } = req.body;
  if (!name)
    return res.status(400).json({ error: "name is required" });

  try {
    let prize1: number | null = null;
    let prize2: number | null = null;
    let prize3: number | null = null;

    if (badgeId) {
      const badge = (await pool.query(`SELECT * FROM get_badge($1::int)`, [badgeId])).rows[0];
      if (!badge)
        return res.status(400).json({ error: "Badge not found" });

      const league: number = badge.league;
      prize1 = 1000 + (100 - league)*(100-league) * 25;
      prize2 = Math.floor(prize1 / 2);
      prize3 = Math.floor(prize2 / 2);
    }

    const { rows } = await pool.query(
      `SELECT create_tournament($1::text, $2::int, $3::int, $4::int, $5::int, $6::text, $7::text, $8::timestamptz, $9::text, $10::text)`,
      [name, badgeId ?? null, prize1, prize2, prize3, sponsoredBy ?? null, venue ?? null, timing ?? null, instructions ?? null, thirdPartyRewardDetail ?? null]
    );
    return res.json({ message: "Tournament created", id: rows[0].create_tournament, prize1, prize2, prize3 });
  } catch (err) {
    console.error("Error in createTournament:", err);
    return res.status(500).json({ error: "Failed to create tournament" });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  return res.json({ valid: true });
};

export const getUsers = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, phone, gender, level, star_score, penalties, gems
       FROM users
       WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ users: rows });
  } catch (err) {
    console.error("Error in getUsers:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getOrganizers = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, phone, gender, credits
       FROM organizers
       WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ organizers: rows });
  } catch (err) {
    console.error("Error in getOrganizers:", err);
    return res.status(500).json({ error: "Failed to fetch organizers" });
  }
};

export const getBosses = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, email, phone, gender, credits
       FROM bosses
       WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
       ORDER BY id
       LIMIT $2 OFFSET $3`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ bosses: rows });
  } catch (err) {
    console.error("Error in getBosses:", err);
    return res.status(500).json({ error: "Failed to fetch bosses" });
  }
};

export const grantGems = async (req: Request, res: Response) => {
  const { userId, gems } = req.body;

  if (!userId || gems == null)
    return res.status(400).json({ error: "userId and gems are required" });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET gems = gems + $1 WHERE id = $2 RETURNING id, gems`,
      [gems, userId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json({ message: "Gems granted", id: rows[0].id, gems: rows[0].gems });
  } catch (err) {
    console.error("Error in grantGems:", err);
    return res.status(500).json({ error: "Failed to grant gems" });
  }
};

export const grantCredits = async (req: Request, res: Response) => {
  const { id, role, credits } = req.body;

  if (!id || !role || credits == null)
    return res.status(400).json({ error: "id, role, and credits are required" });

  if (role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be 'organizer' or 'boss'" });

  const table = role === "organizer" ? "organizers" : "bosses";

  try {
    const { rows } = await pool.query(
      `UPDATE ${table} SET credits = credits + $1 WHERE id = $2 RETURNING id, credits`,
      [credits, id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: `${role} not found` });
    return res.json({ message: "Credits granted", id: rows[0].id, credits: rows[0].credits });
  } catch (err) {
    console.error("Error in grantCredits:", err);
    return res.status(500).json({ error: "Failed to grant credits" });
  }
};

export const getAdventures = async (req: Request, res: Response) => {
  const { isActive, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, category_id, organizer_id, boss_id, user_ids, is_active, room_key, created_at
       FROM adventures
       WHERE ($1::boolean IS NULL OR is_active = $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [isActive ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ adventures: rows });
  } catch (err) {
    console.error("Error in getAdventures:", err);
    return res.status(500).json({ error: "Failed to fetch adventures" });
  }
};

export const getTournaments = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tournaments ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ tournaments: rows });
  } catch (err) {
    console.error("Error in getTournaments:", err);
    return res.status(500).json({ error: "Failed to fetch tournaments" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM categories ORDER BY id LIMIT $1 OFFSET $2`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ categories: rows });
  } catch (err) {
    console.error("Error in getCategories:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getBadges = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM badges ORDER BY id LIMIT $1 OFFSET $2`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ badges: rows });
  } catch (err) {
    console.error("Error in getBadges:", err);
    return res.status(500).json({ error: "Failed to fetch badges" });
  }
};

export const deactivateCompletedAdventures = async () => {
  const { rows } = await pool.query(`SELECT deactivate_completed_adventures();`);
  const ids: number[] = rows[0]?.deactivate_completed_adventures ?? [];

  if (ids.length === 0) return false;

  await Promise.all(ids.map((id) => deleteAdventureFiles(id)));

  return true;
};
