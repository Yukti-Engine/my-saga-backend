import { randomBytes } from "crypto";
import pool from "../dbms/db.js";
import { getBoss, updateBoss, updateAccessToken, getBossByEmail } from "../dbms/boss-helpers.js"; // Ensure this file exports updateUser correctly
import { createRequest } from "../dbms/match-request-helpers.js";
export const updateBossProfile = async (req, res) => {
    const { bid, accessToken, updates } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken) {
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
        if (boss.access_token == accessToken) {
            delete boss.password;
            return res.json(boss);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const requestMatch = async (req, res) => {
    const { bid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
    const boss = await getBoss(bid, pool);
    if (boss)
        if (boss.access_token == accessToken)
            return res.json(await createRequest(null, bid, null, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, pool));
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
//# sourceMappingURL=bossController.js.map