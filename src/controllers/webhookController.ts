import type { Request, Response } from "express";
import axios from "axios";
import pool from "../db.js";
import { verifyWebhookSignature } from "../services/razorpayService.js";

export const razorpayWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const rawBody = (req as any).rawBody as string | undefined;

  if (!signature || !rawBody)
    return res.status(400).json({ error: "Missing signature or body" });

  if (process.env.RAZORPAY_WEBHOOK_SECRET === "staging") {
    const resp = await axios.post("https://api.mysaga.in/razorpay/webhook", rawBody, {
      headers: { "content-type": "application/json", "x-razorpay-signature": signature },
    });
    return res.status(resp.status).json(resp.data);
  }

  if (!verifyWebhookSignature(rawBody, signature))
    return res.status(400).json({ error: "Invalid signature" });

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const eventType: string = event.event;

  if (eventType === "transfer.processed") {
    const transfer = event.payload?.transfer?.entity;
    if (transfer?.id) {
      await pool.query(
        `UPDATE payouts SET status = 'held'::payout_status WHERE razorpay_transfer_id = $1`,
        [transfer.id]
      );
    }
  }

  if (eventType === "transfer.failed") {
    const transfer = event.payload?.transfer?.entity;
    if (transfer?.id) {
      await pool.query(
        `UPDATE payouts SET status = 'failed'::payout_status WHERE razorpay_transfer_id = $1`,
        [transfer.id]
      );
    }
  }

  if (eventType === "settlement.processed") {
    const transferId = event.payload?.transfer?.entity?.id;
    if (transferId) {
      await pool.query(
        `UPDATE payouts SET status = 'released'::payout_status WHERE razorpay_transfer_id = $1`,
        [transferId]
      );
    }
  }

  return res.json({ status: "ok" });
};
