/* ----------------- SIGNUP HELPERS ----------------- */
import { randomInt } from "crypto";
/**
 * Persist a pending user request with a 5 minute expiry.
 * Returns the requestId (unchanged), mirroring the in-memory helper.
 */
/**
 * Find a pending user by requestId.
 */
/**
 * Remove a pending user by requestId. No-op if not found.
 */
/**
 * Create a persisted user. Schema requires a unique username,
 * so we derive it from email's local part or the name.
 * Note: dob is not stored on User model; it exists on PendingUser only.
 */
//User helpers
export async function getOrganizer(id, pool) {
    const query = 'SELECT * FROM organizers WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched organizers:", result.rows[0]);
    return result.rows[0];
}
/* ----------------- LOGIN HELPERS ----------------- */
/**
 * Find user by email OR phone (first match). If both undefined, returns null.
 */
/**
 * Update user by id, allowing username, bio, and/or email.
 * Returns the updated user or null if not found.
 */
export async function updateOrganizer(id, updates, pool) {
    const setClauses = [];
    const params = [];
    let paramIndex = 1;
    if (typeof updates.username !== "undefined") {
        setClauses.push(`username = $${paramIndex++}`);
        params.push(updates.username);
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
        const currentQuery = 'SELECT * FROM organizers WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        return currentResult.rows[0] || null;
    }
    const query = `
    UPDATE organizers
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
        console.error("Error updating Organizers:", error);
        return null;
    }
}
export async function getOrganizerByEmail(email, pool) {
    const query = 'SELECT * FROM organizers WHERE email = $1';
    const result = await pool.query(query, [email]);
    console.log("Fetched organizers by email:", result.rows[0]);
    return result.rows[0];
}
export async function updateAccessToken(id, accessToken, pool) {
    const query = `UPDATE organizers SET access_token = $1, refreshed_at = NOW() WHERE id = $2 returning *`;
    const result = await pool.query(query, [accessToken, id]);
    return result.rows[0];
}
export async function logout(id, pool) {
    const query = `UPDATE organizers SET access_token = null WHERE id = $1 returning *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}
export async function sendNotification(senderId, receiverRole, receiverId, message, pool) {
    const senderRole = "organizer";
    const query = 'INSERT INTO private_messages (sender_id, sender_role, receiver_role, receiver_id, message) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [senderId, senderRole, receiverRole, receiverId, message]);
    return { success: true };
}
export async function getNotificationsFromAToB(receiver_id, a, b, pool) {
    const receiver_role = "organizer";
    const query = 'SELECT * FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2 ORDER BY sent_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [receiver_id, receiver_role, b, a]);
    return result.rows;
}
export async function countNotifications(receiver_id, pool) {
    const receiver_role = "organizer";
    const query = 'SELECT COUNT(*) FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2';
    const result = await pool.query(query, [receiver_id, receiver_role]);
    return parseInt(result.rows[0].count, 10);
}
export async function addMessage(message, sender_id, adventure_id, pool) {
    const query = 'INSERT INTO messages (message, sender_id, sender_type, adventure_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [message, sender_id, "organizer", adventure_id]);
    return result.rows[0];
}
export async function getMessagesFromAToB(adventure_id, a, b, pool) {
    const query = 'SELECT * FROM messages WHERE adventure_id = $1 ORDER BY created_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [adventure_id, b, a]);
    return result.rows;
}
export async function countMessages(adventure_id, pool) {
    const query = 'SELECT COUNT(*) FROM messages WHERE adventure_id = $1';
    const result = await pool.query(query, [adventure_id]);
    return parseInt(result.rows[0].count, 10);
}
export async function createRequest(orgId, categoryId, matchRadius, minTeamMembers, ageRangeMin, ageRangeMax, latitude, longitude, payPerHead, allBoys, allGirls, halfGirls, pool) {
    // 1. Fetch organizer
    const organizerRes = await pool.query(`SELECT dob, gender FROM organizers WHERE id = $1`, [orgId]);
    if (organizerRes.rowCount === 0) {
        throw new Error("Organizer not found");
    }
    const { dob, gender } = organizerRes.rows[0];
    // OPTIONAL: convert dob -> age (recommended)
    const age = calculateAge(dob);
    // 2. Insert match request
    const query = `
    INSERT INTO match_requests (
      org_id,
      category_id,
      match_radius,
      min_team_members,
      age_range_min,
      age_range_max,
      latitude,
      longitude,
      pay_per_head,
      all_boys,
      all_girls,
      half_girls,
      ages,
      genders
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14
    )
    RETURNING *
  `;
    const result = await pool.query(query, [
        orgId,
        categoryId,
        matchRadius,
        minTeamMembers,
        ageRangeMin,
        ageRangeMax,
        latitude,
        longitude,
        payPerHead,
        allBoys,
        allGirls,
        halfGirls,
        [age], // int[]
        [gender], // text[]
    ]);
    return result.rows[0];
}
function calculateAge(dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
        age--;
    return age;
}
export async function currentMatchRequest(id, pool) {
    const query = 'SELECT * from match_requests where org_id = $1 AND is_active = true';
    const result = await pool.query(query, [id]);
    return result.rows;
}
export async function completeMatch(name, id, pool) {
    const query = `update match_requests set is_active = false where id = $1 AND is_active = true returning *`;
    const result = await pool.query(query, [id]);
    const query2 = `insert into adventures(name, boss_id, category_id, organizer_id, user_ids) values($1, $2, $3, $4, $5, $6) returning *`;
    const result2 = await pool.query(query2, [name, result.rows[0].boss_id, result.rows[0].category_id, result.rows[0].org_id, result.rows[0].user_ids, randomInt(100000, 1000000).toString()]);
    return result2.rows[0];
}
export async function approveEvent(event_id, pool) {
    const query = 'UPDATE events SET is_approved_by_organizer = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [event_id]);
    return result.rows[0];
}
export async function getActiveAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND organizer_id = $1`, [id]);
    return result.rows;
}
export async function getInactiveAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND organizer_id = $1 order BY created_at DESC LIMIT $3 OFFSET $4`, [id, a, b]);
    return result.rows;
}
//# sourceMappingURL=organizer-helpers.js.map