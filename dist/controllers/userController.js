import pool from "../dbms/db.js";
import { updateUser, getUser, logout, deductGems, getCompatibleRequests, checkReverseCompatibility, match, currentMatchRequest, getActiveAdventures, getInactiveAdventures, sendNotification, countNotifications, getNotificationsFromAToB } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly
export const updateUserProfile = async (req, res) => {
    const { uid, accessToken, updates } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken) {
            const updatedUser = await updateUser(uid, updates, pool);
            return res.json(updatedUser);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
export const getUserDashboard = async (req, res) => {
    const { uid, accessToken } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken)
            return res.json({ "id": user.id, "username": user.username, "email": user.email, "level": user.level, "star_score": user.star_score, "penalties": user.penalties, "bio": user.bio, "age": user.age, "gender": user.gender, "setting_1": user.setting_1, "setting_2": user.setting_2, "icon": user.icon.toString("base64") });
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
export const requestMatch = async (req, res) => {
    const { uid, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
    const user = await getUser(uid, pool);
    console.log(user);
    const age = getAge(user.dob);
    if (user)
        if (user.access_token == accessToken && accessToken) {
            const compatibleRequests = await getCompatibleRequests(categoryId, age, latitude, longitude, user.gender, pool);
            const potentialAdventures = [];
            for (const element of compatibleRequests) {
                const isCompatible = await checkReverseCompatibility(element.id, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax, (user.gender == 'F' && user.setting_1), (user.gender == 'F' && user.setting_2), pool);
                if (isCompatible) {
                    potentialAdventures.push(element);
                }
            }
            return res.json(potentialAdventures);
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such boss" });
};
export const getAdventures = async (req, res) => {
    const { uid, accessToken } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken) {
            return res.json(await getActiveAdventures(uid, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
export const getPastAdventures = async (req, res) => {
    const { uid, accessToken, a, b } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken) {
            return res.json(await getInactiveAdventures(uid, a, b, pool));
        }
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
export const joinAdventure = async (req, res) => {
    const { uid, accessToken, matchRequest, minTeamMembers, ageRangeMin, ageRangeMax } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken) {
            const matched = await match(uid, minTeamMembers, ageRangeMin, ageRangeMax, matchRequest, pool);
            if (matched.success) {
                const deducted = await deductGems(uid, matched.cost, pool);
                if (deducted.success)
                    return res.json({ success: true });
                else
                    return res.json({ success: false, message: "Insufficient gems" });
            }
            return res.json({ success: false, message: "Insufficient gems" });
        }
    return res.json({ success: false, message: "Authentication Failed" });
};
export const logOut = async (req, res) => {
    const { uid, accessToken } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken)
            return res.json(await logout(uid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
};
export const currentLobby = async (req, res) => {
    const { uid, accessToken } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken && accessToken)
            return res.json(await currentMatchRequest(uid, pool));
    return res.status(500).json({ "error": "Authentication Failed" });
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
export const send = async (req, res) => {
    const { uid, accessToken, message, receiverRole, receiverId } = req.body;
    const user = await getUser(uid, pool);
    if (user.access_token == accessToken && accessToken) {
        const sent = await sendNotification(uid, receiverRole, receiverId, message, pool);
        if (sent.success) {
            const deducted = await deductGems(uid, 1, pool);
            if (deducted.success)
                return res.json({ success: true });
            else
                return res.json({ success: false, message: "Insufficient Gems" });
        }
        else
            return res.json({ success: false });
    }
    else
        return res.status(500).json({ "error": "Authentication Error" });
};
export const count = async (req, res) => {
    const { uid, accessToken } = req.body;
    const user = await getUser(uid, pool);
    if (user.access_token == accessToken && accessToken) {
        return res.json(await countNotifications(uid, pool));
    }
    else
        return res.status(500).json({ "error": "Authentication Error" });
};
export const receive = async (req, res) => {
    const { uid, accessToken, a, b } = req.body;
    const user = await getUser(uid, pool);
    if (user.access_token == accessToken && accessToken) {
        return res.json(await getNotificationsFromAToB(uid, a, b, pool));
    }
    else
        return res.status(500).json({ "error": "Authentication Error" });
};
//# sourceMappingURL=userController.js.map