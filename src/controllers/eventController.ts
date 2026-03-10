import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { changeAttendance, getAdventureOf } from "../dbms/event-helpers.js";
import { getOrganizer } from "../dbms/organizer-helpers.js";
import { isRelatedToAdventure } from "../dbms/adventure-helpers.js";

export const setAttendance = async (req: Request, res: Response) => {
  const { oid, accessToken, eventId, attendance} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
    {
      if (await isRelatedToAdventure(oid, "organizer", await getAdventureOf(eventId, pool), pool))
        return res.json(await changeAttendance(eventId, attendance, pool));
      return res.json({success:false});
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}
