export declare function getMessagesFromAToB(adventure_id: number, a: number, b: number, pool: any): Promise<any>;
export declare function countMessages(adventure_id: number, pool: any): Promise<number>;
export declare function fileCount(adventure_id: number, pool: any): Promise<number>;
export declare function insertPoll(adventure_id: number, question: string, option: string[], pool: any): Promise<any>;
export declare function updatePollAddVote(adventure_id: number, poll_number: number, option_index: number, person_key: string, pool: any): Promise<void>;
export declare function updatePollRemoveVote(adventure_id: number, poll_number: number, option_index: number, person_key: string, pool: any): Promise<void>;
export declare function getPoll(adventure_id: number, poll_number: number, pool: any): Promise<any>;
export declare function getResult(adventure_id: number, result_number: number, pool: any): Promise<any>;
export declare function insertResult(adventure_id: number, badge_ids: number[], user_ids: number[], star_scores: number[], remarks: String[], pool: any): Promise<any>;
export declare function roomAvailable(roomName: string, pool: any): Promise<boolean>;
export declare function isRelatedToAdventure(id: number, role: string, adventureId: number, pool: any): Promise<boolean>;
export declare function createEvent(activity: string, timing: string, venue: string, venue_link: string, adventure_id: number, instruction: string, is_boss_battle: boolean, pool: any): Promise<any>;
//# sourceMappingURL=adventure-helpers.d.ts.map