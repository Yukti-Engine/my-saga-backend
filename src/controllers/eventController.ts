import type { Request, Response } from "express";
import pool from "../db.js";
import { validatePositiveInt } from "../validators.js";

export const setAttendance = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const eventV = validatePositiveInt(req.body.eventId, "eventId");
  if (!eventV.ok) return res.status(400).json({ error: eventV.error });
  const { attendance } = req.body;
  if (!Array.isArray(attendance) || attendance.length === 0 || attendance.length > 50)
    return res.status(400).json({ error: "attendance must be a non-empty array (max 50)" });
  for (const uid of attendance) {
    if (!Number.isInteger(uid) || uid <= 0)
      return res.status(400).json({ error: "attendance must contain positive integers" });
  }

  const adventureRes = await pool.query(`SELECT get_adventure_of($1::int) AS adventure_id`, [eventV.value]);
  const adventureId = adventureRes.rows[0].adventure_id;

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, adventureId]
  );
  if (!check.rows[0].ok)
    return res.status(403).json({ success: false });

  const result = await pool.query(`SELECT * FROM change_attendance($1::int, $2::int[])`, [eventV.value, attendance]);
  return res.json(result.rows[0]);
};
