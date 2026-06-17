/**
 * promoController.ts
 *
 * Promo code feature.
 *   - Admin CRUD handlers (create/list/update/delete) — guarded by authSuperToken.
 *   - A read-only preview endpoint for users to check a code before joining.
 *   - reservePromoCode / releasePromoCode / recordRedemption helpers used by
 *     userController.joinAdventure to apply and account for a discount.
 *
 * Discounts come in two shapes: a flat rupee amount (stored as paise) or a
 * percentage (with an optional max cap in paise). See src/sql/promo_codes.sql.
 */
import type { Request, Response } from "express";
import pool from "../db.js";
import type { PoolClient } from "pg";
import { lobbyCostPaise } from "../utils.js";
import { validatePromoCode } from "../validators.js";

export type PromoRow = {
  id: number;
  code: string;
  discount_type: "flat" | "percent";
  flat_off_paise: string | number | null;
  percent_off: string | number | null;
  max_discount_paise: string | number | null;
  expires_at: string | null;
  active: boolean;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
};

/** Discount in paise this code yields against a base cost, clamped to [0, baseCostPaise]. */
export function computeDiscountPaise(p: PromoRow, baseCostPaise: number): number {
  let discount: number;
  if (p.discount_type === "flat") {
    discount = Number(p.flat_off_paise);
  } else {
    discount = Math.round((baseCostPaise * Number(p.percent_off)) / 100);
    if (p.max_discount_paise != null)
      discount = Math.min(discount, Number(p.max_discount_paise));
  }
  // A discount can never exceed the cost (no negative charges / credits).
  return Math.max(0, Math.min(discount, baseCostPaise));
}

export type ReserveResult =
  | { ok: true; promoCodeId: number; code: string; discountPaise: number }
  | { ok: false; error: string };

/**
 * Validates `code` for `userId` against `baseCostPaise` and, if valid, atomically
 * reserves one use (increments used_count under a row lock). The caller MUST
 * either recordRedemption (on a successful join) or releasePromoCode (on
 * failure/refund) afterwards. Returns the computed discount in paise.
 */
export async function reservePromoCode(
  code: string,
  userId: number,
  baseCostPaise: number
): Promise<ReserveResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<PromoRow>(
      `SELECT * FROM promo_codes WHERE code = $1 FOR UPDATE`,
      [code]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Invalid promo code" };
    }
    const p = rows[0]!;

    if (!p.active) {
      await client.query("ROLLBACK");
      return { ok: false, error: "This promo code is no longer active" };
    }
    if (p.expires_at != null && new Date(p.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false, error: "This promo code has expired" };
    }
    if (p.usage_limit != null && p.used_count >= p.usage_limit) {
      await client.query("ROLLBACK");
      return { ok: false, error: "This promo code has reached its usage limit" };
    }

    const { rows: usedRows } = await client.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM promo_code_redemptions WHERE promo_code_id = $1 AND user_id = $2`,
      [p.id, userId]
    );
    if (usedRows[0]!.c >= p.per_user_limit) {
      await client.query("ROLLBACK");
      return { ok: false, error: "You have already used this promo code" };
    }

    const discountPaise = computeDiscountPaise(p, baseCostPaise);

    await client.query(`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1`, [p.id]);
    await client.query("COMMIT");
    return { ok: true, promoCodeId: p.id, code: p.code, discountPaise };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Undo a reservation when the join ultimately fails / is refunded. */
export async function releasePromoCode(promoCodeId: number): Promise<void> {
  await pool.query(
    `UPDATE promo_codes SET used_count = GREATEST(used_count - 1, 0) WHERE id = $1`,
    [promoCodeId]
  );
}

/** Record a redemption row once a join has succeeded (used by the per-user limit + audit). */
export async function recordRedemption(
  promoCodeId: number,
  userId: number,
  matchRequestId: number | null,
  discountPaise: number,
  client?: PoolClient
): Promise<void> {
  const q = client ?? pool;
  await q.query(
    `INSERT INTO promo_code_redemptions (promo_code_id, user_id, match_request_id, discount_paise)
     VALUES ($1, $2, $3, $4)`,
    [promoCodeId, userId, matchRequestId, discountPaise]
  );
}

/* ─────────────────── USER: preview a code before joining ─────────────────── */

/**
 * POST /user/validate-promo  { uid, accessToken, promoCode, payPerHead }
 * Read-only check (no reservation). Returns whether the code is valid for this
 * user and, if `payPerHead` is supplied, the discount it would yield.
 */
export const previewPromoCode = async (req: Request, res: Response) => {
  const { uid, payPerHead } = req.body;
  const codeV = validatePromoCode(req.body.promoCode);
  if (!codeV.ok) return res.status(400).json({ valid: false, error: codeV.error });

  const { rows } = await pool.query<PromoRow>(
    `SELECT * FROM promo_codes WHERE code = $1`,
    [codeV.value]
  );
  if (rows.length === 0)
    return res.status(404).json({ valid: false, error: "Invalid promo code" });
  const p = rows[0]!;

  if (!p.active)
    return res.json({ valid: false, error: "This promo code is no longer active" });
  if (p.expires_at != null && new Date(p.expires_at).getTime() <= Date.now())
    return res.json({ valid: false, error: "This promo code has expired" });
  if (p.usage_limit != null && p.used_count >= p.usage_limit)
    return res.json({ valid: false, error: "This promo code has reached its usage limit" });

  const { rows: usedRows } = await pool.query<{ c: number }>(
    `SELECT count(*)::int AS c FROM promo_code_redemptions WHERE promo_code_id = $1 AND user_id = $2`,
    [p.id, uid]
  );
  if (usedRows[0]!.c >= p.per_user_limit)
    return res.json({ valid: false, error: "You have already used this promo code" });

  const out: Record<string, unknown> = {
    valid: true,
    code: p.code,
    discountType: p.discount_type,
    flatOffPaise: p.flat_off_paise != null ? Number(p.flat_off_paise) : null,
    percentOff: p.percent_off != null ? Number(p.percent_off) : null,
    maxDiscountPaise: p.max_discount_paise != null ? Number(p.max_discount_paise) : null,
    expiresAt: p.expires_at,
  };
  if (Number.isFinite(payPerHead) && payPerHead >= 0) {
    const baseCostPaise = lobbyCostPaise(Number(payPerHead));
    const discountPaise = computeDiscountPaise(p, baseCostPaise);
    out.baseCostPaise = baseCostPaise;
    out.discountPaise = discountPaise;
    out.finalCostPaise = baseCostPaise - discountPaise;
  }
  return res.json(out);
};

/**
 * POST /auth/promo-usage  { promoCode }
 * Public. For a valid existing code, returns how many distinct users have
 * redeemed it. 404 if the code does not exist.
 */
export const getPromoUserCount = async (req: Request, res: Response) => {
  const codeV = validatePromoCode(req.body.promoCode ?? req.body.promo_code);
  if (!codeV.ok) return res.status(400).json({ error: codeV.error });

  const { rows } = await pool.query<{ user_count: number; used_count: number }>(
    `SELECT pc.used_count,
            COUNT(DISTINCT r.user_id)::int AS user_count
     FROM promo_codes pc
     LEFT JOIN promo_code_redemptions r ON r.promo_code_id = pc.id
     WHERE pc.code = $1
     GROUP BY pc.id`,
    [codeV.value]
  );
  if (rows.length === 0)
    return res.status(404).json({ error: "Invalid promo code" });

  return res.json({ code: codeV.value, userCount: rows[0]!.user_count });
};

/* ─────────────────── ADMIN: CRUD ─────────────────── */

export const listPromoCodes = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, code, discount_type, flat_off_paise, percent_off, max_discount_paise,
              expires_at, active, usage_limit, used_count, per_user_limit, created_at
       FROM promo_codes ORDER BY created_at DESC`
    );
    return res.json({ promoCodes: rows });
  } catch (err) {
    console.error("Error in listPromoCodes:", err);
    return res.status(500).json({ error: "Failed to fetch promo codes" });
  }
};

export const createPromoCode = async (req: Request, res: Response) => {
  const codeV = validatePromoCode(req.body.code);
  if (!codeV.ok) return res.status(400).json({ error: codeV.error });

  const { discountType, expiresAt, usageLimit, perUserLimit } = req.body;
  if (discountType !== "flat" && discountType !== "percent")
    return res.status(400).json({ error: "discountType must be 'flat' or 'percent'" });

  // Discount value: flat takes rupees off; percent takes a 0–100 percentage.
  let flatOffPaise: number | null = null;
  let percentOff: number | null = null;
  let maxDiscountPaise: number | null = null;

  if (discountType === "flat") {
    const rupees = Number(req.body.flatOffRupees);
    if (!Number.isFinite(rupees) || rupees <= 0)
      return res.status(400).json({ error: "flatOffRupees must be a positive number" });
    flatOffPaise = Math.round(rupees * 100);
  } else {
    const pct = Number(req.body.percentOff);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100)
      return res.status(400).json({ error: "percentOff must be a number between 0 and 100" });
    percentOff = pct;
    if (req.body.maxDiscountRupees != null && req.body.maxDiscountRupees !== "") {
      const cap = Number(req.body.maxDiscountRupees);
      if (!Number.isFinite(cap) || cap <= 0)
        return res.status(400).json({ error: "maxDiscountRupees must be a positive number" });
      maxDiscountPaise = Math.round(cap * 100);
    }
  }

  let expiresAtIso: string | null = null;
  if (expiresAt != null && expiresAt !== "") {
    const t = new Date(expiresAt);
    if (Number.isNaN(t.getTime()))
      return res.status(400).json({ error: "Invalid expiresAt timestamp" });
    expiresAtIso = t.toISOString();
  }

  let usageLimitVal: number | null = null;
  if (usageLimit != null && usageLimit !== "") {
    if (!Number.isInteger(usageLimit) || usageLimit <= 0)
      return res.status(400).json({ error: "usageLimit must be a positive integer" });
    usageLimitVal = usageLimit;
  }

  let perUserLimitVal = 1;
  if (perUserLimit != null && perUserLimit !== "") {
    if (!Number.isInteger(perUserLimit) || perUserLimit <= 0)
      return res.status(400).json({ error: "perUserLimit must be a positive integer" });
    perUserLimitVal = perUserLimit;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO promo_codes
         (code, discount_type, flat_off_paise, percent_off, max_discount_paise, expires_at, usage_limit, per_user_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [codeV.value, discountType, flatOffPaise, percentOff, maxDiscountPaise, expiresAtIso, usageLimitVal, perUserLimitVal]
    );
    return res.json({ message: "Promo code created", id: rows[0].id, code: codeV.value });
  } catch (err: any) {
    if (err?.code === "23505")
      return res.status(409).json({ error: "A promo code with that code already exists" });
    console.error("Error in createPromoCode:", err);
    return res.status(500).json({ error: "Failed to create promo code" });
  }
};

/** Update the mutable fields of a promo code: active toggle and/or expiry. */
export const updatePromoCode = async (req: Request, res: Response) => {
  const { id, active, expiresAt } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });

  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (active !== undefined) {
    if (typeof active !== "boolean")
      return res.status(400).json({ error: "active must be a boolean" });
    sets.push(`active = $${i++}`);
    params.push(active);
  }
  if (expiresAt !== undefined) {
    if (expiresAt === null || expiresAt === "") {
      sets.push(`expires_at = $${i++}`);
      params.push(null);
    } else {
      const t = new Date(expiresAt);
      if (Number.isNaN(t.getTime()))
        return res.status(400).json({ error: "Invalid expiresAt timestamp" });
      sets.push(`expires_at = $${i++}`);
      params.push(t.toISOString());
    }
  }

  if (sets.length === 0)
    return res.status(400).json({ error: "Nothing to update" });

  params.push(id);
  try {
    const { rowCount } = await pool.query(
      `UPDATE promo_codes SET ${sets.join(", ")} WHERE id = $${i}`,
      params
    );
    if (rowCount === 0) return res.status(404).json({ error: "Promo code not found" });
    return res.json({ message: "Promo code updated", id });
  } catch (err) {
    console.error("Error in updatePromoCode:", err);
    return res.status(500).json({ error: "Failed to update promo code" });
  }
};

/**
 * POST /admin/cleanup-expired-promo-codes
 * Optional housekeeping: removes codes that expired more than 90 days ago
 * (cascades their redemption history). Expiry itself is enforced live at
 * redemption time, so this is purely to keep the table tidy — not required for
 * correctness. Safe to wire to a Cloud Scheduler job.
 */
export const cleanupExpiredPromoCodes = async (_req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM promo_codes WHERE expires_at IS NOT NULL AND expires_at < NOW() - INTERVAL '90 days'`
    );
    return res.json({ success: true, deleted: rowCount });
  } catch (err) {
    console.error("Error in cleanupExpiredPromoCodes:", err);
    return res.status(500).json({ error: "Failed to clean up promo codes" });
  }
};

export const deletePromoCode = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!Number.isInteger(id) || id <= 0)
    return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rowCount } = await pool.query(`DELETE FROM promo_codes WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Promo code not found" });
    return res.json({ message: "Promo code deleted", id });
  } catch (err) {
    console.error("Error in deletePromoCode:", err);
    return res.status(500).json({ error: "Failed to delete promo code" });
  }
};
