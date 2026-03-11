/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
/**
 * Find a pending user by requestId.
 */
/**
 * Remove a pending user by requestId. No-op if not found.
 */
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export declare function getBoss(id: number, pool: any): Promise<any>;
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export declare function updateBoss(id: number, updates: {
    username?: string;
    setting_1?: boolean;
    setting_2?: boolean;
    bio?: string;
    icon?: string;
}, pool: any): Promise<any>;
export declare function getBossByEmail(email: string, pool: any): Promise<any>;
export declare function updateAccessToken(id: number, accessToken: string | null, pool: any): Promise<any>;
export declare function logout(id: number, pool: any): Promise<any>;
export declare function getQualification(id: number, pool: any): Promise<any>;
export declare function sendNotification(senderId: number, receiverRole: string, receiverId: number, message: string, pool: any): Promise<{
    success: boolean;
}>;
export declare function getNotificationsFromAToB(receiver_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countNotifications(receiver_id: number, pool: any): Promise<number>;
export declare function addMessage(message: string, sender_id: number, adventure_id: number, pool: any): Promise<any>;
export declare function getMessagesFromAToB(adventure_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countMessages(adventure_id: number, pool: any): Promise<number>;
export declare function getCompatibleRequests(categoryId: number, age: number, latitude: number, longitude: number, gender: string, pool: any): Promise<any>;
export declare function checkReverseCompatibility(matchRequestId: number, latitude: number, longitude: number, matchRadius: number, ageRangeMin: number, ageRangeMax: number, allGirls: boolean, halfGirls: boolean, pool: any): Promise<boolean>;
export declare function match(id: number, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, payPerHead2: number, snapshot: any, pool: any): Promise<{
    success: boolean;
}>;
export declare function currentMatchRequest(id: number, pool: any): Promise<any>;
export declare function getActiveAdventures(id: number, pool: any): Promise<any>;
export declare function getInactiveAdventures(id: number, a: number, b: number, pool: any): Promise<any>;
//# sourceMappingURL=boss-helpers.d.ts.map