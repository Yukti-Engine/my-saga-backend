export declare function createRequest(orgId: number, categoryId: number, matchRadius: number, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, latitude: number, longitude: number, payPerHead: number, allBoys: boolean, allGirls: boolean, halfGirls: boolean, pool: any): Promise<any>;
export declare function getCompatibleRequests(categoryId: number, age: number, latitude: number, longitude: number, allBoys: boolean, allGirls: boolean, halfGirls: boolean, gender: string, pool: any): Promise<any>;
export declare function checkReverseCompatibility(matchRequestId: number, latitude: number, longitude: number, matchRadius: number, ageRangeMin: number, ageRangeMax: number, pool: any): Promise<boolean>;
export declare function match(id: number, isBoss: boolean, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, payPerHead2: number, snapshot: any, pool: any): Promise<any>;
export declare function currentMatchRequestUser(id: number, pool: any): Promise<any>;
export declare function currentMatchRequestBoss(id: number, pool: any): Promise<any>;
export declare function currentMatchRequestOrganizer(id: number, pool: any): Promise<any>;
export declare function completeMatch(name: string, id: number, pool: any): Promise<any>;
//# sourceMappingURL=match-request-helpers.d.ts.map