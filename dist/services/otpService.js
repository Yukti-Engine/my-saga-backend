import "dotenv/config";
import twilio from "twilio";
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const service = process.env.TWILIO_SERVICE;
const client = twilio(accountSid, authToken);
export async function sendOtp(phone) {
    const verification = await client.verify.v2.services(service)
        .verifications
        .create({ to: phone, channel: "sms" });
    return verification.sid;
}
export async function verify(phone, otp) {
    const check = await client.verify.v2.services(service)
        .verificationChecks
        .create({ to: phone, code: otp });
    return check.status === "approved";
}
//# sourceMappingURL=otpService.js.map