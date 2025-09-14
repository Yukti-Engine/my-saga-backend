// import type { Request, Response } from "express";
// import {
//   createPendingUser,
//   findPendingUser,
//   removePendingUser,
//   createUser,
// } from "../models/db.js";
// import { sendOtp, verify } from "../services/otpService.js";

// export const signupRequestOtp = async (req: Request, res: Response) => {
//   const { name, phone, email, dob, gender } = req.body;
//   if (!name || !dob || !gender || !phone) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const requestId = await sendOtp(phone);
//   createPendingUser(name, phone, email, dob, gender, requestId);

//   return res.json({ message: "OTP sent", requestId });
// };

// export const signupVerifyOtp = async (req: Request, res: Response) => {
//   const { requestId, otp } = req.body;
//   const pendingUser = findPendingUser(requestId);

//   if (!pendingUser) {
//     return res.status(400).json({ error: "Invalid requestId" });
//   }

//   if (pendingUser.expiresAt < new Date()) {
//     return res.status(400).json({ error: "OTP expired" });
//   }

//   if (!(await verify(pendingUser.phone, otp))) {
//     return res.status(400).json({ error: "Invalid OTP" });
//   }

//   // OTP valid → create real user
//   createUser(
//     pendingUser.name,
//     pendingUser.phone,
//     pendingUser.email,
//     pendingUser.dob,
//     pendingUser.gender
//   );

//   removePendingUser(requestId);

//   return res.json({ message: "Signup successful"});
// };

// export const signupResendOtp = async (req: Request, res: Response) => {
//   const { requestId } = req.body;
//   const pendingUser = findPendingUser(requestId);

//   if (!pendingUser) {
//     return res.status(400).json({ error: "Invalid requestId" });
//   }
  
//   const newRequestId = await sendOtp(pendingUser.phone);
//   createPendingUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, newRequestId);
//   removePendingUser(requestId);
//   return res.json({ message: "OTP resent" , newRequestId});
// };
import type { Request, Response } from "express";
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

/* ----------------- ⚡ FIXED LOGIN FLOW ----------------- */
import { setLoginOtp, verifyLoginOtp, clearLoginOtp } from "../models/db.js";

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
  const requestId = await sendOtp(phone);
  setLoginOtp(user, requestId);

  return res.json({ message: "Login OTP sent" });
};

// export const loginVerifyOtp = async (req: Request, res: Response) => {
//   const { phone, otp } = req.body;

//   const user = users.find((u) => u.phone === phone);
//   if (!user) {
//     return res.status(404).json({ error: "User not found" });
//   }

//   if (!verifyLoginOtp(user, otp)) {
//     return res.status(400).json({ error: "Invalid or expired OTP" });
//   }

//   clearLoginOtp(user);

//   return res.json({
//     message: "Login successful",
//     user: { name: user.name, phone: user.phone, email: user.email },
//   });
// };
export const loginVerifyOtp = async (req: Request, res: Response) => {
  const { requestId, otp } = req.body;

  console.log("Incoming verify request:", { requestId, otp });

  // Find pending user by requestId (since Twilio Verify gives you one per OTP request)
  const pendingUser = users.find((u) => u.phone === requestId); // adjust if requestId != phone

  if (!pendingUser) {
    console.log("User not found for requestId:", requestId);
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const verified = await verify(pendingUser.phone, otp);
    console.log("Twilio verify result:", verified);

    if (!verified) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    return res.json({ message: "Login successful", user: pendingUser });
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
  setLoginOtp(user, requestId);

  return res.json({ message: "Login OTP resent" });
};
