interface PendingUser {
  requestId: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  expiresAt: Date;
}

interface User {
  name: string,
  phone: string,
  email: string,
  dob: string,
  gender: string
}

export const pendingUsers: PendingUser[] = [];
export const users: User[] = [];

export function createPendingUser(
  name: string,
  phone: string,
  email: string,
  dob: string,
  gender: string,
  requestId: string
): string {
  pendingUsers.push({
    requestId,
    name,
    phone,
    email,
    dob,
    gender,
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
  phone: string,
  email: string,
  dob: string,
  gender: string
) {
  const user: User = {
    name,
    phone,
    email,
    dob,
    gender
  };
  users.push(user);
  return user;
}
