import { PrismaClient } from "@prisma/client";
let prisma;
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
}
else {
    if (!global.__prisma) {
        global.__prisma = new PrismaClient();
    }
    prisma = global.__prisma;
}
export { prisma };
// Graceful shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=client.js.map