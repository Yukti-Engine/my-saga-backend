import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { updateUser } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly

export const updateUserProfile = async (req: Request, res: Response) => {
  const { accessToken, username, bio, email } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token required" });
  }

  try {
    // Find user by accessToken
    const findUserQuery = "SELECT * FROM users WHERE access_token = $1";
    const userResult = await pool.query(findUserQuery, [accessToken]);
    const user = userResult.rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ error: "Invalid access token or user not found" });
    }

    // Update user using helper
    const updatedUser = await updateUser(user.id, { username, bio, email }, pool);

    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to update user" });
    }

    return res.json({
      message: "Profile updated successfully",
      user: {
        email: updatedUser.email,
        username: updatedUser.username,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Server error while updating profile" });
  }
};
