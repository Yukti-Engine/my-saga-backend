// import nodemailer from "nodemailer";
// import { randomBytes } from "crypto";
// import type { Request, Response } from "express";
// /* ----------------- SMTP MAIL SETUP ----------------- */
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.MY_EMAIL,       // your email
//     pass: process.env.MY_EMAIL_PASS,  // app password
//   },
// });
// /* ----------------- TEMP STORAGE ----------------- */
// const pendingOrganisers: { email: string; phone: string; reason: string }[] = [];
// const pendingBosses: { email: string; phone: string; reason: string }[] = [];
// /* ----------------- ORGANISER SIGNUP ----------------- */
// export const organiserSignup = async (req: Request, res: Response) => {
//   const { phone, email, reason } = req.body;
//   if (!phone || !email || !reason) {
//     return res.status(400).json({ error: "All fields are required" });
//   }
//   // Add to pending list
//   pendingOrganisers.push({ phone, email, reason });
//   // Send confirmation email
//   const mailOptions = {
//     from: process.env.MY_EMAIL,
//     to: email,
//     subject: "Event Organizer Request Received",
//     text: `Hello,\n\nThe request you made for becoming an event organizer is being processed. We will connect with you shortly.\n\nThank you,\nTeam`,
//   };
//   try {
//     await transporter.sendMail(mailOptions);
//     return res.json({
//       message: "Request submitted successfully. Confirmation email sent.",
//     });
//   } catch (error) {
//     console.error("Mail error:", error);
//     return res.status(500).json({ error: "Failed to send email" });
//   }
// };
// /* ----------------- BOSS SIGNUP ----------------- */
// export const bossSignup = async (req: Request, res: Response) => {
//   const { phone, email, reason } = req.body;
//   if (!phone || !email || !reason) {
//     return res.status(400).json({ error: "All fields are required" });
//   }
//   // Add to pending list
//   pendingBosses.push({ phone, email, reason });
//   // Send confirmation email
//   const mailOptions = {
//     from: process.env.MY_EMAIL,
//     to: email,
//     subject: "Boss Registration Request Received",
//     text: `Hello,\n\nThe request you made for becoming a boss is being processed. We will connect with you shortly.\n\nThank you,\nTeam`,
//   };
//   try {
//     await transporter.sendMail(mailOptions);
//     return res.json({
//       message: "Request submitted successfully. Confirmation email sent.",
//     });
//   } catch (error) {
//     console.error("Mail error:", error);
//     return res.status(500).json({ error: "Failed to send email" });
//   }
// };
// /* ----------------- ORGANISER LOGIN ----------------- */
// export const organiserLogin = async (req: Request, res: Response) => {
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ error: "Email is required" });
//   }
//   // Check if organiser exists in pending list (simulate approval)
//   const organiser = pendingOrganisers.find((o) => o.email === email);
//   if (!organiser) {
//     return res.status(404).json({ error: "Organiser not found or not approved yet" });
//   }
//   const accessToken = randomBytes(16).toString("hex");
//   return res.json({
//     message: "Login successful",
//     accessToken,
//   });
// };
// /* ----------------- BOSS LOGIN ----------------- */
// export const bossLogin = async (req: Request, res: Response) => {
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ error: "Email is required" });
//   }
//   // Check if boss exists in pending list (simulate approval)
//   const boss = pendingBosses.find((b) => b.email === email);
//   if (!boss) {
//     return res.status(404).json({ error: "Boss not found or not approved yet" });
//   }
//   const accessToken = randomBytes(16).toString("hex");
//   return res.json({
//     message: "Login successful",
//     accessToken,
//   });
// };
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
/* ----------------- SMTP MAIL SETUP ----------------- */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MY_EMAIL, // your email
        pass: process.env.MY_EMAIL_PASS, // app password
    },
});
/* ----------------- TEMP STORAGE ----------------- */
const pendingOrganisers = [];
const pendingBosses = [];
/* ----------------- DB SIMULATION ----------------- */
const organisersTable = [];
const bossesTable = [];
/* ----------------- ORGANISER SIGNUP ----------------- */
export const organiserSignup = async (req, res) => {
    const { phone, email, reason } = req.body;
    if (!phone || !email || !reason) {
        return res.status(400).json({ error: "All fields are required" });
    }
    pendingOrganisers.push({ phone, email, reason });
    const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Event Organizer Request Received",
        text: `Hello,\n\nThe request you made for becoming an event organizer is being processed. We will connect with you shortly.\n\nThank you,\nTeam`,
    };
    try {
        await transporter.sendMail(mailOptions);
        return res.json({ message: "Request submitted successfully. Confirmation email sent." });
    }
    catch (error) {
        console.error("Mail error:", error);
        return res.status(500).json({ error: "Failed to send email" });
    }
};
/* ----------------- BOSS SIGNUP ----------------- */
export const bossSignup = async (req, res) => {
    const { phone, email, reason } = req.body;
    if (!phone || !email || !reason) {
        return res.status(400).json({ error: "All fields are required" });
    }
    pendingBosses.push({ phone, email, reason });
    const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Boss Registration Request Received",
        text: `Hello,\n\nThe request you made for becoming a boss is being processed. We will connect with you shortly.\n\nThank you,\nTeam`,
    };
    try {
        await transporter.sendMail(mailOptions);
        return res.json({ message: "Request submitted successfully. Confirmation email sent." });
    }
    catch (error) {
        console.error("Mail error:", error);
        return res.status(500).json({ error: "Failed to send email" });
    }
};
/* ----------------- LOGIN ----------------- */
export const organiserLogin = async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email is required" });
    const organiser = organisersTable.find((o) => o.email === email);
    if (!organiser)
        return res.status(404).json({ error: "Organiser not found or not approved yet" });
    const accessToken = randomBytes(16).toString("hex");
    return res.json({ message: "Login successful", accessToken });
};
export const bossLogin = async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email is required" });
    const boss = bossesTable.find((b) => b.email === email);
    if (!boss)
        return res.status(404).json({ error: "Boss not found or not approved yet" });
    const accessToken = randomBytes(16).toString("hex");
    return res.json({ message: "Login successful", accessToken });
};
/* ----------------- APPROVE ORGANISER ----------------- */
export const approveOrganiser = async (req, res) => {
    const { email, securityKey } = req.body;
    if (securityKey !== "Babycorn")
        return res.status(403).json({ error: "Invalid security key" });
    const pending = pendingOrganisers.find((o) => o.email === email);
    if (!pending)
        return res.status(404).json({ error: "Pending organiser not found" });
    // Generate random password
    const password = randomBytes(8).toString("hex");
    // Add to organisers table
    organisersTable.push({ ...pending, password });
    // Remove from pending
    const index = pendingOrganisers.findIndex((o) => o.email === email);
    if (index !== -1)
        pendingOrganisers.splice(index, 1);
    // Send approval email
    const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Organiser Request Approved",
        text: `Hello,\n\nYour request to become an event organiser has been approved!\nYour temporary password: ${password}\n\nPlease login and change your password.\n\nThank you,\nTeam`,
    };
    try {
        await transporter.sendMail(mailOptions);
        return res.json({ message: "Organiser approved and email sent" });
    }
    catch (error) {
        console.error("Mail error:", error);
        return res.status(500).json({ error: "Failed to send approval email" });
    }
};
/* ----------------- APPROVE BOSS ----------------- */
export const approveBoss = async (req, res) => {
    const { email, securityKey } = req.body;
    if (securityKey !== "Babycorn")
        return res.status(403).json({ error: "Invalid security key" });
    const pending = pendingBosses.find((b) => b.email === email);
    if (!pending)
        return res.status(404).json({ error: "Pending boss not found" });
    const password = randomBytes(8).toString("hex");
    bossesTable.push({ ...pending, password });
    const index = pendingBosses.findIndex((b) => b.email === email);
    if (index !== -1)
        pendingBosses.splice(index, 1);
    const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Boss Request Approved",
        text: `Hello,\n\nYour request to become a boss has been approved!\nYour temporary password: ${password}\n\nPlease login and change your password.\n\nThank you,\nTeam`,
    };
    try {
        await transporter.sendMail(mailOptions);
        return res.json({ message: "Boss approved and email sent" });
    }
    catch (error) {
        console.error("Mail error:", error);
        return res.status(500).json({ error: "Failed to send approval email" });
    }
};
//# sourceMappingURL=authOrgBossController.js.map