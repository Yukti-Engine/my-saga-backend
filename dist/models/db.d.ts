interface PendingUser {
    requestId: string;
    name: string;
    email: string;
    passwordHash: string;
    phone: string;
    otp: string;
    expiresAt: Date;
}
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
}
export declare const pendingUsers: PendingUser[];
export declare const users: User[];
export declare function createPendingUser(name: string, email: string, passwordHash: string, phone: string, otp: string): string;
export declare function findPendingUser(requestId: string): PendingUser | undefined;
export declare function removePendingUser(requestId: string): void;
export declare function createUser(name: string, email: string, passwordHash: string, phone: string): User;
export {};
//# sourceMappingURL=db.d.ts.map