import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import pool from "../db.js";
import { sendOtp, retry, verify } from "../services/otpService.js";
import { sendEmail } from "../services/mailerService.js";
import { validateName, validatePhone, validateEmail, validateDob, validateGender, validateRequestId, validateOtp, validateReasonToJoin, escapeHtml, validatePassword } from "../validators.js";


function joinRequestAcknowledgement(
  role: "organizer" | "boss",
  reasonToJoin: string,
) {
  const roleLabel = role === "organizer" ? "Organizer" : "Boss";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your interest in joining MySaga!</h2>
      <p>Dear Applicant,</p>
      <p>We have received your request to join MySaga as a <strong>${roleLabel}</strong>.</p>
      <p>Your message:</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #555; margin: 16px 0;">
        "${escapeHtml(reasonToJoin)}"
      </blockquote>
      <p>
        Our team will carefully review your application. If we find your request worthy of further consideration,
        a member of the MySaga workforce will reach out to you at this email address.
      </p>
      <p>We appreciate your patience and look forward to potentially welcoming you aboard.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>MySaga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Please do not reply directly to this email.</p>
    </div>
  `;

  return {
    subject: `MySaga ${roleLabel} Join Request — Received`,
    html
  };
}


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

    const taken = await pool.query(`SELECT 1 FROM find_user_by_phone($1::text)`, [pendingUser.phone]);
    if (taken.rows.length > 0)
      return res.status(409).json({ error: "An account with this phone already exists" });

    const verified = await verify(pendingUser.request_id, otp);
    if (!verified)
      return res.status(400).json({ error: "Invalid OTP" });

    await pool.query(
      `SELECT create_user($1::text, $2::text, $3::text, $4::date, $5::text)`,
      [pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender]
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
    const {html, subject} = joinRequestAcknowledgement("organizer", reasonToJoin);
    await sendEmail(email, subject, html);
    return res.json({ message: "Join request submitted. Check your email for confirmation." });
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
