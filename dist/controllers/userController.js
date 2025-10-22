// import type { Request, Response } from "express";
// import { updateUser } from "../dbms/user-helpers.js"; // change path as needed
// import pool from "../dbms/db.js"; 
// export const updateUserProfile = async (req: Request, res: Response) => {
//   const { accessToken, username, bio, email } = req.body;
import { randomBytes } from "crypto";
import db from "../dbms/db.js"; // ✅ use db everywhere
import { createPendingUser, findPendingUser, removePendingUser, createUser, findUserByPhone } from "../dbms/user-helpers.js";
import { sendOtp, verify } from "../services/otpService.js";
/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req, res) => {
    const { name, phone, email, dob, gender } = req.body;
    if (!name || !dob || !gender || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const requestId = await sendOtp(phone);
        await createPendingUser(name, phone, email, dob, gender, requestId, db); // use db
        return res.json({ message: "OTP sent", requestId });
    }
    catch (err) {
        console.error("Error in signupRequestOtp:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
};
export const signupVerifyOtp = async (req, res) => {
    const { requestId, otp } = req.body;
    try {
        const pendingUser = await findPendingUser(requestId, db);
        if (!pendingUser) {
            return res.status(400).json({ error: "Invalid requestId" });
        }
        if (pendingUser.expires_at < new Date()) {
            return res.status(400).json({ error: "OTP expired" });
        }
        const verified = await verify(pendingUser.phone, otp);
        if (!verified) {
            return res.status(400).json({ error: "Invalid OTP" });
        }
        await createUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, db);
        await removePendingUser(requestId, db);
        return res.json({ message: "Signup successful" });
    }
    catch (err) {
        console.error("Error in signupVerifyOtp:", err);
        return res.status(500).json({ error: "Verification failed" });
    }
};
export const signupResendOtp = async (req, res) => {
    const { requestId } = req.body;
    try {
        const pendingUser = await findPendingUser(requestId, db);
        if (!pendingUser) {
            return res.status(400).json({ error: "Invalid requestId" });
        }
        const newRequestId = await sendOtp(pendingUser.phone);
        await createPendingUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, newRequestId, db);
        await removePendingUser(requestId, db);
        return res.json({ message: "OTP resent", newRequestId });
    }
    catch (err) {
        console.error("Error in signupResendOtp:", err);
        return res.status(500).json({ error: "Failed to resend OTP" });
    }
};
/* ----------------- LOGIN FLOW ----------------- */
export const loginRequestOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: "Phone required" });
    }
    try {
        const user = await findUserByPhone(phone, db);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await sendOtp(phone);
        return res.json({ message: "OTP sent", phone });
    }
    catch (err) {
        console.error("Error in loginRequestOtp:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
};
export const loginVerifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const potentialUser = await findUserByPhone(phone, db);
        if (!potentialUser) {
            return res.status(404).json({ error: "User not found" });
        }
        const verified = await verify(phone, otp);
        if (!verified) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        const accessToken = randomBytes(16).toString("hex");
        // Store access token in DB
        const updateQuery = `
      UPDATE users
      SET access_token = $1
      WHERE id = $2
      RETURNING *;
    `;
        const result = await db.query(updateQuery, [accessToken, potentialUser.id]);
        const updatedUser = result.rows[0];
        return res.json({
            message: "Login successful",
            accessToken: accessToken,
            uid: updatedUser.id,
        });
    }
    catch (err) {
        console.error("Error in loginVerifyOtp:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }
};
export const loginResendOtp = async (req, res) => {
    const { phone } = req.body;
    try {
        const user = await findUserByPhone(phone, db);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const requestId = await sendOtp(phone);
        return res.json({ message: "OTP resent", requestId, phone });
    }
    catch (err) {
        console.error("Error in loginResendOtp:", err);
        return res.status(500).json({ error: "Failed to resend OTP" });
    }
};
//# sourceMappingURL=userController.js.map