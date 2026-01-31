import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { updateUser, getUser, logout } from "../dbms/user-helpers.js"; // Ensure this file exports updateUser correctly
import { getCompatibleRequests, checkReverseCompatibility, match, currentMatchRequestUser } from "../dbms/match-request-helpers.js";
 
export const updateUserProfile = async (req: Request, res: Response) => {
  const { uid, accessToken, updates } = req.body;
  const user = await getUser(uid, pool);
  if (user)
    if (user.access_token == accessToken && accessToken)
    {
      const updatedUser = await updateUser(uid, updates, pool);
      return res.json(updatedUser);
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such user"});
};

export const getUserDashboard = async (req: Request, res: Response) => {
  const { uid, accessToken } = req.body;
  const user = await getUser(uid, pool);
  if (user.is_non_binary== true)
    user.gender = "NB"
  if (user)
    if (user.access_token == accessToken && accessToken)
      return res.json(user);
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such user"});
}

export const requestMatch = async (req: Request, res: Response) => {
  const {uid, accessToken, categoryId, matchRadius, ageRangeMin, ageRangeMax, latitude, longitude } = req.body;
  const user = await getUser(uid, pool);
  console.log(user);
  const age = getAge(user.dob);
  if (user)
    if (user.access_token == accessToken && accessToken){
      const compatibleRequests = await getCompatibleRequests(categoryId, age, latitude, longitude, (user.gender=="M" && user.setting_1==true), (user.gender=="F" && user.setting_1==true), (user.gender=="F" && user.setting_2==true), user.gender, pool);
      const potentialAdventures: any = [];
      

      for (const element of compatibleRequests) {
        const isCompatible = await checkReverseCompatibility(
          element.id,
          latitude,
          longitude,
          matchRadius,
          ageRangeMin,
          ageRangeMax,
          pool
        );


        if (isCompatible) {
          potentialAdventures.push(element);
        }
      }
      return res.json(potentialAdventures);
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such boss"});
}

export const  joinAdventure = async (req: Request, res: Response) => {
  const {uid, accessToken, matchRequest, minTeamMembers, ageRangeMin, ageRangeMax}  = req.body;
  const user = await getUser(uid, pool);
  if (user)
    if (user.access_token == accessToken && accessToken)
      return res.json(await match(uid, false, minTeamMembers, ageRangeMin, ageRangeMax, 0, matchRequest, pool));
}

export const  logOut = async (req: Request, res: Response) => {
  const {uid, accessToken}  = req.body;
  const user = await getUser(uid, pool);
  if (user)
    if (user.access_token == accessToken && accessToken)
      return res.json(await logout(uid, pool));
}

export const  currentMatchRequest = async (req: Request, res: Response) => {
  const {uid, accessToken}  = req.body;
  const user = await getUser(uid, pool);
  if (user)
    if (user.access_token == accessToken && accessToken)
      return res.json(await currentMatchRequestUser(uid, pool));
}


function getAge(dob: string) {
  const birthDate = new Date(dob);
  const today = new Date();


  let age = today.getFullYear() - birthDate.getFullYear();


  const hasHadBirthdayThisYear =
  today.getMonth() > birthDate.getMonth() ||
  (today.getMonth() === birthDate.getMonth() &&
  today.getDate() >= birthDate.getDate());


  if (!hasHadBirthdayThisYear) {
  age--;
  }


  return age;
}
