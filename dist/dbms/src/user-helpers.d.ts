import type { PendingUser, User } from "@prisma/client";
/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string): Promise<string>;
/**
 * Find a pending user by requestId.
 */
export declare function findPendingUser(requestId: string): Promise<PendingUser | null>;
/**
 * Remove a pending user by requestId. No-op if not found.
 */
export declare function removePendingUser(requestId: string): Promise<void>;
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export declare function createUser(name: string, phone: string, email: string, _dob: string, gender: string): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}>;
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
export declare function findUserByEmailOrPhone(email?: string, phone?: string): Promise<User | null>;
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export declare function updateUser(id: number, updates: {
    username?: string;
    bio?: string;
    email?: string;
}): Promise<User | null>;
//# sourceMappingURL=user-helpers.d.ts.map