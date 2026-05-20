/**
 * userController.ts
 *
 * Handles all actions available to authenticated My Saga users:
 *   - Profile and settings management (username, bio, email, icon)
 *   - Adventure matching, lobby management, and past adventure retrieval
 *   - The "Book" / story feature: starting, progressing, regenerating, and concluding chapters
 *   - Legal acceptance recording
 *   - Reporting organizers
 */
import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { uploadProfileIcon, deleteProfileIcon } from "../services/bucketService.js";
import { randomBytes } from "crypto";
import { validateUsername, validateBio, validateEmail, validateBoolean, validatePositiveInt, validateBoundedText, validateIntRange } from "../validators.js";
import { generateChapterConclusion, generateProceedChunk, generateIntroduction, generateChapterOpening, type EventSummary, type StatChanges, type Theme } from "../services/llmService.js";

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


  const { rows } = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge_id`, [uid, "user"]);

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

  const matched = await pool.query(
    `SELECT match_request($1::int, $2::text, $3::int, $4::int, $5::int, $6::int, $7::int, $8::int, $9::int, $10::int, $11::int, $12::float8, $13::boolean, $14::boolean) AS result`,
    [uid, "user", ageRangeMin, ageRangeMax,
     matchRequest.id, matchRequest.boss_id, matchRequest.org_id, matchRequest.category_id,
     matchRequest.space_id, matchRequest.age_range_min, matchRequest.age_range_max,
     matchRequest.pay_per_head, matchRequest.all_girls, matchRequest.half_girls]
  );
  const result = matched.rows[0].result;
  if (result.success)
    return res.json({ success: true });
  return res.json({ success: false, message: "Error" });
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

export const startBook = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const usernameV = validateUsername(req.body.username);
  if (!usernameV.ok) return res.status(400).json({ error: usernameV.error });
  const themeIdV = validatePositiveInt(req.body.themeId, "themeId");
  if (!themeIdV.ok) return res.status(400).json({ error: themeIdV.error });

  const existing = await pool.query(`SELECT get_user_book_id($1::int) AS id`, [uid]);
  if (existing.rows[0]?.id != null)
    return res.status(409).json({ error: "book already started" });

  const themeRow = await pool.query(`SELECT * FROM get_theme($1::int)`, [themeIdV.value]);
  if (themeRow.rows.length === 0)
    return res.status(400).json({ error: "invalid themeId" });
  const theme: Theme = themeRow.rows[0];

  try {
    const userRow = await pool.query(`SELECT get_user_name($1::int) AS name`, [uid]);
    const title = (userRow.rows[0]?.name as string ?? "my saga").slice(0, 20);

    // Set the username before creating the book so the intro generation can use it
    await pool.query(`SELECT update_user($1::int, $2::text, NULL::text, NULL::text, NULL::boolean, NULL::boolean, NULL::text)`, [uid, usernameV.value]);

    // books.chapter defaults to 0 (introduction chapter)
    const book = await pool.query(
      `SELECT create_book($1::text, $2::int, $3::int) AS id`,
      [title, uid, themeIdV.value]
    );
    const bookId: number = book.rows[0].id;

    // Step 1: Generate the introduction prose (chapter 0, seq 1)
    const introContent = await generateIntroduction(usernameV.value, title, theme);
    if (!introContent) throw new Error("introduction generation failed");

    await pool.query(
      `SELECT add_story_chunk($1, 0, 1, 'open', $2)`,
      [bookId, introContent]
    );

    // Step 2: Write the closing paragraph for the introduction (chapter 0, seq 2)
    const introConclusion = await generateChapterConclusion({
      username: usernameV.value,
      bookTitle: title,
      chapter: 0,
      priorStory: introContent,
      theme,
    });
    if (!introConclusion) throw new Error("introduction conclusion generation failed");

    await pool.query(
      `SELECT add_story_chunk($1, 0, 2, 'open', $2)`,
      [bookId, introConclusion]
    );

    // Advance to chapter 1
    await pool.query(`SELECT update_book_chapter($1, 1)`, [bookId]);

    // Write the base of chapter 1 (seq 1)
    const chapter1Opening = await generateChapterOpening({
      username: usernameV.value,
      bookTitle: title,
      chapter: 1,
      previousConclusion: introConclusion,
      theme,
    });
    if (!chapter1Opening) throw new Error("chapter 1 opening generation failed");

    await pool.query(
      `SELECT add_story_chunk($1, 1, 1, 'open', $2)`,
      [bookId, chapter1Opening]
    );

    return res.json({
      bookId,
      introduction: introContent + "\n\n" + introConclusion,
      chapter1Opening,
    });
  } catch (err: any) {
    if (err.constraint === "unique_username")
      return res.status(409).json({ error: "username already taken" });
    console.error("Error in startBook:", err);
    return res.status(500).json({ error: "failed to start book" });
  }
};

async function fetchEventSummaries(userId: number, eventIds: number[]): Promise<EventSummary[]> {
  if (eventIds.length === 0) return [];
  const { rows } = await pool.query<{
    id: number; activity: string; timing: Date;
    adventure_name: string; guide_username: string; expert_username: string | null;
    other_adventurers: string[] | null; chat_excerpt: string | null;
  }>(
    `SELECT
       e.id,
       e.activity,
       e.timing,
       a.name          AS adventure_name,
       o.username      AS guide_username,
       b.username      AS expert_username,
       (SELECT array_agg(u.username)
        FROM unnest(e.attendance) AS uid
        JOIN users u ON u.id = uid
        WHERE uid <> $1::int
       )               AS other_adventurers,
       (SELECT string_agg(m.sender_type || ': ' || m.message, E'\n' ORDER BY m.created_at ASC)
        FROM (
          SELECT sender_type, message, created_at
          FROM messages
          WHERE adventure_id = e.adventure_id
            AND created_at >= e.timing - interval '3 days'
            AND created_at <= e.timing + interval '1 day'
          ORDER BY created_at DESC
          LIMIT 10
        ) m
       )               AS chat_excerpt
     FROM events e
     JOIN adventures a ON a.id = e.adventure_id
     JOIN organizers o ON o.id = a.organizer_id
     LEFT JOIN bosses b ON b.id = a.boss_id
     WHERE e.id = ANY($2::int[])
     ORDER BY e.timing ASC`,
    [userId, eventIds]
  );
  return rows.map((r) => ({
    activity: r.activity,
    timing: r.timing,
    adventureName: r.adventure_name,
    guideUsername: r.guide_username,
    expertUsername: r.expert_username,
    otherAdventurers: r.other_adventurers ?? [],
    chatExcerpt: r.chat_excerpt ?? null,
  }));
}

async function getPendingEventIds(userId: number, lastEventId: number | null): Promise<number[]> {
  const { rows } = await pool.query<{ id: number }>(
    `SELECT e.id FROM events e
     WHERE $1::int = ANY(e.attendance)
       AND ($2::int IS NULL OR e.id > $2::int)
     ORDER BY e.id ASC
     LIMIT 15`,
    [userId, lastEventId ?? null]
  );
  return rows.map((r) => r.id);
}

async function getFullStory(bookId: number): Promise<string> {
  const { rows } = await pool.query<{ content: string }>(
    `SELECT * FROM get_full_story($1::int)`,
    [bookId]
  );
  return rows.map((r) => r.content).join("\n\n");
}

async function computeHardStats(
  pendingEventIds: number[],
): Promise<{ drive: -1 | 0 | 1; adaptability: -1 | 0 | 1 }> {
  const eventCount = pendingEventIds.length;
  const drive: -1 | 0 | 1 = eventCount >= 3 ? 1 : eventCount === 0 ? -1 : 0;

  let adaptability: -1 | 0 | 1 = 0;
  if (eventCount >= 2) {
    const { rows } = await pool.query<{ cat_count: string }>(
      `SELECT COUNT(DISTINCT a.category_id)::text AS cat_count
       FROM events e
       JOIN adventures a ON a.id = e.adventure_id
       WHERE e.id = ANY($1::int[]) AND a.category_id IS NOT NULL`,
      [pendingEventIds]
    );
    const catCount = parseInt(rows[0]?.cat_count ?? "0");
    adaptability = catCount >= 2 ? 1 : -1;
  }

  return { drive, adaptability };
}

/** Converts a -1/0/+1 direction flag into a 1% multiplier applied to the stat column. */
function statMultiplier(v: -1 | 0 | 1): number {
  return v === 1 ? 1.01 : v === -1 ? 0.99 : 1.0;
}

async function applyStatChanges(userId: number, stats: StatChanges) {
  const { rows } = await pool.query(
    `SELECT * FROM apply_stat_changes($1::int, $2::float8, $3::float8, $4::float8, $5::float8, $6::float8)`,
    [
      userId,
      statMultiplier(stats.intellect),
      statMultiplier(stats.drive),
      statMultiplier(stats.adaptability),
      statMultiplier(stats.empathy),
      statMultiplier(stats.creativity),
    ]
  );
  return rows[0];
}

export const proceedStory = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const bookRow = await pool.query(
    `SELECT * FROM get_book_with_theme($1::int)`,
    [uid]
  );
  if (bookRow.rows.length === 0)
    return res.status(404).json({ error: "no book found — call start-book first" });

  const book = bookRow.rows[0] as { id: number; title: string; chapter: number; last_event_id: number | null; last_penalty_count: number; theme_name: string; theme_description: string | null };
  const theme: Theme = { name: book.theme_name, description: book.theme_description };
  const userRow = await pool.query(`SELECT * FROM get_user_penalties($1::int)`, [uid]);
  const username: string = userRow.rows[0].username;
  const currentPenalties: number = userRow.rows[0].penalties;

  const pendingIds = await getPendingEventIds(uid, book.last_event_id);
  if (pendingIds.length === 0)
    return res.status(400).json({ error: "no new events since your last story entry — complete an adventure event first" });

  const events = await fetchEventSummaries(uid, pendingIds);
  const priorStory = await getFullStory(book.id);

  // Run LLM generation and hard-stat computation in parallel for performance
  const [llmResult, hardStats] = await Promise.all([
    generateProceedChunk({ username, bookTitle: book.title, chapter: book.chapter, priorStory, events, theme }),
    computeHardStats(pendingIds),
  ]);
  if (!llmResult) return res.status(500).json({ error: "story generation failed" });

  // Merge soft stats (from LLM) and hard stats (from event data); hard stats override soft for shared keys
  const stats: StatChanges = { ...llmResult.softStats, ...hardStats };
  const content = llmResult.story;

  const seqRow = await pool.query(
    `SELECT get_next_story_seq($1::int, $2::int) AS next_seq`,
    [book.id, book.chapter]
  );
  const nextSeq: number = seqRow.rows[0].next_seq;
  const maxEventId = pendingIds.length > 0 ? Math.max(...pendingIds) : book.last_event_id;

  await pool.query(
    `SELECT add_story_chunk($1, $2, $3, 'proceed', $4, $5::int[], $6::jsonb)`,
    [book.id, book.chapter, nextSeq, content, pendingIds, JSON.stringify(stats)]
  );
  await pool.query(
    `SELECT update_book_progress($1, $2, $3)`,
    [book.id, maxEventId, currentPenalties]
  );

  const updatedStats = await applyStatChanges(uid, stats);
  return res.json({ content, chapter: book.chapter, seq: nextSeq, statChanges: stats, stats: updatedStats });
};

export const regenerateStory = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const bookRow = await pool.query(
    `SELECT * FROM get_book_with_theme($1::int)`,
    [uid]
  );
  if (bookRow.rows.length === 0)
    return res.status(404).json({ error: "no book found" });

  const book = bookRow.rows[0] as { id: number; title: string; chapter: number; last_penalty_count: number; theme_name: string; theme_description: string | null };
  const theme: Theme = { name: book.theme_name, description: book.theme_description };
  const userRow = await pool.query(`SELECT * FROM get_user_penalties($1::int)`, [uid]);
  const username: string = userRow.rows[0].username;
  const currentPenalties: number = userRow.rows[0].penalties;

  const lastChunk = await pool.query(
    `SELECT * FROM get_last_chunk($1::int)`,
    [book.id]
  );
  if (lastChunk.rows.length === 0)
    return res.status(400).json({ error: "nothing to regenerate yet" });

  const chunk = lastChunk.rows[0] as { id: number; chapter: number; seq: number; kind: string; event_ids: number[] };

  const priorRows = await pool.query(
    `SELECT * FROM get_prior_story($1::int, $2::int, $3::int)`,
    [book.id, chunk.chapter, chunk.seq]
  );
  const prior = priorRows.rows.map((r: { content: string }) => r.content).join("\n\n");

  if (chunk.kind === 'proceed') {
    const events = await fetchEventSummaries(uid, chunk.event_ids);
    const [llmResult, hardStats] = await Promise.all([
      generateProceedChunk({ username, bookTitle: book.title, chapter: chunk.chapter, priorStory: prior, events, theme }),
      computeHardStats(chunk.event_ids),
    ]);
    if (!llmResult) return res.status(500).json({ error: "story generation failed" });
    const stats: StatChanges = { ...llmResult.softStats, ...hardStats };
    await pool.query(
      `SELECT update_story_chunk_with_stats($1::int, $2::text, $3::jsonb)`,
      [chunk.id, llmResult.story, JSON.stringify(stats)]
    );
    const updatedStats = await applyStatChanges(uid, stats);
    return res.json({ content: llmResult.story, chapter: chunk.chapter, seq: chunk.seq, statChanges: stats, stats: updatedStats });
  }

  // For 'open' chunks the regeneration path depends on which chunk it is
  if (chunk.chapter === 0) {
    const content = chunk.seq === 1
      ? await generateIntroduction(username, book.title, theme)
      : await generateChapterConclusion({ username, bookTitle: book.title, chapter: 0, priorStory: prior, theme });
    if (!content) return res.status(500).json({ error: "story generation failed" });
    await pool.query(`SELECT update_story_chunk_content($2::int, $1::text)`, [content, chunk.id]);
    return res.json({ content, chapter: chunk.chapter, seq: chunk.seq });
  }

  if (chunk.seq === 1) {
    const previousConclusion = priorRows.rows[priorRows.rows.length - 1]?.content ?? "";
    const content = await generateChapterOpening({ username, bookTitle: book.title, chapter: chunk.chapter, previousConclusion, theme });
    if (!content) return res.status(500).json({ error: "story generation failed" });
    await pool.query(`SELECT update_story_chunk_content($2::int, $1::text)`, [content, chunk.id]);
    return res.json({ content, chapter: chunk.chapter, seq: chunk.seq });
  }

  // seq > 1, kind='open' → chapter conclusion
  const content = await generateChapterConclusion({ username, bookTitle: book.title, chapter: chunk.chapter, priorStory: prior, theme });
  if (!content) return res.status(500).json({ error: "story generation failed" });
  await pool.query(`SELECT update_story_chunk_content($2::int, $1::text)`, [content, chunk.id]);
  return res.json({ content, chapter: chunk.chapter, seq: chunk.seq });
};

export const concludeChapter = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const bookRow = await pool.query(
    `SELECT * FROM get_book_with_theme($1::int)`,
    [uid]
  );
  if (bookRow.rows.length === 0)
    return res.status(404).json({ error: "no book found" });

  const book = bookRow.rows[0] as { id: number; title: string; chapter: number; theme_name: string; theme_description: string | null };
  const theme: Theme = { name: book.theme_name, description: book.theme_description };

  const lastChunkKind = await pool.query(
    `SELECT get_last_chunk_kind($1::int, $2::int) AS kind`,
    [book.id, book.chapter]
  );
  if (!lastChunkKind.rows[0]?.kind || lastChunkKind.rows[0].kind !== "proceed")
    return res.status(400).json({ error: "write at least one proceed before concluding the chapter" });

  const userRow = await pool.query(`SELECT get_user_name($1::int) AS username`, [uid]);
  const username: string = userRow.rows[0].username;
  const priorStory = await getFullStory(book.id);

  // 1. Conclude the current chapter
  const conclusion = await generateChapterConclusion({
    username,
    bookTitle: book.title,
    chapter: book.chapter,
    priorStory,
    theme,
  });
  if (!conclusion) return res.status(500).json({ error: "story generation failed" });

  const seqRow = await pool.query(
    `SELECT get_next_story_seq($1::int, $2::int) AS next_seq`,
    [book.id, book.chapter]
  );
  await pool.query(
    `SELECT add_story_chunk($1, $2, $3, 'open', $4)`,
    [book.id, book.chapter, seqRow.rows[0].next_seq, conclusion]
  );

  // 2. Advance chapter counter
  const nextChapter = book.chapter + 1;
  await pool.query(`SELECT update_book_chapter($1, $2)`, [book.id, nextChapter]);

  // 3. Write the opening hook of the new chapter
  const opening = await generateChapterOpening({
    username,
    bookTitle: book.title,
    chapter: nextChapter,
    previousConclusion: conclusion,
    theme,
  });
  if (!opening) return res.status(500).json({ error: "chapter opening generation failed" });

  await pool.query(
    `SELECT add_story_chunk($1, $2, 1, 'open', $3)`,
    [book.id, nextChapter, opening]
  );

  return res.json({
    conclusion,
    concludedChapter: book.chapter,
    nextChapter,
    opening,
  });
};

export const renameBook = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const titleV = validateBoundedText(req.body.title, "title", 1, 20);
  if (!titleV.ok) return res.status(400).json({ error: titleV.error });

  const result = await pool.query(
    `SELECT rename_book($1::int, $2::text) AS id`,
    [uid, titleV.value]
  );
  if (result.rows[0]?.id == null)
    return res.status(404).json({ error: "no book found — call start-book first" });

  return res.json({ bookId: result.rows[0].id });
};

export const getThemes = async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT * FROM get_all_themes()`);
  return res.json(rows);
};

export const getBook = async (req: Request, res: Response) => {
  const { uid } = req.body;

  const bookRow = await pool.query(
    `SELECT * FROM get_book_with_theme($1::int)`,
    [uid]
  );
  if (bookRow.rows.length === 0)
    return res.status(404).json({ error: "no book found" });

  const book = bookRow.rows[0];

  const { rows: chunks } = await pool.query(
    `SELECT * FROM get_book_chunks($1::int)`,
    [book.id]
  );

  return res.json({
    id: book.id,
    title: book.title,
    chapter: book.chapter,
    status: book.status,
    theme: { name: book.theme_name, description: book.theme_description },
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
