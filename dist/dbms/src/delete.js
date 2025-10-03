import { prisma } from "./client";
const entity = (process.argv[2] || "").toLowerCase();
const idRaw = process.argv[3];
if (!entity || !idRaw) {
    console.error("Usage: pnpm db:delete <users|adventures|events|bosses|organizers> <id>");
    process.exit(1);
}
const id = Number(idRaw);
if (!Number.isInteger(id) || id <= 0) {
    console.error("Invalid id. Must be a positive integer.");
    process.exit(1);
}
const delegates = {
    users: prisma.user,
    bosses: prisma.boss,
    organizers: prisma.organizer,
    adventures: prisma.adventure,
    events: prisma.event,
};
(async () => {
    try {
        const delegate = delegates[entity];
        if (!delegate)
            throw new Error(`Unknown entity: ${entity}`);
        const deleted = await delegate.delete({ where: { id } });
        console.log(JSON.stringify(deleted, null, 2));
    }
    catch (err) {
        console.error(err.message || err);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
})();
//# sourceMappingURL=delete.js.map