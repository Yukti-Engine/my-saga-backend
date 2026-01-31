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
export async function getCompatibleRequests(categoryId, age, latitude, longitude, allBoys, allGirls, halfGirls, gender, pool) {
    const query = `
    SELECT
      *
    FROM match_requests
    WHERE
      all_boys = $1
      AND all_girls = $2
      AND half_girls = $3
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
      AND ((all_girls = TRUE AND $8 = 'F') OR (all_boys = TRUE AND $8 = 'M') OR (array_length(genders, 1) < FLOOR(min_team_members/2) AND $8 = 'F' AND half_girls = TRUE) OR (half_girls = FALSE AND all_girls=FALSE AND all_boys=FALSE))
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
function calculateAge(dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate()))
        age--;
    return age;
}
export async function match(id, isBoss, minTeamMembers, // only used for USER
ageRangeMin, // only used for USER
ageRangeMax, // only used for USER
payPerHead2, // only used for BOSS
matchRequestId, updatedAt, pool) {
    // ================= BOSS JOIN =================
    if (isBoss) {
        const bossRes = await pool.query(`SELECT dob, gender FROM bosses WHERE id = $1`, [id]);
        if (bossRes.rowCount === 0)
            throw new Error("Boss not found");
        const { dob, gender } = bossRes.rows[0];
        const age = calculateAge(dob);
        const result = await pool.query(`
      UPDATE match_requests
      SET 
        boss_id = $1,
        genders = array_append(genders, $2),
        ages = array_append(ages, $3),
        pay_per_head_2 = $4,
        updated_at = NOW()
      WHERE id = $5
        AND boss_id IS NULL
        AND updated_at = $6
      RETURNING *
      `, [id, gender, age, payPerHead2, matchRequestId, updatedAt]);
        if (result.rowCount === 0)
            throw new Error("Boss slot already taken or request expired");
        return result.rows[0];
    }
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
      age_range_min    = GREATEST(age_range_min, $5),
      age_range_max    = LEAST(age_range_max, $6),

      updated_at = NOW()
    WHERE id = $7
      AND updated_at = $8
      AND NOT ($1 = ANY(user_ids))  
    RETURNING *
    `, [
        id,
        gender,
        age,
        minTeamMembers,
        ageRangeMin,
        ageRangeMax,
        matchRequestId,
        updatedAt,
    ]);
    if (result.rowCount === 0)
        throw new Error("Slot already filled, duplicate join, or request expired");
    return result.rows[0];
}
//# sourceMappingURL=match-request-helpers.js.map