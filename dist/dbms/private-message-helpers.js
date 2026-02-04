export async function sendMessage(senderId, senderRole, receiverRole, receiverId, message, pool) {
    const query = 'INSERT INTO private_messages (sender_id, sender_role, receiver_role, receiver_id, message) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [senderId, senderRole, receiverRole, receiverId, message]);
    return { success: true };
}
export async function getNotificationsFromAToB(receiver_id, receiver_role, a, b, pool) {
    const query = 'SELECT * FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2 ORDER BY sent_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [receiver_id, receiver_role, b, a]);
    return result.rows;
}
export async function countNotifications(receiver_id, receiver_role, pool) {
    const query = 'SELECT COUNT(*) FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2';
    const result = await pool.query(query, [receiver_id, receiver_role]);
    return parseInt(result.rows[0].count, 10);
}
//# sourceMappingURL=private-message-helpers.js.map