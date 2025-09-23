export const pendingUsers = [];
export const users = [];
/* ----------------- SIGNUP HELPERS ----------------- */
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
    const id = users.length;
    const user = {
        name,
        phone,
        id,
        email,
        dob,
        gender,
        loginOtp: null,
        loginOtpExpiresAt: null,
        accessToken: ""
    };
    users.push(user);
    return user;
}
/* ----------------- LOGIN HELPERS ----------------- */
export function findUserByEmailOrPhone(email, phone) {
    return users.find((u) => (email && u.email === email) || (phone && u.phone === phone));
}
//# sourceMappingURL=db.js.map