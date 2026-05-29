import type { Request, Response } from "express";
import pool from "../db.js";
import { createOrder, verifySignature, razorpay } from "../services/razorpayService.js";

export const createTopup = async (req: Request, res: Response) => {
  const { uid, amount } = req.body;

  if (!Number.isInteger(amount) || amount < 100)
    return res.status(400).json({ error: "amount must be an integer >= 100 paise" });

  try {
    const receipt = `wallet_${uid}_${Date.now()}`;
    const order = await createOrder(amount, receipt);

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

  const order = await razorpay.orders.fetch(razorpay_order_id);
  const amount = Number(order.amount);
  if (!amount || amount < 100)
    return res.status(400).json({ error: "Invalid order amount" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Prevent duplicate processing of the same order
    const existing = await client.query(
      `SELECT 1 FROM wallet_transactions WHERE razorpay_order_id = $1 AND status = 'success'`,
      [razorpay_order_id]
    );
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Payment already processed" });
    }

    await client.query(
      `INSERT INTO wallet_transactions (user_id, type, amount_paise, razorpay_order_id, razorpay_payment_id, status)
       VALUES ($1, 'topup', $2, $3, $4, 'success')`,
      [uid, amount, razorpay_order_id, razorpay_payment_id]
    );

    const walletResult = await client.query(
      `SELECT credit_wallet($1::int, $2::bigint) AS balance`,
      [uid, amount]
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
     WHERE user_id = $1 AND status = 'success'
     ORDER BY created_at DESC
     OFFSET $2 LIMIT $3`,
    [uid, a, b - a]
  );
  return res.json(result.rows);
};
