import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { getAllOffers } from "../dbms/shop-helpers.js"; // Ensure this file exports updateUser correctly
import { getUser } from "../dbms/user-helpers.js";

export const getOffers = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const user = await getUser(uid, pool);
  if (user.is_non_binary== true)
    user.gender = "NB"
  if (user)
    if (user.access_token == accessToken && accessToken)
      return res.json(await getAllOffers(pool));
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such user"});
}
