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
    id: number;
    email: string;
    dob: string;
    gender: string;
    username?: string;
    bio?: string;
    loginOtp: string | null;
    loginOtpExpiresAt: Date | null;
    accessToken: string;
}
export declare const pendingUsers: PendingUser[];
export declare const users: User[];
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string): string;
export declare function findPendingUser(requestId: string): PendingUser | undefined;
export declare function removePendingUser(requestId: string): void;
export declare function createUser(name: string, phone: string, email: string, dob: string, gender: string): User;
export declare function findUserByEmailOrPhone(email?: string, phone?: string): User | undefined;
export declare function updateUser(id: number, updates: {
    username?: string;
    bio?: string;
    email?: string;
}): User | null;
export interface Adventure {
    id: string;
    name: string;
    events: Event[];
    boss: Boss;
    members: User[];
}
export interface Event {
    id: string;
    activity: string;
    timing: string;
    venue: string;
    venue_link: string;
}
export interface Boss {
    id: string;
    name: string;
    email: string;
    phone: string;
    credits: number;
    username: string;
}
export interface Organizer {
    id: string;
    name: string;
    email: string;
    phone: string;
    credits: number;
    username: string;
}
export {};
//# sourceMappingURL=db.d.ts.map