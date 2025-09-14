// interface PendingUser {
//   requestId: string;
//   name: string;
//   phone: string;
//   email: string;
//   dob: string;
//   gender: string;
//   expiresAt: Date;
// }
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
    const user = {
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
export function findUserByEmailOrPhone(email, phone) {
    return users.find((u) => (email && u.email === email) || (phone && u.phone === phone));
}
export function setLoginOtp(user, otp) {
    user.loginOtp = otp;
    user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
}
export function verifyLoginOtp(user, otp) {
    if (!user.loginOtp || !user.loginOtpExpiresAt)
        return false;
    if (user.loginOtpExpiresAt < new Date())
        return false;
    return user.loginOtp === otp;
}
export function clearLoginOtp(user) {
    user.loginOtp = null;
    user.loginOtpExpiresAt = null;
}
//# sourceMappingURL=db.js.map