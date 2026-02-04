export async function getActiveUserAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND user_ids @> ARRAY[$1]`, [id]);
    return result.rows;
}
export async function getActiveBossAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND boss_id = $1`, [id]);
    return result.rows;
}
export async function getActiveOrganizerAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND organizer_id = $1`, [id]);
    return result.rows;
}
export async function getInactiveUserAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND user_ids @> ARRAY[$1]`, [id]);
    return result.rows;
}
export async function getInactiveBossAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND boss_id = $1`, [id]);
    return result.rows;
}
export async function getInactiveOrganizerAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND organizer_id = $1`, [id]);
    return result.rows;
}
//# sourceMappingURL=adventure-helpers.js.map