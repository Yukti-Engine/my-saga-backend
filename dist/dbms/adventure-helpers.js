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
export async function fileCount(adventure_id, pool) {
    const query = `
    SELECT COUNT(*) AS count
    FROM messages
    WHERE adventure_id = $1
      AND message LIKE '<|file|%'
  `;
    const result = await pool.query(query, [adventure_id]);
    return Number(result.rows[0].count);
}
export async function insertPoll(adventure_id, question, option, pool) {
    const votes = option.map(() => []);
    const query = `
    INSERT INTO polls (adventure_id, question, options, votes, poll_number)
    SELECT
      $1,
      $2,
      $3,
      $4,
      COALESCE(MAX(poll_number), 0) + 1
    FROM polls
    WHERE adventure_id = $1
    RETURNING poll_number
  `;
    const result = await pool.query(query, [
        adventure_id,
        question,
        option,
        votes,
    ]);
    return result.rows[0].poll_number;
}
export async function updatePollAddVote(adventure_id, poll_number, option_index, person_key, pool) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1️⃣ Lock the poll row
        const selectQuery = `
      SELECT votes
      FROM polls
      WHERE adventure_id = $1 AND poll_number = $2
      FOR UPDATE
    `;
        const result = await client.query(selectQuery, [
            adventure_id,
            poll_number,
        ]);
        if (result.rows.length === 0) {
            throw new Error("Poll not found");
        }
        const votes = result.rows[0].votes;
        // 2️⃣ Prevent duplicate vote for same option
        if (votes[option_index].includes(person_key)) {
            await client.query("ROLLBACK");
            return; // already voted
        }
        // 3️⃣ Add vote
        votes[option_index].push(person_key);
        // 4️⃣ Update row
        const updateQuery = `
      UPDATE polls
      SET votes = $1
      WHERE adventure_id = $2 AND poll_number = $3
    `;
        await client.query(updateQuery, [
            votes,
            adventure_id,
            poll_number,
        ]);
        await client.query("COMMIT");
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
export async function updatePollRemoveVote(adventure_id, poll_number, option_index, person_key, pool) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // 1️⃣ Lock the poll row
        const selectQuery = `
      SELECT votes
      FROM polls
      WHERE adventure_id = $1 AND poll_number = $2
      FOR UPDATE
    `;
        const result = await client.query(selectQuery, [
            adventure_id,
            poll_number,
        ]);
        if (result.rows.length === 0) {
            throw new Error("Poll not found");
        }
        const votes = result.rows[0].votes;
        // 2️⃣ If option index invalid
        if (!votes[option_index]) {
            await client.query("ROLLBACK");
            return;
        }
        // 3️⃣ Remove user vote if exists
        const index = votes[option_index].indexOf(person_key);
        if (index === -1) {
            await client.query("ROLLBACK");
            return; // user had not voted
        }
        votes[option_index].splice(index, 1);
        // 4️⃣ Update row
        const updateQuery = `
      UPDATE polls
      SET votes = $1
      WHERE adventure_id = $2 AND poll_number = $3
    `;
        await client.query(updateQuery, [
            votes,
            adventure_id,
            poll_number,
        ]);
        await client.query("COMMIT");
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
export async function getPoll(adventure_id, poll_number, pool) {
    const query = `Select * from polls where adventure_id = $1 AND poll_number=$2`;
    const result = await pool.query(query, [adventure_id, poll_number]);
    return result.rows[0];
}
export async function getResult(adventure_id, result_number, pool) {
    const query = `Select * from results where adventure_id = $1 AND result_number= $2`;
    const result = await pool.query(query, [adventure_id, result_number]);
    return result.rows[0];
}
export async function insertResult(adventure_id, badge_ids, user_ids, star_scores, remarks, pool) {
    const query = `
    INSERT INTO results (adventure_id, badge_ids, user_ids, star_scores, remarks, result_number)
    SELECT
      $1,
      $2,
      $3,
      $4,
      $5,
      COALESCE(MAX(result_number), 0) + 1
    FROM results
    WHERE adventure_id = $1
    RETURNING result_number
  `;
    const result = await pool.query(query, [
        adventure_id,
        badge_ids,
        user_ids,
        star_scores,
        remarks
    ]);
    return result.rows[0].result_number;
}
export async function roomAvailable(roomName, pool) {
    const adventureId = parseInt(roomName.substring(0, roomName.indexOf('_')));
    const roomKey = parseInt(roomName.substring(roomName.indexOf('_') + 1, roomName.length));
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND id = $1 AND room_key= $2`, [adventureId, roomKey]);
    if (result.rows.length == 0)
        return false;
    else
        return true;
}
export async function isRelatedToAdventure(id, role, adventureId, pool) {
    const result = await pool.query(`SELECT * FROM adventures WHERE is_active = true AND id = $1`, [adventureId]);
    const adventure = result.rows[0];
    if (role == "organizer") {
        if (adventure.organizer_id == id)
            return true;
        else
            return false;
    }
    else if (role == "boss") {
        if (adventure.boss_id == id)
            return true;
        else
            return false;
    }
    else {
        if (adventure.user_ids.includes(id))
            return true;
        else
            return false;
    }
}
export async function createEvent(activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, pool) {
    const query = 'INSERT INTO events (activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, is_approved_by_organizer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    const result = await pool.query(query, [activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, !is_boss_battle]);
    return result.rows[0];
}
//# sourceMappingURL=adventure-helpers.js.map