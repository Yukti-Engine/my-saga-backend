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

export const deactivateCompletedAdventures = async () => {
  const { rows } = await pool.query(`SELECT deactivate_completed_adventures();`);
  const ids: number[] = rows[0]?.deactivate_completed_adventures ?? [];

  if (ids.length === 0) return false;

  await Promise.all(ids.map((id) => deleteAdventureFiles(id)));

  return true;
};
