import { randomBytes } from "crypto";
import pool from "../dbms/db.js";
import { findPendingUser, removePendingUser, findUserByPhone, updateAccessToken } from "../dbms/user-helpers.js";
import { sendOtp, verify } from "../services/otpService.js";
import { createPendingUser, createUser } from "../dbms/auth-helpers.js";
import { getOrganizerByEmail, updateAccessToken as updateAccessTokenForOrganizer } from "../dbms/organizer-helpers.js";
import { getBossByEmail, updateAccessToken as updateAccessTokenForBoss } from "../dbms/boss-helpers.js";
const adjectives = [
    "anonymous",
    "brave",
    "happy",
    "silly",
    "fast",
    "tiny",
    "cool"
];
const nouns = [
    "whale",
    "kid",
    "carrot",
    "lion",
    "robot",
    "panda",
    "gamer"
];
export function generateRandomUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective} ${noun}`;
}
/* ----------------- SIGNUP FLOW ----------------- */
export const signupRequestOtp = async (req, res) => {
    const { name, phone, email, dob, gender } = req.body;
    if (!name || !dob || !gender || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const requestId = await sendOtp(phone);
        await createPendingUser(name, phone, email, dob, gender, requestId, pool);
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
        const pendingUser = await findPendingUser(requestId, pool);
        if (!pendingUser)
            return res.status(400).json({ error: "Invalid requestId" });
        if (pendingUser.expires_at < new Date()) {
            return res.status(400).json({ error: "OTP expired" });
        }
        const verified = await verify(pendingUser.phone, otp);
        if (!verified)
            return res.status(400).json({ error: "Invalid OTP" });
        await createUser(pendingUser.name, pendingUser.phone, pendingUser.email, new Date(pendingUser.dob), pendingUser.gender, pool);
        await removePendingUser(requestId, pool);
        return res.json({ message: "Signup successful" });
    }
    catch (err) {
        console.error("Error in signupVerifyOtp:", err);
        return res.status(500).json({ error: "Verification failed" });
    }
};
export const signupResendOtp = async (req, res) => {
    const { name, phone, email, dob, gender } = req.body;
    if (!name || !dob || !gender || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const requestId = await sendOtp(phone);
        await createPendingUser(name, phone, email, dob, gender, requestId, pool);
        return res.json({ message: "OTP sent", requestId });
    }
    catch (err) {
        console.error("Error in signupRequestOtp:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
};
/* ----------------- LOGIN FLOW ----------------- */
export const loginRequestOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone)
        return res.status(400).json({ error: "Phone required" });
    try {
        const user = await findUserByPhone(phone, pool);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        await sendOtp(phone);
        return res.json({ message: "OTP sent", phone });
    }
    catch (err) {
        console.error("Error in loginRequestOtp:", err);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
};
export const loginResendOtp = async (req, res) => {
    const { phone } = req.body;
    if (!phone)
        return res.status(400).json({ error: "Phone required" });
    try {
        const user = await findUserByPhone(phone, pool);
        if (!user)
            return res.status(404).json({ error: "User not found" });
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
        const potentialUser = await findUserByPhone(phone, pool);
        if (!potentialUser)
            return res.status(404).json({ error: "User not found" });
        const verified = await verify(phone, otp);
        if (!verified)
            return res.status(400).json({ error: "Invalid or expired OTP" });
        const accessToken = randomBytes(16).toString("hex");
        const updatedUser = await updateAccessToken(potentialUser.id, accessToken, pool);
        return res.json({
            message: "Login successful",
            accessToken,
            uid: updatedUser.id,
        });
    }
    catch (err) {
        console.error("Error in loginVerifyOtp:", err);
        return res.status(500).json({ error: "OTP verification failed" });
    }
};
export const organizerLogin = async (req, res) => {
    const { email, password } = req.body;
    const organizer = await getOrganizerByEmail(email, pool);
    const encode = (text) => {
        return Buffer.from(text, "utf8").toString("base64");
    };
    if (organizer)
        if (organizer.password == encode(password)) {
            const organizerDetails = await updateAccessTokenForOrganizer(organizer.id, randomBytes(16).toString("hex"), pool);
            organizerDetails.password = password;
            return res.json(organizerDetails);
        }
        else
            return res.status(500).json({ "error": "Password does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const bossLogin = async (req, res) => {
    const { email, password } = req.body;
    const boss = await getBossByEmail(email, pool);
    const encode = (text) => {
        return Buffer.from(text, "utf8").toString("base64");
    };
    if (boss)
        if (boss.password == encode(password)) {
            const bossDetails = await updateAccessTokenForBoss(boss.id, randomBytes(16).toString("hex"), pool);
            bossDetails.password = password;
            return res.json(bossDetails);
        }
        else
            return res.status(500).json({ "error": "Password does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
//# sourceMappingURL=authController.js.map