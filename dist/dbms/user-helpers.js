/* ----------------- SIGNUP HELPERS ----------------- */
/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
export async function createPendingUser(name, phone, email, dob, gender, requestId, pool) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    let isNonBinary = false;
    if (gender == "NB") {
        gender = "M";
        isNonBinary = true;
    }
    const query = `
    INSERT INTO pending_users (request_id, name, phone, email, dob, gender, expires_at, is_non_binary)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (request_id) DO UPDATE
    SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
        dob = EXCLUDED.dob, gender = EXCLUDED.gender, expires_at = EXCLUDED.expires_at;
  `;
    await pool.query(query, [requestId, name, phone, email, dob, gender, expiresAt, isNonBinary]);
    return requestId;
}
/**
 * Find a pending user by requestId.
 */
export async function findPendingUser(requestId, pool) {
    const query = 'SELECT * FROM pending_users WHERE request_id = $1';
    const result = await pool.query(query, [requestId]);
    return result.rows[0] || null;
}
/**
 * Remove a pending user by requestId. No-op if not found.
 */
export async function removePendingUser(requestId, pool) {
    const query = 'DELETE FROM pending_users WHERE request_id = $1';
    await pool.query(query, [requestId]);
}
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
export async function createUser(name, phone, email, _dob, gender, isNonBinary, pool) {
    // derive a base username without uniqueness checks
    const emailLocal = email.split("@")[0] || "";
    let baseUsername = (emailLocal || name || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24) || "user";
    // Ensure username is unique
    let username = baseUsername;
    let counter = 1;
    while (true) {
        const checkQuery = "SELECT id FROM users WHERE username = $1";
        const checkResult = await pool.query(checkQuery, [username]);
        if (checkResult.rows.length === 0) {
            break;
        }
        username = `${baseUsername}${counter++}`;
    }
    // Insert user including DOB
    const query = `
    INSERT INTO users (name, email, phone, gender, dob, username, is_non_binary)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
    const result = await pool.query(query, [
        name,
        email,
        phone || null,
        gender || null,
        _dob,
        username,
        isNonBinary
    ]);
    return result.rows[0];
}
//User helpers
export async function getUser(id, pool) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched User:", result.rows[0]);
    return result.rows[0];
}
export async function getAllUsers(pool) {
    const query = 'SELECT * FROM users';
    const result = await pool.query(query);
    console.log("All Users:", result.rows);
    return result.rows;
}
export async function deleteUser(id, pool) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    console.log("Deleted User:", result.rows[0]);
    return result.rows[0];
}
/* ----------------- LOGIN HELPERS ----------------- */
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
export async function findUserByPhone(phone, pool) {
    const query = 'SELECT * FROM users WHERE phone= $1';
    const result = await pool.query(query, [phone]);
    console.log("Fetched User:", result.rows[0]);
    return result.rows[0];
}
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export async function updateUser(id, updates, pool) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;
    if (typeof updates.username !== "undefined") {
        setClauses.push(`username = $${paramIndex++}`);
        params.push(updates.username);
    }
    if (typeof updates.bio !== "undefined") {
        setClauses.push(`bio = $${paramIndex++}`);
        params.push(updates.bio);
    }
    if (typeof updates.email !== "undefined") {
        setClauses.push(`email = $${paramIndex++}`);
        params.push(updates.email);
    }
    if (typeof updates.setting_1 !== "undefined") {
        setClauses.push(`setting_1 = $${paramIndex++}`);
        params.push(updates.setting_1);
    }
    if (typeof updates.setting_2 !== "undefined") {
        setClauses.push(`setting_2 = $${paramIndex++}`);
        params.push(updates.setting_2);
    }
    if (setClauses.length === 0) {
        const currentQuery = 'SELECT * FROM users WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        return currentResult.rows[0] || null;
    }
    const query = `
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;
    params.push(id);
    try {
        const result = await pool.query(query, params);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error("Error updating user:", error);
        return null;
    }
}
export async function updateAccessToken(id, accessToken, pool) {
    const query = `UPDATE users SET access_token = $1 WHERE id = $2 returning *`;
    const result = await pool.query(query, [accessToken, id]);
    return result.rows[0];
}
export async function logout(id, pool) {
    const query = `UPDATE users SET access_token = null WHERE id = $1 returning *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}
export async function getMessagesRead(id, pool) {
    const query = `SELECT messages_read FROM users WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}
export async function deductGems(id, gemsToDeduct, pool) {
    if (gemsToDeduct <= 0) {
        throw new Error("gemsToDeduct must be positive");
    }
    const checkQuery = `SELECT gems FROM users WHERE id = $1`;
    const checkResult = await pool.query(checkQuery, [id]);
    const currentGems = checkResult.rows[0]?.gems || 0;
    if (currentGems < gemsToDeduct) {
        throw new Error("Insufficient gems");
    }
    const query = `UPDATE users SET gems = gems - $1 WHERE id = $2 returning *`;
    const result = await pool.query(query, [gemsToDeduct, id]);
    return { success: true };
}
export async function addGems(id, gemsToAdd, pool) {
    if (gemsToAdd <= 0) {
        throw new Error("gemsToAdd must be positive");
    }
    const query = `UPDATE users SET gems = gems + $1 WHERE id = $2 returning *`;
    const result = await pool.query(query, [gemsToAdd, id]);
    return { success: true };
}
//# sourceMappingURL=user-helpers.js.map