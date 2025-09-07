import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createPendingUser,
  findPendingUser,
  removePendingUser,
  createUser,
} from "../models/db";
import { generateOtp, sendOtp } from "../services/otpService";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const requestOtp = async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const requestId = createPendingUser(name, email, passwordHash, phone, otp);

  sendOtp(phone, otp);

  return res.json({ message: "OTP sent", requestId });
};

export const verifyOtp = (req: Request, res: Response) => {
  const { requestId, otp } = req.body;
  const pendingUser = findPendingUser(requestId);

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid requestId" });
  }

  if (pendingUser.expiresAt < new Date()) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (pendingUser.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // OTP valid → create real user
  const user = createUser(
    pendingUser.name,
    pendingUser.email,
    pendingUser.passwordHash,
    pendingUser.phone
  );

  removePendingUser(requestId);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  return res.json({ message: "Signup successful", user, token });
};

export const resendOtp = (req: Request, res: Response) => {
  const { requestId } = req.body;
  const pendingUser = findPendingUser(requestId);

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid requestId" });
  }

  const otp = generateOtp();
  pendingUser.otp = otp;
  pendingUser.expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  sendOtp(pendingUser.phone, otp);

  return res.json({ message: "OTP resent" });
};
