interface PendingUser {
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}
interface User {
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    loginOtp: string | null;
    loginOtpExpiresAt: Date | null;
}
export declare const pendingUsers: PendingUser[];
export declare const users: User[];
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string): string;
export declare function findPendingUser(requestId: string): PendingUser | undefined;
export declare function removePendingUser(requestId: string): void;
export declare function createUser(name: string, phone: string, email: string, dob: string, gender: string): User;
export declare function findUserByEmailOrPhone(email?: string, phone?: string): User | undefined;
export declare function setLoginOtp(user: User, otp: string): void;
export declare function verifyLoginOtp(user: User, otp: string): boolean;
export declare function clearLoginOtp(user: User): void;
export {};
//# sourceMappingURL=db.d.ts.map