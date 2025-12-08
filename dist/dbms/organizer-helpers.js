export async function createPendingOrganiser(email, phone, reason, requestId, pool) {
    const query = `
    INSERT INTO pending_organisers (request_id, email, phone, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (request_id) DO UPDATE
    SET email = EXCLUDED.email, phone = EXCLUDED.phone, reason = EXCLUDED.reason;
  `;
    await pool.query(query, [requestId, email, phone, reason]);
    return requestId;
}
export async function findPendingOrganiser(requestId, pool) {
    const query = 'SELECT * FROM pending_organisers WHERE request_id = $1';
    const result = await pool.query(query, [requestId]);
    return result.rows[0] || null;
}
export async function removePendingOrganiser(requestId, pool) {
    const query = 'DELETE FROM pending_organisers WHERE request_id = $1';
    await pool.query(query, [requestId]);
}
export async function addOrganizer(data, pool) {
    const query = `
    INSERT INTO organizers (name, email, username, phone, credits)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
    const result = await pool.query(query, [
        data.name, data.email, data.username, data.phone || null, data.credits || 0
    ]);
    console.log("Added Organizer:", result.rows[0]);
    return result.rows[0];
}
export async function updateOrganizer(id, updates, pool) {
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
        const currentQuery = 'SELECT * FROM organizers WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        console.log("No updates for Organizer. Current Organizer:", currentResult.rows[0]);
        return currentResult.rows[0];
    }
    const query = `
    UPDATE organizers
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;
    params.push(id);
    const result = await pool.query(query, params);
    console.log("Updated Organizer:", result.rows[0]);
    return result.rows[0];
}
export async function deleteOrganizer(id, pool) {
    const query = 'DELETE FROM organizers WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    console.log("Deleted Organizer:", result.rows[0]);
    return result.rows[0];
}
export async function getOrganizer(id, pool) {
    const query = 'SELECT * FROM organizers WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched Organizer:", result.rows[0]);
    return result.rows[0];
}
export async function getAllOrganizers(pool) {
    const query = 'SELECT * FROM organizers';
    const result = await pool.query(query);
    console.log("All Organizers:", result.rows);
    return result.rows;
}
//# sourceMappingURL=organizer-helpers.js.map