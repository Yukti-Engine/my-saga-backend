import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { getAllCategories, getAllSubcategories } from "../dbms/search-helpers.js"; // Ensure this file exports updateUser correctly

export const getCategories = async (req: Request, res: Response) => {
  return res.json(await getAllCategories(pool));
}

export const getSubcategories = async (req: Request, res: Response) => {
  const category = req.body.category;
  return res.json(await getAllSubcategories(category, pool));
}
