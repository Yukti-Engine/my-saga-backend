import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { getAllCategories, getAllSubcategories } from "../dbms/search-helpers.js";
import { getOrganizer } from "../dbms/organizer-helpers.js";
import { getBoss } from "../dbms/boss-helpers.js";
import { getUser } from "../dbms/user-helpers.js";

export const getCategories = async (req: Request, res: Response) => {
  const { id, role, accessToken} = req.body;
  let person;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken)
      return res.json(await getAllCategories(pool));
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const getSubcategories = async (req: Request, res: Response) => {
  const { category, id, role, accessToken} = req.body;
  let person;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken)
      return res.json(await getAllSubcategories(category, pool));
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const getProfile = async (req: Request, res: Response) => {
  const { profileId, profileRole, id, role, accessToken} = req.body;
  let person; let person2;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken){
      if (profileRole == "organizer")
        person2 = await getOrganizer(profileId, pool);
      else if (profileRole == "boss")
        person2 = await getBoss(profileId, pool);
      else
        person2 = await getUser(profileId, pool);
      return {"username": person2.username, "dob": person2.dob, "gender": person2.gender, "setting_1": person2.setting_1, "setting_2": person2.setting_2, "icon": person2.icon.toString('base64'), "bio": person2.bio}
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}
