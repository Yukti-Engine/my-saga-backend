// interface PendingUser {
//   requestId: string;
//   name: string;
//   phone: string;
//   email: string;
//   dob: string;
//   gender: string;
//   expiresAt: Date;
// }

// interface User {
//   name: string,
//   phone: string,
//   email: string,
//   dob: string,
//   gender: string
// }

// export const pendingUsers: PendingUser[] = [];
// export const users: User[] = [];

// export function createPendingUser(
//   name: string,
//   phone: string,
//   email: string,
//   dob: string,
//   gender: string,
//   requestId: string
// ): string {
//   pendingUsers.push({
//     requestId,
//     name,
//     phone,
//     email,
//     dob,
//     gender,
//     expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
//   });
//   return requestId;
// }

// export function findPendingUser(requestId: string) {
//   return pendingUsers.find((u) => u.requestId === requestId);
// }

// export function removePendingUser(requestId: string) {
//   const index = pendingUsers.findIndex((u) => u.requestId === requestId);
//   if (index > -1) pendingUsers.splice(index, 1);
// }

// export function createUser(
//   name: string,
//   phone: string,
//   email: string,
//   dob: string,
//   gender: string
// ) {
//   const user: User = {
//     name,
//     phone,
//     email,
//     dob,
//     gender
//   };
//   users.push(user);
//   return user;
// }
// interface PendingUser {
//   requestId: string;
//   name: string;
//   phone: string;
//   email: string;
//   dob: string;
//   gender: string;
//   expiresAt: Date;
// }

// interface User {
//   name: string;
//   phone: string;
//   email: string;
//   dob: string;
//   gender: string;
//   // 🔹 Extra fields for login OTP
//   loginOtp: string | null;
//   loginOtpExpiresAt: Date | null;
// }

// export const pendingUsers: PendingUser[] = [];
// export const users: User[] = [];

// /* ----------------- SIGNUP HELPERS ----------------- */
// export function createPendingUser(
//   name: string,
//   phone: string,
//   email: string,
//   dob: string,
//   gender: string,
//   requestId: string
// ): string {
//   pendingUsers.push({
//     requestId,
//     name,
//     phone,
//     email,
//     dob,
//     gender,
//     expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
//   });
//   return requestId;
// }

// export function findPendingUser(requestId: string) {
//   return pendingUsers.find((u) => u.requestId === requestId);
// }

// export function removePendingUser(requestId: string) {
//   const index = pendingUsers.findIndex((u) => u.requestId === requestId);
//   if (index > -1) pendingUsers.splice(index, 1);
// }

// export function createUser(
//   name: string,
//   phone: string,
//   email: string,
//   dob: string,
//   gender: string
// ) {
//   const user: User = {
//     name,
//     phone,
//     email,
//     dob,
//     gender,
//     loginOtp: null,
//     loginOtpExpiresAt: null,
//   };
//   users.push(user);
//   return user;
// }

// /* ----------------- LOGIN HELPERS ----------------- */
// export function findUserByEmailOrPhone(email?: string, phone?: string) {
//   return users.find(
//     (u) => (email && u.email === email) || (phone && u.phone === phone)
//   );
// }

// export function setLoginOtp(user: User, otp: string) {
//   user.loginOtp = otp;
//   user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
// }

// export function verifyLoginOtp(user: User, otp: string): boolean {
//   if (!user.loginOtp || !user.loginOtpExpiresAt) return false;
//   if (user.loginOtpExpiresAt < new Date()) return false;
//   return user.loginOtp === otp;
// }

// export function clearLoginOtp(user: User) {
//   user.loginOtp = null;
//   user.loginOtpExpiresAt = null;
// }
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
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  // 🔹 Extra fields for login OTP
  loginOtp: string | null;
  loginOtpExpiresAt: Date | null;
}

export const pendingUsers: PendingUser[] = [];
export const users: User[] = [];

/* ----------------- SIGNUP HELPERS ----------------- */
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
    gender,
    loginOtp: null,
    loginOtpExpiresAt: null,
  };
  users.push(user);
  return user;
}

/* ----------------- LOGIN HELPERS ----------------- */
export function findUserByEmailOrPhone(email?: string, phone?: string) {
  return users.find(
    (u) => (email && u.email === email) || (phone && u.phone === phone)
  );
}

export function setLoginOtp(user: User, otp: string) {
  user.loginOtp = otp;
  user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
}

export function verifyLoginOtp(user: User, otp: string): boolean {
  if (!user.loginOtp || !user.loginOtpExpiresAt) return false;
  if (user.loginOtpExpiresAt < new Date()) return false;
  return user.loginOtp === otp;
}

export function clearLoginOtp(user: User) {
  user.loginOtp = null;
  user.loginOtpExpiresAt = null;
}

export interface Adventure {
  id: string;
  name: string;
  events: Event[];
  boss: Boss;
  members: User[]; // assuming members are users
}

export interface Event {
  id: string;
  activity: string;
  timing: string;
  venue: string;
  venue_link: string;
}

export interface Boss {
  id: string;
  name: string;
  email: string;
  phone: string;
  credits: number;
  username: string;
}

export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone: string;
  credits: number;
  username: string;
}
