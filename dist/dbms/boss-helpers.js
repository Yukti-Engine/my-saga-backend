/* ----------------- SIGNUP HELPERS ----------------- */
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
export async function getBoss(id, pool) {
    const query = 'SELECT * FROM bosses WHERE id = $1';
    const result = await pool.query(query, [id]);
    console.log("Fetched bosses:", result.rows[0]);
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
export async function updateBoss(id, updates, pool) {
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
        const currentQuery = 'SELECT * FROM bosses WHERE id = $1';
        const currentResult = await pool.query(currentQuery, [id]);
        return currentResult.rows[0] || null;
    }
    const query = `
    UPDATE bosses
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
        console.error("Error updating bosses:", error);
        return null;
    }
}
export async function getBossByEmail(email, pool) {
    const query = 'SELECT * FROM bosses WHERE email = $1';
    const result = await pool.query(query, [email]);
    console.log("Fetched bosses by email:", result.rows[0]);
    return result.rows[0];
}
export async function updateAccessToken(id, accessToken, pool) {
    const query = `UPDATE bosses SET access_token = $1, refreshed_at = NOW() WHERE id = $2 returning *`;
    const result = await pool.query(query, [accessToken, id]);
    return result.rows[0];
}
export async function logout(id, pool) {
    const query = `UPDATE bosses SET access_token = null WHERE id = $1 returning *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
}
export async function getQualification(id, pool) {
    const query = `SELECT * FROM boss_qualifications WHERE boss_id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows;
}
export async function sendNotification(senderId, receiverRole, receiverId, message, pool) {
    const senderRole = "boss";
    const query = 'INSERT INTO private_messages (sender_id, sender_role, receiver_role, receiver_id, message) VALUES ($1, $2, $3, $4, $5)';
    await pool.query(query, [senderId, senderRole, receiverRole, receiverId, message]);
    return { success: true };
}
export async function getNotificationsFromAToB(receiver_id, a, b, pool) {
    const receiver_role = "boss";
    const query = 'SELECT * FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2 ORDER BY sent_at DESC LIMIT $3 OFFSET $4';
    const result = await pool.query(query, [receiver_id, receiver_role, b, a]);
    return result.rows;
}
export async function countNotifications(receiver_id, pool) {
    const receiver_role = "boss";
    const query = 'SELECT COUNT(*) FROM private_messages WHERE receiver_id = $1 AND receiver_role = $2';
    const result = await pool.query(query, [receiver_id, receiver_role]);
    return parseInt(result.rows[0].count, 10);
}
export async function addMessage(message, sender_id, adventure_id, pool) {
    const query = 'INSERT INTO messages (message, sender_id, sender_type, adventure_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [message, sender_id, "boss", adventure_id]);
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
function calculateAge(dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
        age--;
    return age;
}
export async function getCompatibleRequests(categoryId, age, latitude, longitude, gender, pool) {
    const query = `
    SELECT
      *
    FROM match_requests
    WHERE
      category_id = $1
      AND boss_id is null
      AND age_range_min <= $2
      AND age_range_max >= $2
      AND (
        6371 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS($3 - latitude) / 2), 2) +
            COS(RADIANS(latitude)) *
            COS(RADIANS($3)) *
            POWER(SIN(RADIANS($4 - longitude) / 2), 2)
          )
        )
      ) <= match_radius
      AND (
        (all_girls = TRUE AND $5 = 'F')                                              -- unchanged
        OR (                                                                          -- changed
          half_girls = TRUE                                                           -- changed
          AND (                                                                       -- changed
            $5 = 'F'                                                                 -- changed
            OR (                                                                      -- changed
              array_length(genders, 1) > 0                                           -- changed
              AND (                                                                   -- changed
                SELECT COUNT(*) FROM unnest(genders) g WHERE g = 'F'                -- changed
              ) >= array_length(genders, 1) / 2.0                                   -- changed
            )                                                                        -- changed
          )                                                                          -- changed
        )                                                                            -- changed
        OR (all_girls = FALSE AND half_girls = FALSE)                                -- unchanged
      )
  `;
    const result = await pool.query(query, [
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
export async function checkReverseCompatibility(matchRequestId, latitude, longitude, matchRadius, ageRangeMin, ageRangeMax, allGirls, halfGirls, pool) {
    const result = await pool.query(`SELECT latitude, longitude, ages, genders FROM match_requests WHERE id = $1`, [matchRequestId]);
    if (result.rows.length === 0)
        return false;
    const matchRequest = result.rows[0];
    const distanceInKm = haversineDistanceKm(latitude, longitude, matchRequest.latitude, matchRequest.longitude);
    if (distanceInKm > matchRadius)
        return false;
    if (!Array.isArray(matchRequest.ages))
        return false;
    if (!Array.isArray(matchRequest.genders))
        return false;
    for (const age of matchRequest.ages) {
        if (age < ageRangeMin || age > ageRangeMax) {
            return false;
        }
    }
    let nonFemales = 0;
    let females = 0;
    for (const gender of matchRequest.genders) {
        if (allGirls)
            if (gender != 'F') {
                return false;
            }
            else if (halfGirls) {
                if (gender == 'F')
                    females++;
                else
                    nonFemales++;
            }
    }
    if (halfGirls && nonFemales > females)
        return false;
    return true;
}
export async function match(id, minTeamMembers, ageRangeMin, ageRangeMax, payPerHead2, snapshot, pool) {
    // ================= USER JOIN =================
    const userRes = await pool.query(`SELECT dob, gender, setting_1, setting_2 FROM users WHERE id = $1`, [id]);
    if (userRes.rowCount === 0)
        throw new Error("User not found");
    const { dob, gender, setting_1, setting_2 } = userRes.rows[0];
    const age = calculateAge(dob);
    const result = await pool.query(`
    UPDATE match_requests
    SET 
      boss_id = $1,
      genders = array_append(genders, $2),
      ages = array_append(ages, $3), 
      min_team_members = GREATEST(min_team_members, $4),
      age_range_min    = LEAST(age_range_min, $5),
      age_range_max    = GREATEST(age_range_max, $6),
      all_girls = (all_girls OR $7),
      half_girls = (half_girls OR $8)
      pay_per_head_2 = $9
    WHERE
        id = $10
        AND boss_id IS NOT DISTINCT FROM $11
        AND org_id = $12
        AND category_id = $13
        AND match_radius = $14
        AND min_team_members = $15
        AND age_range_min = $16
        AND age_range_max = $17
        AND latitude = $18
        AND longitude = $19
        AND pay_per_head = $20
        AND pay_per_head_2 IS NOT DISTINCT FROM $21
        AND all_girls = $22
        AND half_girls = $23
    RETURNING *
    `, [
        id,
        gender,
        age,
        minTeamMembers,
        ageRangeMin,
        ageRangeMax,
        setting_1,
        setting_2,
        payPerHead2,
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
        snapshot.all_girls,
        snapshot.half_girls
    ]);
    if (result.rowCount === 0)
        throw new Error("Match request changed, duplicate join, or slot unavailable");
    return { success: true };
}
export async function currentMatchRequest(id, pool) {
    const query = 'SELECT * from match_requests where boss_id = $1 AND is_active = true';
    const result = await pool.query(query, [id]);
    return result.rows;
}
export async function getActiveAdventures(id, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND boss_id = $1`, [id]);
    return result.rows;
}
export async function getInactiveAdventures(id, a, b, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = false AND boss_id = $1 order BY created_at DESC LIMIT $3 OFFSET $4`, [id, a, b]);
    return result.rows;
}
//# sourceMappingURL=boss-helpers.js.map