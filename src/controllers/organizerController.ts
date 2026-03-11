import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { getOrganizer, updateOrganizer, logout, createRequest, getNotificationsFromAToB, countNotifications, sendNotification, 
  currentMatchRequest, completeMatch, getActiveAdventures, getInactiveAdventures} from "../dbms/organizer-helpers.js"; // Ensure this file exports updateOrganizer correctly
import {isRelatedToAdventure, createEvent} from '../dbms/adventure-helpers.js';
import { getWord2s } from "../dbms/search-helpers.js";

export const getAdventures = async (req: Request, res: Response) => {
  const { oid, accessToken} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
    {
      return res.json(await getActiveAdventures(oid, pool));
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const organizeEvent = async (req: Request, res: Response) => {
  const { oid, accessToken, activity, timing, venue, venueLink, adventureId, instruction} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
    {
      try{
        if (await isRelatedToAdventure(oid, "organizer", adventureId, pool)){
          await createEvent(activity, timing, venue, venueLink, adventureId, instruction, false, pool);
          return res.json({success:true });
        }
        return res.json({success: false});
      }
      catch{
        return res.json({success:false });
      }
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const getPastAdventures = async (req: Request, res: Response) => {
  const { oid, accessToken, a, b} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
    {
      return res.json(await getInactiveAdventures(oid, a, b, pool));
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const updateOrganizerProfile = async (req: Request, res: Response) => {
  const { oid, accessToken, updates } = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
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
    if (organizer.access_token == accessToken && accessToken)
      return res.json({"username": organizer.username, "bio": organizer.bio, "gender": organizer.gender, "dob": organizer.dob, "setting_1": organizer.setting_1, "setting_2": organizer.setting_2, "icon": organizer.icon.toString("base64")});
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const requestMatch = async (req: Request, res: Response) => {
  const { oid, accessToken, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
      return res.json(await createRequest(oid, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead, (organizer.gender=="F" && organizer.setting_1==true), (organizer.gender=="F" && organizer.setting_2==true), pool))
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such organizer"});
}

export const  logOut = async (req: Request, res: Response) => {
  const {oid, accessToken}  = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
      return res.json(await logout(oid, pool));
  return res.status(500).json({"error": "Authentication Failed"});
}
export const  currentLobby = async (req: Request, res: Response) => {
  const {oid, accessToken}  = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
      return res.json(await currentMatchRequest(oid, pool));
  return res.status(500).json({"error": "Authentication Failed"});
}

export const  startAdventure = async (req: Request, res: Response) => {
  const {oid, accessToken, name}  = req.body;
  const organizer = await getOrganizer(oid, pool);
  const matchRequests = await currentMatchRequest(oid, pool);
  if (organizer)
    if (organizer.access_token == accessToken && accessToken)
      if (name)
        return res.json(await completeMatch(name, matchRequests[0].id, pool));
      else
        return res.json(await completeMatch(await generateRandomName(matchRequests[0].category_id), matchRequests[0].id, pool));
  return res.status(500).json({"error": "Authentication Failed"});
}

async function generateRandomName(categoryId:number){
    const word3Options = [
    "Adventure", "Quest", "Story", "Exam", "Course", "Files", "Case",
    "Pursuit", "Race", "Problem", "Challenge", "Puzzle", "Battle",

    "Journey", "Mission", "Expedition", "Trial", "Test", "Assignment",
    "Task", "Campaign", "Investigation", "Operation",

    "Riddle", "Enigma", "Dilemma",  "Scenario",
     "Assessment", "Evaluation",
    "Sprint", "Run", "Showdown", "Contest",
    "Match", "Clash", 

    "Module", "Lesson",
   "Stage", "Episode", "Chapter", "Dungeon",

    "Conflict", "Encounter", "Struggle", "Siege",

    "Session", "Path", "Phase", "Round"
    ];
    const word1Options = ["The", "A", "Brave","Curious","Quirky","Swift","Mighty","Sunny","Witty","Bold","Clever","Cheerful",
    "Lucky","Sneaky","Fierce","Gentle","Playful","Jolly","Calm","Bright","Zesty","Nimble",
    "Cosmic","Epic","Happy","Fuzzy","Breezy","Chirpy","Spunky","Goofy","Daring","Dreamy",
    "Magic","Rusty","Funky","Snappy","Peppy","Jazzy","Chilly","Stormy","Wavy","Glowing",
    "Radiant","Sparkly","Bubbly","Whimsical","Fearless","Lively","Sunny","Golden","Wild",
    "Free","Sneaky","Silly","Charming","Crafty","Flashy","Loopy","Bouncy","Cosy","Snug",
    "Wacky","Feisty","Lucky","Moody","Speedy","Cheeky","Plucky","Shiny","Roaming","Witty",
    "Curly","Fluffy","Frothy","Crackling","Zippy","Perky","Sunny","Blissful","Jumpy","Dizzy",
    "Groovy","Spirited","Snazzy","Sparky","Breezy","Rugged","Rowdy","Cheerful","Twisty",
    "Fabled","Mystic","Electric","Glitchy","Pixelated","Retro","Feral","Cosmic","Nebulous",
    "Galactic","Playful","Oddball","Scrappy","Heroic","Nifty","Jovial","Kooky","Slinky",
    "Chipper","Mellow","Bouncy","Fiery","Snappy","Crafty","Curious","Roaring",
    "Hidden","Secret","Frosty","Dusty","Sunny","Crimson","Azure","Emerald","Golden",
    "Midnight","Glassy","Echoing","Floating","Drifting","Rolling","Crackling",
    "Howling","Wandering","Restless","Fearless","Radiant","Sparked","Tilted","Spinning",
    "Laughing","Skipping","Buzzing","Fluttery","Ticklish","Cheery","Snug","Lofty","Cosy",
    "Brisk","Chasing","Racing","Roaming","Hopping","Dancing","Smiling","Glorious","Epic",
    "Legendary","Mythic","Playbound","Starry","Moonlit","Sunlit","Cloudy","Windy","Stormlit"]
  const word2Options = (await getWord2s(categoryId, pool)).word_2s;
  let word1 = word1Options[Math.floor(Math.random() * word1Options.length)]
  const word2 = word2Options[Math.floor(Math.random() * word2Options.length)]
  const word3 = word3Options[Math.floor(Math.random() * word3Options.length)]
  if (word1 == "A" && (word2 == "A" || word2 == "E" || word2 == "I" || word2 == "O" || word2 == "U"))
    word1 = "An";
  return word1+" "+word2+" "+word3;
}



export const send = async (req: Request, res: Response) => {
  const { oid, accessToken, message, receiverRole, receiverId} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer.access_token == accessToken && accessToken)
  {
    const sent = await sendNotification(oid, receiverRole, receiverId, message, pool);
    if (sent.success)
    {
      return res.json({success: true})
    }
    else
      return res.json({success: false})
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};
export const count = async (req: Request, res: Response) => {
  const { oid, accessToken} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer.access_token == accessToken && accessToken)
  {
    return res.json(await countNotifications(oid, pool));
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};
export const receive = async (req: Request, res: Response) => {
  const { oid, accessToken, a, b} = req.body;
  const organizer = await getOrganizer(oid, pool);
  if (organizer.access_token == accessToken && accessToken)
  {
    return res.json(await getNotificationsFromAToB(oid, a, b, pool));
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};
