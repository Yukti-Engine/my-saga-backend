/**
 * validators.ts
 *
 * Pure validation helpers used across all controllers.
 * Each function takes a raw (unknown) input and returns a
 * ValidationResult — either `{ ok: true, value }` or `{ ok: false, error }`.
 * No side effects; safe to call at the top of any handler.
 */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateName(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid name" };
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2 || cleaned.length > 40)
    return { ok: false, error: "Name must be 2-40 characters" };
  return { ok: true, value: cleaned };
}

export function validatePhone(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid phone" };
  if (!/^\+[0-9]+$/.test(raw) || raw.length > 180)
    return { ok: false, error: "Phone must start with + followed by digits, max 180 chars" };
  return { ok: true, value: raw };
}

export function validateEmail(raw: unknown, required: boolean): ValidationResult<string | null> {
  if (raw === undefined || raw === null || raw === "") {
    if (required) return { ok: false, error: "Email is required" };
    return { ok: true, value: null };
  }
  if (typeof raw !== "string") return { ok: false, error: "Invalid email" };
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.length > 254)
    return { ok: false, error: "Email must be at most 254 characters" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned))
    return { ok: false, error: "Invalid email format" };
  return { ok: true, value: cleaned };
}

export function validateDob(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw))
    return { ok: false, error: "DOB must be YYYY-MM-DD" };
  const dob = new Date(raw + "T00:00:00Z");
  if (Number.isNaN(dob.getTime()))
    return { ok: false, error: "Invalid DOB" };
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const hasHadBirthday =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate());
  if (!hasHadBirthday) age--;
  if (age < 18 || age > 100)
    return { ok: false, error: "Age must be between 18 and 100" };
  return { ok: true, value: raw };
}

export function validateGender(raw: unknown): ValidationResult<"M" | "F" | "NB"> {
  if (raw === "M" || raw === "F" || raw === "NB")
    return { ok: true, value: raw };
  return { ok: false, error: "Gender must be M, F, or NB" };
}

export function validateRequestId(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 100)
    return { ok: false, error: "Invalid requestId" };
  return { ok: true, value: raw };
}

export function validateOtp(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string" || !/^\d{6}$/.test(raw))
    return { ok: false, error: "OTP must be 6 digits" };
  return { ok: true, value: raw };
}

export function validateUsername(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid username" };
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.length < 8 || cleaned.length > 32)
    return { ok: false, error: "Username must be 8-32 characters" };
  if (!/^[a-z0-9_]+$/.test(cleaned))
    return { ok: false, error: "Username may only contain lowercase letters, digits, and underscore" };
  return { ok: true, value: cleaned };
}

export function validateBio(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid bio" };
  const cleaned = raw.trim();
  if (/[\r\n]/.test(cleaned))
    return { ok: false, error: "Bio may not contain newlines" };
  if (cleaned.length > 500)
    return { ok: false, error: "Bio must be at most 500 characters" };
  return { ok: true, value: cleaned };
}

export function validateBoolean(raw: unknown, field: string): ValidationResult<boolean> {
  if (typeof raw !== "boolean") return { ok: false, error: `${field} must be a boolean` };
  return { ok: true, value: raw };
}

export function validateBoundedText(
  raw: unknown,
  field: string,
  min: number,
  max: number,
  opts: { allowNewlines?: boolean } = {}
): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: `Invalid ${field}` };
  const cleaned = raw.trim();
  if (!opts.allowNewlines && /[\r\n]/.test(cleaned))
    return { ok: false, error: `${field} may not contain newlines` };
  if (cleaned.length < min || cleaned.length > max)
    return { ok: false, error: `${field} must be ${min}-${max} characters` };
  return { ok: true, value: cleaned };
}

export function validateHttpUrl(raw: unknown, field: string, max: number): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: `Invalid ${field}` };
  const cleaned = raw.trim();
  if (cleaned.length > max)
    return { ok: false, error: `${field} must be at most ${max} characters` };
  try {
    const u = new URL(cleaned);
    if (u.protocol !== "http:" && u.protocol !== "https:")
      return { ok: false, error: `${field} must be http or https` };
  } catch {
    return { ok: false, error: `Invalid ${field} URL` };
  }
  return { ok: true, value: cleaned };
}

export function validateFutureTimestamp(raw: unknown, field: string): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: `Invalid ${field}` };
  const t = new Date(raw);
  if (Number.isNaN(t.getTime()))
    return { ok: false, error: `Invalid ${field} timestamp` };
  if (t.getTime() <= Date.now())
    return { ok: false, error: `${field} must be in the future` };
  return { ok: true, value: raw };
}

export function validatePositiveInt(raw: unknown, field: string): ValidationResult<number> {
  if (!Number.isInteger(raw) || (raw as number) <= 0)
    return { ok: false, error: `${field} must be a positive integer` };
  return { ok: true, value: raw as number };
}

export function validateIntRange(raw: unknown, field: string, min: number, max: number): ValidationResult<number> {
  if (!Number.isInteger(raw) || (raw as number) < min || (raw as number) > max)
    return { ok: false, error: `${field} must be an integer between ${min} and ${max}` };
  return { ok: true, value: raw as number };
}

export function validateFloatRange(raw: unknown, field: string, min: number, max: number): ValidationResult<number> {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < min || raw > max)
    return { ok: false, error: `${field} must be a number between ${min} and ${max}` };
  return { ok: true, value: raw };
}

export function validateDateString(raw: unknown, field: string): ValidationResult<string> {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw))
    return { ok: false, error: `${field} must be a valid date (YYYY-MM-DD)` };
  const d = new Date(raw + "T00:00:00Z");
  if (Number.isNaN(d.getTime()))
    return { ok: false, error: `${field} is not a real date` };
  return { ok: true, value: raw };
}

export function validateTimeString(raw: unknown, field: string): ValidationResult<string> {
  if (typeof raw !== "string" || !/^\d{2}:\d{2}$/.test(raw))
    return { ok: false, error: `${field} must be a valid time (HH:MM)` };
  const parts = raw.split(":").map(Number);
  const h = parts[0]!, m = parts[1]!;
  if (h < 0 || h > 23 || m < 0 || m > 59)
    return { ok: false, error: `${field} is not a valid time` };
  return { ok: true, value: raw };
}

export function validatePassword(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid password" };
  if (raw.trim().length === 0)
    return { ok: false, error: "Password must not be empty" };
  if (raw.length < 8 || raw.length > 128)
    return { ok: false, error: "Password must be 8-128 characters" };
  return { ok: true, value: raw };
}

export function validateReasonToJoin(raw: unknown): ValidationResult<string> {
  if (typeof raw !== "string") return { ok: false, error: "Invalid reasonToJoin" };
  const cleaned = raw.trim();
  if (cleaned.length < 20 || cleaned.length > 2000)
    return { ok: false, error: "reasonToJoin must be 20-2000 characters" };
  return { ok: true, value: cleaned };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
