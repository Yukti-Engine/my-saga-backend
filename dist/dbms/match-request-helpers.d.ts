export declare function createRequest(orgId: number, categoryId: number, matchRadius: number, minTeamMembers: number, ageRangeMin: number, ageRangeMax: number, latitude: number, longitude: number, payPerHead: number, allBoys: boolean, allGirls: boolean, halfGirls: boolean, pool: any): Promise<any>;
export declare function getCompatibleRequests(categoryId: number, age: number, latitude: number, longitude: number, allBoys: boolean, allGirls: boolean, halfGirls: boolean, gender: string, pool: any): Promise<any>;
export declare function checkReverseCompatibility(matchRequestId: number, latitude: number, longitude: number, matchRadius: number, ageRangeMin: number, ageRangeMax: number, pool: any): Promise<boolean>;
export declare function match(id: number, isBoss: boolean, minTeamMembers: number, // only used for USER
ageRangeMin: number, // only used for USER
ageRangeMax: number, // only used for USER
payPerHead2: number, // only used for BOSS
matchRequestId: number, updatedAt: string, pool: any): Promise<any>;
//# sourceMappingURL=match-request-helpers.d.ts.map