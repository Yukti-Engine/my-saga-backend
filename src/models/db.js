import { v4 as uuidv4 } from "uuid";
export const pendingUsers = [];
export const users = [];
export function createPendingUser(name, email, passwordHash, phone, otp) {
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
export function findPendingUser(requestId) {
    return pendingUsers.find((u) => u.requestId === requestId);
}
export function removePendingUser(requestId) {
    const index = pendingUsers.findIndex((u) => u.requestId === requestId);
    if (index > -1)
        pendingUsers.splice(index, 1);
}
export function createUser(name, email, passwordHash, phone) {
    const user = {
        id: uuidv4(),
        name,
        email,
        phone,
        passwordHash,
    };
    users.push(user);
    return user;
}
//# sourceMappingURL=db.js.map