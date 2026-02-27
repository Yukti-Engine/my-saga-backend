export async function getAdventureOf(eventId, pool) {
    const result = await pool.query(`SELECT adventure_id FROM adventures WHERE id = $1`, [eventId]);
    return result.rows[0].adventure_id;
}
//# sourceMappingURL=event-helpers.js.map