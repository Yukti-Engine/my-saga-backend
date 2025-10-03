import { z } from "zod";
// Common schema
const common = {
    id: z.number().int().positive().optional(),
};
// Entity schemas for validation
export const userSchema = z.object({
    ...common,
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    star_score: z.number().int().nonnegative().optional(),
    level: z.number().int().positive().optional(),
    gems: z.number().int().nonnegative().optional(),
    accessToken: z.string().optional(),
    username: z.string(),
    bio: z.string().optional(),
    age: z.number().int().nonnegative().optional(),
    gender: z.string().optional(),
    setting_1: z.boolean().optional(),
    setting_2: z.boolean().optional(),
});
export const bossSchema = z.object({
    ...common,
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string(),
});
export const organizerSchema = z.object({
    ...common,
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string(),
});
export const adventureSchema = z.object({
    ...common,
    name: z.string(),
    bossId: z.number().int().positive().optional(),
});
export const eventSchema = z.object({
    ...common,
    activity: z.string(),
    timing: z.coerce.date(),
    venue: z.string().optional(),
    venue_link: z.string().url().optional(),
    adventureId: z.number().int().positive().optional(),
});
// Update field whitelists
export const updateWhitelists = {
    users: [
        "name",
        "email",
        "phone",
        "star_score",
        "level",
        "gems",
        "accessToken",
        "username",
        "bio",
        "age",
        "gender",
        "setting_1",
        "setting_2",
    ],
    bosses: ["name", "email", "phone", "credits", "username"],
    organizers: ["name", "email", "phone", "credits", "username"],
    adventures: ["name", "bossId"],
    events: ["activity", "timing", "venue", "venue_link", "adventureId"],
};
//# sourceMappingURL=types.js.map