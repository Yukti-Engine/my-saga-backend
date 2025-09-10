import type { Request, Response } from "express";
import {
  createPendingUser,
  findPendingUser,
  removePendingUser,
  createUser,
} from "../models/db.js";
import { sendOtp, verify } from "../services/otpService.js";

export const requestOtp = async (req: Request, res: Response) => {
  const { name, phone, email, dob, gender } = req.body;
  if (!name || !dob || !gender || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const requestId = await sendOtp(phone);
  createPendingUser(name, phone, email, dob, gender, requestId);

  return res.json({ message: "OTP sent", requestId });
};

export const verifyOtp = async (req: Request, res: Response) => {
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

  return res.json({ message: "Signup successful"});
};

export const resendOtp = async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const pendingUser = findPendingUser(requestId);

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid requestId" });
  }
  
  const newRequestId = await sendOtp(pendingUser.phone);
  createPendingUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, newRequestId);
  removePendingUser(requestId);
  return res.json({ message: "OTP resent" , newRequestId});
};
