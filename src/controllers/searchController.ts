import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";

export const getCategories = async (req: Request, res: Response) => {
  const { id, role, accessToken } = req.body;

  const result = await pool.query(`SELECT * FROM get_all_categories()`);
  return res.json(result.rows);
};

export const getSubcategories = async (req: Request, res: Response) => {
  const { category, id, role, accessToken } = req.body;

  const result = await pool.query(`SELECT * FROM get_all_subcategories($1::text)`, [category]);
  return res.json(result.rows);
};

export const getProfile = async (req: Request, res: Response) => {
  const { profileId, profileRole, id, role, accessToken } = req.body;
  let person2;
  if (role === profileRole)
    person2 = (await pool.query(`SELECT * FROM get_organizer($1::int)`, [profileId])).rows[0];
  else if (role === "boss")
    person2 = (await pool.query(`SELECT * FROM get_boss($1::int)`, [profileId])).rows[0];
  else
    person2 = (await pool.query(`SELECT * FROM get_user($1::int)`, [profileId])).rows[0];

  return res.json({
    username: person2.username, age: calculateAge(person2.dob), gender: person2.gender,
    setting_1: person2.setting_1, setting_2: person2.setting_2,
    icon: person2.icon?.toString("base64"), bio: person2.bio
  });
};


export const getBadges = async (req: Request, res: Response) => {
  const { id, role, accessToken, categoryId, badgeId } = req.body;
  
  if (!categoryId)
    return res.json((await pool.query(`SELECT * FROM get_badge($1::int)`, [badgeId])).rows);
  else if (!badgeId)
    return res.json((await pool.query(`SELECT * FROM get_badges($1::int)`, [categoryId])).rows);
  return res.json({success:false});
};

export const getOffers = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const result = await pool.query(`SELECT * FROM get_all_offers()`);
  return res.json(result.rows);
};


export const generateAdventureName = async (req: Request, res: Response) => {
  const { oid, accessToken, categoryId } = req.body;
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

  return res.json({ "suggestion": `${word1} ${word2} ${word3}`});
}


export const findLobbies = async (req: Request, res: Response) => {
  const { id, role, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
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
