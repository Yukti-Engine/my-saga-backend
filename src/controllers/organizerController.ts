import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM get_active_adventures($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

export const organizeEvent = async (req: Request, res: Response) => {
  const { oid, activity, timing, venue, venueLink, adventureId, instruction } = req.body;

  
    const check = await pool.query(
      `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
      [oid, adventureId]
    );
    if (check.rows[0].ok) {
      const queryResult = await pool.query(
        `SELECT create_event($1::text, $2::timestamptz, $3::text, $4::text, $5::int, $6::text, false)`,
        [activity, timing, venue, venueLink, adventureId, instruction]
      );
      return res.json({ success: true, eventId: queryResult.rows[0].create_event });
      
    }
    return res.json({ success: false });

};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { oid, a, b } = req.body;

  const result = await pool.query(`SELECT * FROM get_inactive_adventures($1::int, $2::text, $3::int, $4::int)`, [oid, "organizer", a, b]);
  return res.json(result.rows);
};

export const updateOrganizerProfile = async (req: Request, res: Response) => {
  const { oid, updates } = req.body;

  const updated = await pool.query(
    `SELECT * FROM update_organizer($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::bytea)`,
    [oid, updates.username ?? null, updates.setting1 ?? null, updates.setting2 ?? null,
     updates.bio ?? null, updates.icon ? Buffer.from(updates.icon, "base64") : null]
  );
  const updatedOrganizer = updated.rows[0];
  delete updatedOrganizer.password;
  updatedOrganizer.icon = updatedOrganizer.icon?.toString("base64") ?? null;
  return res.json(updatedOrganizer);
};

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  const { oid } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  return res.json({
    username: organizer.username, bio: organizer.bio, gender: organizer.gender, credits: organizer.credits,
    age: calculateAge(organizer.dob), setting_1: organizer.setting_1, setting_2: organizer.setting_2,
    rating: organizer.rating, icon: organizer.icon?.toString("base64")
  });
};

export const requestMatch = async (req: Request, res: Response) => {
  const { oid, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead, roadmap, badgeId } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  const result = await pool.query(
    `SELECT * FROM create_match_request($1::int, $2::int, $3::float8, $4::int, $5::int, $6::int, $7::float8, $8::float8, $9::float8, $10::boolean, $11::boolean, $12::text, $13::int)`,
    [oid, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax,
     latitude, longitude, payPerHead,
     organizer.gender === "F" && organizer.setting_1 === true,
     organizer.gender === "F" && organizer.setting_2 === true,
     roadmap ?? null, badgeId ?? null]
  );
  return res.json(result.rows[0]);
};

export const retrieveRoadmap = async (req: Request, res: Response) => {
  const { badgeId } = req.body;

  if (!badgeId)
    return res.status(400).json({ error: "badgeId is required" });

  try {
    const { rows } = await pool.query(
      `SELECT roadmaps FROM badges WHERE id = $1`,
      [badgeId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Badge not found" });

    const roadmaps: string[] = rows[0].roadmaps ?? [];
    if (roadmaps.length === 0)
      return res.json({ roadmap: null });

    const roadmap = roadmaps[Math.floor(Math.random() * roadmaps.length)];
    return res.json({ roadmap });
  } catch (err) {
    console.error("Error in retrieveRoadmap:", err);
    return res.status(500).json({ error: "Failed to retrieve roadmap" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM logout($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { oid } = req.body;

  const result = await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"]);
  return res.json(result.rows);
};

export const startAdventure = async (req: Request, res: Response) => {
  const { oid, name } = req.body;

  const lobby = (await pool.query(`SELECT * FROM current_match_request($1::int, $2::text)`, [oid, "organizer"])).rows[0];
  const matchId = lobby.id;
  if (lobby.boss_id && lobby.user_ids.length >= lobby.min_team_members){
    const result = await pool.query(`SELECT * FROM complete_match($1::text, $2::int)`, [name, matchId]);
    return res.json(result.rows[0]);
  }
  return res.json({success:false})
};
