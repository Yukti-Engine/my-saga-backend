export declare function findPendingUser(requestId: string, pool: any): Promise<any>;
export declare function removePendingUser(requestId: string, pool: any): Promise<void>;
export declare function getUser(id: number, pool: any): Promise<any>;
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
export declare function deductGems(id: number, gemsToDeduct: number, pool: any): Promise<{
    success: boolean;
}>;
export declare function addGems(id: number, gemsToAdd: number, pool: any): Promise<{
    success: boolean;
}>;
export declare function getActiveAdventures(id: number, pool: any): Promise<any>;
export declare function sendNotification(senderId: number, receiverRole: string, receiverId: number, message: string, pool: any): Promise<{
    success: boolean;
}>;
export declare function getNotificationsFromAToB(receiver_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countNotifications(receiver_id: number, pool: any): Promise<number>;
export declare function addMessage(message: string, sender_id: number, adventure_id: number, pool: any): Promise<any>;
export declare function getCompatibleRequests(categoryId: number, age: number, latitude: number, longitude: number, allBoys: boolean, allGirls: boolean, halfGirls: boolean, gender: string, pool: any): Promise<any>;
export declare function checkReverseCompatibility(matchRequestId: number, latitude: number, longitude: number, matchRadius: number, ageRangeMin: number, ageRangeMax: number, pool: any): Promise<boolean>;
export declare function match(id: number, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, snapshot: any, pool: any): Promise<{
    success: boolean;
    cost: number;
}>;
export declare function currentMatchRequest(id: number, pool: any): Promise<any>;
export declare function approveEvent(event_id: number, user_id: number, pool: any): Promise<any>;
export declare function getBadges(id: number, pool: any): Promise<any>;
export declare function rewardBadge(id: number, badge_id: number, pool: any): Promise<any>;
export declare function checkBadge(id: number, badge_id: number, pool: any): Promise<any>;
export declare function getInactiveAdventures(id: number, a: number, b: number, pool: any): Promise<any>;
//# sourceMappingURL=user-helpers.d.ts.map