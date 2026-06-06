import type { Request, Response } from "express";
import pool from "../db.js";
import { validatePositiveInt } from "../validators.js";

export const summarizeEvent = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const eventV = validatePositiveInt(req.body.eventId, "eventId");
  if (!eventV.ok) return res.status(400).json({ error: eventV.error });

  const { attendance, statsDelta, summary } = req.body;

  if (!Array.isArray(attendance) || attendance.length === 0 || attendance.length > 50)
    return res.status(400).json({ error: "attendance must be a non-empty array (max 50)" });
  for (const uid of attendance) {
    if (!Number.isInteger(uid) || uid <= 0)
      return res.status(400).json({ error: "attendance must contain positive integers" });
  }

  if (!Array.isArray(statsDelta) || statsDelta.length !== attendance.length)
    return res.status(400).json({ error: "statsDelta must be an array with the same length as attendance" });
  for (const s of statsDelta) {
    if (typeof s !== "string" || s.length !== 5 || !/^[+\-0]{5}$/.test(s))
      return res.status(400).json({ error: "each statsDelta entry must be exactly 5 characters of '+', '-', or '0'" });
  }

  if (typeof summary !== "string" || summary.trim().length === 0)
    return res.status(400).json({ error: "summary is required" });

  const adventureRes = await pool.query<{ adventure_id: number; user_ids: number[] }>(
    `SELECT a.id AS adventure_id, a.user_ids
     FROM events e JOIN adventures a ON a.id = e.adventure_id
     WHERE e.id = $1`,
    [eventV.value]
  );
  const adv = adventureRes.rows[0];
  if (!adv) return res.status(404).json({ error: "Event not found" });
  const adventureId = adv.adventure_id;

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, adventureId]
  );
  if (!check.rows[0].ok) return res.status(403).json({ error: "Forbidden" });

  // Auto-append users the guide omitted from attendance with "0000-" (drive penalty).
  // Drive sits at the last (index 4) position of the stat delta.
  const attendedSet = new Set<number>(attendance);
  const absentIds = (adv.user_ids ?? []).filter((id) => !attendedSet.has(id));
  const fullAttendance = [...attendance, ...absentIds];
  const fullDeltas = [...statsDelta, ...absentIds.map(() => "0000-")];

  try {
    await pool.query(
      `SELECT summarize_event($1::int, $2::int[], $3::varchar(5)[], $4::text)`,
      [eventV.value, fullAttendance, fullDeltas, summary.trim()]
    );
    return res.json({ success: true });
  } catch (err: any) {
    if (typeof err.message === "string" && err.message.includes("already summarized"))
      return res.status(409).json({ error: "Event already summarized" });
    console.error("Error in summarizeEvent:", err);
    return res.status(500).json({ error: "Failed to summarize event" });
  }
};
