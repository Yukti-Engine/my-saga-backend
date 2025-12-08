import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { updateUser, getUser } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly

export const updateUserProfile = async (req: Request, res: Response) => {
  const { accessToken, username, bio, email } = req.body;

};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const user = await getUser(uid, pool);
  if (user)
    if (user.access_token == accessToken)
      return res.json(user);
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such user"});
}
