// import type { Request, Response } from "express";
// import {
//   createPendingUser,
//   findPendingUser,
//   removePendingUser,
//   createUser,
// } from "../models/db.js";
// import { sendOtp, verify } from "../services/otpService.js";
import { createPendingUser, findPendingUser, removePendingUser, createUser, users, // ⚡ NEW: import users so we can find existing ones
 } from "../models/db.js";
import { sendOtp, verify } from "../services/otpService.js";
/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req, res) => {
    const { name, phone, email, dob, gender } = req.body;
    if (!name || !dob || !gender || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const requestId = await sendOtp(phone);
    createPendingUser(name, phone, email, dob, gender, requestId);
    return res.json({ message: "OTP sent", requestId });
};
export const signupVerifyOtp = async (req, res) => {
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
    createUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender);
    removePendingUser(requestId);
    return res.json({ message: "Signup successful" });
};
export const signupResendOtp = async (req, res) => {
    const { requestId } = req.body;
    const pendingUser = findPendingUser(requestId);
    if (!pendingUser) {
        return res.status(400).json({ error: "Invalid requestId" });
    }
    const newRequestId = await sendOtp(pendingUser.phone);
    createPendingUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, newRequestId);
    removePendingUser(requestId);
    return res.json({ message: "OTP resent", newRequestId });
};
/* ----------------- ⚡ FIXED LOGIN FLOW ----------------- */
import { setLoginOtp, verifyLoginOtp, clearLoginOtp } from "../models/db.js";
export const loginRequestOtp = async (req, res) => {
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
export const loginVerifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    const user = users.find((u) => u.phone === phone);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    if (!verifyLoginOtp(user, otp)) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    clearLoginOtp(user);
    return res.json({
        message: "Login successful",
        user: { name: user.name, phone: user.phone, email: user.email },
    });
};
export const loginResendOtp = async (req, res) => {
    const { phone } = req.body;
    const user = users.find((u) => u.phone === phone);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const requestId = await sendOtp(user.phone);
    setLoginOtp(user, requestId);
    return res.json({ message: "Login OTP resent" });
};
//# sourceMappingURL=authController.js.map