import pool from "../db.js";
import {Request, Response} from "express";
import { validatePositiveInt, validateBoundedText } from "../validators.js";

export const send = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  const messageV = validateBoundedText(req.body.message, "message", 1, 1000, { allowNewlines: true });
  if (!messageV.ok) return res.status(400).json({ error: messageV.error });
  const receiverRole = req.body.receiverRole;
  if (receiverRole !== "organizer" && receiverRole !== "boss" && receiverRole !== "user")
    return res.status(400).json({ error: "receiverRole must be organizer, boss, or user" });
  const receiverIdV = validatePositiveInt(req.body.receiverId, "receiverId");
  if (!receiverIdV.ok) return res.status(400).json({ error: receiverIdV.error });
  if (receiverRole === role && receiverIdV.value === id)
    return res.status(400).json({ error: "Cannot send to yourself" });

  if (role=="user"){
    const deducted = await pool.query(`SELECT deduct_gems($1::int, $2::int) AS ok`, [id, 1]);
    if (!deducted.rows[0].ok)
      return res.json({ success: false, message: "Insufficient gems" });
  }
  await pool.query(
    `SELECT send_notification($1::int, $2::text, $3::text, $4::int, $5::text)`,
    [id, role, messageV.value, receiverIdV.value, receiverRole]
  );
  return res.json({ success: true });
};

export const count = async (req: Request, res: Response) => {
  const { id, role } = req.body;

  const result = await pool.query(`SELECT count_notifications($1::int, $2::text) AS count`, [id, role]);
  return res.json({ count: result.rows[0].count });
};

export const receive = async (req: Request, res: Response) => {
  const { id, role, a, b } = req.body;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(`SELECT * FROM get_notifications($1::int, $2::text, $3::int, $4::int)`, [id, role, a, b]);
  return res.json(result.rows);
};