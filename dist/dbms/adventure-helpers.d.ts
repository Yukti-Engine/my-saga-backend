export declare function getMessagesFromAToB(adventure_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countMessages(adventure_id: number, pool: any): Promise<number>;
export declare function roomAvailable(roomName: string, pool: any): Promise<boolean>;
export declare function isRelatedToAdventure(id: number, role: string, adventureId: number, pool: any): Promise<boolean>;
export declare function createEvent(activity: string, timing: string, venue: string, venue_link: string, adventure_id: number, instruction: string, is_boss_battle: boolean, pool: any): Promise<any>;
//# sourceMappingURL=adventure-helpers.d.ts.map