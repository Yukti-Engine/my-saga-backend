import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { getAllOffers } from "../dbms/shop-helpers.js"; // Ensure this file exports updateUser correctly

export const getOffers = async (req: Request, res: Response) => {
  return res.json(await getAllOffers(pool));
}
