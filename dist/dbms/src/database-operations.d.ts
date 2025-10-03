import { z } from "zod";
declare const UserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    star_score: z.ZodDefault<z.ZodNumber>;
    level: z.ZodDefault<z.ZodNumber>;
    gems: z.ZodDefault<z.ZodNumber>;
    accessToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    username: z.ZodString;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    age: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    gender: z.ZodOptional<z.ZodNullable<z.ZodString>>;
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
    phone?: string | null | undefined;
    gender?: string | null | undefined;
    accessToken?: string | null | undefined;
    bio?: string | null | undefined;
    age?: number | null | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | null | undefined;
    gender?: string | null | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | null | undefined;
    bio?: string | null | undefined;
    age?: number | null | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}>;
declare const UserUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    star_score: z.ZodOptional<z.ZodNumber>;
    level: z.ZodOptional<z.ZodNumber>;
    gems: z.ZodOptional<z.ZodNumber>;
    accessToken: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    username: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    age: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    gender: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    setting_1: z.ZodOptional<z.ZodBoolean>;
    setting_2: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    gender?: string | null | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | null | undefined;
    username?: string | undefined;
    bio?: string | null | undefined;
    age?: number | null | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    gender?: string | null | undefined;
    star_score?: number | undefined;
    level?: number | undefined;
    gems?: number | undefined;
    accessToken?: string | null | undefined;
    username?: string | undefined;
    bio?: string | null | undefined;
    age?: number | null | undefined;
    setting_1?: boolean | undefined;
    setting_2?: boolean | undefined;
}>;
declare const BossSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    credits: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    credits: number;
    phone?: string | null | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | null | undefined;
    credits?: number | undefined;
}>;
declare const BossUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}>;
declare const OrganizerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    credits: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    credits: number;
    phone?: string | null | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | null | undefined;
    credits?: number | undefined;
}>;
declare const OrganizerUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
    email?: string | undefined;
    username?: string | undefined;
    credits?: number | undefined;
}>;
declare const AdventureSchema: z.ZodObject<{
    name: z.ZodString;
    bossId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    bossId?: number | null | undefined;
}, {
    name: string;
    bossId?: number | null | undefined;
}>;
declare const AdventureUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bossId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bossId?: number | null | undefined;
}, {
    name?: string | undefined;
    bossId?: number | null | undefined;
}>;
declare const EventSchema: z.ZodObject<{
    activity: z.ZodString;
    timing: z.ZodDate;
    venue: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    venue_link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    adventureId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    activity: string;
    timing: Date;
    venue?: string | null | undefined;
    venue_link?: string | null | undefined;
    adventureId?: number | null | undefined;
}, {
    activity: string;
    timing: Date;
    venue?: string | null | undefined;
    venue_link?: string | null | undefined;
    adventureId?: number | null | undefined;
}>;
declare const EventUpdateSchema: z.ZodObject<{
    activity: z.ZodOptional<z.ZodString>;
    timing: z.ZodOptional<z.ZodDate>;
    venue: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    venue_link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    adventureId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    activity?: string | undefined;
    timing?: Date | undefined;
    venue?: string | null | undefined;
    venue_link?: string | null | undefined;
    adventureId?: number | null | undefined;
}, {
    activity?: string | undefined;
    timing?: Date | undefined;
    venue?: string | null | undefined;
    venue_link?: string | null | undefined;
    adventureId?: number | null | undefined;
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
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}, {
    requestId: string;
    name: string;
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
export declare function addUser(userData: CreateUserData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}>;
export declare function updateUser(userId: number, updateData: UpdateUserData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}>;
export declare function deleteUser(userId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}>;
export declare function getUser(userId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}>;
export declare function getAllUsers(): Promise<{
    name: string;
    phone: string | null;
    email: string;
    gender: string | null;
    star_score: number;
    level: number;
    gems: number;
    accessToken: string | null;
    username: string;
    bio: string | null;
    age: number | null;
    setting_1: boolean;
    setting_2: boolean;
    id: number;
}[]>;
export declare function addBoss(bossData: CreateBossData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function updateBoss(bossId: number, updateData: UpdateBossData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function deleteBoss(bossId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function getBoss(bossId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function getAllBosses(): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}[]>;
export declare function addOrganizer(organizerData: CreateOrganizerData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function updateOrganizer(organizerId: number, updateData: UpdateOrganizerData): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function deleteOrganizer(organizerId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function getOrganizer(organizerId: number): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}>;
export declare function getAllOrganizers(): Promise<{
    name: string;
    phone: string | null;
    email: string;
    username: string;
    id: number;
    credits: number;
}[]>;
export declare function addAdventure(adventureData: CreateAdventureData): Promise<{
    name: string;
    id: number;
    bossId: number | null;
}>;
export declare function updateAdventure(adventureId: number, updateData: UpdateAdventureData): Promise<{
    name: string;
    id: number;
    bossId: number | null;
}>;
export declare function deleteAdventure(adventureId: number): Promise<{
    name: string;
    id: number;
    bossId: number | null;
}>;
export declare function getAdventure(adventureId: number): Promise<{
    boss: {
        name: string;
        phone: string | null;
        email: string;
        username: string;
        id: number;
        credits: number;
    } | null;
    events: {
        id: number;
        activity: string;
        timing: Date;
        venue: string | null;
        venue_link: string | null;
        adventureId: number | null;
    }[];
    members: {
        adventureId: number;
        userId: number;
    }[];
} & {
    name: string;
    id: number;
    bossId: number | null;
}>;
export declare function getAllAdventures(): Promise<({
    boss: {
        name: string;
        phone: string | null;
        email: string;
        username: string;
        id: number;
        credits: number;
    } | null;
    events: {
        id: number;
        activity: string;
        timing: Date;
        venue: string | null;
        venue_link: string | null;
        adventureId: number | null;
    }[];
    members: {
        adventureId: number;
        userId: number;
    }[];
} & {
    name: string;
    id: number;
    bossId: number | null;
})[]>;
export declare function addEvent(eventData: CreateEventData): Promise<{
    id: number;
    activity: string;
    timing: Date;
    venue: string | null;
    venue_link: string | null;
    adventureId: number | null;
}>;
export declare function updateEvent(eventId: number, updateData: UpdateEventData): Promise<{
    id: number;
    activity: string;
    timing: Date;
    venue: string | null;
    venue_link: string | null;
    adventureId: number | null;
}>;
export declare function deleteEvent(eventId: number): Promise<{
    id: number;
    activity: string;
    timing: Date;
    venue: string | null;
    venue_link: string | null;
    adventureId: number | null;
}>;
export declare function getEvent(eventId: number): Promise<{
    adventure: {
        name: string;
        id: number;
        bossId: number | null;
    } | null;
} & {
    id: number;
    activity: string;
    timing: Date;
    venue: string | null;
    venue_link: string | null;
    adventureId: number | null;
}>;
export declare function getAllEvents(): Promise<({
    adventure: {
        name: string;
        id: number;
        bossId: number | null;
    } | null;
} & {
    id: number;
    activity: string;
    timing: Date;
    venue: string | null;
    venue_link: string | null;
    adventureId: number | null;
})[]>;
export declare function addAdventureMember(memberData: CreateAdventureMemberData): Promise<{
    adventureId: number;
    userId: number;
}>;
export declare function deleteAdventureMember(adventureId: number, userId: number): Promise<{
    adventureId: number;
    userId: number;
}>;
export declare function getAdventureMembers(adventureId: number): Promise<({
    user: {
        name: string;
        phone: string | null;
        email: string;
        gender: string | null;
        star_score: number;
        level: number;
        gems: number;
        accessToken: string | null;
        username: string;
        bio: string | null;
        age: number | null;
        setting_1: boolean;
        setting_2: boolean;
        id: number;
    };
    adventure: {
        name: string;
        id: number;
        bossId: number | null;
    };
} & {
    adventureId: number;
    userId: number;
})[]>;
export declare function addPendingUser(pendingUserData: CreatePendingUserData): Promise<{
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}>;
export declare function updatePendingUser(requestId: string, updateData: UpdatePendingUserData): Promise<{
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}>;
export declare function deletePendingUser(requestId: string): Promise<{
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}>;
export declare function getPendingUser(requestId: string): Promise<{
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}>;
export declare function getAllPendingUsers(): Promise<{
    requestId: string;
    name: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    expiresAt: Date;
}[]>;
export declare function closeConnection(): Promise<void>;
export {};
//# sourceMappingURL=database-operations.d.ts.map