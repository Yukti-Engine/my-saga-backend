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
const VALID_ROLES = new Set(["user", "organizer", "boss"]);

// Per-socket rate limit: token bucket — 5 msg/sec sustained, burst of 10.
const RATE_REFILL_PER_SEC = 5;
const RATE_MAX_TOKENS = 10;

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

function ack(cb: unknown, payload: any) {
  if (typeof cb === "function") (cb as Function)(payload);
}

/** Refills the bucket based on elapsed time, returns true if a token could be consumed. */
function takeRateToken(s: any): boolean {
  const now = Date.now();
  const data = s.data;
  const elapsed = (now - (data.rateLastRefill ?? now)) / 1000;
  const tokens = Math.min(RATE_MAX_TOKENS, (data.rateTokens ?? RATE_MAX_TOKENS) + elapsed * RATE_REFILL_PER_SEC);
  data.rateLastRefill = now;
  if (tokens < 1) {
    data.rateTokens = tokens;
    return false;
  }
  data.rateTokens = tokens - 1;
  return true;
}

export default function roomSocket(io: any, socket: any) {
  // Per-socket state
  socket.data.rooms = new Map<number, string>();   // adventureId → roomName (authorised rooms)
  socket.data.rateTokens = RATE_MAX_TOKENS;
  socket.data.rateLastRefill = Date.now();

  socket.on("join_room", async (payload: any, cb: unknown) => {
    const { roomName, id, role, accessToken } = payload ?? {};
    const adventureId = parseRoomName(roomName);
    if (adventureId === null) return ack(cb, { ok: false, error: "bad_room" });
    if (!VALID_ROLES.has(role)) return ack(cb, { ok: false, error: "bad_role" });
    if (!Number.isInteger(id) || id <= 0) return ack(cb, { ok: false, error: "bad_id" });
    if (typeof accessToken !== "string" || accessToken.length === 0)
      return ack(cb, { ok: false, error: "bad_token" });

    // Combined: authenticate + room_available + relation in a single round-trip
    let row: any;
    try {
      const result = await pool.query(
        `SELECT
           authenticate($1::int, $2::text, $3::text)              AS authed,
           room_available($4::text)                               AS room_ok,
           is_related_to_adventure($1::int, $2::text, $5::int)    AS related`,
        [id, role, accessToken, roomName, adventureId]
      );
      row = result.rows[0];
    } catch (err) {
      console.error("join_room db error:", err);
      return ack(cb, { ok: false, error: "server_error" });
    }
    if (!row.authed)  return ack(cb, { ok: false, error: "auth" });
    if (!row.room_ok) return ack(cb, { ok: false, error: "room_unavailable" });
    if (!row.related) return ack(cb, { ok: false, error: "forbidden" });

    // Cache identity + authorised rooms on the socket so send_message skips per-message DB hits
    socket.data.uid = id;
    socket.data.role = role;
    socket.data.rooms.set(adventureId, roomName);
    socket.join(roomName);
    ack(cb, { ok: true });
  });

  socket.on("send_message", async (payload: any, cb: unknown) => {
    const { room, message, clientId } = payload ?? {};
    const adventureId = parseRoomName(room);
    if (adventureId === null) return ack(cb, { ok: false, error: "bad_room", clientId });

    const cleaned = cleanMessage(message);
    if (cleaned === null) return ack(cb, { ok: false, error: "bad_message", clientId });

    // Auth-once check: this socket must have joined exactly this room
    const cachedRoom = socket.data.rooms?.get(adventureId);
    if (!cachedRoom || cachedRoom !== room)
      return ack(cb, { ok: false, error: "not_in_room", clientId });

    if (!takeRateToken(socket))
      return ack(cb, { ok: false, error: "rate_limited", clientId });

    try {
      const { rows } = await pool.query(
        `SELECT add_message($1::int, $2::text, $3::int, $4::text) AS message_id, NOW() AS created_at`,
        [socket.data.uid, socket.data.role, adventureId, cleaned]
      );
      const stored = rows[0] ?? {};
      const broadcast = {
        id: stored.message_id ?? null,
        adventureId,
        senderId: socket.data.uid,
        senderType: socket.data.role,
        message: cleaned,
        createdAt: stored.created_at,
        clientId,
      };
      io.to(room).emit("new_message", broadcast);
      ack(cb, { ok: true, id: stored.message_id ?? null, createdAt: stored.created_at, clientId });
    } catch (err) {
      console.error("send_message db error:", err);
      ack(cb, { ok: false, error: "server_error", clientId });
    }
  });

  socket.on("leave_room", (payload: any, cb: unknown) => {
    const { roomName } = payload ?? {};
    const adventureId = parseRoomName(roomName);
    if (adventureId === null) return ack(cb, { ok: false, error: "bad_room" });
    // Trust the socket's own room registry — no DB call needed
    if (socket.data.rooms?.has(adventureId)) {
      socket.data.rooms.delete(adventureId);
      socket.leave(roomName);
    }
    ack(cb, { ok: true });
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
  const data = await generateUploadUrl(fileNameV.value, contentTypeV.value, advV.value, Number(countRes.rows[0].count) + 1, req.headers.origin as string | undefined);
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

