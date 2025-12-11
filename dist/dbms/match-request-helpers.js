export async function createRequest(user_id, boss_id, org_id, category_id, match_radius, min_team_members, age_range_min, age_range_max, pool) {
    const query = `INSERT INTO match_requests 
    (user_id, boss_id, org_id, category_id, match_radius, min_team_members, age_range_min, age_range_max) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
    const result = await pool.query(query, [
        user_id,
        boss_id,
        org_id,
        category_id,
        match_radius,
        min_team_members,
        age_range_max,
        age_range_min
    ]);
    return result.rows[0];
}
//# sourceMappingURL=match-request-helpers.js.map