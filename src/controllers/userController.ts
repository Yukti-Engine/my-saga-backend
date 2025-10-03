
import type { Request, Response } from "express";
import { updateUser } from "../dbms/src/user-helpers.js"; // change path as needed
import { prisma } from "../dbms/src/client.js"; // or import prisma directly for queries

export const updateUserProfile = async (req: Request, res: Response) => {
  const { accessToken, username, bio, email } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token required" });
  }

  // Find user by accessToken with prisma query directly
  const user = await prisma.user.findFirst({ where: { accessToken } });

  if (!user) {
    return res.status(404).json({ error: "Invalid access token or user not found" });
  }

  const updatedUser = await updateUser(user.id, { username, bio, email });

  if (!updatedUser) {
    return res.status(500).json({ error: "Failed to update user" });
  }

  return res.json({
    message: "Profile updated successfully",
    user: {
      email: updatedUser.email,
      username: updatedUser.username,
      bio: updatedUser.bio
    },
  });
};

