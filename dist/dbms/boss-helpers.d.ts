interface PendingBoss {
    request_id: string;
    email: string;
    phone: string;
    reason: string;
}
export interface UpdateBossData {
    name?: string;
    email?: string;
    username?: string;
    phone?: string;
    credits?: number;
}
export interface CreateBossData {
    name: string;
    email: string;
    username: string;
    phone?: string;
    credits?: number;
}
export declare function createPendingBoss(email: string, phone: string, reason: string, requestId: string, pool: any): Promise<string>;
export declare function findPendingBoss(requestId: string, pool: any): Promise<PendingBoss | null>;
export declare function removePendingBoss(requestId: string, pool: any): Promise<void>;
export declare function addBoss(data: CreateBossData, pool: any): Promise<any>;
export declare function updateBoss(id: number, updates: UpdateBossData, pool: any): Promise<any>;
export declare function deleteBoss(id: number, pool: any): Promise<any>;
export declare function getBoss(id: number, pool: any): Promise<any>;
export declare function getAllBosses(pool: any): Promise<any>;
export {};
//# sourceMappingURL=boss-helpers.d.ts.map