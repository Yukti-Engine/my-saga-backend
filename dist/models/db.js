export const pendingUsers = [];
export const users = [];
export function createPendingUser(name, phone, email, dob, gender, requestId) {
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
export function findPendingUser(requestId) {
    return pendingUsers.find((u) => u.requestId === requestId);
}
export function removePendingUser(requestId) {
    const index = pendingUsers.findIndex((u) => u.requestId === requestId);
    if (index > -1)
        pendingUsers.splice(index, 1);
}
export function createUser(name, phone, email, dob, gender) {
    const user = {
        name,
        phone,
        email,
        dob,
        gender
    };
    users.push(user);
    return user;
}
//# sourceMappingURL=db.js.map