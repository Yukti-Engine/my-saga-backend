import axios from "axios";

export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  const { data } = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    { params: { secret: process.env.RECAPTCHA_API_KEY, response: token } }
  );
  if (!data.success) console.error("reCAPTCHA failed:", data["error-codes"]);
  return data.success && data.score >= 0.5;
}
