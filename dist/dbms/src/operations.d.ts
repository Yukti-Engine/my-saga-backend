import { type EntityType, type UserInput, type BossInput, type OrganizerInput, type AdventureInput, type EventInput } from "./types.js";
/**
 * Insert a new record into the specified entity table
 */
export declare function insertRecord<T extends EntityType>(entity: T, data: T extends "users" ? UserInput : T extends "bosses" ? BossInput : T extends "organizers" ? OrganizerInput : T extends "adventures" ? AdventureInput : T extends "events" ? EventInput : never): Promise<any>;
/**
 * Update an existing record in the specified entity table
 */
export declare function updateRecord<T extends EntityType>(entity: T, id: number, data: Partial<T extends "users" ? UserInput : T extends "bosses" ? BossInput : T extends "organizers" ? OrganizerInput : T extends "adventures" ? AdventureInput : T extends "events" ? EventInput : never>): Promise<any>;
/**
 * Delete a record from the specified entity table
 */
export declare function deleteRecord<T extends EntityType>(entity: T, id: number): Promise<any>;
/**
 * Find a record by ID
 */
export declare function findRecord<T extends EntityType>(entity: T, id: number): Promise<any>;
/**
 * Find multiple records with optional filtering
 */
export declare function findRecords<T extends EntityType>(entity: T, options?: {
    where?: Record<string, any>;
    take?: number;
    skip?: number;
    orderBy?: Record<string, "asc" | "desc">;
}): Promise<any>;
//# sourceMappingURL=operations.d.ts.map