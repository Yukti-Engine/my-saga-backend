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
export async function roomAvailable(roomName, pool) {
    const adventureId = parseInt(roomName.substring(0, roomName.indexOf('_')));
    const roomKey = parseInt(roomName.substring(roomName.indexOf('_') + 1, roomName.length));
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND id = $1 AND room_key= $2`, [adventureId, roomKey]);
    if (result.rows.length == 0)
        return false;
    else
        return true;
}
export async function isRelatedToAdventure(id, role, adventureId, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND id = $1`, [adventureId]);
    const adventure = result.rows[0];
    if (role == "organizer") {
        if (adventure.organizer_id == id)
            return true;
        else
            return false;
    }
    else if (role == "boss") {
        if (adventure.boss_id == id)
            return true;
        else
            return false;
    }
    else {
        if (adventure.user_ids.includes(id))
            return true;
        else
            return false;
    }
}
export async function createEvent(activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, pool) {
    const query = 'INSERT INTO events (activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, is_approved_by_organizer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    const result = await pool.query(query, [activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, !is_boss_battle]);
    return result.rows[0];
}
//# sourceMappingURL=adventure-helpers.js.map