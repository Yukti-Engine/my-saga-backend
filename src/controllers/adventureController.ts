import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { isRelatedToAdventure, countMessages, getMessagesFromAToB, roomAvailable, fileCount, addMessage} from '../dbms/adventure-helpers.js';
import {getBoss} from '../dbms/boss-helpers.js';
import {getUser} from '../dbms/user-helpers.js';
import { getOrganizer } from "../dbms/organizer-helpers.js";
import { generateDownloadUrl, generateUploadUrl } from "../services/bucketService.js";

export const count = async (req: Request, res: Response) => {
  const { adventureId, id, role, accessToken} = req.body;
  let person;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken)
    {
      if (await isRelatedToAdventure(id, role, adventureId, pool))
        return res.json(await countMessages(adventureId, pool));
      return res.json({success:false});
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such person"});
}

export const getMessages = async (req: Request, res: Response) => {
  const { adventureId, id, role, accessToken, a, b} = req.body;
  let person;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken)
    {
      if (await isRelatedToAdventure(id, role, adventureId, pool))
        return res.json(await getMessagesFromAToB(adventureId, a, b, pool));
      return res.json({success:false});
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such person"});
}

export default function roomSocket(io:any, socket:any) {
  socket.on("join_room", async ({roomName, id, role, accessToken}:any) => {
    let person;
    if (role == "organizer")
      person = await getOrganizer(id, pool);
    else if (role == "boss")
      person = await getBoss(id, pool);
    else
      person = await getUser(id, pool);
    if (person)
      if (person.access_token == accessToken && accessToken)
        if (await roomAvailable(roomName, pool) && await isRelatedToAdventure(id, role, parseInt(roomName.substrimg(0, roomName.indexOf('_'))), pool)){
          socket.join(roomName);
          socket.to(roomName).emit("message", "A user has joined!");
        }
    
  });

  socket.on("send_message", async ({ room, senderId, senderType, accessToken, message }:any) => {
    let person;
    const role = senderType;
    if (role == "organizer")
      person = await getOrganizer(senderId, pool);
    else if (role == "boss")
      person = await getBoss(senderId, pool);
    else
      person = await getUser(senderId, pool);
    if (person)
      if (person.access_token == accessToken && accessToken && await isRelatedToAdventure(senderId, role, parseInt(room.substrimg(0, room.indexOf('_'))), pool)){
        await addMessage(senderId, senderType, parseInt(room.substring(0, room.indexOf('_'))), message, pool);
        io.to(room).emit("message", message);
      }
  });

  socket.on("leave_room", async ({roomName, id, role, accessToken}:any) => {
    let person;
    if (role == "organizer")
      person = await getOrganizer(id, pool);
    else if (role == "boss")
      person = await getBoss(id, pool);
    else
      person = await getUser(id, pool);
    if (person)
      if (person.access_token == accessToken && accessToken)
        if (await isRelatedToAdventure(id, role, parseInt(roomName.substrimg(0, roomName.indexOf('_'))), pool)){
          socket.leave(roomName);
          socket.to(roomName).emit("message", "A user has left!");
        }
    
  });
}

export async function  getUploadFileUrl(req:any, res:any)  {
  const { fileName, contentType, adventureId, id, role, accessToken } = req.body;
  let person;
  if (role == "organizer")
    person = await getOrganizer(id, pool);
  else if (role == "boss")
    person = await getBoss(id, pool);
  else
    person = await getUser(id, pool);
  if (person)
    if (person.access_token == accessToken && accessToken)
    {
      if (await isRelatedToAdventure(id, role, adventureId, pool)) {
        const data = await generateUploadUrl(fileName, contentType, adventureId, await fileCount(adventureId, pool)+1);

        res.json(data);
      }
      return res.json({success:false});
    }
    else
      return res.status(500).json({"error": "Access token does not match"});
  else
    return res.status(500).json({"error": "No such person"});
}

export async function getDownloadFileUrl(req:any, res:any) {
  const { fileName, adventureId, fileNumber, id, role, accessToken } = req.body;
    let person;
    if (role == "organizer")
      person = await getOrganizer(id, pool);
    else if (role == "boss")
      person = await getBoss(id, pool);
    else
      person = await getUser(id, pool);
    if (person)
      if (person.access_token == accessToken && accessToken)
      {
        if (await isRelatedToAdventure(id, role, adventureId, pool)) {
          const data = await generateDownloadUrl(fileName, adventureId, fileNumber);
          return res.json({ data });
        }
        return res.json({success:false});
      }
      else
        return res.status(500).json({"error": "Access token does not match"});
    else
      return res.status(500).json({"error": "No such person"});
}
  
  


