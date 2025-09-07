export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sendOtp(phone: string, otp: string) {
  console.log(`📲 Sending OTP ${otp} to ${phone}`);
  // Integrate with real SMS service here
}
