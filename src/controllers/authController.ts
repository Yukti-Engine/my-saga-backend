import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import pool from "../db.js";
import { sendOtp, retry, verify } from "../services/otpService.js";
import { sendJoinRequestAcknowledgement } from "../services/emailService.js";


/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender } = req.body;

  if (!name || !dob || !gender || !phone)
    return res.status(400).json({ error: "Missing required fields" });

  try {
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
  const { requestId, otp } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM find_pending_user($1::text)`,
      [requestId]
    );
    const pendingUser = rows[0];
    if (!pendingUser)
      return res.status(400).json({ error: "Invalid requestId" });

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
  const { requestId } = req.body;

  if (!requestId)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const { rows } = await pool.query(`SELECT * FROM find_pending_user($1::text)`, [requestId]);
    const pendingUser = rows[0]
    await retry(pendingUser.request_id);
    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Error in signupResendOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};


/* ----------------- LOGIN FLOW ----------------- */
export const loginRequestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone required" });

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
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone required" });

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1::text)`, [phone]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    const requestId = rows[0].request_id;
    await retry(requestId);
    return res.json({ message: "OTP sent", phone });
  } catch (err) {
    console.error("Error in loginResendOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};
export const loginVerifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1::text)`, [phone]);
    const potentialUser = rows[0];
    if (!potentialUser)
      return res.status(404).json({ error: "User not found" });

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
  const { email, reasonToJoin } = req.body;

  if (!email || !reasonToJoin)
    return res.status(400).json({ error: "email and reasonToJoin are required" });

  try {
    await sendJoinRequestAcknowledgement(email, "organizer", reasonToJoin);
    return res.json({ message: "Join request submitted. Check your email for confirmation." });
  } catch (err) {
    console.error("Error in organizerJoinRequest:", err);
    return res.status(500).json({ error: "Failed to submit join request" });
  }
};

export const bossJoinRequest = async (req: Request, res: Response) => {
  const { email, reasonToJoin } = req.body;

  if (!email || !reasonToJoin)
    return res.status(400).json({ error: "email and reasonToJoin are required" });

  try {
    await sendJoinRequestAcknowledgement(email, "boss", reasonToJoin);
    return res.json({ message: "Join request submitted. Check your email for confirmation." });
  } catch (err) {
    console.error("Error in bossJoinRequest:", err);
    return res.status(500).json({ error: "Failed to submit join request" });
  }
};


/* ----------------- LOGIN FLOW (ORGANIZER / BOSS) ----------------- */
export const organizerLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_organizer_by_email($1::text)`, [email]);
  const organizer = rows[0];

  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });

  if (organizer.password !== encode(password))
    return res.status(500).json({ error: "Password does not match" });

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
  const { email, password } = req.body;
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_boss_by_email($1::text)`, [email]);
  const boss = rows[0];

  if (!boss)
    return res.status(500).json({ error: "No such boss" });

  if (boss.password !== encode(password))
    return res.status(500).json({ error: "Password does not match" });

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
