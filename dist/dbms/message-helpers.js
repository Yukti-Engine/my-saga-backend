export async function addMessage(message, sender_id, sender_type, adventure_id, pool) {
    const query = 'INSERT INTO messages (message, sender_id, sender_type, adventure_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [message, sender_id, sender_type, adventure_id]);
    return result.rows[0];
}
export async function getMessagesFromAToB(adventure_id, a, b, pool) {
    const query = 'SELECT * FROM messages WHERE adventure_id = $1 ORDER BY created_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [adventure_id, b, a]);
    return result.rows;
}
export async function countMessages(adventure_id, pool) {
    const query = 'SELECT COUNT(*) FROM messages WHERE adventure_id = $1';
    const result = await pool.query(query, [adventure_id]);
    return parseInt(result.rows[0].count, 10);
}
//# sourceMappingURL=message-helpers.js.map