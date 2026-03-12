import type { Request, Response } from "express";
import pool from "../db.js";

export const getOffers = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_user($1)`, [uid]);
  const user = rows[0];
  if (!user)
    return res.status(500).json({ error: "No such user" });
  if (user.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_all_offers()`);
  return res.json(result.rows);
};
