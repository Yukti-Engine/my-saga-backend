export async function getAdventureOf(eventId, pool) {
    const result = await pool.query(`SELECT adventure_id FROM adventures WHERE id = $1`, [eventId]);
    return result.rows[0].adventure_id;
}
export async function changeAttendance(eventId, attendance, pool) {
    const query = `
    UPDATE events
    SET attendance = $2
    WHERE event_id = $1
    RETURNING *;
  `;
    const result = await pool.query(query, [eventId, attendance]);
    return result.rows[0];
}
export async function getEvent(eventId, pool) {
    const query = `Select * from events where event_id = $1`;
    const result = await pool.query(query, [eventId]);
    return result.rows[0];
}
//# sourceMappingURL=event-helpers.js.map