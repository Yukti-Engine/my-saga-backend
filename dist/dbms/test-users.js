import { 
// User operations
addUser, updateUser, deleteUser, getUser, getAllUsers, 
// Boss operations
addBoss, updateBoss, deleteBoss, getBoss, getAllBosses, 
// Organizer operations
addOrganizer, updateOrganizer, deleteOrganizer, getOrganizer, getAllOrganizers, 
// Adventure operations
addAdventure, updateAdventure, deleteAdventure, getAdventure, getAllAdventures, 
// Event operations
addEvent, updateEvent, deleteEvent, getEvent, getAllEvents, 
// Adventure Member operations
addAdventureMember, deleteAdventureMember, getAdventureMembers, 
// Pending User operations
addPendingUser, updatePendingUser, deletePendingUser, getPendingUser, getAllPendingUsers, 
// Connection
closeConnection, } from "./src/database-operations.js";
async function testAllDatabaseOperations() {
    console.log("🚀 Starting Comprehensive Database Operations Test\n");
    try {
        // ========== USER OPERATIONS ==========
        console.log("👤 ========== USER OPERATIONS ==========");
        console.log("📝 Test 1: Adding a new user...");
        const newUserData = {
            name: "John Doe",
            email: "john.doe@example.com",
            username: "johndoe123",
            phone: "+1234567890",
            age: 25,
            bio: "Software developer from NYC",
            gender: "male",
            level: 1,
            gems: 100,
            star_score: 0,
            accessToken: "sample_access_token_123",
            setting_1: true,
            setting_2: false,
        };
        const createdUser = await addUser(newUserData);
        const userId = createdUser.id;
        console.log(`User created with ID: ${userId}\n`);
        console.log("🔍 Test 2: Getting the user...");
        await getUser(userId);
        console.log("");
        console.log("✏️ Test 3: Updating the user...");
        const updateUserData = {
            bio: "Updated bio: Senior Software Developer from NYC",
            level: 2,
            gems: 250,
            star_score: 5,
            accessToken: "updated_access_token_456",
        };
        await updateUser(userId, updateUserData);
        console.log("");
        console.log("📋 Test 4: Getting all users...");
        await getAllUsers();
        console.log("");
        // ========== BOSS OPERATIONS ==========
        console.log("👔 ========== BOSS OPERATIONS ==========");
        console.log("📝 Test 5: Adding a new boss...");
        const newBossData = {
            name: "Jane Smith",
            email: "jane.smith@company.com",
            username: "janesmith_boss",
            phone: "+1987654321",
            credits: 500,
        };
        const createdBoss = await addBoss(newBossData);
        const bossId = createdBoss.id;
        console.log(`Boss created with ID: ${bossId}\n`);
        console.log("🔍 Test 6: Getting the boss...");
        await getBoss(bossId);
        console.log("");
        console.log("✏️ Test 7: Updating the boss...");
        const updateBossData = {
            credits: 750,
            phone: "+1555666777",
        };
        await updateBoss(bossId, updateBossData);
        console.log("");
        console.log("📋 Test 8: Getting all bosses...");
        await getAllBosses();
        console.log("");
        // ========== ORGANIZER OPERATIONS ==========
        console.log("🎯 ========== ORGANIZER OPERATIONS ==========");
        console.log("📝 Test 9: Adding a new organizer...");
        const newOrganizerData = {
            name: "Mike Johnson",
            email: "mike.johnson@events.com",
            username: "mikejohnson_org",
            phone: "+1444555666",
            credits: 300,
        };
        const createdOrganizer = await addOrganizer(newOrganizerData);
        const organizerId = createdOrganizer.id;
        console.log(`Organizer created with ID: ${organizerId}\n`);
        console.log("🔍 Test 10: Getting the organizer...");
        await getOrganizer(organizerId);
        console.log("");
        console.log("✏️ Test 11: Updating the organizer...");
        const updateOrganizerData = {
            credits: 450,
            name: "Michael Johnson",
        };
        await updateOrganizer(organizerId, updateOrganizerData);
        console.log("");
        console.log("📋 Test 12: Getting all organizers...");
        await getAllOrganizers();
        console.log("");
        // ========== ADVENTURE OPERATIONS ==========
        console.log("🏔️ ========== ADVENTURE OPERATIONS ==========");
        console.log("📝 Test 13: Adding a new adventure...");
        const newAdventureData = {
            name: "Mountain Hiking Adventure",
            bossId: bossId,
        };
        const createdAdventure = await addAdventure(newAdventureData);
        const adventureId = createdAdventure.id;
        console.log(`Adventure created with ID: ${adventureId}\n`);
        console.log("🔍 Test 14: Getting the adventure...");
        await getAdventure(adventureId);
        console.log("");
        console.log("✏️ Test 15: Updating the adventure...");
        const updateAdventureData = {
            name: "Epic Mountain Hiking Adventure",
        };
        await updateAdventure(adventureId, updateAdventureData);
        console.log("");
        console.log("📋 Test 16: Getting all adventures...");
        await getAllAdventures();
        console.log("");
        // ========== EVENT OPERATIONS ==========
        console.log("📅 ========== EVENT OPERATIONS ==========");
        console.log("📝 Test 17: Adding a new event...");
        const newEventData = {
            activity: "Rock Climbing Session",
            timing: new Date("2024-12-25T10:00:00Z"),
            venue: "Rocky Mountain Park",
            venue_link: "https://rockymountainpark.com",
            adventureId: adventureId,
        };
        const createdEvent = await addEvent(newEventData);
        const eventId = createdEvent.id;
        console.log(`Event created with ID: ${eventId}\n`);
        console.log("🔍 Test 18: Getting the event...");
        await getEvent(eventId);
        console.log("");
        console.log("✏️ Test 19: Updating the event...");
        const updateEventData = {
            activity: "Advanced Rock Climbing Session",
            venue: "Rocky Mountain Adventure Park",
        };
        await updateEvent(eventId, updateEventData);
        console.log("");
        console.log("📋 Test 20: Getting all events...");
        await getAllEvents();
        console.log("");
        // ========== ADVENTURE MEMBER OPERATIONS ==========
        console.log("👥 ========== ADVENTURE MEMBER OPERATIONS ==========");
        console.log("📝 Test 21: Adding user to adventure...");
        const newMemberData = {
            adventureId: adventureId,
            userId: userId,
        };
        await addAdventureMember(newMemberData);
        console.log("");
        console.log("🔍 Test 22: Getting adventure members...");
        await getAdventureMembers(adventureId);
        console.log("");
        // ========== PENDING USER OPERATIONS ==========
        console.log("⏳ ========== PENDING USER OPERATIONS ==========");
        console.log("📝 Test 23: Adding a new pending user...");
        const newPendingUserData = {
            requestId: "req_123456789",
            name: "Alice Brown",
            phone: "+1333444555",
            email: "alice.brown@example.com",
            dob: "1995-06-15",
            gender: "female",
            expiresAt: new Date("2024-12-31T23:59:59Z"),
        };
        const createdPendingUser = await addPendingUser(newPendingUserData);
        const pendingUserRequestId = createdPendingUser.requestId;
        console.log(`Pending user created with Request ID: ${pendingUserRequestId}\n`);
        console.log("🔍 Test 24: Getting the pending user...");
        await getPendingUser(pendingUserRequestId);
        console.log("");
        console.log("✏️ Test 25: Updating the pending user...");
        const updatePendingUserData = {
            name: "Alice Marie Brown",
            phone: "+1333444777",
        };
        await updatePendingUser(pendingUserRequestId, updatePendingUserData);
        console.log("");
        console.log("📋 Test 26: Getting all pending users...");
        await getAllPendingUsers();
        console.log("");
        // ========== CLEANUP OPERATIONS ==========
        console.log("🧹 ========== CLEANUP OPERATIONS ==========");
        console.log("🗑️ Test 27: Deleting pending user...");
        await deletePendingUser(pendingUserRequestId);
        console.log("");
        console.log("🗑️ Test 28: Removing user from adventure...");
        await deleteAdventureMember(adventureId, userId);
        console.log("");
        console.log("🗑️ Test 29: Deleting event...");
        await deleteEvent(eventId);
        console.log("");
        console.log("🗑️ Test 30: Deleting adventure...");
        await deleteAdventure(adventureId);
        console.log("");
        console.log("🗑️ Test 31: Deleting organizer...");
        await deleteOrganizer(organizerId);
        console.log("");
        console.log("🗑️ Test 32: Deleting boss...");
        await deleteBoss(bossId);
        console.log("");
        console.log("🗑️ Test 33: Deleting user...");
        await deleteUser(userId);
        console.log("");
        console.log("✅ All tests completed successfully!");
    }
    catch (error) {
        console.error("❌ Test failed:", error);
    }
    finally {
        // Always close the connection
        await closeConnection();
    }
}
// Run the comprehensive test
testAllDatabaseOperations();
//# sourceMappingURL=test-users.js.map