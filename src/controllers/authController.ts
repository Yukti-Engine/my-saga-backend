/**
 * authController.ts
 *
 * Handles all public authentication flows for the My Saga platform:
 *   - User signup and login via OTP (phone-based)
 *   - Organizer and Boss login via email + password
 *   - Join-request submission for aspiring organizers
 *   - Invite-link generation, validation, KYC upload, and signup via link
 *   - Legal version retrieval
 */
import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import { google } from "googleapis";
import pool from "../db.js";
import { sendOtp, retry, verify } from "../services/otpService.js";
import { sendEmail } from "../services/mailerService.js";
import { generateKycUploadUrl } from "../services/bucketService.js";
import { validateName, validatePhone, validateEmail, validateDob, validateGender, validateRequestId, validateOtp, validateReasonToJoin, escapeHtml, validatePassword, validateUsername, validateBoundedText } from "../validators.js";
import { fetchLegalVersions, type LegalApp } from "../legalVersions.js";

// GCS bucket that hosts the versioned PDF files for T&C and Privacy Policy
const LEGAL_BUCKET = "my-saga-legal";
const LEGAL_BASE = `https://storage.googleapis.com/${LEGAL_BUCKET}`;


function joinRequestAcknowledgement(
  role: "organizer" | "boss",
  reasonToJoin: string,
) {
  const roleLabel = role === "organizer" ? "Organizer" : "Boss";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your interest in joining My Saga!</h2>
      <p>Dear Applicant,</p>
      <p>We have received your request to join My Saga as a <strong>${roleLabel}</strong>.</p>
      <p>Your message:</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #555; margin: 16px 0;">
        "${escapeHtml(reasonToJoin)}"
      </blockquote>
      <p>
        Our team will carefully review your application. If we find your request worthy of further consideration,
        a member of the My Saga workforce will reach out to you at this email address.
      </p>
      <p>We appreciate your patience and look forward to potentially welcoming you aboard.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>My Saga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Please do not reply directly to this email.</p>
    </div>
  `;

  return {
    subject: `My Saga ${roleLabel} Join Request — Received`,
    html
  };
}


/* ----------------- LEGAL VERSIONS ----------------- */
export const getLegalVersions = async (req: Request, res: Response) => {
  const app: string = req.body.app;
  if (app !== "user" && app !== "guide" && app !== "expert")
    return res.status(400).json({ error: "app must be user, guide, or expert" });

  const { terms_version, privacy_version } = await fetchLegalVersions(app as LegalApp);
  return res.json({
    termsVersion: terms_version,
    termsUrl: `${LEGAL_BASE}/${app}/terms-and-conditions/${terms_version}.pdf`,
    privacyVersion: privacy_version,
    privacyUrl: `${LEGAL_BASE}/${app}/privacy-policy/${privacy_version}.pdf`,
  });
};

/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req: Request, res: Response) => {
  const nameV = validateName(req.body.name);
  if (!nameV.ok) return res.status(400).json({ error: nameV.error });
  const phoneV = validatePhone(req.body.phone);
  if (!phoneV.ok) return res.status(400).json({ error: phoneV.error });
  const emailV = validateEmail(req.body.email, false);
  if (!emailV.ok) return res.status(400).json({ error: emailV.error });
  const dobV = validateDob(req.body.dob);
  if (!dobV.ok) return res.status(400).json({ error: dobV.error });
  const genderV = validateGender(req.body.gender);
  if (!genderV.ok) return res.status(400).json({ error: genderV.error });

  const name = nameV.value;
  const phone = phoneV.value;
  const email = emailV.value;
  const dob = dobV.value;
  const gender = genderV.value;

  try {
    const existing = await pool.query(`SELECT 1 FROM find_user_by_phone($1::text)`, [phone]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "An account with this phone already exists" });

    const requestId = await sendOtp(phone);
    await pool.query(
      `SELECT create_pending_user($1::text, $2::text, $3::text, $4::text, $5::text, $6::text)`,
      [requestId, name, phone, email, dob, gender]
    );
    return res.json({ message: "OTP sent", requestId });
  } catch (err) {
    console.error("Error in signupRequestOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const signupVerifyOtp = async (req: Request, res: Response) => {
  const requestIdV = validateRequestId(req.body.requestId);
  if (!requestIdV.ok) return res.status(400).json({ error: requestIdV.error });
  const otpV = validateOtp(req.body.otp);
  if (!otpV.ok) return res.status(400).json({ error: otpV.error });

  const requestId = requestIdV.value;
  const otp = otpV.value;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM find_pending_user($1::text)`,
      [requestId]
    );
    const pendingUser = rows[0];
    if (!pendingUser)
      return res.status(400).json({ error: "Invalid requestId" });

    // Guard against a race where the user managed to sign up between OTP send and verify
    const taken = await pool.query(`SELECT 1 FROM find_user_by_phone($1::text)`, [pendingUser.phone]);
    if (taken.rows.length > 0)
      return res.status(409).json({ error: "An account with this phone already exists" });

    const verified = await verify(pendingUser.request_id, otp);
    if (!verified)
      return res.status(400).json({ error: "Invalid OTP" });

    // Legal acceptance must be confirmed at the point of account creation, not just during signup start
    if (req.body.acceptTerms !== true || req.body.acceptPrivacy !== true)
      return res.status(400).json({ error: "You must accept the Terms & Conditions and Privacy Policy to sign up" });

    // Fetch the current legal versions so we record exactly which version the user agreed to
    const { terms_version, privacy_version } = await fetchLegalVersions("user");
    await pool.query(
      `SELECT create_user($1::text, $2::text, $3::text, $4::date, $5::text)`,
      [pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender]
    );
    await pool.query(
      `SELECT accept_legal_user_by_phone($1::text, $2::int, $3::int)`,
      [pendingUser.phone, terms_version, privacy_version]
    );

    return res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Error in signupVerifyOtp:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

export const signupResendOtp = async (req: Request, res: Response) => {
  const requestIdV = validateRequestId(req.body.requestId);
  if (!requestIdV.ok) return res.status(400).json({ error: requestIdV.error });
  const requestId = requestIdV.value;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_pending_user($1::text)`, [requestId]);
    const pendingUser = rows[0];
    if (!pendingUser)
      return res.status(404).json({ error: "No pending signup" });

    const taken = await pool.query(`SELECT 1 FROM find_user_by_phone($1::text)`, [pendingUser.phone]);
    if (taken.rows.length > 0)
      return res.status(409).json({ error: "An account with this phone already exists" });

    await retry(pendingUser.request_id);
    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Error in signupResendOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};


/* ----------------- LOGIN FLOW ----------------- */
export const loginRequestOtp = async (req: Request, res: Response) => {
  const phoneV = validatePhone(req.body.phone);
  if (!phoneV.ok) return res.status(400).json({ error: phoneV.error });
  const phone = phoneV.value;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1::text)`, [phone]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    const requestId = await sendOtp(phone);
    await pool.query(`SELECT * FROM update_user_request_id($1::text, $2::text)`, [phone, requestId]);
    return res.json({ message: "OTP sent", phone });
  } catch (err) {
    console.error("Error in loginRequestOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const loginResendOtp = async (req: Request, res: Response) => {
  const phoneV = validatePhone(req.body.phone);
  if (!phoneV.ok) return res.status(400).json({ error: phoneV.error });
  const phone = phoneV.value;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1::text)`, [phone]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    const requestId = rows[0].request_id;
    if (!requestId) return res.status(400).json({ error: "Request an OTP first" });
    await retry(requestId);
    return res.json({ message: "OTP sent", phone });
  } catch (err) {
    console.error("Error in loginResendOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};
export const loginVerifyOtp = async (req: Request, res: Response) => {
  const phoneV = validatePhone(req.body.phone);
  if (!phoneV.ok) return res.status(400).json({ error: phoneV.error });
  const otpV = validateOtp(req.body.otp);
  if (!otpV.ok) return res.status(400).json({ error: otpV.error });
  const phone = phoneV.value;
  const otp = otpV.value;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1::text)`, [phone]);
    const potentialUser = rows[0];
    if (!potentialUser)
      return res.status(404).json({ error: "User not found" });
    if (!potentialUser.request_id)
      return res.status(400).json({ error: "Request an OTP first" });

    const verified = await verify(potentialUser.request_id, otp);
    if (!verified)
      return res.status(400).json({ error: "Invalid or expired OTP" });
    let accessToken;
    if (potentialUser.access_token)
      accessToken = potentialUser.access_token;
    else
      accessToken = randomBytes(16).toString("hex");
    await pool.query(
      `SELECT update_access_token($1::int, $2::text, $3::text)`,
      [potentialUser.id, 'user', accessToken]
    );

    return res.json({
      message: "Login successful",
      accessToken,
      uid: potentialUser.id,
    });
  } catch (err) {
    console.error("Error in loginVerifyOtp:", err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

/* ----------------- JOIN REQUESTS ----------------- */
export const organizerJoinRequest = async (req: Request, res: Response) => {
  const emailV = validateEmail(req.body.email, true);
  if (!emailV.ok) return res.status(400).json({ error: emailV.error });
  const reasonV = validateReasonToJoin(req.body.reasonToJoin);
  if (!reasonV.ok) return res.status(400).json({ error: reasonV.error });
  const email = emailV.value!;
  const reasonToJoin = reasonV.value;

  try {
    const inserted = await pool.query(
      `SELECT create_ticket('organizer_join_request', $1::jsonb) AS id`,
      [JSON.stringify({ email, reasonToJoin })]
    );
    const {html, subject} = joinRequestAcknowledgement("organizer", reasonToJoin);
    await sendEmail(email, subject, html);
    return res.json({ message: "Join request submitted. Check your email for confirmation.", ticketId: inserted.rows[0].id });
  } catch (err) {
    console.error("Error in organizerJoinRequest:", err);
    return res.status(500).json({ error: "Failed to submit join request" });
  }
};


/* ----------------- LOGIN FLOW (ORGANIZER / BOSS) ----------------- */
export const organizerLogin = async (req: Request, res: Response) => {
  const emailV = validateEmail(req.body.email, true);
  if (!emailV.ok) return res.status(400).json({ error: emailV.error });
  const passwordV = validatePassword(req.body.password);
  if (!passwordV.ok) return res.status(400).json({ error: passwordV.error });
  const email = emailV.value!;
  const password = passwordV.value;

  // Passwords are stored as plain base64 (not hashed) — encode before comparing
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_organizer_by_email($1::text)`, [email]);
  const organizer = rows[0];

  if (!organizer || organizer.password !== encode(password))
    return res.status(401).json({ error: "Invalid email or password" });

  let accessToken;
  if (organizer.access_token)
    accessToken = organizer.access_token;
  else
    accessToken = randomBytes(16).toString("hex");
  await pool.query(
    `SELECT update_access_token($1::int, $2::text, $3::text)`,
    [organizer.id, 'organizer', accessToken]
  );
  
  return res.json({
    message: "Login successful",
    accessToken,
    oid: organizer.id,
  });
};

export const bossLogin = async (req: Request, res: Response) => {
  const emailV = validateEmail(req.body.email, true);
  if (!emailV.ok) return res.status(400).json({ error: emailV.error });
  const passwordV = validatePassword(req.body.password);
  if (!passwordV.ok) return res.status(400).json({ error: passwordV.error });
  const email = emailV.value!;
  const password = passwordV.value;

  // Same base64 encoding scheme as organizer login
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_boss_by_email($1::text)`, [email]);
  const boss = rows[0];

  if (!boss || boss.password !== encode(password))
    return res.status(401).json({ error: "Invalid email or password" });

  let accessToken;
  if (boss.access_token)
    accessToken = boss.access_token;
  else
    accessToken = randomBytes(16).toString("hex");;
  await pool.query(
    `SELECT update_access_token($1::int, $2::text, $3::text)`,
    [boss.id, 'boss', accessToken]
  );
  
  return res.json({
    message: "Login successful",
    accessToken,
    bid: boss.id,
  });
};

function signupInviteEmail(role: "organizer" | "boss", signupUrl: string) {
  const roleLabel = role === "organizer" ? "Guide" : "Expert";
  const platform = role === "organizer" ? "My Saga" : "My Guild";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've been invited to join ${platform}!</h2>
      <p>Hi there,</p>
      <p>
        A moderator has approved your account. You've been invited to join as a
        <strong>${roleLabel}</strong> on ${platform}.
      </p>
      <p>Click the button below to complete your signup. This link expires in <strong>7 days</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${signupUrl}"
           style="background-color: #010101; color: #ffffff; padding: 14px 28px; border-radius: 8px;
                  text-decoration: none; font-size: 16px; display: inline-block;">
          Complete Signup
        </a>
      </div>
      <p style="font-size: 13px; color: #666;">
        Or copy this link into your browser:<br/>
        <a href="${signupUrl}" style="color: #333;">${signupUrl}</a>
      </p>
      <br />
      <p>Welcome aboard,</p>
      <p><strong>My Saga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Do not reply to this email.</p>
    </div>
  `;
  return {
    subject: `You're invited to join ${platform} as a ${roleLabel}`,
    html,
  };
}

/* ----------------- SIGNUP LINK FLOW ----------------- */
export const generateSignupLink = async (req: Request, res: Response) => {
  const role = req.body.role;
  if (role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be organizer or boss" });
  const emailV = validateEmail(req.body.email, true);
  if (!emailV.ok) return res.status(400).json({ error: emailV.error });

  const token = randomBytes(24).toString("hex");
  // Pre-assign a unique KYC folder path so the applicant can upload documents before the account is approved
  const kycFolder = `${role}/${randomBytes(16).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // link expires in 7 days
  await pool.query(
    `SELECT create_signup_link($1::text, $2::text, $3::text, $4::timestamptz, $5::text)`,
    [token, role, emailV.value, expiresAt, kycFolder]
  );

  if (emailV.value) {
    // Derive the correct front-end base URL per role and environment
    const organizerBase = "https://guide.mysaga.in";
    const bossBase     = "https://myguild.mysaga.in";
    const signupUrl = role === "organizer"
      ? `${organizerBase}/join?token=${token}`
      : `${bossBase}/join?token=${token}`;
    const { subject, html } = signupInviteEmail(role, signupUrl);
    // Fire-and-forget — a failed email should not break link generation
    sendEmail(emailV.value, subject, html).catch((e) =>
      console.error("signup invite email failed:", e)
    );
  }

  return res.json({ token, expiresAt: expiresAt.toISOString() });
};

export const checkSignupLink = async (req: Request, res: Response) => {
  const tokenV = validateBoundedText(req.body.token, "token", 10, 128);
  if (!tokenV.ok) return res.json({ valid: false });

  const { rows } = await pool.query(
    `SELECT * FROM check_signup_link($1::text)`,
    [tokenV.value]
  );
  if (rows.length === 0) return res.json({ valid: false });
  return res.json({ valid: true, role: rows[0].role as string });
};

export const getKycUploadUrlForSignup = async (req: Request, res: Response) => {
  const tokenV = validateBoundedText(req.body.token, "token", 10, 128);
  if (!tokenV.ok) return res.status(400).json({ error: tokenV.error });
  const fileNameV = validateBoundedText(req.body.fileName, "fileName", 1, 200);
  if (!fileNameV.ok) return res.status(400).json({ error: fileNameV.error });
  const contentTypeV = validateBoundedText(req.body.contentType, "contentType", 1, 100);
  if (!contentTypeV.ok) return res.status(400).json({ error: contentTypeV.error });

  const { rows } = await pool.query(
    `SELECT get_signup_link_kyc_folder($1::text) AS folder`,
    [tokenV.value]
  );
  const folder: string | null = rows[0]?.folder ?? null;
  if (!folder) return res.status(400).json({ error: "Invalid, expired, or used link" });

  const data = await generateKycUploadUrl(folder, fileNameV.value, contentTypeV.value);
  return res.json(data);
};

export const signupViaLink = async (req: Request, res: Response) => {
  const tokenV = validateBoundedText(req.body.token, "token", 10, 128);
  if (!tokenV.ok) return res.status(400).json({ error: tokenV.error });
  const nameV = validateName(req.body.name);
  if (!nameV.ok) return res.status(400).json({ error: nameV.error });
  const phoneV = validatePhone(req.body.phone);
  if (!phoneV.ok) return res.status(400).json({ error: phoneV.error });
  const dobV = validateDob(req.body.dob);
  if (!dobV.ok) return res.status(400).json({ error: dobV.error });
  const genderV = validateGender(req.body.gender);
  if (!genderV.ok) return res.status(400).json({ error: genderV.error });
  const passV = validatePassword(req.body.password);
  if (!passV.ok) return res.status(400).json({ error: passV.error });
  const userV = validateUsername(req.body.username);
  if (!userV.ok) return res.status(400).json({ error: userV.error });

  if (req.body.acceptTerms !== true || req.body.acceptPrivacy !== true)
    return res.status(400).json({ error: "You must accept the Terms & Conditions and Privacy Policy to sign up" });

  // Atomically mark the link as used to prevent double-submission
  const consumed = await pool.query(`SELECT * FROM consume_signup_link($1::text)`, [tokenV.value]);
  if (consumed.rows.length === 0)
    return res.status(400).json({ error: "Invalid, expired, or already used link" });
  const { role, email, kyc_folder: kycFolder } = consumed.rows[0];

  try {
    const legalApp: LegalApp = role === "organizer" ? "guide" : "expert";
    // Capture the current legal version at submission time for compliance record-keeping
    const { terms_version: termsV, privacy_version: privacyV } = await fetchLegalVersions(legalApp);
    await pool.query(
      `SELECT create_pending_signup($1::text, $2::text, $3::text, $4::text, $5::text, $6::date, $7::text, $8::text, $9::text, $10::text, $11::int, $12::int)`,
      [tokenV.value, role, email, nameV.value, phoneV.value, dobV.value, genderV.value, userV.value, passV.value, kycFolder, termsV, privacyV]
    );
    return res.json({ success: true, message: "Application submitted. You will be notified by email once reviewed." });
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "This link has already been used to submit an application" });
    console.error("Error in signupViaLink:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
};

export const getCloneIp = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (token !== "Babycorn@38")
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const sql = google.sqladmin({ version: "v1beta4", auth });
    const { data } = await sql.instances.get({
      project: process.env.GCP_PROJECT_ID!,
      instance: "my-saga-data-clone",
    });
    const ip = data.ipAddresses?.find((a: any) => a.type === "PRIMARY")?.ipAddress ?? null;
    if (!ip) return res.status(404).json({ error: "Clone has no public IP yet" });
    return res.json({ ip });
  } catch (err: any) {
    console.error("[getCloneIp] Failed:", err.message);
    return res.status(500).json({ error: "Failed to get clone IP", detail: err.message });
  }
};
