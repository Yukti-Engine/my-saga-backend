import "dotenv/config";
export declare function sendOtp(phone: string): Promise<string>;
export declare function verify(phone: string, otp: string): Promise<boolean>;
//# sourceMappingURL=otpService.d.ts.map