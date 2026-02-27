export async function purchaseTicket(id, user_id, pool) {
    const query = `UPDATE tournaments SET user_ids = array_append(user_ids, $1) WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [user_id, id]);
    return result.rows[0];
}
export async function applyForTournament(id, organizer_id, pool) {
    return { Success: true };
}
//# sourceMappingURL=tournament-helpers.js.map