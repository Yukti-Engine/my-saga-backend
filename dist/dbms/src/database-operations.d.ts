import { z } from "zod";
declare const UserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    star_score: z.ZodDefault<z.ZodNumber>;
    level: z.ZodDefault<z.ZodNumber>;
    gems: z.ZodDefault<z.ZodNumber>;
    accessToken: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodString>;
    setting_1: z.ZodDefault<z.ZodBoolean>;
    setting_2: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    star_score: number;
    level: number;
    gems: number;
    username: string;
    setting_1: boolean;
    setting_2: boolean;
    phone?: string | undefined;
    gender?: string | undefined;
    accessToken?: string | undefined;
    bio?: string | undefined;
    age?: number | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    gender?: string | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | undefined;
    bio?: string | undefined;
    age?: number | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}>;
declare const UserUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    star_score: z.ZodOptional<z.ZodNumber>;
    level: z.ZodOptional<z.ZodNumber>;
    gems: z.ZodOptional<z.ZodNumber>;
    accessToken: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodString>;
    setting_1: z.ZodOptional<z.ZodBoolean>;
    setting_2: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    gender?: string | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | undefined;
    username?: string | undefined;
    bio?: string | undefined;
    age?: number | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    gender?: string | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | undefined;
    username?: string | undefined;
    bio?: string | undefined;
    age?: number | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}>;
declare const BossSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    credits: number;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    credits?: number | undefined;
}>;
declare const BossUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}>;
declare const OrganizerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    credits: number;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    credits?: number | undefined;
}>;
declare const OrganizerUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}>;
declare const AdventureSchema: z.ZodObject<{
    name: z.ZodString;
    bossId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    bossId?: number | undefined;
}, {
    name: string;
    bossId?: number | undefined;
}>;
declare const AdventureUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bossId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bossId?: number | undefined;
}, {
    name?: string | undefined;
    bossId?: number | undefined;
}>;
declare const EventSchema: z.ZodObject<{
    activity: z.ZodString;
    timing: z.ZodDate;
    venue: z.ZodOptional<z.ZodString>;
    venue_link: z.ZodOptional<z.ZodString>;
    adventureId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    activity: string;
    timing: Date;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}, {
    activity: string;
    timing: Date;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}>;
declare const EventUpdateSchema: z.ZodObject<{
    activity: z.ZodOptional<z.ZodString>;
    timing: z.ZodOptional<z.ZodDate>;
    venue: z.ZodOptional<z.ZodString>;
    venue_link: z.ZodOptional<z.ZodString>;
    adventureId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    activity?: string | undefined;
    timing?: Date | undefined;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}, {
    activity?: string | undefined;
    timing?: Date | undefined;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}>;
declare const AdventureMemberSchema: z.ZodObject<{
    adventureId: z.ZodNumber;
    userId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    adventureId: number;
    userId: number;
}, {
    adventureId: number;
    userId: number;
}>;
declare const PendingUserSchema: z.ZodObject<{
    requestId: z.ZodString;
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    dob: z.ZodString;
    gender: z.ZodString;
    expiresAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name: string;
    requestId: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}, {
    name: string;
    requestId: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}>;
declare const PendingUserUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    dob: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    dob?: string | undefined;
    gender?: string | undefined;
    expiresAt?: Date | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    dob?: string | undefined;
    gender?: string | undefined;
    expiresAt?: Date | undefined;
}>;
export type CreateUserData = z.infer<typeof UserSchema>;
export type UpdateUserData = z.infer<typeof UserUpdateSchema>;
export type CreateBossData = z.infer<typeof BossSchema>;
export type UpdateBossData = z.infer<typeof BossUpdateSchema>;
export type CreateOrganizerData = z.infer<typeof OrganizerSchema>;
export type UpdateOrganizerData = z.infer<typeof OrganizerUpdateSchema>;
export type CreateAdventureData = z.infer<typeof AdventureSchema>;
export type UpdateAdventureData = z.infer<typeof AdventureUpdateSchema>;
export type CreateEventData = z.infer<typeof EventSchema>;
export type UpdateEventData = z.infer<typeof EventUpdateSchema>;
export type CreateAdventureMemberData = z.infer<typeof AdventureMemberSchema>;
export type CreatePendingUserData = z.infer<typeof PendingUserSchema>;
export type UpdatePendingUserData = z.infer<typeof PendingUserUpdateSchema>;
export declare function addUser(userData: CreateUserData): Promise<any>;
export declare function updateUser(userId: number, updateData: UpdateUserData): Promise<any>;
export declare function deleteUser(userId: number): Promise<any>;
export declare function getUser(userId: number): Promise<any>;
export declare function getAllUsers(): Promise<any>;
export declare function addBoss(bossData: CreateBossData): Promise<any>;
export declare function updateBoss(bossId: number, updateData: UpdateBossData): Promise<any>;
export declare function deleteBoss(bossId: number): Promise<any>;
export declare function getBoss(bossId: number): Promise<any>;
export declare function getAllBosses(): Promise<any>;
export declare function addOrganizer(organizerData: CreateOrganizerData): Promise<any>;
export declare function updateOrganizer(organizerId: number, updateData: UpdateOrganizerData): Promise<any>;
export declare function deleteOrganizer(organizerId: number): Promise<any>;
export declare function getOrganizer(organizerId: number): Promise<any>;
export declare function getAllOrganizers(): Promise<any>;
export declare function addAdventure(adventureData: CreateAdventureData): Promise<any>;
export declare function updateAdventure(adventureId: number, updateData: UpdateAdventureData): Promise<any>;
export declare function deleteAdventure(adventureId: number): Promise<any>;
export declare function getAdventure(adventureId: number): Promise<any>;
export declare function getAllAdventures(): Promise<any>;
export declare function addEvent(eventData: CreateEventData): Promise<any>;
export declare function updateEvent(eventId: number, updateData: UpdateEventData): Promise<any>;
export declare function deleteEvent(eventId: number): Promise<any>;
export declare function getEvent(eventId: number): Promise<any>;
export declare function getAllEvents(): Promise<any>;
export declare function addAdventureMember(memberData: CreateAdventureMemberData): Promise<any>;
export declare function deleteAdventureMember(adventureId: number, userId: number): Promise<any>;
export declare function getAdventureMembers(adventureId: number): Promise<any>;
export declare function addPendingUser(pendingUserData: CreatePendingUserData): Promise<any>;
export declare function updatePendingUser(requestId: string, updateData: UpdatePendingUserData): Promise<any>;
export declare function deletePendingUser(requestId: string): Promise<any>;
export declare function getPendingUser(requestId: string): Promise<any>;
export declare function getAllPendingUsers(): Promise<any>;
export declare function closeConnection(): Promise<void>;
export {};
//# sourceMappingURL=database-operations.d.ts.map