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