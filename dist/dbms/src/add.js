import { prisma } from "./client.js";
import { z } from "zod";
const entity = (process.argv[2] || "").toLowerCase();
const payloadRaw = process.argv[3];
if (!entity || !payloadRaw) {
    console.error("Usage: pnpm db:add <users|adventures|events|bosses|organizers> '<json>'");
    process.exit(1);
}
const common = {
    id: z.number().int().positive().optional(),
};
const userSchema = z.object({
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
const bossSchema = z.object({
    ...common,
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string(),
});
const organizerSchema = z.object({
    ...common,
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string(),
});
const adventureSchema = z.object({
    ...common,
    name: z.string(),
    bossId: z.number().int().positive().optional(),
});
const eventSchema = z.object({
    ...common,
    activity: z.string(),
    timing: z.coerce.date(),
    venue: z.string().optional(),
    venue_link: z.string().url().optional(),
    adventureId: z.number().int().positive().optional(),
});
const map = {
    users: {
        schema: userSchema,
        create: (data) => prisma.user.create({ data: remapUser(data) }),
    },
    bosses: {
        schema: bossSchema,
        create: (data) => prisma.boss.create({ data }),
    },
    organizers: {
        schema: organizerSchema,
        create: (data) => prisma.organizer.create({ data }),
    },
    adventures: {
        schema: adventureSchema,
        create: (data) => prisma.adventure.create({ data }),
    },
    events: {
        schema: eventSchema,
        create: (data) => prisma.event.create({ data }),
    },
};
function remapUser(input) {
    const { star_score, setting_1, setting_2, ...rest } = input;
    return {
        ...rest,
        star_score: star_score ?? 0,
        setting_1: setting_1 ?? false,
        setting_2: setting_2 ?? false,
    };
}
;
(async () => {
    try {
        const cfg = map[entity];
        if (!cfg)
            throw new Error(`Unknown entity: ${entity}`);
        const json = JSON.parse(payloadRaw);
        const data = cfg.schema.parse(json);
        const created = await cfg.create(data);
        console.log(JSON.stringify(created, null, 2));
    }
    catch (err) {
        console.error(err.message || err);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
})();
//# sourceMappingURL=add.js.map