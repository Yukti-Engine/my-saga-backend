import pool from "../db.js";
import { archiveFile, deleteAdventureFiles } from "../services/bucketService.js";
import fs from "fs";
import path from "path";
import os from "os";
import Anthropic from "@anthropic-ai/sdk";

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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { rows: badges } = await pool.query(
    `SELECT id, title, description, league FROM badges`
  );

  if (badges.length === 0) return false;

  const prompt = (badge: { title: string; description: string | null; league: number | null }) =>
    `You are designing a group activity roadmap for 4 to 20 people working together to earn the following badge:

Title: ${badge.title}
Description: ${badge.description ?? "N/A"}
League (difficulty, 1=hardest, 100=easiest): ${badge.league ?? "N/A"}

Create a roadmap with exactly 7 to 8 checkpoints. Rules:
- Every checkpoint must be a group activity — something the whole group does together, not individually
- Activities should build progressively towards earning the badge
- The final checkpoint must be a climactic finale that represents earning the badge
- Be specific and creative — no generic advice

Respond with ONLY the roadmap as plain text. No JSON, no lists, no extra formatting. Just write the roadmap directly.`;

  for (const badge of badges) {
    const roadmaps: string[] = [];

    for (let i = 0; i < 10; i++) {
      try {
        const message = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt(badge) }],
        });

        const content = message.content[0];
        if (!content || content.type !== "text") continue;

        const text = content.text.trim();
        if (text.length > 0)
          roadmaps.push(text);
      } catch {
        continue;
      }
    }

    if (roadmaps.length === 0) continue;

    await pool.query(
      `UPDATE badges SET roadmaps = $1::varchar(10000)[] WHERE id = $2`,
      [roadmaps, badge.id]
    );
  }

  return true;
};

export const deactivateCompletedAdventures = async () => {
  const { rows } = await pool.query(`SELECT deactivate_completed_adventures();`);
  const ids: number[] = rows[0]?.deactivate_completed_adventures ?? [];

  if (ids.length === 0) return false;

  await Promise.all(ids.map((id) => deleteAdventureFiles(id)));

  return true;
};