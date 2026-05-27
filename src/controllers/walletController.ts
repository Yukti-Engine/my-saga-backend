import type { Request, Response } from "express";
import pool from "../db.js";
import { createOrder, verifySignature } from "../services/razorpayService.js";

export const createTopup = async (req: Request, res: Response) => {
  const { uid, amount } = req.body;

  if (!Number.isInteger(amount) || amount < 100)
    return res.status(400).json({ error: "amount must be an integer >= 100 paise" });

  try {
    const receipt = `wallet_${uid}_${Date.now()}`;
    const order = await createOrder(amount, receipt);

    await pool.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_paise, razorpay_order_id, status)
       VALUES ($1, 'topup', $2, $3, 'created')`,
      [uid, amount, order.id]
    );

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error("Razorpay createOrder failed:", err);
    return res.status(500).json({ error: "Payment gateway error" });
  }
};

export const verifyTopup = async (req: Request, res: Response) => {
  const { uid, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
    return res.status(400).json({ error: "Missing payment verification fields" });

  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature))
    return res.status(400).json({ error: "Signature mismatch" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const txResult = await client.query(
      `UPDATE wallet_transactions
       SET status = 'success', razorpay_payment_id = $1
       WHERE razorpay_order_id = $2 AND user_id = $3 AND status = 'created'
       RETURNING amount_paise`,
      [razorpay_payment_id, razorpay_order_id, uid]
    );

    if (txResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Transaction not found or already processed" });
    }

    const amountPaise = txResult.rows[0].amount_paise;
    const walletResult = await client.query(
      `SELECT credit_wallet($1::int, $2::bigint) AS balance`,
      [uid, amountPaise]
    );

    await client.query("COMMIT");
    return res.json({ success: true, balance: walletResult.rows[0].balance });
  } catch (err: any) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getBalance = async (req: Request, res: Response) => {
  const { uid } = req.body;
  const result = await pool.query(
    `SELECT ensure_wallet($1::int) AS balance`,
    [uid]
  );
  return res.json({ balance: result.rows[0].balance });
};

export const getTransactions = async (req: Request, res: Response) => {
  const { uid, a, b } = req.body;

  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || a >= b)
    return res.status(400).json({ error: "Invalid pagination: a and b must be integers with a < b" });

  const result = await pool.query(
    `SELECT id, type, amount_paise, razorpay_order_id, match_request_id, status, created_at
     FROM wallet_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     OFFSET $2 LIMIT $3`,
    [uid, a, b - a]
  );
  return res.json(result.rows);
};
