import type { Request, Response } from "express";
import pool from "../dbms/db.js";
import { sendMessage, countNotifications, getNotificationsFromAToB } from "../dbms/private-message-helpers.js";
import { getOrganizer } from "../dbms/organizer-helpers.js";
import { getBoss } from "../dbms/boss-helpers.js";
import { getUser } from "../dbms/user-helpers.js";

export const send = async (req: Request, res: Response) => {
  const { senderRole, senderId, accessToken, message, receiverRole, receiverId} = req.body;
  let sender;
  if (senderRole=="organizer")
    sender = await getOrganizer(senderId, pool);
  else if(senderRole=="boss")
    sender = await getBoss(senderId, pool);
  else
    sender = await getUser(senderId, pool);
  if (sender.access_token == accessToken && accessToken)
  {
    return res.json(await sendMessage(senderId, senderRole, receiverRole, receiverId, message, pool))
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};
export const count = async (req: Request, res: Response) => {
  const { accessToken, receiverRole, receiverId} = req.body;
  let receiver;
  if (receiverRole=="organizer")
    receiver = await getOrganizer(receiverId, pool);
  else if(receiverRole=="boss")
    receiver = await getBoss(receiverId, pool);
  else
    receiver = await getUser(receiverId, pool);
  if (receiver.access_token == accessToken && accessToken)
  {
    return res.json(await countNotifications(receiverId, receiverRole, pool));
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};
export const receive = async (req: Request, res: Response) => {
  const { accessToken, receiverRole, receiverId, a, b} = req.body;
  let receiver;
  if (receiverRole=="organizer")
    receiver = await getOrganizer(receiverId, pool);
  else if(receiverRole=="boss")
    receiver = await getBoss(receiverId, pool);
  else
    receiver = await getUser(receiverId, pool);
  if (receiver.access_token == accessToken && accessToken)
  {
    return res.json(await getNotificationsFromAToB(receiverId, receiverRole, a, b, pool));
  }
  else
    return res.status(500).json({"error": "Authentication Error"});
};