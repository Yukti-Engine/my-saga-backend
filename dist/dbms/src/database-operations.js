import { prisma } from "./client.js";
import { z } from "zod";
// Helper to remove undefined properties from an object
function removeUndefined(obj) {
    return JSON.parse(JSON.stringify(obj));
}
// User validation schema
const UserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().nullable().optional(),
    star_score: z.number().int().nonnegative().default(0),
    level: z.number().int().positive().default(1),
    gems: z.number().int().nonnegative().default(0),
    accessToken: z.string().nullable().optional(),
    username: z.string().min(1, "Username is required"),
    bio: z.string().nullable().optional(),
    age: z.number().int().nonnegative().nullable().optional(),
    gender: z.string().nullable().optional(),
    setting_1: z.boolean().default(false),
    setting_2: z.boolean().default(false),
});
const UserUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    star_score: z.number().int().nonnegative().optional(),
    level: z.number().int().positive().optional(),
    gems: z.number().int().nonnegative().optional(),
    accessToken: z.string().nullable().optional(),
    username: z.string().min(1).optional(),
    bio: z.string().nullable().optional(),
    age: z.number().int().nonnegative().nullable().optional(),
    gender: z.string().nullable().optional(),
    setting_1: z.boolean().optional(),
    setting_2: z.boolean().optional(),
});
// Boss validation schema
const BossSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().nullable().optional(),
    credits: z.number().int().nonnegative().default(0),
    username: z.string().min(1, "Username is required"),
});
const BossUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string().min(1).optional(),
});
// Organizer validation schema
const OrganizerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().nullable().optional(),
    credits: z.number().int().nonnegative().default(0),
    username: z.string().min(1, "Username is required"),
});
const OrganizerUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    credits: z.number().int().nonnegative().optional(),
    username: z.string().min(1).optional(),
});
// Adventure validation schema
const AdventureSchema = z.object({
    name: z.string().min(1, "Adventure name is required"),
    bossId: z.number().int().positive().nullable().optional(),
});
const AdventureUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    bossId: z.number().int().positive().nullable().optional(),
});
// Event validation schema
const EventSchema = z.object({
    activity: z.string().min(1, "Activity is required"),
    timing: z.date(),
    venue: z.string().nullable().optional(),
    venue_link: z.string().url().nullable().optional(),
    adventureId: z.number().int().positive().nullable().optional(),
});
const EventUpdateSchema = z.object({
    activity: z.string().min(1).optional(),
    timing: z.date().optional(),
    venue: z.string().nullable().optional(),
    venue_link: z.string().url().nullable().optional(),
    adventureId: z.number().int().positive().nullable().optional(),
});
// AdventureMember validation schema
const AdventureMemberSchema = z.object({
    adventureId: z.number().int().positive(),
    userId: z.number().int().positive(),
});
// PendingUser validation schema
const PendingUserSchema = z.object({
    requestId: z.string().min(1, "Request ID is required"),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email format"),
    dob: z.string().min(1, "Date of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    expiresAt: z.date(),
});
const PendingUserUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    dob: z.string().min(1).optional(),
    gender: z.string().min(1).optional(),
    expiresAt: z.date().optional(),
});
// ========== USER OPERATIONS ==========
export async function addUser(userData) {
    try {
        const validatedData = UserSchema.parse(userData);
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        const dataForDb = {
            ...validatedData,
            phone: validatedData.phone ?? null,
            accessToken: validatedData.accessToken ?? null,
            bio: validatedData.bio ?? null,
            age: validatedData.age ?? null,
            gender: validatedData.gender ?? null,
        };
        const newUser = await prisma.user.create({ data: dataForDb });
        console.log("✅ User created successfully:", newUser);
        return newUser;
    }
    catch (error) {
        console.error("❌ Error adding user:", error);
        throw error;
    }
}
export async function updateUser(userId, updateData) {
    try {
        const validatedData = UserUpdateSchema.parse(updateData);
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            throw new Error("User not found");
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ User updated successfully:", updatedUser);
        return updatedUser;
    }
    catch (error) {
        console.error("❌ Error updating user:", error);
        throw error;
    }
}
export async function deleteUser(userId) {
    try {
        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            throw new Error("User not found");
        }
        const deletedUser = await prisma.user.delete({ where: { id: userId } });
        console.log("✅ User deleted successfully:", deletedUser);
        return deletedUser;
    }
    catch (error) {
        console.error("❌ Error deleting user:", error);
        throw error;
    }
}
export async function getUser(userId) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }
        console.log("✅ User found:", user);
        return user;
    }
    catch (error) {
        console.error("❌ Error getting user:", error);
        throw error;
    }
}
export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log("✅ All users retrieved:", users.length, "users found");
        return users;
    }
    catch (error) {
        console.error("❌ Error getting users:", error);
        throw error;
    }
}
// ========== BOSS OPERATIONS ==========
export async function addBoss(bossData) {
    try {
        const validatedData = BossSchema.parse(bossData);
        const existingBoss = await prisma.boss.findUnique({
            where: { email: validatedData.email },
        });
        if (existingBoss) {
            throw new Error("Boss with this email already exists");
        }
        const dataForDb = {
            ...validatedData,
            phone: validatedData.phone ?? null,
        };
        const newBoss = await prisma.boss.create({ data: dataForDb });
        console.log("✅ Boss created successfully:", newBoss);
        return newBoss;
    }
    catch (error) {
        console.error("❌ Error adding boss:", error);
        throw error;
    }
}
export async function updateBoss(bossId, updateData) {
    try {
        const validatedData = BossUpdateSchema.parse(updateData);
        const existingBoss = await prisma.boss.findUnique({ where: { id: bossId } });
        if (!existingBoss) {
            throw new Error("Boss not found");
        }
        const updatedBoss = await prisma.boss.update({
            where: { id: bossId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ Boss updated successfully:", updatedBoss);
        return updatedBoss;
    }
    catch (error) {
        console.error("❌ Error updating boss:", error);
        throw error;
    }
}
export async function deleteBoss(bossId) {
    try {
        const existingBoss = await prisma.boss.findUnique({ where: { id: bossId } });
        if (!existingBoss) {
            throw new Error("Boss not found");
        }
        const deletedBoss = await prisma.boss.delete({ where: { id: bossId } });
        console.log("✅ Boss deleted successfully:", deletedBoss);
        return deletedBoss;
    }
    catch (error) {
        console.error("❌ Error deleting boss:", error);
        throw error;
    }
}
export async function getBoss(bossId) {
    try {
        const boss = await prisma.boss.findUnique({ where: { id: bossId } });
        if (!boss) {
            throw new Error("Boss not found");
        }
        console.log("✅ Boss found:", boss);
        return boss;
    }
    catch (error) {
        console.error("❌ Error getting boss:", error);
        throw error;
    }
}
export async function getAllBosses() {
    try {
        const bosses = await prisma.boss.findMany();
        console.log("✅ All bosses retrieved:", bosses.length, "bosses found");
        return bosses;
    }
    catch (error) {
        console.error("❌ Error getting bosses:", error);
        throw error;
    }
}
// ========== ORGANIZER OPERATIONS ==========
export async function addOrganizer(organizerData) {
    try {
        const validatedData = OrganizerSchema.parse(organizerData);
        const existingOrganizer = await prisma.organizer.findUnique({
            where: { email: validatedData.email },
        });
        if (existingOrganizer) {
            throw new Error("Organizer with this email already exists");
        }
        const dataForDb = {
            ...validatedData,
            phone: validatedData.phone ?? null,
        };
        const newOrganizer = await prisma.organizer.create({ data: dataForDb });
        console.log("✅ Organizer created successfully:", newOrganizer);
        return newOrganizer;
    }
    catch (error) {
        console.error("❌ Error adding organizer:", error);
        throw error;
    }
}
export async function updateOrganizer(organizerId, updateData) {
    try {
        const validatedData = OrganizerUpdateSchema.parse(updateData);
        const existingOrganizer = await prisma.organizer.findUnique({ where: { id: organizerId } });
        if (!existingOrganizer) {
            throw new Error("Organizer not found");
        }
        const updatedOrganizer = await prisma.organizer.update({
            where: { id: organizerId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ Organizer updated successfully:", updatedOrganizer);
        return updatedOrganizer;
    }
    catch (error) {
        console.error("❌ Error updating organizer:", error);
        throw error;
    }
}
export async function deleteOrganizer(organizerId) {
    try {
        const existingOrganizer = await prisma.organizer.findUnique({ where: { id: organizerId } });
        if (!existingOrganizer) {
            throw new Error("Organizer not found");
        }
        const deletedOrganizer = await prisma.organizer.delete({ where: { id: organizerId } });
        console.log("✅ Organizer deleted successfully:", deletedOrganizer);
        return deletedOrganizer;
    }
    catch (error) {
        console.error("❌ Error deleting organizer:", error);
        throw error;
    }
}
export async function getOrganizer(organizerId) {
    try {
        const organizer = await prisma.organizer.findUnique({ where: { id: organizerId } });
        if (!organizer) {
            throw new Error("Organizer not found");
        }
        console.log("✅ Organizer found:", organizer);
        return organizer;
    }
    catch (error) {
        console.error("❌ Error getting organizer:", error);
        throw error;
    }
}
export async function getAllOrganizers() {
    try {
        const organizers = await prisma.organizer.findMany();
        console.log("✅ All organizers retrieved:", organizers.length, "organizers found");
        return organizers;
    }
    catch (error) {
        console.error("❌ Error getting organizers:", error);
        throw error;
    }
}
// ========== ADVENTURE OPERATIONS ==========
export async function addAdventure(adventureData) {
    try {
        const validatedData = AdventureSchema.parse(adventureData);
        const dataForDb = {
            ...validatedData,
            bossId: validatedData.bossId ?? null,
        };
        const newAdventure = await prisma.adventure.create({ data: dataForDb });
        console.log("✅ Adventure created successfully:", newAdventure);
        return newAdventure;
    }
    catch (error) {
        console.error("❌ Error adding adventure:", error);
        throw error;
    }
}
export async function updateAdventure(adventureId, updateData) {
    try {
        const validatedData = AdventureUpdateSchema.parse(updateData);
        const existingAdventure = await prisma.adventure.findUnique({ where: { id: adventureId } });
        if (!existingAdventure) {
            throw new Error("Adventure not found");
        }
        const updatedAdventure = await prisma.adventure.update({
            where: { id: adventureId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ Adventure updated successfully:", updatedAdventure);
        return updatedAdventure;
    }
    catch (error) {
        console.error("❌ Error updating adventure:", error);
        throw error;
    }
}
export async function deleteAdventure(adventureId) {
    try {
        const existingAdventure = await prisma.adventure.findUnique({ where: { id: adventureId } });
        if (!existingAdventure) {
            throw new Error("Adventure not found");
        }
        const deletedAdventure = await prisma.adventure.delete({ where: { id: adventureId } });
        console.log("✅ Adventure deleted successfully:", deletedAdventure);
        return deletedAdventure;
    }
    catch (error) {
        console.error("❌ Error deleting adventure:", error);
        throw error;
    }
}
export async function getAdventure(adventureId) {
    try {
        const adventure = await prisma.adventure.findUnique({
            where: { id: adventureId },
            include: { boss: true, events: true, members: true },
        });
        if (!adventure) {
            throw new Error("Adventure not found");
        }
        console.log("✅ Adventure found:", adventure);
        return adventure;
    }
    catch (error) {
        console.error("❌ Error getting adventure:", error);
        throw error;
    }
}
export async function getAllAdventures() {
    try {
        const adventures = await prisma.adventure.findMany({
            include: { boss: true, events: true, members: true },
        });
        console.log("✅ All adventures retrieved:", adventures.length, "adventures found");
        return adventures;
    }
    catch (error) {
        console.error("❌ Error getting adventures:", error);
        throw error;
    }
}
// ========== EVENT OPERATIONS ==========
export async function addEvent(eventData) {
    try {
        const validatedData = EventSchema.parse(eventData);
        const dataForDb = {
            ...validatedData,
            venue: validatedData.venue ?? null,
            venue_link: validatedData.venue_link ?? null,
            adventureId: validatedData.adventureId ?? null,
        };
        const newEvent = await prisma.event.create({ data: dataForDb });
        console.log("✅ Event created successfully:", newEvent);
        return newEvent;
    }
    catch (error) {
        console.error("❌ Error adding event:", error);
        throw error;
    }
}
export async function updateEvent(eventId, updateData) {
    try {
        const validatedData = EventUpdateSchema.parse(updateData);
        const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
        if (!existingEvent) {
            throw new Error("Event not found");
        }
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ Event updated successfully:", updatedEvent);
        return updatedEvent;
    }
    catch (error) {
        console.error("❌ Error updating event:", error);
        throw error;
    }
}
export async function deleteEvent(eventId) {
    try {
        const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
        if (!existingEvent) {
            throw new Error("Event not found");
        }
        const deletedEvent = await prisma.event.delete({ where: { id: eventId } });
        console.log("✅ Event deleted successfully:", deletedEvent);
        return deletedEvent;
    }
    catch (error) {
        console.error("❌ Error deleting event:", error);
        throw error;
    }
}
export async function getEvent(eventId) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { adventure: true },
        });
        if (!event) {
            throw new Error("Event not found");
        }
        console.log("✅ Event found:", event);
        return event;
    }
    catch (error) {
        console.error("❌ Error getting event:", error);
        throw error;
    }
}
export async function getAllEvents() {
    try {
        const events = await prisma.event.findMany({
            include: { adventure: true },
        });
        console.log("✅ All events retrieved:", events.length, "events found");
        return events;
    }
    catch (error) {
        console.error("❌ Error getting events:", error);
        throw error;
    }
}
// ========== ADVENTURE MEMBER OPERATIONS ==========
export async function addAdventureMember(memberData) {
    try {
        const validatedData = AdventureMemberSchema.parse(memberData);
        const existingMember = await prisma.adventureMember.findUnique({
            where: {
                adventureId_userId: {
                    adventureId: validatedData.adventureId,
                    userId: validatedData.userId,
                },
            },
        });
        if (existingMember) {
            throw new Error("User is already a member of this adventure");
        }
        const newMember = await prisma.adventureMember.create({ data: validatedData });
        console.log("✅ Adventure member added successfully:", newMember);
        return newMember;
    }
    catch (error) {
        console.error("❌ Error adding adventure member:", error);
        throw error;
    }
}
export async function deleteAdventureMember(adventureId, userId) {
    try {
        const existingMember = await prisma.adventureMember.findUnique({
            where: {
                adventureId_userId: {
                    adventureId,
                    userId,
                },
            },
        });
        if (!existingMember) {
            throw new Error("Adventure member not found");
        }
        const deletedMember = await prisma.adventureMember.delete({
            where: {
                adventureId_userId: {
                    adventureId,
                    userId,
                },
            },
        });
        console.log("✅ Adventure member removed successfully:", deletedMember);
        return deletedMember;
    }
    catch (error) {
        console.error("❌ Error removing adventure member:", error);
        throw error;
    }
}
export async function getAdventureMembers(adventureId) {
    try {
        const members = await prisma.adventureMember.findMany({
            where: { adventureId },
            include: { user: true, adventure: true },
        });
        console.log("✅ Adventure members retrieved:", members.length, "members found");
        return members;
    }
    catch (error) {
        console.error("❌ Error getting adventure members:", error);
        throw error;
    }
}
// ========== PENDING USER OPERATIONS ==========
export async function addPendingUser(pendingUserData) {
    try {
        const validatedData = PendingUserSchema.parse(pendingUserData);
        const existingPendingUser = await prisma.pendingUser.findUnique({
            where: { requestId: validatedData.requestId },
        });
        if (existingPendingUser) {
            throw new Error("Pending user with this request ID already exists");
        }
        const newPendingUser = await prisma.pendingUser.create({ data: validatedData });
        console.log("✅ Pending user created successfully:", newPendingUser);
        return newPendingUser;
    }
    catch (error) {
        console.error("❌ Error adding pending user:", error);
        throw error;
    }
}
export async function updatePendingUser(requestId, updateData) {
    try {
        const validatedData = PendingUserUpdateSchema.parse(updateData);
        const existingPendingUser = await prisma.pendingUser.findUnique({ where: { requestId } });
        if (!existingPendingUser) {
            throw new Error("Pending user not found");
        }
        const updatedPendingUser = await prisma.pendingUser.update({
            where: { requestId },
            data: removeUndefined(validatedData),
        });
        console.log("✅ Pending user updated successfully:", updatedPendingUser);
        return updatedPendingUser;
    }
    catch (error) {
        console.error("❌ Error updating pending user:", error);
        throw error;
    }
}
export async function deletePendingUser(requestId) {
    try {
        const existingPendingUser = await prisma.pendingUser.findUnique({ where: { requestId } });
        if (!existingPendingUser) {
            throw new Error("Pending user not found");
        }
        const deletedPendingUser = await prisma.pendingUser.delete({ where: { requestId } });
        console.log("✅ Pending user deleted successfully:", deletedPendingUser);
        return deletedPendingUser;
    }
    catch (error) {
        console.error("❌ Error deleting pending user:", error);
        throw error;
    }
}
export async function getPendingUser(requestId) {
    try {
        const pendingUser = await prisma.pendingUser.findUnique({ where: { requestId } });
        if (!pendingUser) {
            throw new Error("Pending user not found");
        }
        console.log("✅ Pending user found:", pendingUser);
        return pendingUser;
    }
    catch (error) {
        console.error("❌ Error getting pending user:", error);
        throw error;
    }
}
export async function getAllPendingUsers() {
    try {
        const pendingUsers = await prisma.pendingUser.findMany();
        console.log("✅ All pending users retrieved:", pendingUsers.length, "pending users found");
        return pendingUsers;
    }
    catch (error) {
        console.error("❌ Error getting pending users:", error);
        throw error;
    }
}
// Close database connection
export async function closeConnection() {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
}
//# sourceMappingURL=database-operations.js.map