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
//# sourceMappingURL=auth-helpers.js.map