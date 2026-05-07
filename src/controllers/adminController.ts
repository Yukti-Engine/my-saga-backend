import pool from "../db.js";
import { archiveFile, deleteAdventureFiles, deleteKycFolder } from "../services/bucketService.js";
import fs from "fs";
import path from "path";
import os from "os";
import { generateBadgeRoadmap } from "../services/llmService.js";

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

/** Removes signup_links that expired without ever being used. Safe to run frequently. */
export const cleanupExpiredSignupLinks = async () => {
  const { rows } = await pool.query(`SELECT cleanup_expired_signup_links() AS count`);
  return rows[0]?.count ?? 0;
};

/**
 * Purges pending_signups that have been waiting for moderator review for more than
 * 60 days. Also deletes each applicant's KYC folder from GCS so no orphaned files remain.
 */
export const cleanupStalePendingSignups = async () => {
  const { rows } = await pool.query(`SELECT * FROM cleanup_stale_pending_signups()`);

  if (rows.length === 0) return 0;

  // Best-effort GCS cleanup — errors are logged but don't abort the rest.
  await Promise.allSettled(
    rows.map((r: { kyc_folder: string }) =>
      deleteKycFolder(r.kyc_folder).catch((e) =>
        console.error(`cleanupStalePendingSignups: failed to delete GCS folder ${r.kyc_folder}:`, e)
      )
    )
  );

  return rows.length;
};

/**
 * Archives closed tickets older than 90 days to GCS, then deletes them from the DB.
 * One JSON file per run, keyed by timestamp, stored under tickets/ in the archive bucket.
 */
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