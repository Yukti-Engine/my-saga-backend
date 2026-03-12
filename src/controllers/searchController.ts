import type { Request, Response } from "express";
import pool from "../db.js";

async function getPerson(role: string, id: number) {
  if (role === "organizer")
    return (await pool.query(`SELECT * FROM get_organizer($1)`, [id])).rows[0];
  else if (role === "boss")
    return (await pool.query(`SELECT * FROM get_boss($1)`, [id])).rows[0];
  else
    return (await pool.query(`SELECT * FROM get_user($1)`, [id])).rows[0];
}

export const getCategories = async (req: Request, res: Response) => {
  const { id, role, accessToken } = req.body;
  const person = await getPerson(role, id);
  if (!person)
    return res.status(500).json({ error: "No such person" });
  if (person.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_all_categories()`);
  return res.json(result.rows);
};

export const getSubcategories = async (req: Request, res: Response) => {
  const { category, id, role, accessToken } = req.body;
  const person = await getPerson(role, id);
  if (!person)
    return res.status(500).json({ error: "No such person" });
  if (person.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_all_subcategories($1)`, [category]);
  return res.json(result.rows);
};

export const getProfile = async (req: Request, res: Response) => {
  const { profileId, profileRole, id, role, accessToken } = req.body;
  const person = await getPerson(role, id);
  if (!person)
    return res.status(500).json({ error: "No such person" });
  if (person.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const person2 = await getPerson(profileRole, profileId);
  return res.json({
    username: person2.username, dob: person2.dob, gender: person2.gender,
    setting_1: person2.setting_1, setting_2: person2.setting_2,
    icon: person2.icon?.toString("base64"), bio: person2.bio
  });
};
