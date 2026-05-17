import type { Request, Response } from "express";
import pool from "../db.js";
import { randomUUID } from "crypto";
import { generateDownloadUrl, generateUploadUrl } from "../services/bucketService.js";
import { validatePositiveInt, validateIntRange, validateBoundedText } from "../validators.js";
import { issueOpenBadge } from "../services/openBadgesService.js";


export const count = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, advV.value]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const result = await pool.query(`SELECT count_messages($1::int) AS count`, [advV.value]);
  return res.json({ count: Number(result.rows[0].count) });
};

export const getMessages = async (req: Request, res: Response) => {
  const { id, role, a, b } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, advV.value]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const result = await pool.query(
    `SELECT * FROM get_messages_from_a_to_b($1::int, $2::int, $3::int)`,
    [advV.value, a, b]
  );
  return res.json(result.rows);
};

const ROOM_NAME_RE = /^[1-9][0-9]{0,8}_[1-9][0-9]{0,8}$/;

function parseRoomName(name: unknown): number | null {
  if (typeof name !== "string" || !ROOM_NAME_RE.test(name)) return null;
  return parseInt(name.substring(0, name.indexOf('_')), 10);
}

function cleanMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (cleaned.length < 1 || cleaned.length > 2000) return null;
  return cleaned;
}

export default function roomSocket(io: any, socket: any) {
  socket.on("join_room", async ({ roomName, id, role, accessToken }: any) => {
    const adventureId = parseRoomName(roomName);
    if (adventureId === null) return;

    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;
    const roomOk = await pool.query(`SELECT room_available($1::text) AS ok`, [roomName]);
    const related = await pool.query(
      `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
      [id, role, adventureId]
    );
    if (roomOk.rows[0].ok && related.rows[0].ok) {
      socket.join(roomName);
    }
  });

  socket.on("send_message", async ({ room, senderId, senderType, accessToken, message }: any) => {
    const adventureId = parseRoomName(room);
    if (adventureId === null) return;
    const cleaned = cleanMessage(message);
    if (cleaned === null) return;

    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [senderId, senderType, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;

    const related = await pool.query(
      `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
      [senderId, senderType, adventureId]
    );
    if (related.rows[0].ok) {
      await pool.query(
        `SELECT add_message($1::int, $2::text, $3::int, $4::text)`,
        [senderId, senderType, adventureId, cleaned]
      );
    }
  });

  socket.on("leave_room", async ({ roomName, id, role, accessToken }: any) => {
    const adventureId = parseRoomName(roomName);
    if (adventureId === null) return;

    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;

    const related = await pool.query(
      `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
      [id, role, adventureId]
    );
    if (related.rows[0].ok) {
      socket.leave(roomName);
    }
  });
}

export async function getEvent(req: any, res: any) {
  const eventV = validatePositiveInt(req.body.eventId, "eventId");
  if (!eventV.ok) return res.status(400).json({ error: eventV.error });
  const result = await pool.query(`SELECT * FROM get_event($1::int)`, [eventV.value]);
  return res.json(result.rows[0]);
}

export async function createPoll(req: any, res: any) {
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const questionV = validateBoundedText(req.body.question, "question", 1, 50);
  if (!questionV.ok) return res.status(400).json({ error: questionV.error });
  const { options } = req.body;
  if (!Array.isArray(options) || options.length < 2 || options.length > 10)
    return res.status(400).json({ error: "options must be an array of 2-10 items" });
  const cleanedOptions: string[] = [];
  for (const opt of options) {
    const v = validateBoundedText(opt, "option", 1, 20);
    if (!v.ok) return res.status(400).json({ error: v.error });
    cleanedOptions.push(v.value);
  }

  const resultQuery = await pool.query(`SELECT insert_poll($1::int, $2::text, $3::text[]) AS poll_number`, [advV.value, questionV.value, cleanedOptions]);
  return res.json({ pollNumber: resultQuery.rows[0].poll_number });
}

async function getPollOptionCount(adventureId: number, pollNumber: number): Promise<number | null> {
  const { rows } = await pool.query(`SELECT * FROM get_poll($1::int, $2::int)`, [adventureId, pollNumber]);
  if (rows.length === 0) return null;
  const opts = rows[0].options;
  return Array.isArray(opts) ? opts.length : null;
}

export async function updatePollAddVote(req: any, res: any) {
  const { id, role } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const pollV = validatePositiveInt(req.body.pollNumber, "pollNumber");
  if (!pollV.ok) return res.status(400).json({ error: pollV.error });
  const count = await getPollOptionCount(advV.value, pollV.value);
  if (count === null) return res.status(404).json({ error: "Poll not found" });
  const idxV = validateIntRange(req.body.optionIndex, "optionIndex", 0, count - 1);
  if (!idxV.ok) return res.status(400).json({ error: idxV.error });

  await pool.query(`SELECT update_poll_add_vote($1::int, $2::int, $3::int, $4::text)`, [advV.value, pollV.value, idxV.value, role.charAt(0).toLowerCase()+id.toString()]);
  return res.json({ success: true });
}

export async function updatePollRemoveVote(req: any, res: any) {
  const { id, role } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const pollV = validatePositiveInt(req.body.pollNumber, "pollNumber");
  if (!pollV.ok) return res.status(400).json({ error: pollV.error });
  const count = await getPollOptionCount(advV.value, pollV.value);
  if (count === null) return res.status(404).json({ error: "Poll not found" });
  const idxV = validateIntRange(req.body.optionIndex, "optionIndex", 0, count - 1);
  if (!idxV.ok) return res.status(400).json({ error: idxV.error });

  await pool.query(`SELECT update_poll_remove_vote($1::int, $2::int, $3::int, $4::text)`, [advV.value, pollV.value, idxV.value, role.charAt(0).toLowerCase()+id.toString()]);
  return res.json({ success: true });
}

export async function getPoll(req: any, res: any) {
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const pollV = validatePositiveInt(req.body.pollNumber, "pollNumber");
  if (!pollV.ok) return res.status(400).json({ error: pollV.error });
  const result = await pool.query(`SELECT * FROM get_poll($1::int, $2::int)`, [advV.value, pollV.value]);
  return res.json(result.rows[0]);
}


export async function insertResult(req: Request, res: Response) {
  const { id } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });

  const { userIds, starScores, remarks } = req.body;
  if (!Array.isArray(userIds) || !Array.isArray(starScores) || !Array.isArray(remarks))
    return res.status(400).json({ error: "userIds, starScores, remarks must be arrays" });
  const n = userIds.length;
  if (n === 0) return res.status(400).json({ error: "userIds must be non-empty" });
  if (n > 20) return res.status(400).json({ error: "arrays exceed max length 20" });
  if (starScores.length !== n || remarks.length !== n)
    return res.status(400).json({ error: "userIds, starScores, remarks must be same length" });

  for (const uid of userIds) {
    if (!Number.isInteger(uid) || uid <= 0)
      return res.status(400).json({ error: "userIds must be positive integers" });
  }
  for (const s of starScores) {
    if (!Number.isInteger(s) || s < 0 || s > 100)
      return res.status(400).json({ error: "starScores must be integers 0-100" });
  }
  const trimmedRemarks: string[] = [];
  for (const r of remarks) {
    if (typeof r !== "string") return res.status(400).json({ error: "remarks must be strings" });
    const t = r.trim();
    if (t.length > 100) return res.status(400).json({ error: "each remark must be <= 100 chars" });
    trimmedRemarks.push(t);
  }

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'boss', $2::int) AS ok`,
    [id, advV.value]
  );
  if (!check.rows[0].ok) return res.status(403).json({ success: false });

  const resultQuery = await pool.query(
    `SELECT insert_result($1::int, $2::int[], $3::int[], $4::text[]) AS result_number`,
    [advV.value, userIds, starScores, trimmedRemarks]
  );

  // Issue Open Badge credentials for qualified users (fire-and-forget)
  issueObCredentials(advV.value, userIds, starScores).catch(() => {});

  return res.json({ resultNumber: resultQuery.rows[0].result_number });
}

async function issueObCredentials(adventureId: number, userIds: number[], starScores: number[]) {
  const { rows: [badge] } = await pool.query(
    `SELECT b.id, b.title::TEXT, b.description::TEXT, b.league
     FROM adventures a JOIN badges b ON b.id = a.badge_id
     WHERE a.id = $1`,
    [adventureId]
  );
  if (!badge) return;

  const threshold = 100 - (badge.league ?? 0);
  const issuedOn = new Date();

  for (let i = 0; i < userIds.length; i++) {
    if ((starScores[i] ?? 0) < threshold) continue;

    const { rows: [user] } = await pool.query(
      `SELECT get_user_email($1::int) AS email`, [userIds[i]]
    );
    if (!user?.email) continue;

    const assertionId = randomUUID();
    const signedVC = await issueOpenBadge({
      assertionId,
      recipientEmail: user.email,
      badgeId: badge.id,
      badgeName: badge.title,
      badgeDescription: badge.description,
      issuedOn,
    });

    await pool.query(
      `SELECT insert_ob_assertion($1::uuid, $2::int, $3::int, $4::int, $5::jsonb)`,
      [assertionId, userIds[i], badge.id, adventureId, JSON.stringify(signedVC)]
    );
  }
}
export async function getResult(req: any, res: any) {
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const resV = validatePositiveInt(req.body.resultNumber, "resultNumber");
  if (!resV.ok) return res.status(400).json({ error: resV.error });
  const result = await pool.query(`SELECT * FROM get_result($1::int, $2::int)`, [advV.value, resV.value]);
  return res.json(result.rows[0]);
}

export const getUploadFileUrl = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const fileNameV = validateBoundedText(req.body.fileName, "fileName", 1, 200);
  if (!fileNameV.ok) return res.status(400).json({ error: fileNameV.error });
  const contentTypeV = validateBoundedText(req.body.contentType, "contentType", 1, 100);
  if (!contentTypeV.ok) return res.status(400).json({ error: contentTypeV.error });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, advV.value]
  );
  if (!check.rows[0].ok) return res.status(403).json({ success: false });

  const countRes = await pool.query(`SELECT file_count($1::int) AS count`, [advV.value]);
  const data = await generateUploadUrl(fileNameV.value, contentTypeV.value, advV.value, Number(countRes.rows[0].count) + 1);
  return res.json(data);
};

export const getDownloadFileUrl = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const fileNumberV = validatePositiveInt(req.body.fileNumber, "fileNumber");
  if (!fileNumberV.ok) return res.status(400).json({ error: fileNumberV.error });
  const fileNameV = validateBoundedText(req.body.fileName, "fileName", 1, 200);
  if (!fileNameV.ok) return res.status(400).json({ error: fileNameV.error });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, advV.value]
  );
  if (!check.rows[0].ok) return res.status(403).json({ success: false });

  const data = await generateDownloadUrl(fileNameV.value, advV.value, fileNumberV.value);
  return res.json({ data });
};

