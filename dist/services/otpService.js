export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export function sendOtp(phone, otp) {
    console.log(`📲 Sending OTP ${otp} to ${phone}`);
    // Integrate with real SMS service here
}
//# sourceMappingURL=otpService.js.map