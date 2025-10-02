import { users } from "../models/db.js";
/* ----------------- UPDATE PROFILE ----------------- */
export const updateUserProfile = (req, res) => {
    const { accessToken, username, bio, email } = req.body;
    if (!accessToken) {
        return res.status(400).json({ error: "Access token required" });
    }
    // Find the user by accessToken
    const user = users.find((u) => u.accessToken === accessToken);
    if (!user) {
        return res
            .status(404)
            .json({ error: "Invalid access token or user not found" });
    }
    // Update only the provided fields
    if (username !== undefined)
        user.username = username;
    if (bio !== undefined)
        user.bio = bio;
    if (email !== undefined)
        user.email = email;
    return res.json({
        message: "Profile updated successfully",
        user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            username: user.username,
            bio: user.bio,
            dob: user.dob,
            gender: user.gender,
        },
    });
};
//# sourceMappingURL=userController.js.map