import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { validateUsername, validateBio, validateEmail, validateBoolean, validatePositiveInt, validateBoundedText, validateIntRange } from "../validators.js";
import { generateChapterConclusion, generateProceedChunk, generateIntroduction, generateChapterOpening, type EventSummary, type Theme } from "../services/llmService.js";

export const updateUserProfile = async (req: Request, res: Response) => {
  const { uid, updates } = req.body;
  if (!updates || typeof updates !== "object")
    return res.status(400).json({ error: "Missing updates" });

  let username: string | null = null;
  if (updates.username !== undefined) {
    const v = validateUsername(updates.username);
    if (!v.ok) return res.status(400).json({ error: v.error });
    username = v.value;
  }

  let bio: string | null = null;
  if (updates.bio !== undefined) {
    const v = validateBio(updates.bio);
    if (!v.ok) return res.status(400).json({ error: v.error });
    bio = v.value;
  }

  let email: string | null = null;
  if (updates.email !== undefined) {
    const v = validateEmail(updates.email, false);
    if (!v.ok) return res.status(400).json({ error: v.error });
    email = v.value;
  }

  let setting1: boolean | null = null;
  if (updates.setting1 !== undefined) {
    const v = validateBoolean(updates.setting1, "setting1");
    if (!v.ok) return res.status(400).json({ error: v.error });
    setting1 = v.value;
  }

  let setting2: boolean | null = null;
  if (updates.setting2 !== undefined) {
    const v = validateBoolean(updates.setting2, "setting2");
    if (!v.ok) return res.status(400).json({ error: v.error });
    setting2 = v.value;
  }

  let newIconKey: string | null = null;
  let oldIconKey: string | null = null;
  if (updates.icon) {
    // Upload new icon first; the old key is kept so it can be deleted after a successful DB update
    const { rows } = await pool.query(`SELECT get_user_icon_key($1::int) AS icon_key`, [uid]);
    oldIconKey = rows[0]?.icon_key ?? null;
    newIconKey = randomBytes(16).toString("hex");
    await uploadProfileIcon(updates.icon, "user", newIconKey);
  }

  try {
    const updated = await pool.query(
      `SELECT update_user($1::int, $2::text, $3::text, $4::text, $5::boolean, $6::boolean, $7::text)`,
      [uid, username, bio, email, setting1, setting2, newIconKey]
    );
    // Fire-and-forget old icon deletion — storage cleanup failures are non-fatal
    if (oldIconKey && oldIconKey !== newIconKey) {
      deleteProfileIcon("user", oldIconKey).catch((e) => console.error("deleteProfileIcon failed:", e));
    }
    return res.json(updated.rows[0]);
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "Username already taken" });
    throw err;
  }
};

export const getUserQualifications = async (req: Request, res: Response) => {
  const { uid } = req.body;


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge`, [uid, "user"]);

  return res.json(rows);
};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1::int)`, [uid]);
  const user = rows[0];
  return res.json({
    id: user.id, username: user.username, email: user.email,
    level: user.level, penalties: user.penalties,
    intellect_index: user.intellect_index, drive_index: user.drive_index,
    adaptability_index: user.adaptability_index,
    empathy_index: user.empathy_index, creativity_index: user.creativity_index,
    bio: user.bio, age: calculateAge(user.dob), gender: user.gender,
    setting_1: user.setting_1, setting_2: user.setting_2,
    icon_key: user.icon_key ?? null
  });
};

export const getAdventures = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { uid, a, b } = req.body;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [uid, "user", a, b]);
  return res.json(result.rows);
};

export const joinAdventure = async (req: Request, res: Response) => {
  const { uid,  matchRequest, ageRangeMin, ageRangeMax } = req.body;

  if (!Number.isInteger(ageRangeMin) || !Number.isInteger(ageRangeMax)
      || ageRangeMin < 18 || ageRangeMax > 100 || ageRangeMin > ageRangeMax)
    return res.status(400).json({ error: "Invalid age range" });

  const existing = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [uid, "user"]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Already in an active lobby" });

  const taxRate = parseFloat(process.env.PLATFORM_TAX_RATE || "0");
  const costRupees = matchRequest.pay_per_head * 1.25 + 200
                   + taxRate * matchRequest.pay_per_head * 0.25;
  const costPaise = Math.round(costRupees * 100);

  const walletRow = await pool.query(
    `SELECT ensure_wallet($1::int) AS balance`, [uid]
  );
  const balance = Number(walletRow.rows[0].balance);
  if (balance < costPaise)
    return res.status(402).json({ error: "Insufficient wallet balance", required: costPaise, balance });

  await pool.query(`SELECT debit_wallet($1::int, $2::bigint)`, [uid, costPaise]);
  await pool.query(
    `INSERT INTO wallet_transactions (user_id, type, amount_paise, match_request_id, status)
     VALUES ($1, 'lobby_debit', $2, $3, 'success')`,
    [uid, costPaise, matchRequest.id]
  );

  try {
    const matched = await pool.query(
      `SELECT match_request($1::int, $2::text, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::int, $10::int, $11::int, $12::float8, $13::boolean, $14::boolean) AS result`,
      [uid, "user", ageRangeMin, ageRangeMax,
       matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
       matchRequest.space_id, matchRequest.age_range_min, matchRequest.age_range_max,
       matchRequest.pay_per_head, matchRequest.all_girls, matchRequest.half_girls]
    );
    const result = matched.rows[0].result;
    if (result.success)
      return res.json({ success: true, costPaise });

    await pool.query(`SELECT credit_wallet($1::int, $2::bigint)`, [uid, costPaise]);
    await pool.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_paise, match_request_id, status)
       VALUES ($1, 'lobby_refund', $2, $3, 'success')`,
      [uid, costPaise, matchRequest.id]
    );
    return res.json({ success: false, message: "Lobby changed, wallet refunded" });
  } catch (err: any) {
    await pool.query(`SELECT credit_wallet($1::int, $2::bigint)`, [uid, costPaise]);
    await pool.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_paise, match_request_id, status)
       VALUES ($1, 'lobby_refund', $2, $3, 'success')`,
      [uid, costPaise, matchRequest.id]
    );
    throw err;
  }
};

export const logOut = async (req: Request, res: Response) => {
  const { uid, } = req.body;

  const result = await pool.query(`SELECT * FROM logout($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { uid, } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [uid, "user"]);
  return res.json(result.rows);
};


export const getThemes = async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT * FROM get_all_themes()`);
  return res.json(rows);
};

export const getBook = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const book = await getBookForUser(uid);
  if (!book) return res.status(404).json({ error: "no book found" });

  const { rows: rawChunks } = await pool.query(
    `SELECT id, chapter, seq, kind, content, event_id, created_at
     FROM story_chunks WHERE book_id = $1 ORDER BY chapter ASC, seq ASC`,
    [book.id]
  );

  const chunks = rawChunks.map((c: any) => ({
    id: c.id,
    chapter: c.chapter,
    seq: c.seq,
    kind: c.kind,
    content: c.content ?? "",
    event_ids: c.event_id != null ? [c.event_id] : [],
    created_at: c.created_at,
  }));

  return res.json({
    id: book.id,
    title: book.title,
    chapter: book.chapter,
    theme: { name: book.theme_name, description: book.theme_description ?? "" },
    chunks,
  });
};

export const rateOrganizer = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const organizerIdV = validatePositiveInt(req.body.organizerId, "organizerId");
  if (!organizerIdV.ok) return res.status(400).json({ error: organizerIdV.error });
  const ratingV = validateIntRange(req.body.rating, "rating", 1, 5);
  if (!ratingV.ok) return res.status(400).json({ error: ratingV.error });

  await pool.query(
    `SELECT upsert_rating($1::int, $2::int, $3::int)`,
    [organizerIdV.value, uid, ratingV.value]
  );
  return res.json({ success: true });
};

export const reportOrganizer = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const targetV = validatePositiveInt(req.body.organizerId, "organizerId");
  if (!targetV.ok) return res.status(400).json({ error: targetV.error });
  const reasonV = validateBoundedText(req.body.reason, "reason", 20, 1000, { allowNewlines: true });
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });

  const inserted = await pool.query(
    `SELECT create_ticket('report_organizer', $1::jsonb) AS id`,
    [JSON.stringify({ reporterId: uid, reporterRole: "user", organizerId: targetV.value, reason: reasonV.value })]
  );
  return res.json({ ticketId: inserted.rows[0].id });
};

export const acceptLegal = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { acceptTerms, acceptPrivacy } = req.body;
  if (acceptTerms !== undefined && typeof acceptTerms !== "boolean")
    return res.status(400).json({ error: "acceptTerms must be a boolean" });
  if (acceptPrivacy !== undefined && typeof acceptPrivacy !== "boolean")
    return res.status(400).json({ error: "acceptPrivacy must be a boolean" });

  const { fetchLegalVersions } = await import("../legalVersions.js");
  const { terms_version, privacy_version } = await fetchLegalVersions("user");
  if (!acceptTerms && !acceptPrivacy)
    return res.status(400).json({ error: "Provide acceptTerms and/or acceptPrivacy as true" });

  await pool.query(
    `SELECT accept_legal_user($1::int, $2::boolean, $3::boolean, $4::int, $5::int)`,
    [uid, acceptTerms === true, acceptPrivacy === true, terms_version, privacy_version]
  );
  return res.json({ success: true });
};

export const myBadges = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const { rows } = await pool.query(
    `SELECT * FROM get_ob_assertions_by_user($1::int)`,
    [uid]
  );
  return res.json(
    rows.map((a) => ({
      assertionId: a.id,
      badgeId: a.badge_id,
      adventureId: a.adventure_id,
      issuedOn: a.issued_on,
      verificationUrl: `https://api.mysaga.in/ob/assertions/${a.id}`,
      credentialJson: a.credential_json,
    }))
  );
};

// Sentinel summary text used by auto-summarization (scheduler / inline 24h fallback).
// Lets us tell guide-summarized "absent" from scheduler-summarized "absent" so we
// only penalize drive when the guide actively marked the user absent.
export const AUTO_SUMMARY_TEXT = "Event auto-closed (guide did not summarize within 24 hours)";

// ── Book helpers ──────────────────────────────────────────────────────────────

async function getBookForUser(uid: number) {
  const { rows } = await pool.query<{
    id: number; chapter: number; title: string;
    theme_name: string; theme_description: string | null;
  }>(
    `SELECT b.id, b.chapter, b.title,
            t.name::text        AS theme_name,
            t.description::text AS theme_description
     FROM books b
     LEFT JOIN themes t ON t.id = b.theme_id
     WHERE b.user_id = $1`,
    [uid]
  );
  return rows[0] ?? null;
}


async function getPriorStory(bookId: number): Promise<string> {
  const { rows } = await pool.query<{ content: string }>(
    `SELECT content FROM story_chunks WHERE book_id = $1 ORDER BY chapter ASC, seq ASC`,
    [bookId]
  );
  return rows.map((r) => r.content).join("\n\n");
}

async function getNextSeq(bookId: number, chapter: number): Promise<number> {
  const { rows } = await pool.query<{ next_seq: number }>(
    `SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq
     FROM story_chunks WHERE book_id = $1 AND chapter = $2`,
    [bookId, chapter]
  );
  return rows[0]!.next_seq;
}

async function buildEventSummary(eventId: number, uid: number): Promise<EventSummary | null> {
  const { rows } = await pool.query<{
    activity: string; summary: string | null; adventure_name: string;
    organizer_id: number; boss_id: number | null; user_ids: number[];
    attendance: number[] | null; stat_deltas: string[] | null; timing: Date | null;
  }>(
    `SELECT e.activity, e.summary, a.name AS adventure_name,
            a.organizer_id, a.boss_id, a.user_ids,
            e.attendance, e.stat_deltas, s.datetime AS timing
     FROM events e
     JOIN adventures a ON a.id = e.adventure_id
     LEFT JOIN slots s ON s.id = e.slot_id
     WHERE e.id = $1`,
    [eventId]
  );
  if (rows.length === 0) return null;
  const event = rows[0]!;

  // Attended unless: auto-closed event, OR guide marked the user absent (delta == "0000-")
  const autoSummarized = event.summary === AUTO_SUMMARY_TEXT;
  const idx = event.attendance?.indexOf(uid) ?? -1;
  const userDelta = idx >= 0 ? (event.stat_deltas?.[idx] ?? null) : null;
  const attended = !autoSummarized && idx >= 0 && userDelta !== "0000-";

  return {
    activity: event.activity,
    timing: event.timing ? new Date(event.timing) : new Date(),
    adventureName: event.adventure_name,
    guideId: event.organizer_id,
    expertId: event.boss_id,
    otherUserIds: event.user_ids.filter((id) => id !== uid),
    chatExcerpt: event.summary === AUTO_SUMMARY_TEXT ? null : (event.summary ?? null),
    attended,
  };
}


// ── Book routes ───────────────────────────────────────────────────────────────

export const startBook = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const themeIdV = validatePositiveInt(req.body.themeId, "themeId");
  if (!themeIdV.ok) return res.status(400).json({ error: themeIdV.error });

  if (typeof req.body.username !== "string" || req.body.username.trim().length === 0)
    return res.status(400).json({ error: "username is required" });
  const username: string = req.body.username.trim();

  const existing = await pool.query(`SELECT id FROM books WHERE user_id = $1`, [uid]);
  if (existing.rows.length > 0)
    return res.status(409).json({ error: "Book already exists" });

  const themeRow = await pool.query<{ name: string; description: string | null }>(
    `SELECT name::text, description::text FROM themes WHERE id = $1`, [themeIdV.value]
  );
  if (themeRow.rows.length === 0) return res.status(404).json({ error: "Theme not found" });
  const theme: Theme = { name: themeRow.rows[0]!.name, description: themeRow.rows[0]!.description };

  // books.title is varchar(40); truncate if username makes it longer
  const bookTitle = `The tales of ${username}`.substring(0, 40);

  const bookInsert = await pool.query<{ id: number }>(
    `INSERT INTO books (title, user_id, theme_id, chapter) VALUES ($1, $2, $3, 0) RETURNING id`,
    [bookTitle, uid, themeIdV.value]
  );
  const bookId = bookInsert.rows[0]!.id;

  try {
    const introText = await generateIntroduction(uid, bookTitle, theme);
    if (!introText) throw new Error("generateIntroduction returned null");

    await pool.query(
      `INSERT INTO story_chunks (book_id, chapter, seq, kind, content) VALUES ($1, 0, 1, 'open', $2)`,
      [bookId, introText]
    );

    const conclusionText = await generateChapterConclusion({
      uid, bookTitle, chapter: 0, priorStory: introText, theme
    });
    if (!conclusionText) throw new Error("generateChapterConclusion returned null");

    await pool.query(
      `INSERT INTO story_chunks (book_id, chapter, seq, kind, content) VALUES ($1, 0, 2, 'conclusion', $2)`,
      [bookId, conclusionText]
    );

    const ch1Opening = await generateChapterOpening({
      uid, bookTitle, chapter: 1, previousConclusion: conclusionText, theme
    });
    if (!ch1Opening) throw new Error("generateChapterOpening returned null");

    await pool.query(
      `INSERT INTO story_chunks (book_id, chapter, seq, kind, content) VALUES ($1, 1, 1, 'open', $2)`,
      [bookId, ch1Opening]
    );

    await pool.query(`UPDATE books SET chapter = 1 WHERE id = $1`, [bookId]);
    return res.json({ success: true, bookId, introduction: introText, chapter1Opening: ch1Opening });
  } catch (err) {
    await pool.query(`DELETE FROM books WHERE id = $1`, [bookId]);
    console.error("startBook generation failed:", err);
    return res.status(500).json({ error: "Failed to generate introduction" });
  }
};

export const renameBook = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const titleV = validateBoundedText(req.body.title, "title", 1, 20);
  if (!titleV.ok) return res.status(400).json({ error: titleV.error });

  const { rows } = await pool.query<{ id: number }>(
    `UPDATE books SET title = $1 WHERE user_id = $2 RETURNING id`,
    [titleV.value, uid]
  );
  if (rows.length === 0) return res.status(404).json({ error: "No book found" });
  return res.json({ success: true });
};

export const proceedStory = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const book = await getBookForUser(uid);
  if (!book) return res.status(404).json({ error: "No book found" });
  const theme: Theme = { name: book.theme_name, description: book.theme_description };

  // Find the oldest event for this user that hasn't been turned into a story chunk yet
  const { rows: eventRows } = await pool.query<{
    id: number; summarized: boolean; summary: string | null;
    attendance: number[] | null; stat_deltas: string[] | null;
    user_ids: number[]; slot_end: Date | null;
  }>(
    `SELECT e.id, e.summarized, e.summary, e.attendance, e.stat_deltas,
            a.user_ids,
            (s.datetime + s.duration * interval '1 hour') AS slot_end
     FROM events e
     JOIN adventures a ON a.id = e.adventure_id
     LEFT JOIN slots s ON s.id = e.slot_id
     WHERE $1 = ANY(a.user_ids)
       AND NOT EXISTS (
         SELECT 1 FROM story_chunks sc
         WHERE sc.book_id = $2 AND sc.event_id = e.id
       )
     ORDER BY e.id ASC
     LIMIT 1`,
    [uid, book.id]
  );

  if (eventRows.length === 0)
    return res.status(409).json({ error: "No pending events to process" });

  const ev = eventRows[0]!;

  // If not summarized: wait for guide, unless 24h have passed (then auto-close)
  if (!ev.summarized) {
    const endTime = ev.slot_end ? ev.slot_end.getTime() : 0;
    const hoursSinceEnd = (Date.now() - endTime) / (1000 * 60 * 60);
    if (hoursSinceEnd < 24)
      return res.status(202).json({ error: "Event not yet summarized by the guide" });

    // 24h+ passed — auto-close: pass every adventure member with "00000" (no stat change).
    // summarize_event doesn't accept empty arrays.
    const allUserIds = ev.user_ids ?? [];
    const autoDeltas = allUserIds.map(() => "00000");
    await pool.query(
      `SELECT summarize_event($1::int, $2::int[], $3::varchar(5)[], $4::text)`,
      [ev.id, allUserIds, autoDeltas, AUTO_SUMMARY_TEXT]
    );
    ev.summarized = true;
    ev.summary = AUTO_SUMMARY_TEXT;
    ev.attendance = allUserIds;
    ev.stat_deltas = autoDeltas;
  }

  // Everyone in the adventure is now in ev.attendance (either guide-marked attended,
  // guide-marked absent via "0000-" appended in /event/summarize, or auto-closed "00000").
  // summarize_event has already applied the deltas to user stats. Just read this user's.
  const idx = ev.attendance?.indexOf(uid) ?? -1;
  const delta = idx >= 0 ? (ev.stat_deltas?.[idx] ?? "00000") : "00000";
  // Stat positions: 0=intellect, 1=adaptability, 2=empathy, 3=creativity, 4=drive
  const sign = (c: string) => (c === "+" ? 1 : c === "-" ? -1 : 0);
  const statChanges = {
    intellect:    sign(delta[0]!),
    adaptability: sign(delta[1]!),
    empathy:      sign(delta[2]!),
    creativity:   sign(delta[3]!),
    drive:        sign(delta[4]!),
  };

  const eventId = ev.id;
  const eventSummary = await buildEventSummary(eventId, uid);
  if (!eventSummary) return res.status(500).json({ error: "Event data not found" });

  const [priorStory, nextSeq] = await Promise.all([
    getPriorStory(book.id),
    getNextSeq(book.id, book.chapter),
  ]);

  const rawText = await generateProceedChunk({
    uid, bookTitle: book.title, chapter: book.chapter,
    priorStory, events: [eventSummary], theme,
  });
  if (!rawText) return res.status(500).json({ error: "Failed to generate story chunk" });

  const content = rawText.trim();

  await pool.query(
    `INSERT INTO story_chunks (book_id, chapter, seq, kind, content, event_id)
     VALUES ($1, $2, $3, 'proceed', $4, $5)`,
    [book.id, book.chapter, nextSeq, content, eventId]
  );

  return res.json({ success: true, chapter: book.chapter, seq: nextSeq, content, statChanges });
};

export const concludeChapter = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const book = await getBookForUser(uid);
  if (!book) return res.status(404).json({ error: "No book found" });
  const theme: Theme = { name: book.theme_name, description: book.theme_description };

  // Only allowed after at least one proceed chunk in the current chapter
  const { rows: proceedRows } = await pool.query(
    `SELECT 1 FROM story_chunks
     WHERE book_id = $1 AND chapter = $2 AND kind = 'proceed'
     LIMIT 1`,
    [book.id, book.chapter]
  );
  if (proceedRows.length === 0)
    return res.status(409).json({ error: "No proceed chunk in current chapter; write a proceed first" });

  const [priorStory, conclusionSeq] = await Promise.all([
    getPriorStory(book.id),
    getNextSeq(book.id, book.chapter),
  ]);

  const conclusionText = await generateChapterConclusion({
    uid, bookTitle: book.title, chapter: book.chapter, priorStory, theme,
  });
  if (!conclusionText) return res.status(500).json({ error: "Failed to generate chapter conclusion" });

  await pool.query(
    `INSERT INTO story_chunks (book_id, chapter, seq, kind, content)
     VALUES ($1, $2, $3, 'conclusion', $4)`,
    [book.id, book.chapter, conclusionSeq, conclusionText]
  );

  const nextChapter = book.chapter + 1;

  const openingText = await generateChapterOpening({
    uid, bookTitle: book.title, chapter: nextChapter,
    previousConclusion: conclusionText, theme,
  });
  if (!openingText) return res.status(500).json({ error: "Failed to generate next chapter opening" });

  await pool.query(
    `INSERT INTO story_chunks (book_id, chapter, seq, kind, content) VALUES ($1, $2, 1, 'open', $3)`,
    [book.id, nextChapter, openingText]
  );

  await pool.query(`UPDATE books SET chapter = $1 WHERE id = $2`, [nextChapter, book.id]);

  return res.json({ success: true, concludedChapter: book.chapter, nextChapter, conclusion: conclusionText, opening: openingText });
};

export const regenerateStory = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const COST_PAISE = 700;

  const book = await getBookForUser(uid);
  if (!book) return res.status(404).json({ error: "No book found" });
  const theme: Theme = { name: book.theme_name, description: book.theme_description };

  const walletRow = await pool.query(`SELECT ensure_wallet($1::int) AS balance`, [uid]);
  const balance = Number(walletRow.rows[0].balance);
  if (balance < COST_PAISE)
    return res.status(402).json({ error: "Insufficient wallet balance", required: COST_PAISE, balance });

  const { rows: lastRows } = await pool.query<{
    id: number; chapter: number; seq: number; kind: string; event_id: number | null;
  }>(
    `SELECT id, chapter, seq, kind, event_id FROM story_chunks
     WHERE book_id = $1 ORDER BY chapter DESC, seq DESC LIMIT 1`,
    [book.id]
  );
  if (lastRows.length === 0) return res.status(404).json({ error: "No chunks to regenerate" });
  const last = lastRows[0]!;

  await pool.query(`SELECT debit_wallet($1::int, $2::bigint)`, [uid, COST_PAISE]);


  // Build prior story excluding the last chunk so context is correct for regeneration
  const { rows: priorRows } = await pool.query<{ content: string }>(
    `SELECT content FROM story_chunks
     WHERE book_id = $1 AND (chapter < $2 OR (chapter = $2 AND seq < $3))
     ORDER BY chapter ASC, seq ASC`,
    [book.id, last.chapter, last.seq]
  );
  const priorStory = priorRows.map((r) => r.content).join("\n\n");

  let newContent: string | null = null;

  if (last.kind === "open") {
    if (last.chapter === 0) {
      newContent = await generateIntroduction(uid, book.title, theme);
    } else {
      const { rows: prevCRows } = await pool.query<{ content: string }>(
        `SELECT content FROM story_chunks
         WHERE book_id = $1 AND chapter = $2 AND kind = 'conclusion'
         ORDER BY seq DESC LIMIT 1`,
        [book.id, last.chapter - 1]
      );
      const previousConclusion = prevCRows[0]?.content ?? priorStory;
      newContent = await generateChapterOpening({
        uid, bookTitle: book.title, chapter: last.chapter,
        previousConclusion, theme,
      });
    }
  } else if (last.kind === "conclusion") {
    newContent = await generateChapterConclusion({
      uid, bookTitle: book.title, chapter: last.chapter, priorStory, theme,
    });
  } else if (last.kind === "proceed" && last.event_id != null) {
    const eventSummary = await buildEventSummary(last.event_id, uid);
    if (!eventSummary) {
      await pool.query(`SELECT credit_wallet($1::int, $2::bigint)`, [uid, COST_PAISE]);
      return res.status(500).json({ error: "Event data not found for regeneration" });
    }
    const rawText = await generateProceedChunk({
      uid, bookTitle: book.title, chapter: last.chapter,
      priorStory, events: [eventSummary], theme,
    });
    if (rawText) newContent = rawText.trim();
  }

  if (!newContent) {
    await pool.query(`SELECT credit_wallet($1::int, $2::bigint)`, [uid, COST_PAISE]);
    return res.status(500).json({ error: "Failed to regenerate chunk" });
  }

  // Only swap after successful generation
  await pool.query(`DELETE FROM story_chunks WHERE id = $1`, [last.id]);

  if (last.kind === "proceed" && last.event_id != null) {
    await pool.query(
      `INSERT INTO story_chunks (book_id, chapter, seq, kind, content, event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [book.id, last.chapter, last.seq, last.kind, newContent, last.event_id]
    );
  } else {
    await pool.query(
      `INSERT INTO story_chunks (book_id, chapter, seq, kind, content)
       VALUES ($1, $2, $3, $4, $5)`,
      [book.id, last.chapter, last.seq, last.kind, newContent]
    );
  }

  return res.json({ success: true, content: newContent });
};
