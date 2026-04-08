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

export const deactivateCompletedAdventures = async () => {
  const { rows } = await pool.query(`SELECT deactivate_completed_adventures();`);
  const ids: number[] = rows[0]?.deactivate_completed_adventures ?? [];

  if (ids.length === 0) return false;

  await Promise.all(ids.map((id) => deleteAdventureFiles(id)));

  return true;
};
