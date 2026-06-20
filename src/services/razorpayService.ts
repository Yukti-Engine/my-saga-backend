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
  // 1. Create the Route linked account (sub-merchant). Returns an `acc_…` id.
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
          street2: params.street,
          city: params.city,
          state: params.state,
          postal_code: params.pincode,
          country: "IN",
        },
      },
    },
  } as any);

  // The Route APIs below are not in the SDK's typings; cast to reach them.
  const rzp = razorpay as any;

  // 2. A stakeholder is a prerequisite for configuring the route product.
  await rzp.stakeholders.create(account.id, {
    name: params.name,
    email: params.email,
  });

  // 3. Request the `route` product configuration for this account.
  const product = await rzp.products.requestProductConfiguration(account.id, {
    product_name: "route",
    tnc_accepted: true,
  });

  // 4. Submit the settlement bank account on the route product. This is how a
  //    Route linked account receives transfers — NOT the RazorpayX Fund Account
  //    API (which expects a `cont_…` contact id, not an `acc_…` account id).
  await rzp.products.edit(account.id, product.id, {
    settlements: {
      account_number: params.accountNumber,
      ifsc_code: params.ifsc,
      beneficiary_name: params.beneficiaryName,
    },
    tnc_accepted: true,
  });

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
