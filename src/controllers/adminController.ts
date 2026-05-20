import type { Request, Response } from "express";
import pool from "../db.js";
import { archiveFile, deleteAdventureFiles, deleteKycFolder, uploadBadgeIcon, uploadCategoryIcon, uploadThemeIcon } from "../services/bucketService.js";
import fs from "fs";
import path from "path";
import os from "os";
import { generateBadgeRoadmap } from "../services/llmService.js";

/* ─────────────────── MAINTENANCE (existing) ─────────────────── */

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

export const refreshBadgeRoadmaps = async () => {
  const { rows: badges } = await pool.query(
    `SELECT * FROM get_all_badges_for_roadmap()`
  );

  if (badges.length === 0) return false;

  for (const badge of badges) {
    const roadmaps: string[] = [];

    for (let i = 0; i < 10; i++) {
      try {
        const text = await generateBadgeRoadmap(badge);
        if (text) roadmaps.push(text);
      } catch {
        continue;
      }
    }

    if (roadmaps.length === 0) continue;

    await pool.query(
      `SELECT update_badge_roadmaps($1::int, $2::varchar(10000)[])`,
      [badge.id, roadmaps]
    );
  }

  return true;
};

export const limitMore = async () => {
  const { rows } = await pool.query(`SELECT limit_more() AS affected`);
  return rows[0]?.affected ?? 0;
};

export const deactivateCompletedAdventures = async () => {
  const { rows } = await pool.query(`SELECT deactivate_completed_adventures();`);
  const ids: number[] = rows[0]?.deactivate_completed_adventures ?? [];

  if (ids.length === 0) return false;

  await Promise.all(ids.map((id) => deleteAdventureFiles(id)));

  return true;
};

export const cleanupExpiredSignupLinks = async () => {
  const { rows } = await pool.query(`SELECT cleanup_expired_signup_links() AS count`);
  return rows[0]?.count ?? 0;
};

export const cleanupStalePendingSignups = async () => {
  const { rows } = await pool.query(`SELECT * FROM cleanup_stale_pending_signups()`);

  if (rows.length === 0) return 0;

  await Promise.allSettled(
    rows.map((r: { kyc_folder: string }) =>
      deleteKycFolder(r.kyc_folder).catch((e) =>
        console.error(`cleanupStalePendingSignups: failed to delete GCS folder ${r.kyc_folder}:`, e)
      )
    )
  );

  return rows.length;
};

export const cleanupResolvedTickets = async () => {
  const { rows } = await pool.query(`SELECT * FROM cleanup_resolved_tickets()`);

  if (rows.length === 0) return 0;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `tickets_${timestamp}.json`;
  const tmpFile = path.join(os.tmpdir(), fileName);

  fs.writeFileSync(tmpFile, JSON.stringify(rows));
  await archiveFile(tmpFile, `tickets/${fileName}`, "application/json");
  fs.unlinkSync(tmpFile);

  return rows.length;
};

/* ─────────────────── CATEGORIES ─────────────────── */

export const getCategories = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_categories($1::int, $2::int)`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ categories: rows });
  } catch (err) {
    console.error("Error in getCategories:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
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

export const updateCategory = async (req: Request, res: Response) => {
  const { id, category, subcategory } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_update_category($1::int, $2::text, $3::text) AS found`,
      [id, category ?? null, subcategory ?? null]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Category not found" });
    return res.json({ message: "Category updated", id });
  } catch (err) {
    console.error("Error in updateCategory:", err);
    return res.status(500).json({ error: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_delete_category($1::int) AS found`, [id]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Category not found" });
    return res.json({ message: "Category deleted", id });
  } catch (err) {
    console.error("Error in deleteCategory:", err);
    return res.status(500).json({ error: "Failed to delete category" });
  }
};

export const uploadCategoryIconRoute = async (req: Request, res: Response) => {
  const { categoryId, icon } = req.body;
  if (!Number.isInteger(categoryId) || categoryId <= 0)
    return res.status(400).json({ error: "categoryId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadCategoryIcon(icon, categoryId);
  return res.json({ message: "icon uploaded" });
};

/* ─────────────────── BADGES ─────────────────── */

export const getBadges = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_badges($1::int, $2::int)`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ badges: rows });
  } catch (err) {
    console.error("Error in getBadges:", err);
    return res.status(500).json({ error: "Failed to fetch badges" });
  }
};

export const createNewBadge = async (req: Request, res: Response) => {
  const { title, categoryId, league, description, icon } = req.body;
  if (!title)
    return res.status(400).json({ error: "title is required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_badge($1::text, $2::int, $3::smallint, $4::text)`,
      [title, categoryId ?? null, league ?? null, description ?? null]
    );
    const badgeId: number = rows[0].create_badge;

    if (icon) {
      await uploadBadgeIcon(icon, badgeId);
    }

    return res.json({ message: "Badge created", id: badgeId });
  } catch (err) {
    console.error("Error in createNewBadge:", err);
    return res.status(500).json({ error: "Failed to create badge" });
  }
};

export const updateBadge = async (req: Request, res: Response) => {
  const { id, title, categoryId, league, description } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_update_badge($1::int, $2::text, $3::int, $4::smallint, $5::text) AS found`,
      [id, title ?? null, categoryId ?? null, league ?? null, description ?? null]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Badge not found" });
    return res.json({ message: "Badge updated", id });
  } catch (err) {
    console.error("Error in updateBadge:", err);
    return res.status(500).json({ error: "Failed to update badge" });
  }
};

export const deleteBadge = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_delete_badge($1::int) AS found`, [id]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Badge not found" });
    return res.json({ message: "Badge deleted", id });
  } catch (err) {
    console.error("Error in deleteBadge:", err);
    return res.status(500).json({ error: "Failed to delete badge" });
  }
};

export const uploadBadgeIconRoute = async (req: Request, res: Response) => {
  const { badgeId, icon } = req.body;
  if (!Number.isInteger(badgeId) || badgeId <= 0)
    return res.status(400).json({ error: "badgeId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadBadgeIcon(icon, badgeId);
  return res.json({ message: "icon uploaded" });
};

/* ─────────────────── THEMES ─────────────────── */

export const getThemes = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM get_all_themes()`);
    return res.json({ themes: rows });
  } catch (err) {
    console.error("Error in getThemes:", err);
    return res.status(500).json({ error: "Failed to fetch themes" });
  }
};

export const createTheme = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name)
    return res.status(400).json({ error: "name is required" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_create_theme($1::text, $2::text) AS id`,
      [name, description ?? null]
    );
    return res.json({ message: "Theme created", id: rows[0].id });
  } catch (err) {
    console.error("Error in createTheme:", err);
    return res.status(500).json({ error: "Failed to create theme" });
  }
};

export const updateTheme = async (req: Request, res: Response) => {
  const { id, name, description } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_update_theme($1::int, $2::text, $3::text) AS found`,
      [id, name ?? null, description ?? null]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Theme not found" });
    return res.json({ message: "Theme updated", id });
  } catch (err) {
    console.error("Error in updateTheme:", err);
    return res.status(500).json({ error: "Failed to update theme" });
  }
};

export const deleteTheme = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_delete_theme($1::int) AS found`, [id]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Theme not found" });
    return res.json({ message: "Theme deleted", id });
  } catch (err) {
    console.error("Error in deleteTheme:", err);
    return res.status(500).json({ error: "Failed to delete theme" });
  }
};

export const uploadThemeIconRoute = async (req: Request, res: Response) => {
  const { themeId, icon } = req.body;
  if (!Number.isInteger(themeId) || themeId <= 0)
    return res.status(400).json({ error: "themeId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadThemeIcon(icon, themeId);
  return res.json({ message: "icon uploaded" });
};

/* ─────────────────── SPACES ─────────────────── */

export const listSpaces = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM admin_list_spaces()`);
    return res.json({ spaces: rows });
  } catch (err) {
    console.error("Error in listSpaces:", err);
    return res.status(500).json({ error: "Failed to fetch spaces" });
  }
};

export const createSpace = async (req: Request, res: Response) => {
  const { name, link, lat, long: lng } = req.body;
  if (!name)
    return res.status(400).json({ error: "name is required" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_create_space($1::text, $2::text, $3::decimal, $4::decimal) AS id`,
      [name, link ?? null, lat ?? null, lng ?? null]
    );
    return res.json({ message: "Space created", id: rows[0].id });
  } catch (err) {
    console.error("Error in createSpace:", err);
    return res.status(500).json({ error: "Failed to create space" });
  }
};

export const updateSpace = async (req: Request, res: Response) => {
  const { id, name, link, lat, long: lng } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_update_space($1::int, $2::text, $3::text, $4::decimal, $5::decimal) AS found`,
      [id, name ?? null, link ?? null, lat ?? null, lng ?? null]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Space not found" });
    return res.json({ message: "Space updated", id });
  } catch (err) {
    console.error("Error in updateSpace:", err);
    return res.status(500).json({ error: "Failed to update space" });
  }
};

export const deleteSpace = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT admin_delete_space($1::int) AS found`, [id]
    );
    if (!rows[0].found) return res.status(404).json({ error: "Space not found" });
    return res.json({ message: "Space deleted", id });
  } catch (err) {
    console.error("Error in deleteSpace:", err);
    return res.status(500).json({ error: "Failed to delete space" });
  }
};

export const setSpaceCategories = async (req: Request, res: Response) => {
  const { spaceId, categoryIds } = req.body;
  if (!Number.isInteger(spaceId) || spaceId <= 0)
    return res.status(400).json({ error: "spaceId must be a positive integer" });
  if (!Array.isArray(categoryIds) || !categoryIds.every((c: unknown) => Number.isInteger(c) && (c as number) > 0))
    return res.status(400).json({ error: "categoryIds must be an array of positive integers" });

  try {
    await pool.query(
      `SELECT admin_set_space_categories($1::int, $2::int[])`,
      [spaceId, categoryIds]
    );
    return res.json({ message: "Space categories updated", spaceId });
  } catch (err) {
    console.error("Error in setSpaceCategories:", err);
    return res.status(500).json({ error: "Failed to update space categories" });
  }
};

export const getSpaceCategories = async (req: Request, res: Response) => {
  const { spaceId } = req.body;
  if (!Number.isInteger(spaceId) || spaceId <= 0)
    return res.status(400).json({ error: "spaceId must be a positive integer" });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM admin_get_space_categories($1::int)`,
      [spaceId]
    );
    return res.json({ categories: rows });
  } catch (err) {
    console.error("Error in getSpaceCategories:", err);
    return res.status(500).json({ error: "Failed to fetch space categories" });
  }
};
