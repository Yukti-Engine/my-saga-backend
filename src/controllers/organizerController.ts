import type { Request, Response } from "express";
import { randomBytes } from "crypto";
import pool from "../dbms/db.js";
import { getOrganizer, updateOrganizer, updateAccessToken, getOrganizerByEmail } from "../dbms/organizer-helpers.js"; // Ensure this file exports updateUser correctly
import { createRequest } from "../dbms/match-request-helpers.js";

export const updateOrganizerProfile = async (req: Request, res: Response) => {
  const { oid, accessToken, updates } = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken)
    {
      const updatedOrganizer = await updateOrganizer(oid, updates, pool);
      delete updatedOrganizer.password;
      return res.json(updatedOrganizer);
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
};

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken){
      delete organizer.password;
      return res.json(organizer);
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const requestMatch = async (req: Request, res: Response) => {
  const { oid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken)
      return res.json(await createRequest(null,null,oid,categoryId,matchRadius,minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, pool))
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const organizer = await getOrganizerByEmail(email, pool);
  const encode = (text: string): string => {
    return Buffer.from(text, "utf8").toString("base64");
  };
  if (organizer)
    if (organizer.password == encode(password))
    {
      const organizerDetails = await updateAccessToken(organizer.id, randomBytes(16).toString("hex"), pool);
      organizerDetails.password = password;
      return res.json(organizerDetails)
    }
    else
      return res.status(500).json({"error": "Password does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}
