import type { Request, Response } from "express";
import pool from "../db.js";
import { generateDownloadUrl, generateUploadUrl } from "../services/bucketService.js";
import { validatePositiveInt, validateIntRange, validateBoundedText } from "../validators.js";


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
      socket.to(roomName).emit("message", "A user has joined!");
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
      io.to(room).emit("message", cleaned);
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
      socket.to(roomName).emit("message", "A user has left!");
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


export async function insertResult(req: any, res: any) {
  const { adventureId, userIds, starScores, remarks, badgeIds } = req.body;
  const resultQuery = await pool.query(`SELECT insert_result($1::int, $2::int[], $3::int[], $4::int[], $5::text[]) AS result_number`, [adventureId, badgeIds, userIds, starScores, remarks]);
  return res.json({ resultNumber: resultQuery.rows[0].result_number });
}
export async function getResult(req: any, res: any) {
  const advV = validatePositiveInt(req.body.adventureId, "adventureId");
  if (!advV.ok) return res.status(400).json({ error: advV.error });
  const resV = validatePositiveInt(req.body.resultNumber, "resultNumber");
  if (!resV.ok) return res.status(400).json({ error: resV.error });
  const result = await pool.query(`SELECT * FROM get_result($1::int, $2::int)`, [advV.value, resV.value]);
  return res.json(result.rows[0]);
}

