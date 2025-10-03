import { z } from "zod";
export declare const userSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    star_score: z.ZodOptional<z.ZodNumber>;
    level: z.ZodOptional<z.ZodNumber>;
    gems: z.ZodOptional<z.ZodNumber>;
    accessToken: z.ZodOptional<z.ZodString>;
    username: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodString>;
    setting_1: z.ZodOptional<z.ZodBoolean>;
    setting_2: z.ZodOptional<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
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
    id?: number | undefined;
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
    id?: number | undefined;
}>;
export declare const bossSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodString;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    id?: number | undefined;
    credits?: number | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    id?: number | undefined;
    credits?: number | undefined;
}>;
export declare const organizerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    credits: z.ZodOptional<z.ZodNumber>;
    username: z.ZodString;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    id?: number | undefined;
    credits?: number | undefined;
}, {
    name: string;
    email: string;
    username: string;
    phone?: string | undefined;
    id?: number | undefined;
    credits?: number | undefined;
}>;
export declare const adventureSchema: z.ZodObject<{
    name: z.ZodString;
    bossId: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id?: number | undefined;
    bossId?: number | undefined;
}, {
    name: string;
    id?: number | undefined;
    bossId?: number | undefined;
}>;
export declare const eventSchema: z.ZodObject<{
    activity: z.ZodString;
    timing: z.ZodDate;
    venue: z.ZodOptional<z.ZodString>;
    venue_link: z.ZodOptional<z.ZodString>;
    adventureId: z.ZodOptional<z.ZodNumber>;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    activity: string;
    timing: Date;
    id?: number | undefined;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}, {
    activity: string;
    timing: Date;
    id?: number | undefined;
    venue?: string | undefined;
    venue_link?: string | undefined;
    adventureId?: number | undefined;
}>;
export type UserInput = z.infer<typeof userSchema>;
export type BossInput = z.infer<typeof bossSchema>;
export type OrganizerInput = z.infer<typeof organizerSchema>;
export type AdventureInput = z.infer<typeof adventureSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type EntityType = "users" | "bosses" | "organizers" | "adventures" | "events";
export declare const updateWhitelists: Record<EntityType, string[]>;
//# sourceMappingURL=types.d.ts.map