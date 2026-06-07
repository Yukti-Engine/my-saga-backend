import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import pool from "../db.js";
import { validatePositiveInt } from "../validators.js";
import { issueOpenBadge } from "../services/openBadgesService.js";

// Sentinel an organizer embeds in the event description (activity) to mark the
// last event of an adventure. Only such an event can be converted to a challenge.
const FINAL_EVENT_MARKER = "(Final Event)";

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

  if (typeof summary !== "string" || summary.trim().length === 0)
    return res.status(400).json({ error: "summary is required" });

  // Fetch event + adventure + badge info in one shot
  const eventRes = await pool.query<{
    adventure_id: number; user_ids: number[]; is_challenge: boolean;
    badge_id: number | null; league: number | null;
    badge_title: string | null; badge_description: string | null;
  }>(
    `SELECT a.id AS adventure_id, a.user_ids, e.is_challenge,
            a.badge_id, b.league,
            b.title::text  AS badge_title,
            b.description::text AS badge_description
     FROM events e
     JOIN adventures a ON a.id = e.adventure_id
     LEFT JOIN badges b ON b.id = a.badge_id
     WHERE e.id = $1`,
    [eventV.value]
  );
  const ev = eventRes.rows[0];
  if (!ev) return res.status(404).json({ error: "Event not found" });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
    [oid, ev.adventure_id]
  );
  if (!check.rows[0].ok) return res.status(403).json({ error: "Forbidden" });

  // Validate stats_delta — format depends on whether this is a challenge event
  if (ev.is_challenge) {
    // Challenge: 5-char score, leading underscores pad to width 5, trailing digits 0-100
    // e.g. "____0" = 0, "___77" = 77, "__100" = 100
    for (const s of statsDelta) {
      if (typeof s !== "string" || s.length !== 5 || !/^_{2,4}\d{1,3}$/.test(s))
        return res.status(400).json({ error: "each challenge statsDelta entry must be 5 chars: leading '_' padding then digits (e.g. \"____0\", \"___77\", \"__100\")" });
      const n = parseInt(s.replace(/^_+/, ""), 10);
      if (Number.isNaN(n) || n < 0 || n > 100)
        return res.status(400).json({ error: "challenge statsDelta value must be 0-100" });
    }
  } else {
    // Regular: 5 chars of +/-/0
    for (const s of statsDelta) {
      if (typeof s !== "string" || s.length !== 5 || !/^[+\-0]{5}$/.test(s))
        return res.status(400).json({ error: "each statsDelta entry must be exactly 5 characters of '+', '-', or '0'" });
    }
  }

  // Auto-append users the guide omitted from attendance.
  // Regular event: "0000-" (drive -1% penalty). Challenge event: "____0" (zero score).
  const attendedSet = new Set<number>(attendance);
  const absentIds = (ev.user_ids ?? []).filter((id) => !attendedSet.has(id));
  const absentDelta = ev.is_challenge ? "____0" : "0000-";
  const fullAttendance = [...attendance, ...absentIds];
  const fullDeltas = [...statsDelta, ...absentIds.map(() => absentDelta)];

  try {
    await pool.query(
      `SELECT summarize_event($1::int, $2::int[], $3::varchar(5)[], $4::text)`,
      [eventV.value, fullAttendance, fullDeltas, summary.trim()]
    );

    // Challenge events: per-user level boost + badge grant for qualifying scores
    if (ev.is_challenge) {
      // Parse padded scores for users the boss actually scored (skip auto-appended absentees;
      // their score is 0 so the boost would be 0 anyway).
      const scored: { uid: number; score: number }[] = [];
      for (let i = 0; i < attendance.length; i++) {
        const uid = attendance[i] as number;
        const score = parseInt((statsDelta[i] as string).replace(/^_+/, ""), 10);
        if (!Number.isNaN(score)) scored.push({ uid, score });
      }

      // Level boost: every attended user gets level += score/100 (a 100 score = +1 level, a 50 = +0.5)
      if (scored.length > 0) {
        const ids = scored.map((s) => s.uid);
        const boosts = scored.map((s) => s.score / 100);
        await pool.query(
          `UPDATE users
              SET level = level + b.boost
             FROM unnest($1::int[], $2::float8[]) AS b(uid, boost)
            WHERE users.id = b.uid`,
          [ids, boosts]
        );
      }

      // Badge issuance — users whose score beats 100 - league.
      // Blocking so the boss app knows whether badges were actually issued.
      if (ev.badge_id != null && ev.league != null && ev.badge_title) {
        const threshold = 100 - ev.league;
        const winners = scored.filter((s) => s.score > threshold);
        try {
          const issued = await issueBadgeForWinners(
            winners, ev.adventure_id, ev.badge_id, ev.badge_title, ev.badge_description ?? "", new Date()
          );
          return res.json({ success: true, badgesIssued: issued });
        } catch (e) {
          console.error("issueBadgeForWinners failed:", e);
          return res.status(500).json({ error: "Event summarized but badge issuance failed", detail: (e as Error).message });
        }
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    if (typeof err.message === "string" && err.message.includes("already summarized"))
      return res.status(409).json({ error: "Event already summarized" });
    console.error("Error in summarizeEvent:", err);
    return res.status(500).json({ error: "Failed to summarize event" });
  }
};

/** Boss flips an event's is_challenge flag to TRUE. Only allowed if:
 *   - boss is related to the adventure
 *   - event.activity contains "(Final Event)" (organizer designation)
 *   - event has not been summarized yet
 *   - event is not already a challenge
 */
export const markChallenge = async (req: Request, res: Response) => {
  const { bid } = req.body;
  const eventV = validatePositiveInt(req.body.eventId, "eventId");
  if (!eventV.ok) return res.status(400).json({ error: eventV.error });

  const { rows } = await pool.query<{
    adventure_id: number; activity: string;
    is_challenge: boolean; summarized: boolean;
  }>(
    `SELECT e.adventure_id, e.activity, e.is_challenge, e.summarized
     FROM events e WHERE e.id = $1`,
    [eventV.value]
  );
  const ev = rows[0];
  if (!ev) return res.status(404).json({ error: "Event not found" });

  if (ev.is_challenge) return res.status(409).json({ error: "Event is already a challenge" });
  if (ev.summarized) return res.status(409).json({ error: "Event already summarized" });
  if (!(ev.activity ?? "").includes(FINAL_EVENT_MARKER))
    return res.status(400).json({
      error: `Event is not marked as final by the organizer (description must contain ${FINAL_EVENT_MARKER})`,
    });

  const check = await pool.query(
    `SELECT is_related_to_adventure($1::int, 'boss', $2::int) AS ok`,
    [bid, ev.adventure_id]
  );
  if (!check.rows[0].ok) return res.status(403).json({ error: "Forbidden" });

  await pool.query(`UPDATE events SET is_challenge = TRUE WHERE id = $1`, [eventV.value]);
  return res.json({ success: true });
};

async function issueBadgeForWinners(
  winners: { uid: number; score: number }[],
  adventureId: number,
  badgeId: number,
  badgeTitle: string,
  badgeDescription: string,
  issuedOn: Date,
): Promise<number> {
  let issued = 0;
  for (const { uid } of winners) {
    // Skip if the user already holds this badge (source of truth: user_qualifications)
    const existing = await pool.query(
      `SELECT 1 FROM user_qualifications WHERE user_id = $1 AND badge_id = $2 LIMIT 1`,
      [uid, badgeId]
    );
    if (existing.rows.length > 0) continue;

    const userEmailRow = await pool.query<{ email: string | null }>(
      `SELECT get_user_email($1::int) AS email`, [uid]
    );
    const email = userEmailRow.rows[0]?.email;
    if (!email) continue;

    const assertionId = randomUUID();
    const signedVC = await issueOpenBadge({
      assertionId,
      recipientEmail: email,
      badgeId,
      badgeName: badgeTitle,
      badgeDescription,
      issuedOn,
    });

    await pool.query(
      `SELECT insert_ob_assertion($1::uuid, $2::int, $3::int, $4::int, $5::jsonb)`,
      [assertionId, uid, badgeId, adventureId, JSON.stringify(signedVC)]
    );
    // Record the earned-badge status alongside the OB credential
    await pool.query(
      `INSERT INTO user_qualifications (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [uid, badgeId]
    );
    issued++;
  }
  return issued;
}
