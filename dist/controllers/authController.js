// import type { Request, Response } from "express";
// import { randomBytes } from "crypto";
// import { 
//   createPendingUser,
//   findPendingUser,
//   removePendingUser,
//   createUser,
//   //users
//   findUserByEmailOrPhone
// } from "../../dbms/packages/user-helpers/user-helpers.ts";
// import { sendOtp, verify } from "../services/otpService.js";
import { randomBytes } from "crypto";
import { createPendingUser, findPendingUser, removePendingUser, createUser, findUserByEmailOrPhone } from "../dbms/src/user-helpers.js"; // relative path from your backend src/controllers/
/* Adjust the import path if your controller is located elsewhere in the project structure */
import { sendOtp, verify } from "../services/otpService.js";
/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req, res) => {
    const { name, phone, email, dob, gender } = req.body;
    if (!name || !dob || !gender || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const requestId = await sendOtp(phone);
    await createPendingUser(name, phone, email, dob, gender, requestId);
    return res.json({ message: "OTP sent", requestId });
};
export const signupVerifyOtp = async (req, res) => {
    const { requestId, otp } = req.body;
    const pendingUser = await findPendingUser(requestId);
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
    await createUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender);
    await removePendingUser(requestId);
    return res.json({ message: "Signup successful" });
};
export const signupResendOtp = async (req, res) => {
    const { requestId } = req.body;
    const pendingUser = await findPendingUser(requestId);
    if (!pendingUser) {
        return res.status(400).json({ error: "Invalid requestId" });
    }
    const newRequestId = await sendOtp(pendingUser.phone);
    await createPendingUser(pendingUser.name, pendingUser.phone, pendingUser.email, pendingUser.dob, pendingUser.gender, newRequestId);
    await removePendingUser(requestId);
    return res.json({ message: "OTP resent", newRequestId });
};
/* ----------------- LOGIN FLOW ----------------- */
export const loginRequestOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
        return res.status(400).json({ error: "Phone required" });
    }
    const user = await findUserByEmailOrPhone(undefined, phone);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    // send OTP
    await sendOtp(phone);
    return res.json({ phone: phone });
};
export const loginVerifyOtp = async (req, res) => {
    const { phone, otp } = req.body;
    const potentialUser = await findUserByEmailOrPhone(undefined, phone);
    if (!potentialUser) {
        return res.status(404).json({ error: "User not found" });
    }
    try {
        const verified = await verify(phone, otp);
        if (!verified) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        const accessToken = randomBytes(16).toString("hex");
        // You may want to update user's accessToken in DB with a helper function
        // For now, just return as part of response
        // If you need to persist, implement updateUser in your helpers
        return res.json({
            message: "Login successful",
            accessToken: accessToken,
            uid: potentialUser.id,
        });
    }
    catch (err) {
        console.error("Error during OTP verification:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }
};
export const loginResendOtp = async (req, res) => {
    const { phone } = req.body;
    const user = await findUserByEmailOrPhone(undefined, phone);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const requestId = await sendOtp(phone);
    return res.json({ requestId: requestId, phone: phone });
};
//# sourceMappingURL=authController.js.map