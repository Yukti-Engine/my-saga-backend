import { Pool } from 'pg';
interface PendingUser {
    request_id: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expires_at: Date;
}
interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    star_score: number;
    level: number;
    gems: number;
    access_token: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    gender: string | null;
    setting_1: boolean;
    setting_2: boolean;
}
/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string, pool: Pool): Promise<string>;
/**
 * Find a pending user by requestId.
 */
export declare function findPendingUser(requestId: string, pool: any): Promise<PendingUser | null>;
/**
 * Remove a pending user by requestId. No-op if not found.
 */
export declare function removePendingUser(requestId: string, pool: any): Promise<void>;
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export declare function createUser(name: string, phone: string, email: string, _dob: string, gender: string, pool: any): Promise<User>;
export declare function getUser(id: number, pool: any): Promise<any>;
export declare function getAllUsers(pool: any): Promise<any>;
export declare function deleteUser(id: number, pool: any): Promise<any>;
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
export declare function findUserByPhone(phone: string, pool: any): Promise<User | null>;
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export declare function updateUser(id: number, updates: {
    username?: string;
    bio?: string;
    email?: string;
}, pool: any): Promise<User | null>;
export {};
//# sourceMappingURL=user-helpers.d.ts.map