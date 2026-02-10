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
export async function getInactiveUserAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND user_ids @> ARRAY[$1] order BY created_at DESC LIMIT $3 OFFSET $4 `, [id, a, b]);
    return result.rows;
}
export async function getInactiveBossAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND boss_id = $1 order BY created_at DESC LIMIT $3 OFFSET $4`, [id, a, b]);
    return result.rows;
}
export async function getInactiveOrganizerAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND organizer_id = $1 order BY created_at DESC LIMIT $3 OFFSET $4`, [id, a, b]);
    return result.rows;
}
//# sourceMappingURL=adventure-helpers.js.map