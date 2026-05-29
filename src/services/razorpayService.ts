import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
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

export async function createLinkedAccount(params: {
  name: string;
  email: string;
  phone: string;
  legalBusinessName: string;
  ifsc: string;
  accountNumber: string;
  beneficiaryName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}) {
  const account = await razorpay.accounts.create({
    email: params.email,
    phone: params.phone,
    type: "route",
    legal_business_name: params.legalBusinessName,
    business_type: "individual",
    contact_name: params.name,
    profile: {
      category: "education",
      subcategory: "college",
      addresses: {
        registered: {
          street1: params.street,
          street2: "",
          city: params.city,
          state: params.state,
          postal_code: params.pincode,
          country: "IN",
        },
      },
    },
  } as any);

  // Add bank account via Fund Account API
  await razorpay.fundAccount.create({
    contact_id: account.id,
    account_type: "bank_account",
    bank_account: {
      name: params.beneficiaryName,
      ifsc: params.ifsc,
      account_number: params.accountNumber,
    },
  } as any);

  return account;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
