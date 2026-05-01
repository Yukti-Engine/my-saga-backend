/**
 * moderatorController.ts
 *
 * Internal moderation endpoints used by the MySaga admin dashboard.
 * Handles: boss/organizer management, badge/category/tournament creation,
 * KYC document review, ticket resolution, asset icon uploads,
 * and the pending-signup approval/rejection workflow.
 */
import type { Request, Response } from "express";
import pool from "../db.js";
import { generateKycDownloadUrl, listKycFiles, uploadBadgeIcon, uploadCategoryIcon, uploadThemeIcon, deleteKycFolder } from "../services/bucketService.js";
import { sendEmail } from "../services/mailerService.js";
import { escapeHtml } from "../validators.js";

export const addBoss = async (req: Request, res: Response) => {
  const { name, email, password, username, phone, dob, gender } = req.body;

  if (!name || !email || !password || !username)
    return res.status(400).json({ error: "name, email, password, username are required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_boss($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text, $8::text)`,
      [name, email, password, username, phone ?? null, dob ?? null, gender ?? null, req.body.kycFolder ?? null]
    );
    return res.json({ message: "Boss created", id: rows[0].create_boss });
  } catch (err) {
    console.error("Error in addBoss:", err);
    return res.status(500).json({ error: "Failed to create boss" });
  }
};

export const addOrganizer = async (req: Request, res: Response) => {
  const { name, email, password, username, phone, dob, gender } = req.body;

  if (!name || !email || !password || !username)
    return res.status(400).json({ error: "name, email, password, username are required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_organizer($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text, $8::text)`,
      [name, email, password, username, phone ?? null, dob ?? null, gender ?? null, req.body.kycFolder ?? null]
    );
    return res.json({ message: "Organizer created", id: rows[0].create_organizer });
  } catch (err) {
    console.error("Error in addOrganizer:", err);
    return res.status(500).json({ error: "Failed to create organizer" });
  }
};

export const createNewBadge = async (req: Request, res: Response) => {
  const { title, categoryId, league, description, icon } = req.body;

  if (!title)
    return res.status(400).json({ error: "title is required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_badge($1::text, $2::int, $3::smallint, $4::text)`,
      [title, categoryId ?? null, league ?? null, description ?? null]
    );
    const badgeId: number = rows[0].create_badge;

    if (icon) {
      await uploadBadgeIcon(icon, badgeId);
    }

    return res.json({ message: "Badge created", id: badgeId });
  } catch (err) {
    console.error("Error in createNewBadge:", err);
    return res.status(500).json({ error: "Failed to create badge" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  const { category, subCategory, word2s } = req.body;

  if (!category)
    return res.status(400).json({ error: "category is required" });

  try {
    const { rows } = await pool.query(
      `SELECT create_category($1::text, $2::text, $3::text[])`,
      [category, subCategory ?? null, word2s ?? null]
    );
    return res.json({ message: "Category created", id: rows[0].create_category });
  } catch (err) {
    console.error("Error in createCategory:", err);
    return res.status(500).json({ error: "Failed to create category" });
  }
};

export const createTournament = async (req: Request, res: Response) => {
  const { name, badgeId, sponsoredBy, venue, timing, instructions, thirdPartyRewardDetail } = req.body;
  if (!name)
    return res.status(400).json({ error: "name is required" });

  try {
    let prize1: number | null = null;
    let prize2: number | null = null;
    let prize3: number | null = null;

    if (badgeId) {
      const badge = (await pool.query(`SELECT * FROM get_badge($1::int)`, [badgeId])).rows[0];
      if (!badge)
        return res.status(400).json({ error: "Badge not found" });

      // Prize pool scales quadratically with badge difficulty (lower league = harder = bigger prize)
      const league: number = badge.league;
      prize1 = 1000 + (100 - league)*(100-league) * 25;
      prize2 = Math.floor(prize1 / 2);
      prize3 = Math.floor(prize2 / 2);
    }

    const { rows } = await pool.query(
      `SELECT create_tournament($1::text, $2::int, $3::int, $4::int, $5::int, $6::text, $7::text, $8::timestamptz, $9::text, $10::text)`,
      [name, badgeId ?? null, prize1, prize2, prize3, sponsoredBy ?? null, venue ?? null, timing ?? null, instructions ?? null, thirdPartyRewardDetail ?? null]
    );
    return res.json({ message: "Tournament created", id: rows[0].create_tournament, prize1, prize2, prize3 });
  } catch (err) {
    console.error("Error in createTournament:", err);
    return res.status(500).json({ error: "Failed to create tournament" });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  return res.json({ valid: true });
};

export const getUsers = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_search_users($1::text, $2::int, $3::int)`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ users: rows });
  } catch (err) {
    console.error("Error in getUsers:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getOrganizers = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_search_organizers($1::text, $2::int, $3::int)`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ organizers: rows });
  } catch (err) {
    console.error("Error in getOrganizers:", err);
    return res.status(500).json({ error: "Failed to fetch organizers" });
  }
};

export const getBosses = async (req: Request, res: Response) => {
  const { search, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_search_bosses($1::text, $2::int, $3::int)`,
      [search ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ bosses: rows });
  } catch (err) {
    console.error("Error in getBosses:", err);
    return res.status(500).json({ error: "Failed to fetch bosses" });
  }
};

export const grantGems = async (req: Request, res: Response) => {
  const { userId, gems } = req.body;

  if (!userId || gems == null)
    return res.status(400).json({ error: "userId and gems are required" });

  try {
    const { rows } = await pool.query(
      `SELECT mod_grant_gems($1::int, $2::int) AS gems`,
      [userId, gems]
    );
    if (rows[0].gems === null)
      return res.status(404).json({ error: "User not found" });
    return res.json({ message: "Gems granted", id: userId, gems: rows[0].gems });
  } catch (err) {
    console.error("Error in grantGems:", err);
    return res.status(500).json({ error: "Failed to grant gems" });
  }
};

export const grantCredits = async (req: Request, res: Response) => {
  const { id, role, credits } = req.body;

  if (!id || !role || credits == null)
    return res.status(400).json({ error: "id, role, and credits are required" });

  if (role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be 'organizer' or 'boss'" });

  try {
    const { rows } = await pool.query(
      `SELECT mod_grant_credits($1::int, $2::text, $3::int) AS credits`,
      [id, role, credits]
    );
    if (rows[0].credits === null)
      return res.status(404).json({ error: `${role} not found` });
    return res.json({ message: "Credits granted", id, credits: rows[0].credits });
  } catch (err) {
    console.error("Error in grantCredits:", err);
    return res.status(500).json({ error: "Failed to grant credits" });
  }
};

export const getAdventures = async (req: Request, res: Response) => {
  const { isActive, limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_adventures($1::boolean, $2::int, $3::int)`,
      [isActive ?? null, limit ?? 50, offset ?? 0]
    );
    return res.json({ adventures: rows });
  } catch (err) {
    console.error("Error in getAdventures:", err);
    return res.status(500).json({ error: "Failed to fetch adventures" });
  }
};

export const getTournaments = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_tournaments($1::int, $2::int)`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ tournaments: rows });
  } catch (err) {
    console.error("Error in getTournaments:", err);
    return res.status(500).json({ error: "Failed to fetch tournaments" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_categories($1::int, $2::int)`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ categories: rows });
  } catch (err) {
    console.error("Error in getCategories:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const addCategoryQualification = async (req: Request, res: Response) => {
  const { organizerId, category } = req.body;

  if (!organizerId || !category)
    return res.status(400).json({ error: "organizerId and category are required" });

  try {
    const { rows } = await pool.query(
      `SELECT mod_add_category_qualification($1::int, $2::text) AS added`,
      [organizerId, category]
    );
    return res.json({ message: rows[0].added ? "Category added" : "Category already present", id: organizerId });
  } catch (err: any) {
    if (typeof err?.message === "string" && err.message.includes("Category not found"))
      return res.status(404).json({ error: "Category not found" });
    if (typeof err?.message === "string" && err.message.includes("Organizer not found"))
      return res.status(404).json({ error: "Organizer not found" });
    console.error("Error in addCategoryQualification:", err);
    return res.status(500).json({ error: "Failed to add category qualification" });
  }
};

export const removeCategoryQualification = async (req: Request, res: Response) => {
  const { organizerId, category } = req.body;

  if (!organizerId || !category)
    return res.status(400).json({ error: "organizerId and category are required" });

  try {
    const { rows } = await pool.query(
      `SELECT mod_remove_category_qualification($1::int, $2::text) AS removed`,
      [organizerId, category]
    );
    if (!rows[0].removed)
      return res.status(404).json({ error: "Qualification not present" });
    return res.json({ message: "Category removed", id: organizerId });
  } catch (err: any) {
    if (typeof err?.message === "string" && err.message.includes("Category not found"))
      return res.status(404).json({ error: "Category not found" });
    console.error("Error in removeCategoryQualification:", err);
    return res.status(500).json({ error: "Failed to remove category qualification" });
  }
};

export const getBadges = async (req: Request, res: Response) => {
  const { limit, offset } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM mod_list_badges($1::int, $2::int)`,
      [limit ?? 50, offset ?? 0]
    );
    return res.json({ badges: rows });
  } catch (err) {
    console.error("Error in getBadges:", err);
    return res.status(500).json({ error: "Failed to fetch badges" });
  }
};

export const listKyc = async (req: Request, res: Response) => {
  const { role, id } = req.body;
  if (role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be organizer or boss" });
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  const { rows } = await pool.query(`SELECT get_kyc_folder($1::int, $2::text) AS folder`, [id, role]);
  const folder: string | null = rows[0]?.folder ?? null;
  if (!folder) return res.json({ files: [] });

  const files = await listKycFiles(folder);
  return res.json({ folder, files });
};

export const kycDownloadUrl = async (req: Request, res: Response) => {
  const { role, id, fileName } = req.body;
  if (role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be organizer or boss" });
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });
  if (typeof fileName !== "string" || fileName.length === 0 || fileName.length > 200)
    return res.status(400).json({ error: "fileName must be 1-200 chars" });

  const { rows } = await pool.query(`SELECT get_kyc_folder($1::int, $2::text) AS folder`, [id, role]);
  const folder: string | null = rows[0]?.folder ?? null;
  if (!folder) return res.status(404).json({ error: "KYC folder not found" });

  const url = await generateKycDownloadUrl(folder, fileName);
  return res.json({ url });
};


export const getTickets = async (req: Request, res: Response) => {
  const { status, type, limit, offset } = req.body;
  const { rows } = await pool.query(
    `SELECT * FROM tickets
     WHERE ($1::text IS NULL OR status = $1::text)
       AND ($2::text IS NULL OR type = $2::text)
     ORDER BY created_at DESC
     LIMIT $3::int OFFSET $4::int`,
    [status ?? null, type ?? null, limit ?? 50, offset ?? 0]
  );
  return res.json({ tickets: rows });
};

export const resolveTicket = async (req: Request, res: Response) => {
  const { ticketId, status } = req.body;
  if (!Number.isInteger(ticketId) || ticketId <= 0)
    return res.status(400).json({ error: "ticketId must be a positive integer" });
  if (!["approved", "rejected", "closed"].includes(status))
    return res.status(400).json({ error: "status must be approved, rejected, or closed" });

  const { rows } = await pool.query(
    `UPDATE tickets SET status = $1, resolved_at = NOW(), updated_at = NOW()
     WHERE id = $2::int RETURNING *`,
    [status, ticketId]
  );
  if (rows.length === 0)
    return res.status(404).json({ error: "ticket not found" });
  return res.json({ ticket: rows[0] });
};

export const uploadBadgeIconRoute = async (req: Request, res: Response) => {
  const { badgeId, icon } = req.body;
  if (!Number.isInteger(badgeId) || badgeId <= 0)
    return res.status(400).json({ error: "badgeId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadBadgeIcon(icon, badgeId);
  return res.json({ message: "icon uploaded" });
};

export const uploadCategoryIconRoute = async (req: Request, res: Response) => {
  const { categoryId, icon } = req.body;
  if (!Number.isInteger(categoryId) || categoryId <= 0)
    return res.status(400).json({ error: "categoryId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadCategoryIcon(icon, categoryId);
  return res.json({ message: "icon uploaded" });
};

export const uploadThemeIconRoute = async (req: Request, res: Response) => {
  const { themeId, icon } = req.body;
  if (!Number.isInteger(themeId) || themeId <= 0)
    return res.status(400).json({ error: "themeId must be a positive integer" });
  if (typeof icon !== "string" || icon.length === 0)
    return res.status(400).json({ error: "icon must be a base64 string" });
  await uploadThemeIcon(icon, themeId);
  return res.json({ message: "icon uploaded" });
};

export const getThemes = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, description FROM themes ORDER BY id ASC`);
    return res.json({ themes: rows });
  } catch (err) {
    console.error("Error in getThemes:", err);
    return res.status(500).json({ error: "Failed to fetch themes" });
  }
};

/* ─────────────────── PENDING SIGNUPS ─────────────────── */
// The pending signup workflow: applicants submit via link → moderator reviews KYC → approves/rejects.

function signupApprovalEmail(role: "organizer" | "boss", name: string) {
  const platform = role === "organizer" ? "MySagaGuide" : "MyGuild";
  const isStaging = process.env.NODE_ENV !== "production";
  const loginUrl = role === "organizer"
    ? (isStaging ? "http://localhost:3000" : "https://guide.mysaga.in")
    : (isStaging ? "http://localhost:3000" : "https://myguild.mysaga.in");
  const roleLabel = role === "organizer" ? "Guide" : "Expert";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to ${platform}!</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>
        Great news — your application to join <strong>${platform}</strong> as a
        <strong>${roleLabel}</strong> has been reviewed and approved.
      </p>
      <p>Your account is ready. You can sign in with the email and password you provided during signup.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginUrl}"
           style="background-color: #010101; color: #ffffff; padding: 14px 28px; border-radius: 8px;
                  text-decoration: none; font-size: 16px; display: inline-block;">
          Sign In
        </a>
      </div>
      <p>We're excited to have you on board. Welcome to the team!</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>MySaga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Please do not reply directly to this email.</p>
    </div>
  `;
  return { subject: `Your ${platform} account is approved — welcome aboard!`, html };
}

function signupRejectionEmail(role: "organizer" | "boss", name: string, reason?: string) {
  const platform = role === "organizer" ? "MySagaGuide" : "MyGuild";
  const reasonBlock = reason
    ? `<p>Our team has shared the following note:</p>
       <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #555; margin: 16px 0;">
         "${escapeHtml(reason)}"
       </blockquote>`
    : "";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Update on your ${platform} application</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>
        Thank you for applying to join <strong>${platform}</strong>. After careful review,
        we're unable to approve your application at this time.
      </p>
      ${reasonBlock}
      <p>We appreciate your interest and wish you the best.</p>
      <br />
      <p>Regards,</p>
      <p><strong>MySaga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Please do not reply directly to this email.</p>
    </div>
  `;
  return { subject: `Update on your ${platform} application`, html };
}

export const listPendingSignups = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, role, email, name, phone, dob, gender, username, kyc_folder, submitted_at
       FROM pending_signups ORDER BY submitted_at DESC`
    );
    return res.json({ pendingSignups: rows });
  } catch (err) {
    console.error("Error in listPendingSignups:", err);
    return res.status(500).json({ error: "Failed to list pending signups" });
  }
};

export const getPendingSignupKyc = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  try {
    const { rows } = await pool.query(`SELECT kyc_folder FROM pending_signups WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Pending signup not found" });

    const folder: string = rows[0].kyc_folder;
    const files = await listKycFiles(folder);
    return res.json({ folder, files });
  } catch (err) {
    console.error("Error in getPendingSignupKyc:", err);
    return res.status(500).json({ error: "Failed to list KYC files" });
  }
};

export const pendingSignupKycDownloadUrl = async (req: Request, res: Response) => {
  const { id, fileName } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });
  if (typeof fileName !== "string" || fileName.length === 0 || fileName.length > 200)
    return res.status(400).json({ error: "fileName must be 1–200 chars" });

  try {
    const { rows } = await pool.query(`SELECT kyc_folder FROM pending_signups WHERE id = $1`, [id]);
    if (!rows[0]) return res.status(404).json({ error: "Pending signup not found" });

    const url = await generateKycDownloadUrl(rows[0].kyc_folder, fileName);
    return res.json({ url });
  } catch (err) {
    console.error("Error in pendingSignupKycDownloadUrl:", err);
    return res.status(500).json({ error: "Failed to generate download URL" });
  }
};

export const approveSignup = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  const { rows } = await pool.query(`SELECT * FROM pending_signups WHERE id = $1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: "Pending signup not found" });
  const ps = rows[0];

  const procName = ps.role === "organizer" ? "create_organizer" : "create_boss";

  try {
    const result = await pool.query(
      `SELECT ${procName}($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text, $8::text) AS new_id`,
      [ps.name, ps.email, ps.password, ps.username, ps.phone, ps.dob, ps.gender, ps.kyc_folder]
    );
    const newId: number = result.rows[0].new_id;

    // Preserve the legal version the applicant accepted at signup time
    const table = ps.role === "organizer" ? "organizers" : "bosses";
    await pool.query(
      `UPDATE ${table}
       SET terms_accepted_version = $1, terms_accepted_at = NOW(),
           privacy_accepted_version = $2, privacy_accepted_at = NOW()
       WHERE id = $3`,
      [ps.terms_accepted_version, ps.privacy_accepted_version, newId]
    );

    await pool.query(`DELETE FROM pending_signups WHERE id = $1`, [id]);

    // Fire-and-forget approval email — a failure here should not roll back account creation
    const { subject, html } = signupApprovalEmail(ps.role, ps.name);
    sendEmail(ps.email, subject, html).catch((e) =>
      console.error("approval email failed:", e)
    );

    return res.json({ success: true, newId });
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "An account with this email, phone, or username already exists" });
    console.error("Error in approveSignup:", err);
    return res.status(500).json({ error: "Failed to approve signup" });
  }
};

export const rejectSignup = async (req: Request, res: Response) => {
  const { id, reason } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  const { rows } = await pool.query(`SELECT * FROM pending_signups WHERE id = $1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: "Pending signup not found" });
  const ps = rows[0];

  try {
    // Remove uploaded KYC documents from storage before deleting the pending record
    await deleteKycFolder(ps.kyc_folder);
    await pool.query(`DELETE FROM pending_signups WHERE id = $1`, [id]);

    const { subject, html } = signupRejectionEmail(
      ps.role,
      ps.name,
      typeof reason === "string" && reason.trim() ? reason.trim() : undefined,
    );
    sendEmail(ps.email, subject, html).catch((e) =>
      console.error("rejection email failed:", e)
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Error in rejectSignup:", err);
    return res.status(500).json({ error: "Failed to reject signup" });
  }
};
