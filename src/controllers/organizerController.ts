import type { Request, Response } from "express";
import pool from "../db.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_active_adventures_organizer($1::int)`, [oid]);
  return res.json(result.rows);
};

export const organizeEvent = async (req: Request, res: Response) => {
  const { oid, accessToken, activity, timing, venue, venueLink, adventureId, instruction } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  try {
    const check = await pool.query(
      `SELECT is_related_to_adventure($1::int, 'organizer', $2::int) AS ok`,
      [oid, adventureId]
    );
    if (check.rows[0].ok) {
      await pool.query(
        `SELECT create_event($1::text, $2::timestamptz, $3::text, $4::text, $5::int, $6::text, false)`,
        [activity, timing, venue, venueLink, adventureId, instruction]
      );
      return res.json({ success: true });
    }
    return res.json({ success: false });
  } catch {
    return res.json({ success: false });
  }
};

export const getPastAdventures = async (req: Request, res: Response) => {
  const { oid, accessToken, a, b } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(`SELECT * FROM get_inactive_adventures_organizer($1::int, $2::int, $3::int)`, [oid, a, b]);
  return res.json(result.rows);
};

export const updateOrganizerProfile = async (req: Request, res: Response) => {
  const { oid, accessToken, updates } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const updated = await pool.query(
    `SELECT * FROM update_organizer($1::int, $2::text, $3::boolean, $4::boolean, $5::text, $6::bytea)`,
    [oid, updates.username ?? null, updates.setting_1 ?? null, updates.setting_2 ?? null,
     updates.bio ?? null, updates.icon ? Buffer.from(updates.icon, "base64") : null]
  );
  const updatedOrganizer = updated.rows[0];
  delete updatedOrganizer.password;
  return res.json(updatedOrganizer);
};

export const getOrganizerDashboard = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  return res.json({
    username: organizer.username, bio: organizer.bio, gender: organizer.gender,
    dob: organizer.dob, setting_1: organizer.setting_1, setting_2: organizer.setting_2,
    icon: organizer.icon?.toString("base64")
  });
};

export const requestMatch = async (req: Request, res: Response) => {
  const { oid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer)
    return res.status(500).json({ error: "No such organizer" });
  if (organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Access token does not match" });

  const result = await pool.query(
    `SELECT * FROM create_match_request($1::int, $2::int, $3::float8, $4::int, $5::int, $6::int, $7::float8, $8::float8, $9::float8, $10::boolean, $11::boolean)`,
    [oid, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax,
     latitude, longitude, payPerHead,
     organizer.gender === "F" && organizer.setting_1 === true,
     organizer.gender === "F" && organizer.setting_2 === true]
  );
  return res.json(result.rows[0]);
};

export const logOut = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM logout_organizer($1::int)`, [oid]);
  return res.json(result.rows[0]);
};

export const currentLobby = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const result = await pool.query(`SELECT * FROM current_match_request_organizer($1::int)`, [oid]);
  return res.json(result.rows);
};

export const startAdventure = async (req: Request, res: Response) => {
  const { oid, accessToken, name } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Failed" });

  const lobbies = await pool.query(`SELECT * FROM current_match_request_organizer($1::int)`, [oid]);
  const matchId = lobbies.rows[0].id;
  const adventureName = name || await generateRandomName(lobbies.rows[0].category_id);

  const result = await pool.query(`SELECT * FROM complete_match($1::text, $2::int)`, [adventureName, matchId]);
  return res.json(result.rows[0]);
};

export const send = async (req: Request, res: Response) => {
  const { oid, accessToken, message, receiverRole, receiverId } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  await pool.query(
    `SELECT send_notification_organizer($1::int, $2::text, $3::int, $4::text)`,
    [oid, receiverRole, receiverId, message]
  );
  return res.json({ success: true });
};

export const count = async (req: Request, res: Response) => {
  const { oid, accessToken } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT count_notifications_organizer($1::int) AS count`, [oid]);
  return res.json(result.rows[0].count);
};

export const receive = async (req: Request, res: Response) => {
  const { oid, accessToken, a, b } = req.body;
  const { rows } = await pool.query(`SELECT * FROM get_organizer($1::int)`, [oid]);
  const organizer = rows[0];
  if (!organizer || organizer.access_token !== accessToken || !accessToken)
    return res.status(500).json({ error: "Authentication Error" });

  const result = await pool.query(`SELECT * FROM get_notifications_organizer($1::int, $2::int, $3::int)`, [oid, a, b]);
  return res.json(result.rows);
};

async function generateRandomName(categoryId: number) {
  const word3Options = [
    "Adventure","Quest","Story","Exam","Course","Files","Case","Pursuit","Race",
    "Problem","Challenge","Puzzle","Battle","Journey","Mission","Expedition","Trial",
    "Test","Assignment","Task","Campaign","Investigation","Operation","Riddle","Enigma",
    "Dilemma","Scenario","Assessment","Evaluation","Sprint","Run","Showdown","Contest",
    "Match","Clash","Module","Lesson","Stage","Episode","Chapter","Dungeon",
    "Conflict","Encounter","Struggle","Siege","Session","Path","Phase","Round"
  ];
  const word1Options = [
    "The","A","Brave","Curious","Quirky","Swift","Mighty","Sunny","Witty","Bold",
    "Clever","Cheerful","Lucky","Sneaky","Fierce","Gentle","Playful","Jolly","Calm",
    "Bright","Zesty","Nimble","Cosmic","Epic","Happy","Fuzzy","Breezy","Chirpy",
    "Spunky","Goofy","Daring","Dreamy","Magic","Rusty","Funky","Snappy","Peppy",
    "Jazzy","Chilly","Stormy","Wavy","Glowing","Radiant","Sparkly","Bubbly",
    "Whimsical","Fearless","Lively","Golden","Wild","Free","Silly","Charming",
    "Crafty","Flashy","Loopy","Bouncy","Cosy","Snug","Wacky","Feisty","Moody",
    "Speedy","Cheeky","Plucky","Shiny","Roaming","Curly","Fluffy","Frothy",
    "Crackling","Zippy","Perky","Blissful","Jumpy","Dizzy","Groovy","Spirited",
    "Snazzy","Sparky","Rugged","Rowdy","Twisty","Fabled","Mystic","Electric",
    "Glitchy","Pixelated","Retro","Feral","Nebulous","Galactic","Oddball","Scrappy",
    "Heroic","Nifty","Jovial","Kooky","Slinky","Chipper","Mellow","Fiery","Hidden",
    "Secret","Frosty","Dusty","Crimson","Azure","Emerald","Midnight","Glassy",
    "Echoing","Floating","Drifting","Rolling","Howling","Wandering","Restless",
    "Sparked","Tilted","Spinning","Laughing","Skipping","Buzzing","Fluttery",
    "Ticklish","Cheery","Lofty","Brisk","Chasing","Racing","Hopping","Dancing",
    "Smiling","Glorious","Legendary","Mythic","Playbound","Starry","Moonlit",
    "Sunlit","Cloudy","Windy","Stormlit"
  ];

  const result = await pool.query(`SELECT word_2s FROM get_word2s($1::int)`, [categoryId]);
  const word2Options = result.rows[0]?.word_2s ?? [];

  let word1 = word1Options[Math.floor(Math.random() * word1Options.length)];
  const word2 = word2Options[Math.floor(Math.random() * word2Options.length)];
  const word3 = word3Options[Math.floor(Math.random() * word3Options.length)];

  if (word1 === "A" && ["A","E","I","O","U"].includes(word2[0]?.toUpperCase()))
    word1 = "An";

  return `${word1} ${word2} ${word3}`;
}
