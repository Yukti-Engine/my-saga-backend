/**
 * mailerService.ts
 *
 * Sends transactional emails via Gmail using OAuth2 + nodemailer.
 * A fresh access token is obtained from Google on every call using the stored
 * refresh token, so there is no need to manage token expiry manually.
 *
 * In staging environments the subject line is prefixed with "(test) "
 * to clearly distinguish test emails from production ones.
 */
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// OAuth2 client configured with app credentials from environment variables
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

export async function sendEmail(to: string, subject: string, body: string) {
  // Exchange the refresh token for a short-lived access token on each send
  const { token } = await oauth2Client.getAccessToken();

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_SENDER_EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: token,
    },
  } as any);

  // Prefix the subject in non-production environments for easy identification
  subject = (process.env.NODE_ENV=="staging"?"(test) ":"")+subject

  await transporter.sendMail({
    from: process.env.GOOGLE_SENDER_EMAIL,
    to,
    subject,
    html: body,
  });
}

/* ================== SCHEDULE EMAILS ================== */

const isStaging = process.env.NODE_ENV !== "production";
const apiBase = isStaging ? "http://localhost:5000" : "https://api.mysaga.in";

function formatDt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

export function scheduleRequestEmail(venueName: string, partnerName: string, token: string, startTime: string, endTime: string) {
  const confirmUrl = `${apiBase}/auth/confirm-schedule?token=${token}`;
  const rejectUrl = `${apiBase}/auth/reject-schedule?token=${token}`;

  const subject = `Schedule Request — ${venueName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:#21a78f;margin-bottom:8px;">New Schedule Request</h2>
      <p>Hi ${partnerName},</p>
      <p>A schedule has been requested at <strong>${venueName}</strong>:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Start</td><td style="padding:6px 0;"><strong>${formatDt(startTime)}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666;">End</td><td style="padding:6px 0;"><strong>${formatDt(endTime)}</strong></td></tr>
      </table>
      <p>Please confirm or reject this booking:</p>
      <div style="margin:24px 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 28px;background:#21a78f;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;margin-right:12px;">Confirm</a>
        <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;background:#b8962e;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Reject</a>
      </div>
      <p style="color:#999;font-size:12px;">If you did not expect this request, you can safely ignore this email.</p>
    </div>`;

  return { subject, html };
}

export function scheduleAcknowledgementEmail(venueName: string, partnerName: string, startTime: string, endTime: string, action: "confirmed" | "rejected") {
  const color = action === "confirmed" ? "#21a78f" : "#b8962e";
  const subject = `Schedule ${action === "confirmed" ? "Confirmed" : "Rejected"} — ${venueName}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="color:${color};margin-bottom:8px;">Schedule ${action === "confirmed" ? "Confirmed" : "Rejected"}</h2>
      <p>Hi ${partnerName},</p>
      <p>You have <strong>${action}</strong> the following schedule at <strong>${venueName}</strong>:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:6px 16px 6px 0;color:#666;">Start</td><td style="padding:6px 0;"><strong>${formatDt(startTime)}</strong></td></tr>
        <tr><td style="padding:6px 16px 6px 0;color:#666;">End</td><td style="padding:6px 0;"><strong>${formatDt(endTime)}</strong></td></tr>
      </table>
      <p style="color:#999;font-size:12px;">This is an automated confirmation from MySaga.</p>
    </div>`;

  return { subject, html };
}