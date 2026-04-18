import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";

export const getCategories = async (req: Request, res: Response) => {
  const result = await pool.query(`SELECT * FROM get_all_categories()`);
  return res.json(result.rows);
};

export const getSubcategories = async (req: Request, res: Response) => {
  const { category } = req.body;

  const result = await pool.query(`SELECT * FROM get_all_subcategories($1::text)`, [category]);
  return res.json(result.rows);
};

export const getProfile = async (req: Request, res: Response) => {
  const { profileId, profileRole } = req.body;
  let person2;
  if (profileRole === "organizer")
    person2 = (await pool.query(`SELECT * FROM get_organizer($1::int)`, [profileId])).rows[0];
  else if (profileRole === "boss")
    person2 = (await pool.query(`SELECT * FROM get_boss($1::int)`, [profileId])).rows[0];
  else
    person2 = (await pool.query(`SELECT * FROM get_user($1::int)`, [profileId])).rows[0];

  return res.json({
    username: person2.username, age: calculateAge(person2.dob), gender: person2.gender,
    setting_1: person2.setting_1, setting_2: person2.setting_2,
    icon: person2.icon ?? null, bio: person2.bio
  });
};


export const getBadges = async (req: Request, res: Response) => {
  const { categoryId, badgeId } = req.body;
  
  if (!categoryId)
    return res.json((await pool.query(`SELECT * FROM get_badge($1::int)`, [badgeId])).rows);
  else if (!badgeId)
    return res.json((await pool.query(`SELECT * FROM get_badges($1::int)`, [categoryId])).rows);
  return res.json({success:false});
};

export const getOffers = async (req: Request, res: Response) => {
  const result = await pool.query(`SELECT * FROM get_all_offers()`);
  return res.json(result.rows);
};



export const findLobbies = async (req: Request, res: Response) => {
  const { id, role, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
  let rows;
  if (role == "boss"){
    rows = (await pool.query(`SELECT * FROM get_boss($1::int)`, [id])).rows;
  }
  else if (role == "user"){
    rows = (await pool.query(`SELECT * FROM get_user($1::int)`, [id])).rows;
  }
  if(!rows) throw new Error("no such person");
  const person = rows[0];
  const age = calculateAge(person.dob);
  const compatible = await pool.query(
    `SELECT * FROM get_compatible_requests($1::text, $2::int, $3::int, $4::float8, $5::float8, $6::text)`,
    [role, categoryId, age, latitude, longitude, person.gender]
  );

  const potentialAdventures: any[] = [];
  for (const element of compatible.rows) {
    const check = await pool.query(
      `SELECT check_reverse_compatibility($1::int, $2::float8, $3::float8, $4::float8, $5::int, $6::int, $7::boolean, $8::boolean) AS ok`,
      [element.id, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax,
       person.gender === 'F' && person.setting_1,
       person.gender === 'F' && person.setting_2]
    );
    if (check.rows[0].ok) potentialAdventures.push(element);
  }
  return res.json(potentialAdventures);
};
