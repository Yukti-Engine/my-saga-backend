import pool from "../dbms/db.js";
import { getUser } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly
export const updateUserProfile = async (req, res) => {
    const { accessToken, username, bio, email } = req.body;
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
//# sourceMappingURL=userController.js.map