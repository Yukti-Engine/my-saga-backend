export async function createPendingBoss(email, phone, reason, requestId, pool) {
    const query = `
    INSERT INTO pending_bosses (request_id, email, phone, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (request_id) DO UPDATE
    SET email = EXCLUDED.email, phone = EXCLUDED.phone, reason = EXCLUDED.reason;
  `;
    await pool.query(query, [requestId, email, phone, reason]);
    return requestId;
}
export async function findPendingBoss(requestId, pool) {
    const query = 'SELECT * FROM pending_bosses WHERE request_id = $1';
    const result = await pool.query(query, [requestId]);
    return result.rows[0] || null;
}
export async function removePendingBoss(requestId, pool) {
    const query = 'DELETE FROM pending_bosses WHERE request_id = $1';
    await pool.query(query, [requestId]);
}
export async function addBoss(data, pool) {
    const query = `
    INSERT INTO bosses (name, email, username, phone, credits)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
    const result = await pool.query(query, [
        data.name, data.email, data.username, data.phone || null, data.credits || 0
    ]);
    console.log("Added Boss:", result.rows[0]);
    return result.rows[0];
}
export async function updateBoss(id, updates, pool) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;
    if (typeof updates.name !== "undefined") {
        setClauses.push(`name = $${paramIndex++}`);
        params.push(updates.name);
    }
    if (typeof updates.email !== "undefined") {
        setClauses.push(`email = $${paramIndex++}`);
        params.push(updates.email);
    }
    if (typeof updates.username !== "undefined") {
        setClauses.push(`username = $${paramIndex++}`);
        params.push(updates.username);
    }
    if (typeof updates.phone !== "undefined") {
        setClauses.push(`phone = $${paramIndex++}`);
        params.push(updates.phone);
    }
    if (typeof updates.credits !== "undefined") {
        setClauses.push(`credits = $${paramIndex++}`);
        params.push(updates.credits);
    }
    if (setClauses.length === 0) {
        const currentQuery = 'SELECT * FROM bosses WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        console.log("No updates for Boss. Current Boss:", currentResult.rows[0]);
        return currentResult.rows[0];
    }
    const query = `
    UPDATE bosses
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;
    params.push(id);
    const result = await pool.query(query, params);
    console.log("Updated Boss:", result.rows[0]);
    return result.rows[0];
}
export async function deleteBoss(id, pool) {
    const query = 'DELETE FROM bosses WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    console.log("Deleted Boss:", result.rows[0]);
    return result.rows[0];
}
export async function getBoss(id, pool) {
    const query = 'SELECT * FROM bosses WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched Boss:", result.rows[0]);
    return result.rows[0];
}
export async function getAllBosses(pool) {
    const query = 'SELECT * FROM bosses';
    const result = await pool.query(query);
    console.log("All Bosses:", result.rows);
    return result.rows;
}
//# sourceMappingURL=boss-helpers.js.map