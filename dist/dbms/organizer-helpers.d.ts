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
export declare function getOrganizer(id: number, pool: any): Promise<any>;
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export declare function updateOrganizer(id: number, updates: {
    username?: string;
    setting_1?: boolean;
    setting_2?: boolean;
    bio?: string;
    icon?: string;
}, pool: any): Promise<any>;
export declare function getOrganizerByEmail(email: string, pool: any): Promise<any>;
export declare function updateAccessToken(id: number, accessToken: string | null, pool: any): Promise<any>;
export declare function logout(id: number, pool: any): Promise<any>;
export declare function sendNotification(senderId: number, receiverRole: string, receiverId: number, message: string, pool: any): Promise<{
    success: boolean;
}>;
export declare function getNotificationsFromAToB(receiver_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countNotifications(receiver_id: number, pool: any): Promise<number>;
export declare function addMessage(message: string, sender_id: number, adventure_id: number, pool: any): Promise<any>;
export declare function getMessagesFromAToB(adventure_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countMessages(adventure_id: number, pool: any): Promise<number>;
export declare function createRequest(orgId: number, categoryId: number, matchRadius: number, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, latitude: number, longitude: number, payPerHead: number, allGirls: boolean, halfGirls: boolean, pool: any): Promise<any>;
export declare function currentMatchRequest(id: number, pool: any): Promise<any>;
export declare function completeMatch(name: string, id: number, pool: any): Promise<any>;
export declare function approveEvent(event_id: number, pool: any): Promise<any>;
export declare function getActiveAdventures(id: number, pool: any): Promise<any>;
export declare function getInactiveAdventures(id: number, a: number, b: number, pool: any): Promise<any>;
//# sourceMappingURL=organizer-helpers.d.ts.map