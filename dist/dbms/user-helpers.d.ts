/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
export declare function createPendingUser(name: string, phone: string, email: string, dob: string, gender: string, requestId: string, pool: any): Promise<string>;
/**
 * Find a pending user by requestId.
 */
export declare function findPendingUser(requestId: string, pool: any): Promise<any>;
/**
 * Remove a pending user by requestId. No-op if not found.
 */
export declare function removePendingUser(requestId: string, pool: any): Promise<void>;
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export declare function createUser(name: string, phone: string, email: string, _dob: Date, gender: string, isNonBinary: boolean, pool: any): Promise<any>;
export declare function getUser(id: number, pool: any): Promise<any>;
export declare function getAllUsers(pool: any): Promise<any>;
export declare function deleteUser(id: number, pool: any): Promise<any>;
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
export declare function findUserByPhone(phone: string, pool: any): Promise<any>;
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export declare function updateUser(id: number, updates: {
    username?: string;
    bio?: string;
    email?: string;
    setting_1?: boolean;
    setting_2?: boolean;
}, pool: any): Promise<any>;
export declare function updateAccessToken(id: number, accessToken: string | null, pool: any): Promise<any>;
export declare function logout(id: number, pool: any): Promise<any>;
//# sourceMappingURL=user-helpers.d.ts.map