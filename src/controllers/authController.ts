import type { Request, Response } from "express";
import {randomBytes} from "crypto";

import {
  createPendingUser,
  findPendingUser,
  removePendingUser,
  createUser,
  users, // ⚡ NEW: import users so we can find existing ones
} from "../models/db.js";
import { sendOtp, verify } from "../services/otpService.js";

/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender } = req.body;
  if (!name || !dob || !gender || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const requestId = await sendOtp(phone);
  createPendingUser(name, phone, email, dob, gender, requestId);

  return res.json({ message: "OTP sent", requestId });
};

export const signupVerifyOtp = async (req: Request, res: Response) => {
  const { requestId, otp } = req.body;
  const pendingUser = findPendingUser(requestId);

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid requestId" });
  }

  if (pendingUser.expiresAt < new Date()) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (!(await verify(pendingUser.phone, otp))) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // OTP valid → create real user
  createUser(
    pendingUser.name,
    pendingUser.phone,
    pendingUser.email,
    pendingUser.dob,
    pendingUser.gender
  );

  removePendingUser(requestId);

  return res.json({ message: "Signup successful" });
};

export const signupResendOtp = async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const pendingUser = findPendingUser(requestId);

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid requestId" });
  }

  const newRequestId = await sendOtp(pendingUser.phone);
  createPendingUser(
    pendingUser.name,
    pendingUser.phone,
    pendingUser.email,
    pendingUser.dob,
    pendingUser.gender,
    newRequestId
  );
  removePendingUser(requestId);
  return res.json({ message: "OTP resent", newRequestId });
};


export const loginRequestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone required" });
  }

  const user = users.find((u) => u.phone === phone);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // send OTP
  await sendOtp(phone);

  return res.json({ phone: phone });
};

export const loginVerifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const potentialUser = users.find((u) => u.phone === phone);

  if (!potentialUser) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const verified = await verify(phone, otp);

    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const accessToken = randomBytes(16).toString('hex')

    return res.json({ message: "Login successful", accessToken: accessToken, uid: potentialUser.id});
  } catch (err) {
    console.error("Error during OTP verification:", err);
    return res.status(500).json({ error: "OTP verification failed" });
  }
};

export const loginResendOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  const user = users.find((u) => u.phone === phone);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const requestId = await sendOtp(user.phone);

  return res.json({ requestId: requestId, phone: phone });
};
