import { prisma } from "./client";
/* ----------------- SIGNUP HELPERS ----------------- */
/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
export async function createPendingUser(name, phone, email, dob, gender, requestId) {
    // Ensure no duplicate requestId (id is unique)
    const existing = await prisma.pendingUser.findUnique({ where: { requestId } });
    if (existing) {
        // overwrite semantics to mimic array push "latest wins"
        await prisma.pendingUser.delete({ where: { requestId } });
    }
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.pendingUser.create({
        data: { requestId, name, phone, email, dob, gender, expiresAt },
    });
    return requestId;
}
/**
 * Find a pending user by requestId.
 */
export async function findPendingUser(requestId) {
    return prisma.pendingUser.findUnique({ where: { requestId } });
}
/**
 * Remove a pending user by requestId. No-op if not found.
 */
export async function removePendingUser(requestId) {
    try {
        await prisma.pendingUser.delete({ where: { requestId } });
    }
    catch {
        // swallow if not found to mirror original behavior
    }
}
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export async function createUser(name, phone, email, _dob, gender) {
    // derive a base username without uniqueness checks
    const emailLocal = email.split("@")[0] || "";
    const base = (emailLocal || name || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24) || "user";
    const user = await prisma.user.create({
        data: {
            name,
            email,
            phone: phone || undefined,
            gender: gender || undefined,
            username: base,
        },
    });
    return user;
}
/* ----------------- LOGIN HELPERS ----------------- */
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
export async function findUserByEmailOrPhone(email, phone) {
    if (!email && !phone)
        return null;
    if (email && phone) {
        return prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    }
    if (email)
        return prisma.user.findUnique({ where: { email } });
    return prisma.user.findFirst({ where: { phone } });
}
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export async function updateUser(id, updates) {
    const data = {};
    if (typeof updates.username !== "undefined")
        data.username = updates.username;
    if (typeof updates.bio !== "undefined")
        data.bio = updates.bio;
    if (typeof updates.email !== "undefined")
        data.email = updates.email;
    if (Object.keys(data).length === 0) {
        return prisma.user.findUnique({ where: { id } }); // no changes; return current
    }
    try {
        return await prisma.user.update({ where: { id }, data });
    }
    catch {
        // if not found or unique constraint failure, align with original helper returning null
        const current = await prisma.user.findUnique({ where: { id } });
        return current ?? null;
    }
}
//# sourceMappingURL=user-helpers.js.map