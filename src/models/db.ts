import { v4 as uuidv4 } from "uuid";

interface PendingUser {
  requestId: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  otp: string;
  expiresAt: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
}

export const pendingUsers: PendingUser[] = [];
export const users: User[] = [];

export function createPendingUser(
  name: string,
  email: string,
  passwordHash: string,
  phone: string,
  otp: string
): string {
  const requestId = uuidv4();
  pendingUsers.push({
    requestId,
    name,
    email,
    passwordHash,
    phone,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
  });
  return requestId;
}

export function findPendingUser(requestId: string) {
  return pendingUsers.find((u) => u.requestId === requestId);
}

export function removePendingUser(requestId: string) {
  const index = pendingUsers.findIndex((u) => u.requestId === requestId);
  if (index > -1) pendingUsers.splice(index, 1);
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
  phone: string
) {
  const user: User = {
    id: uuidv4(),
    name,
    email,
    phone,
    passwordHash,
  };
  users.push(user);
  return user;
}
