import pool from "../dbms/db.js";
import { updateUser, getUser } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly
import { createRequest } from "../dbms/match-request-helpers.js";
export const updateUserProfile = async (req, res) => {
    const { uid, accessToken, updates } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken) {
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
        if (user.access_token == accessToken)
            return res.json(user);
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
export const requestMatch = async (req, res) => {
    const { uid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
    const user = await getUser(uid, pool);
    if (user)
        if (user.access_token == accessToken)
            return res.json(await createRequest(uid, null, null, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, pool));
        else
            return res.status(500).json({ "error": "Access token does not match" });
    else
        return res.status(500).json({ "error": "No such user" });
};
//# sourceMappingURL=userController.js.map