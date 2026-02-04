export declare function sendMessage(senderId: number, senderRole: string, receiverRole: string, receiverId: number, message: string, pool: any): Promise<{
    success: boolean;
}>;
export declare function getNotificationsFromAToB(receiver_id: number, receiver_role: string, a: number, b: number, pool: any): Promise<any>;
export declare function countNotifications(receiver_id: number, receiver_role: string, pool: any): Promise<number>;
//# sourceMappingURL=private-message-helpers.d.ts.map