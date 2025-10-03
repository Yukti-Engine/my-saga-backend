import { prisma } from "./client.js";
import { z } from "zod";
const entity = (process.argv[2] || "").toLowerCase();
const payloadRaw = process.argv[3];
if (!entity || !payloadRaw) {
    console.error("Usage: pnpm db:update <users|adventures|events|bosses|organizers> '{\"id\":1, ...fields}'");
    process.exit(1);
}
const idSchema = z.object({ id: z.number().int().positive() });
const whitelist = {
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
const delegates = {
    users: prisma.user,
    bosses: prisma.boss,
    organizers: prisma.organizer,
    adventures: prisma.adventure,
    events: prisma.event,
};
(async () => {
    try {
        const parsed = idSchema.passthrough().parse(JSON.parse(payloadRaw));
        const { id, ...rest } = parsed;
        const allowed = whitelist[entity];
        const delegate = delegates[entity];
        if (!allowed || !delegate)
            throw new Error(`Unknown entity: ${entity}`);
        const data = {};
        for (const key of Object.keys(rest)) {
            if (allowed.includes(key))
                data[key] = rest[key];
        }
        if (Object.keys(data).length === 0)
            throw new Error("No valid fields provided to update");
        if (data.timing)
            data.timing = new Date(data.timing);
        const updated = await delegate.update({ where: { id }, data });
        console.log(JSON.stringify(updated, null, 2));
    }
    catch (err) {
        console.error(err.message || err);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
})();
//# sourceMappingURL=update.js.map