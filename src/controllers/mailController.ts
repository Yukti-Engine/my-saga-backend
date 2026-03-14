import pool from "../db";
import {Request, Response} from "express";

export const send = async (req: Request, res: Response) => {
  const { id, role, accessToken, message, receiverRole, receiverId } = req.body;
  
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });
  if (role=="user"){
    const deducted = await pool.query(`SELECT deduct_gems($1::int, $2::int) AS ok`, [id, 1]);
    if (!deducted.rows[0].ok) 
      return res.json({ success: false, message: "Insufficient gems" });
  }
  await pool.query(
    `SELECT send_notification($1::int, $2::text, $3::text, $4::int, $5::text)`,
    [id, role, message, receiverId, receiverRole]
  );
  return res.json({ success: true });
};

export const count = async (req: Request, res: Response) => {
  const { id, role, accessToken } = req.body;
  
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT count_notifications($1::int, $2::text) AS count`, [id, role]);
  return res.json({ count: result.rows[0].count });
};

export const receive = async (req: Request, res: Response) => {
  const { id, role, accessToken, a, b } = req.body;
  
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [id, role, accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM get_notifications($1::int, $2::text, $3::int, $4::int)`, [id, role, a, b]);
  return res.json(result.rows);
};