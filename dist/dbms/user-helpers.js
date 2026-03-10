export async function findPendingUser(requestId, pool) {
    const query = 'SELECT * FROM pending_users WHERE request_id = $1';
    const result = await pool.query(query, [requestId]);
    return result.rows[0] || null;
}
export async function removePendingUser(requestId, pool) {
    const query = 'DELETE FROM pending_users WHERE request_id = $1';
    await pool.query(query, [requestId]);
}
//User helpers
export async function getUser(id, pool) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched User:", result.rows[0]);
    return result.rows[0];
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
    const query = `UPDATE users SET access_token = $1, refreshed_at = NOW() WHERE id = $2 returning *`;
    const result = await pool.query(query, [accessToken, id]);
    return result.rows[0];
}
export async function logout(id, pool) {
    const query = `UPDATE users SET access_token = null WHERE id = $1 returning *`;
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
export async function getActiveAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND user_ids @> ARRAY[$1]`, [id]);
    return result.rows;
}
export async function sendNotification(senderId, receiverRole, receiverId, message, pool) {
    const senderRole = "user";
    const query = 'INSERT INTO private_messages (sender_id, sender_role, receiver_role, receiver_id, message) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [senderId, senderRole, receiverRole, receiverId, message]);
    return { success: true };
}
export async function getNotificationsFromAToB(receiver_id, a, b, pool) {
    const receiver_role = "user";
    const query = 'SELECT * FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2 ORDER BY sent_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [receiver_id, receiver_role, b, a]);
    return result.rows;
}
export async function countNotifications(receiver_id, pool) {
    const receiver_role = "user";
    const query = 'SELECT COUNT(*) FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2';
    const result = await pool.query(query, [receiver_id, receiver_role]);
    return parseInt(result.rows[0].count, 10);
}
export async function addMessage(message, sender_id, adventure_id, pool) {
    const query = 'INSERT INTO messages (message, sender_id, sender_type, adventure_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [message, sender_id, "user", adventure_id]);
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
export async function getCompatibleRequests(categoryId, age, latitude, longitude, allBoys, allGirls, halfGirls, gender, pool) {
    const query = `
    SELECT
      *
    FROM match_requests
    WHERE
      ((all_boys = $1
      AND all_girls = $2
      AND half_girls = $3) 
      OR (false = $1
      AND false = $2
      AND false = $3))
      AND category_id = $4
      AND age_range_min <= $5
      AND age_range_max >= $5
      AND (
        6371 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS($6 - latitude) / 2), 2) +
            COS(RADIANS(latitude)) *
            COS(RADIANS($6)) *
            POWER(SIN(RADIANS($7 - longitude) / 2), 2)
          )
        )
      ) <= match_radius
      AND ((all_girls = TRUE AND $8 = 'F') OR (all_boys = TRUE AND $8 = 'M') OR COALESCE(array_length(genders, 1), 0) < FLOOR(min_team_members/2) AND $8 = 'F' AND half_girls = TRUE) OR (half_girls = FALSE AND all_girls=FALSE AND all_boys=FALSE))
  `;
    const result = await pool.query(query, [
        allBoys,
        allGirls,
        halfGirls,
        categoryId,
        age,
        latitude,
        longitude,
        gender
    ]);
    return result.rows;
}
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in KM
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export async function checkReverseCompatibility(matchRequestId, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax, pool) {
    const result = await pool.query(`SELECT latitude, longitude, ages FROM match_requests WHERE id = $1`, [matchRequestId]);
    if (result.rows.length === 0)
        return false;
    const matchRequest = result.rows[0];
    const distanceInKm = haversineDistanceKm(latitude, longitude, matchRequest.latitude, matchRequest.longitude);
    if (distanceInKm > matchRadius)
        return false;
    if (!Array.isArray(matchRequest.ages))
        return false;
    // Compatible if ANY age overlaps
    for (const age of matchRequest.ages) {
        if (age >= ageRangeMin && age <= ageRangeMax) {
            return true;
        }
    }
    return false;
}
export async function match(id, minTeamMembers, ageRangeMin, ageRangeMax, snapshot, pool) {
    // ================= USER JOIN =================
    const userRes = await pool.query(`SELECT dob, gender FROM users WHERE id = $1`, [id]);
    if (userRes.rowCount === 0)
        throw new Error("User not found");
    const { dob, gender } = userRes.rows[0];
    const age = calculateAge(dob);
    const result = await pool.query(`
    UPDATE match_requests
    SET 
      user_ids = array_append(user_ids, $1),
      genders = array_append(genders, $2),
      ages = array_append(ages, $3),
      min_team_members = GREATEST(min_team_members, $4),
      age_range_min    = LEAST(age_range_min, $5),
      age_range_max    = GREATEST(age_range_max, $6)
    WHERE
        id = $7
        AND boss_id IS NOT DISTINCT FROM $8
        AND org_id = $9
        AND category_id = $10
        AND match_radius = $11
        AND min_team_members = $12
        AND age_range_min = $13
        AND age_range_max = $14
        AND latitude = $15
        AND longitude = $16
        AND pay_per_head = $17
        AND pay_per_head_2 IS NOT DISTINCT FROM $18
        AND all_boys = $19
        AND all_girls = $20
        AND half_girls = $21
    RETURNING *
    `, [
        id,
        gender,
        age,
        minTeamMembers,
        ageRangeMin,
        ageRangeMax,
        snapshot.id,
        snapshot.boss_id,
        snapshot.org_id,
        snapshot.category_id,
        snapshot.match_radius,
        snapshot.min_team_members,
        snapshot.age_range_min,
        snapshot.age_range_max,
        snapshot.latitude,
        snapshot.longitude,
        snapshot.pay_per_head,
        snapshot.pay_per_head_2,
        snapshot.all_boys,
        snapshot.all_girls,
        snapshot.half_girls
    ]);
    if (result.rowCount === 0)
        throw new Error("Match request changed, duplicate join, or slot unavailable");
    return { success: true, cost: Math.round((snapshot.pay_per_head + snapshot.pay_per_head_2) * 1.25) };
}
export async function currentMatchRequest(id, pool) {
    const query = 'SELECT * from match_requests where user_ids @> ARRAY[$1]::int[] AND is_active = true';
    const result = await pool.query(query, [id]);
    return result.rows;
}
export async function approveEvent(event_id, user_id, pool) {
    const query = 'UPDATE events SET is_approved_by_users = array_append(is_approved_by_users, $1) WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [user_id, event_id]);
    return result.rows[0];
}
export async function getBadges(id, pool) {
    const query = `
        SELECT b.*, ub.earned_at
        FROM badges b
        JOIN user_badges ub 
            ON b.id = ub.badge_id
        WHERE ub.user_id = $1
        ORDER BY ub.earned_at DESC
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
}
export async function rewardBadge(id, badge_id, pool) {
    const query = `insert into user_badges (user_id, badge_id) values ($1, $2) returning *`;
    const result = await pool.query(query, [id, badge_id]);
    return result.rows[0];
}
export async function checkBadge(id, badge_id, pool) {
    const query = `select * from user_badges where user_id = $1 and badge_id = $2`;
    const result = await pool.query(query, [id, badge_id]);
    return result.rows;
}
export async function getInactiveAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND user_ids @> ARRAY[$1] order BY created_at DESC LIMIT $3 OFFSET $4 `, [id, a, b]);
    return result.rows;
}
//# sourceMappingURL=user-helpers.js.map