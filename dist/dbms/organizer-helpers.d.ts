interface PendingOrganiser {
    request_id: string;
    email: string;
    phone: string;
    reason: string;
}
export interface CreateOrganizerData {
    name: string;
    email: string;
    username: string;
    phone?: string;
    credits?: number;
}
export interface UpdateOrganizerData {
    name?: string;
    email?: string;
    username?: string;
    phone?: string;
    credits?: number;
}
export declare function createPendingOrganiser(email: string, phone: string, reason: string, requestId: string, pool: any): Promise<string>;
export declare function findPendingOrganiser(requestId: string, pool: any): Promise<PendingOrganiser | null>;
export declare function removePendingOrganiser(requestId: string, pool: any): Promise<void>;
export declare function addOrganizer(data: CreateOrganizerData, pool: any): Promise<any>;
export declare function updateOrganizer(id: number, updates: UpdateOrganizerData, pool: any): Promise<any>;
export declare function deleteOrganizer(id: number, pool: any): Promise<any>;
export declare function getOrganizer(id: number, pool: any): Promise<any>;
export declare function getAllOrganizers(pool: any): Promise<any>;
export {};
//# sourceMappingURL=organizer-helpers.d.ts.map