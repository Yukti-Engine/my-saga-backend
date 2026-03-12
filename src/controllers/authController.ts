import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import pool from "../db.js";
import { sendOtp, verify } from "../services/otpService.js";

export function generateRandomUsername(): string {
  const adjectives = ["anonymous","brave","happy","silly","fast","tiny","cool"];
  const nouns = ["whale","kid","carrot","lion","robot","panda","gamer"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}


/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender } = req.body;

  if (!name || !dob || !gender || !phone)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const requestId = await sendOtp(phone);
    await pool.query(
      `SELECT create_pending_user($1, $2, $3, $4, $5, $6)`,
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
      `SELECT * FROM find_pending_user($1)`,
      [requestId]
    );
    const pendingUser = rows[0];
    if (!pendingUser)
      return res.status(400).json({ error: "Invalid requestId" });

    if (pendingUser.expires_at < new Date())
      return res.status(400).json({ error: "OTP expired" });

    const verified = await verify(pendingUser.phone, otp);
    if (!verified)
      return res.status(400).json({ error: "Invalid OTP" });

    await pool.query(
      `SELECT create_user($1, $2, $3, $4, $5)`,
      [pendingUser.name, pendingUser.phone, pendingUser.email, new Date(pendingUser.dob), pendingUser.gender]
    );
    await pool.query(`SELECT remove_pending_user($1)`, [requestId]);

    return res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Error in signupVerifyOtp:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

export const signupResendOtp = async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender } = req.body;

  if (!name || !dob || !gender || !phone)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const requestId = await sendOtp(phone);
    await pool.query(
      `SELECT create_pending_user($1, $2, $3, $4, $5, $6)`,
      [requestId, name, phone, email, dob, gender]
    );
    return res.json({ message: "OTP sent", requestId });
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
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1)`, [phone]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    await sendOtp(phone);
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
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1)`, [phone]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    await sendOtp(phone);
    return res.json({ message: "OTP sent", phone });
  } catch (err) {
    console.error("Error in loginResendOtp:", err);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const loginVerifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    const { rows } = await pool.query(`SELECT * FROM find_user_by_phone($1)`, [phone]);
    const potentialUser = rows[0];
    if (!potentialUser)
      return res.status(404).json({ error: "User not found" });

    const verified = await verify(phone, otp);
    if (!verified)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    const accessToken = randomBytes(16).toString("hex");
    const updated = await pool.query(
      `SELECT * FROM update_user_access_token($1, $2)`,
      [potentialUser.id, accessToken]
    );

    return res.json({
      message: "Login successful",
      accessToken,
      uid: updated.rows[0].id,
    });
  } catch (err) {
    console.error("Error in loginVerifyOtp:", err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const organizerLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_organizer_by_email($1)`, [email]);
  const organizer = rows[0];

  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });

  if (organizer.password !== encode(password))
    return res.status(500).json({ error: "Password does not match" });

  const updated = await pool.query(
    `SELECT * FROM update_organizer_access_token($1, $2)`,
    [organizer.id, randomBytes(16).toString("hex")]
  );
  const organizerDetails = updated.rows[0];
  organizerDetails.password = password;
  return res.json(organizerDetails);
};

export const bossLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const encode = (text: string) => Buffer.from(text, "utf8").toString("base64");

  const { rows } = await pool.query(`SELECT * FROM get_boss_by_email($1)`, [email]);
  const boss = rows[0];

  if (!boss)
    return res.status(500).json({ error: "No such boss" });

  if (boss.password !== encode(password))
    return res.status(500).json({ error: "Password does not match" });

  const updated = await pool.query(
    `SELECT * FROM update_boss_access_token($1, $2)`,
    [boss.id, randomBytes(16).toString("hex")]
  );
  const bossDetails = updated.rows[0];
  bossDetails.password = password;
  return res.json(bossDetails);
};
