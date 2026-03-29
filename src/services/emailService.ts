import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_EMAIL_PASS,
      },
    });
  }
  return transporter;
}

export async function sendJoinRequestAcknowledgement(
  to: string,
  role: "organizer" | "boss",
  reasonToJoin: string,
) {
  const roleLabel = role === "organizer" ? "Organizer" : "Boss";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank you for your interest in joining MySaga!</h2>
      <p>Dear Applicant,</p>
      <p>We have received your request to join MySaga as a <strong>${roleLabel}</strong>.</p>
      <p>Your message:</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #555; margin: 16px 0;">
        "${reasonToJoin}"
      </blockquote>
      <p>
        Our team will carefully review your application. If we find your request worthy of further consideration,
        a member of the MySaga workforce will reach out to you at this email address.
      </p>
      <p>We appreciate your patience and look forward to potentially welcoming you aboard.</p>
      <br />
      <p>Warm regards,</p>
      <p><strong>MySaga Support Team</strong></p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
      <p style="font-size: 12px; color: #999;">This is an automated message from support@mysaga.in. Please do not reply directly to this email.</p>
    </div>
  `;

  await getTransporter().sendMail({
    from: `"MySaga Support" <${process.env.MY_EMAIL}>`,
    to,
    subject: `MySaga ${roleLabel} Join Request — Received`,
    html,
  });
}
