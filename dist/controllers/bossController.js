import { randomBytes } from "crypto";
import pool from "../dbms/db.js";
import { getBoss, updateBoss, updateAccessToken, getBossByEmail, logout, getActiveAdventures, getInactiveAdventures, getCompatibleRequests, checkReverseCompatibility, match, currentMatchRequest } from "../dbms/boss-helpers.js"; // Ensure this file exports updateUser correctly
import { isRelatedToAdventure, createEvent } from "../dbms/adventure-helpers.js";
export const getAdventures = async (req, res) => {
    const { bid, accessToken } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            return res.json(await getActiveAdventures(bid, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const organizeExam = async (req, res) => {
    const { bid, accessToken, activity, timing, venue, venueLink, adventureId, instruction } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            try {
                if (await isRelatedToAdventure(bid, "boss", adventureId, pool)) {
                    await createEvent(activity, timing, venue, venueLink, adventureId, instruction, true, pool);
                    return res.json({ success: true });
                }
                return res.json({ success: false });
            }
            catch {
                return res.json({ success: false });
            }
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const getPastAdventures = async (req, res) => {
    const { bid, accessToken, a, b } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            return res.json(await getInactiveAdventures(bid, a, b, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const updateBossProfile = async (req, res) => {
    const { bid, accessToken, updates } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            const updatedBoss = await updateBoss(bid, updates, pool);
            delete updatedBoss.password;
            return res.json(updatedBoss);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const getBossDashboard = async (req, res) => {
    const { bid, accessToken } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            delete boss.password;
            return res.json(boss);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
function getAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasHadBirthdayThisYear = today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());
    if (!hasHadBirthdayThisYear) {
        age--;
    }
    return age;
}
export const findAdventures = async (req, res) => {
    const { bid, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
    const boss = await getBoss(bid, pool);
    const age = getAge(boss.dob);
    if (boss)
        if (boss.access_token == accessToken && accessToken) {
            const compatibleRequests = await getCompatibleRequests(categoryId, age, latitude, longitude, (boss.gender == "M" && boss.setting_1 == true), (boss.gender == "F" && boss.setting_1 == true), (boss.gender == "F" && boss.setting_2 == true), boss.gender, pool);
            const potentialAdventures = [];
            for (const element of compatibleRequests) {
                const isCompatible = await checkReverseCompatibility(element.id, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax, pool);
                if (isCompatible) {
                    potentialAdventures.push(element);
                }
            }
            const finalPotentialMatches = [];
            for (const element of potentialAdventures) {
                if (element.boss_id) {
                }
                else {
                    finalPotentialMatches.push(element);
                }
            }
            return res.json(finalPotentialMatches);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    const boss = await getBossByEmail(email, pool);
    const encode = (text) => {
        return Buffer.from(text, "utf8").toString("base64");
    };
    if (boss)
        if (boss.password == encode(password)) {
            const bossDetails = await updateAccessToken(boss.id, randomBytes(16).toString("hex"), pool);
            bossDetails.password = password;
            return res.json(bossDetails);
        }
        else
            return res.status(500).json({ "error": "Password does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const joinAdventure = async (req, res) => {
    const { bid, accessToken, matchRequest, payPerHead2 } = req.body;
    const user = await getBoss(bid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken)
            return res.json(await match(bid, payPerHead2, matchRequest, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
export const logOut = async (req, res) => {
    const { bid, accessToken } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken)
            return res.json(await logout(bid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
export const currentLobby = async (req, res) => {
    const { bid, accessToken } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken && accessToken)
            return res.json(await currentMatchRequest(bid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
//# sourceMappingURL=bossController.js.map