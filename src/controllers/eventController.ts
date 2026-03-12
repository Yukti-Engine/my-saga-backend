import type { Request, Response } from "express";
import pool from "../db.js";

export const setAttendance = async (req: Request, res: Response) => {
  const { oid, accessToken, eventId, attendance } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const adventureRes = await pool.query(`SELECT get_adventure_of($1) AS adventure_id`, [eventId]);
  const adventureId = adventureRes.rows[0].adventure_id;

  const check = await pool.query(
    `SELECT is_related_to_adventure($1, 'organizer', $2) AS ok`,
    [oid, adventureId]
  );
  if (!check.rows[0].ok)
    return res.json({ success: false });

  const result = await pool.query(`SELECT * FROM change_attendance($1, $2)`, [eventId, attendance]);
  return res.json(result.rows[0]);
};
