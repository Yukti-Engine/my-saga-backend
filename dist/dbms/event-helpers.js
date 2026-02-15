export async function createEvent(activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, pool) {
    const query = 'INSERT INTO events (activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, is_approved_by_organizer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    const result = await pool.query(query, [activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, !is_boss_battle]);
    return result.rows[0];
}
export async function approveEventByUser(event_id, user_id, pool) {
    const query = 'UPDATE events SET is_approved_by_users = array_append(is_approved_by_users, $1) WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [user_id, event_id]);
    return result.rows[0];
}
export async function approveEventByOrganizer(event_id, pool) {
    const query = 'UPDATE events SET is_approved_by_organizer = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [event_id]);
    return result.rows[0];
}
export async function getAdventureOf(eventId, pool) {
    const result = await pool.query(`SELECT adventure_id FROM adventures WHERE id = $1`, [eventId]);
    return result.rows[0].adventure_id;
}
//# sourceMappingURL=event-helpers.js.map