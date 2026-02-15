import { randomBytes } from "crypto";
import pool from "../dbms/db.js";
import { getOrganizer, updateOrganizer, updateAccessToken, getOrganizerByEmail, logout } from "../dbms/organizer-helpers.js"; // Ensure this file exports updateUser correctly
import { createRequest, currentMatchRequestOrganizer, completeMatch } from "../dbms/match-request-helpers.js";
import { getWord2s } from '../dbms/category-helpers.js';
import { getActiveOrganizerAdventures, getInactiveOrganizerAdventures, isRelatedToAdventure } from '../dbms/adventure-helpers.js';
import { countMessages, getMessagesFromAToB } from '../dbms/message-helpers.js';
import { getBoss } from '../dbms/boss-helpers.js';
import { getUser } from '../dbms/user-helpers.js';
export const getAdventures = async (req, res) => {
    const { oid, accessToken } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken) {
            return res.json(await getActiveOrganizerAdventures(oid, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const count = async (req, res) => {
    const { adventureId, id, role, accessToken } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken) {
            if (await isRelatedToAdventure(id, role, adventureId, pool))
                return res.json(await countMessages(adventureId, pool));
            return res.json({ success: false });
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const getMessages = async (req, res) => {
    const { adventureId, id, role, accessToken, a, b } = req.body;
    let person;
    if (role == "organizer")
        person = await getOrganizer(id, pool);
    else if (role == "boss")
        person = await getBoss(id, pool);
    else
        person = await getUser(id, pool);
    if (person)
        if (person.access_token == accessToken && accessToken) {
            if (await isRelatedToAdventure(id, role, adventureId, pool))
                return res.json(await getMessagesFromAToB(adventureId, a, b, pool));
            return res.json({ success: false });
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const getPastAdventures = async (req, res) => {
    const { oid, accessToken, a, b } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken) {
            return res.json(await getInactiveOrganizerAdventures(oid, a, b, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const updateOrganizerProfile = async (req, res) => {
    const { oid, accessToken, updates } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken) {
            const updatedOrganizer = await updateOrganizer(oid, updates, pool);
            delete updatedOrganizer.password;
            return res.json(updatedOrganizer);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const getOrganizerDashboard = async (req, res) => {
    const { oid, accessToken } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken) {
            delete organizer.password;
            return res.json(organizer);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const requestMatch = async (req, res) => {
    const { oid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken)
            return res.json(await createRequest(oid, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead, (organizer.gender == "M" && organizer.setting_1 == true), (organizer.gender == "F" && organizer.setting_1 == true), (organizer.gender == "F" && organizer.setting_2 == true), pool));
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    const organizer = await getOrganizerByEmail(email, pool);
    const encode = (text) => {
        return Buffer.from(text, "utf8").toString("base64");
    };
    if (organizer)
        if (organizer.password == encode(password)) {
            const organizerDetails = await updateAccessToken(organizer.id, randomBytes(16).toString("hex"), pool);
            organizerDetails.password = password;
            return res.json(organizerDetails);
        }
        else
            return res.status(500).json({ "error": "Password does not match" });
    else
        return res.status(500).json({ "error": "No such organizer" });
};
export const logOut = async (req, res) => {
    const { oid, accessToken } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken)
            return res.json(await logout(oid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
export const currentMatchRequest = async (req, res) => {
    const { oid, accessToken } = req.body;
    const organizer = await getOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken)
            return res.json(await currentMatchRequestOrganizer(oid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
export const startAdventure = async (req, res) => {
    const { oid, accessToken, name } = req.body;
    const organizer = await getOrganizer(oid, pool);
    const matchRequests = await currentMatchRequestOrganizer(oid, pool);
    if (organizer)
        if (organizer.access_token == accessToken && accessToken)
            if (name)
                return res.json(await completeMatch(name, matchRequests[0].id, pool));
            else
                return res.json(await completeMatch(await generateRandomName(matchRequests[0].category_id), matchRequests[0].id, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
async function generateRandomName(categoryId) {
    const word3Options = [
        "Adventure", "Quest", "Story", "Exam", "Course", "Files", "Case",
        "Pursuit", "Race", "Problem", "Challenge", "Puzzle", "Battle",
        "Journey", "Mission", "Expedition", "Trial", "Test", "Assignment",
        "Task", "Campaign", "Investigation", "Operation",
        "Riddle", "Enigma", "Dilemma", "Scenario",
        "Assessment", "Evaluation",
        "Sprint", "Run", "Showdown", "Contest",
        "Match", "Clash",
        "Module", "Lesson",
        "Stage", "Episode", "Chapter", "Dungeon",
        "Conflict", "Encounter", "Struggle", "Siege",
        "Session", "Path", "Phase", "Round"
    ];
    const word1Options = ["The", "A", "Brave", "Curious", "Quirky", "Swift", "Mighty", "Sunny", "Witty", "Bold", "Clever", "Cheerful",
        "Lucky", "Sneaky", "Fierce", "Gentle", "Playful", "Jolly", "Calm", "Bright", "Zesty", "Nimble",
        "Cosmic", "Epic", "Happy", "Fuzzy", "Breezy", "Chirpy", "Spunky", "Goofy", "Daring", "Dreamy",
        "Magic", "Rusty", "Funky", "Snappy", "Peppy", "Jazzy", "Chilly", "Stormy", "Wavy", "Glowing",
        "Radiant", "Sparkly", "Bubbly", "Whimsical", "Fearless", "Lively", "Sunny", "Golden", "Wild",
        "Free", "Sneaky", "Silly", "Charming", "Crafty", "Flashy", "Loopy", "Bouncy", "Cosy", "Snug",
        "Wacky", "Feisty", "Lucky", "Moody", "Speedy", "Cheeky", "Plucky", "Shiny", "Roaming", "Witty",
        "Curly", "Fluffy", "Frothy", "Crackling", "Zippy", "Perky", "Sunny", "Blissful", "Jumpy", "Dizzy",
        "Groovy", "Spirited", "Snazzy", "Sparky", "Breezy", "Rugged", "Rowdy", "Cheerful", "Twisty",
        "Fabled", "Mystic", "Electric", "Glitchy", "Pixelated", "Retro", "Feral", "Cosmic", "Nebulous",
        "Galactic", "Playful", "Oddball", "Scrappy", "Heroic", "Nifty", "Jovial", "Kooky", "Slinky",
        "Chipper", "Mellow", "Bouncy", "Fiery", "Snappy", "Crafty", "Curious", "Roaring",
        "Hidden", "Secret", "Frosty", "Dusty", "Sunny", "Crimson", "Azure", "Emerald", "Golden",
        "Midnight", "Glassy", "Echoing", "Floating", "Drifting", "Rolling", "Crackling",
        "Howling", "Wandering", "Restless", "Fearless", "Radiant", "Sparked", "Tilted", "Spinning",
        "Laughing", "Skipping", "Buzzing", "Fluttery", "Ticklish", "Cheery", "Snug", "Lofty", "Cosy",
        "Brisk", "Chasing", "Racing", "Roaming", "Hopping", "Dancing", "Smiling", "Glorious", "Epic",
        "Legendary", "Mythic", "Playbound", "Starry", "Moonlit", "Sunlit", "Cloudy", "Windy", "Stormlit"];
    const word2Options = (await getWord2s(categoryId, pool)).word_2s;
    let word1 = word1Options[Math.floor(Math.random() * word1Options.length)];
    const word2 = word2Options[Math.floor(Math.random() * word2Options.length)];
    const word3 = word3Options[Math.floor(Math.random() * word3Options.length)];
    if (word1 == "A" && (word2 == "A" || word2 == "E" || word2 == "I" || word2 == "O" || word2 == "U"))
        word1 = "An";
    return word1 + " " + word2 + " " + word3;
}
//# sourceMappingURL=adventureController.js.map