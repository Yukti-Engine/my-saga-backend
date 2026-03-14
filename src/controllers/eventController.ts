import type { Request, Response } from "express";
import pool from "../db.js";

export const setAttendance = async (req: Request, res: Response) => {
  const { oid, accessToken, eventId, attendance } = req.body;
  const authResult = await pool.query(`SELECT authenticate($1::int, $2::text, $3::text) AS is_authenticated`, [oid, "organizer", accessToken]);
  if (!authResult.rows[0].is_authenticated)
    return res.status(500).json({ error: "Authentication Error" });

  const adventureRes = await pool.query(`SELECT get_adventure_of($1::int) AS adventure_id`, [eventId]);
  const adventureId = adventureRes.rows[0].adventure_id;

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const result = await pool.query(`SELECT * FROM change_attendance($1::int, $2::int[])`, [eventId, attendance]);
  return res.json(result.rows[0]);
};
