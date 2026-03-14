import type { Request, Response } from "express";
import pool from "../db.js";
import { generateDownloadUrl, generateUploadUrl } from "../services/bucketService.js";


export const count = async (req: Request, res: Response) => {
  const { adventureId, id, role, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const result = await pool.query(`SELECT count_messages($1::int) AS count`, [adventureId]);
  return res.json(result.rows[0].count);
};

export const getMessages = async (req: Request, res: Response) => {
  const { adventureId, id, role, accessToken, a, b } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const result = await pool.query(
    `SELECT * FROM get_messages_from_a_to_b($1::int, $2::int, $3::int)`,
    [adventureId, a, b]
  );
  return res.json(result.rows);
};

export default function roomSocket(io: any, socket: any) {
  socket.on("join_room", async ({ roomName, id, role, accessToken }: any) => {
    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;
    const adventureId = parseInt(roomName.substring(0, roomName.indexOf('_')));
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
    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [senderId, senderType, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;

    const adventureId = parseInt(room.substring(0, room.indexOf('_')));
    const related = await pool.query(
      `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
      [senderId, senderType, adventureId]
    );
    if (related.rows[0].ok) {
      await pool.query(
        `SELECT add_message($1::int, $2::text, $3::int, $4::text)`,
        [senderId, senderType, adventureId, message]
      );
      io.to(room).emit("message", message);
    }
  });

  socket.on("leave_room", async ({ roomName, id, role, accessToken }: any) => {
    const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
    if (!authResult.rows[0].is_authenticated)
      return;

    const adventureId = parseInt(roomName.substring(0, roomName.indexOf('_')));
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

export async function getUploadFileUrl(req: any, res: any) {
  const { fileName, contentType, adventureId, id, role, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const countRes = await pool.query(`SELECT file_count($1::int) AS count`, [adventureId]);
  const data = await generateUploadUrl(fileName, contentType, adventureId, Number(countRes.rows[0].count) + 1);
  return res.json(data);
}

export async function getDownloadFileUrl(req: any, res: any) {
  const { fileName, adventureId, fileNumber, id, role, accessToken } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, $2::text, $3::int) AS ok`,
    [id, role, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const data = await generateDownloadUrl(fileName, adventureId, fileNumber);
  return res.json({ data });
}
