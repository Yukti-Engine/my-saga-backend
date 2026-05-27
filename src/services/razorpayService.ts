import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createOrder(amountPaise: number, receipt: string) {
  return razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
}

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(orderId + "|" + paymentId)
    .digest("hex");
  return expected === signature;
}

export async function createHeldTransfer(
  accountId: string,
  amountPaise: number,
  onHoldUntil: number
) {
  return razorpay.transfers.create({
    account: accountId,
    amount: amountPaise,
    currency: "INR",
    on_hold: 1,
    on_hold_until: onHoldUntil,
  } as any);
}
