import { faker } from '@faker-js/faker';
import { Pool } from 'pg';
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Clear all tables (order matters due to foreign keys) ──────────────────
    await client.query(`
      TRUNCATE
        results, polls, messages, private_messages, events,
        user_badges, boss_qualifications, adventures, match_requests,
        users, bosses, organizers, categories, badges, offers, pending_users
      RESTART IDENTITY CASCADE
    `);

    // ── 1. Categories ─────────────────────────────────────────────────────────
    const sportCategories = [
      { category: 'Football',   sub: 'Soccer',      words: ['kick', 'goal'] },
      { category: 'Football',   sub: '5-a-side',    words: ['mini', 'fast'] },
      { category: 'Basketball', sub: 'Full Court',  words: ['dunk', 'hoop'] },
      { category: 'Basketball', sub: 'Street Ball', words: ['street', 'cross'] },
      { category: 'Tennis',     sub: 'Singles',     words: ['ace', 'serve'] },
      { category: 'Cricket',    sub: 'T20',         words: ['bat', 'bowl'] },
    ];

    const categoryIds: number[] = [];
    for (const c of sportCategories) {
      const res = await client.query(
        `INSERT INTO categories (category, sub_category, word_2s)
         VALUES ($1, $2, $3) RETURNING id`,
        [c.category, c.sub, c.words]
      );
      categoryIds.push(res.rows[0].id);
    }

    // ── 2. Badges ─────────────────────────────────────────────────────────────
    const badgeNames = ['Rookie', 'Veteran', 'Champion', 'Legend', 'Elite'];
    const badgeIds: number[] = [];
    for (let i = 0; i < badgeNames.length; i++) {
      const res = await client.query(
        `INSERT INTO badges (name, category_id) VALUES ($1, $2) RETURNING id`,
        [badgeNames[i], categoryIds[i % categoryIds.length]]
      );
      badgeIds.push(res.rows[0].id);
    }

    // ── 3. Offers ─────────────────────────────────────────────────────────────
    const offersData = [
      { name: 'Starter Pack',  price: 4.99,  gems: 100 },
      { name: 'Value Pack',    price: 9.99,  gems: 250 },
      { name: 'Premium Pack',  price: 19.99, gems: 600 },
      { name: 'Ultimate Pack', price: 49.99, gems: 1800 },
    ];
    for (const o of offersData) {
      await client.query(
        `INSERT INTO offers (offer_name, price, gems) VALUES ($1, $2, $3)`,
        [o.name, o.price, o.gems]
      );
    }

    // ── 4. Users ──────────────────────────────────────────────────────────────
    const userIds: number[] = [];
    for (let i = 0; i < 20; i++) {
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      const name      = `${firstName} ${lastName}`;
      const email     = faker.internet.email({ firstName, lastName }).toLowerCase();
      const dob       = faker.date.birthdate({ min: 18, max: 40, mode: 'age' });
      const gender    = faker.helpers.arrayElement(['M', 'F']);

      const res = await client.query(
        `INSERT INTO users (name, email, phone, dob, gender, username, star_score, gems, level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          name,
          email,
          faker.phone.number(),
          dob.toISOString().split('T')[0],
          gender,
          faker.internet.username({ firstName, lastName }).toLowerCase().slice(0, 24),
          faker.number.int({ min: 0, max: 500 }),
          faker.number.int({ min: 0, max: 1000 }),
          faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
        ]
      );
      userIds.push(res.rows[0].id);
    }

    // ── 5. Bosses ─────────────────────────────────────────────────────────────
    const bossIds: number[] = [];
    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      const dob       = faker.date.birthdate({ min: 20, max: 45, mode: 'age' });
      const gender    = faker.helpers.arrayElement(['M', 'F']);

      const res = await client.query(
        `INSERT INTO bosses (name, email, phone, password, username, dob, gender, credits, bio)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          `${firstName} ${lastName}`,
          faker.internet.email({ firstName, lastName }).toLowerCase(),
          faker.phone.number(),
          'hashed_dev_password',
          faker.internet.username({ firstName, lastName }).toLowerCase().slice(0, 24),
          dob.toISOString().split('T')[0],
          gender,
          faker.number.int({ min: 0, max: 500 }),
          faker.lorem.sentence(),
        ]
      );
      bossIds.push(res.rows[0].id);
    }

    // ── 6. Organizers ─────────────────────────────────────────────────────────
    const organizerIds: number[] = [];
    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName();
      const lastName  = faker.person.lastName();
      const dob       = faker.date.birthdate({ min: 20, max: 45, mode: 'age' });
      const gender    = faker.helpers.arrayElement(['M', 'F']);

      const res = await client.query(
        `INSERT INTO organizers (name, email, phone, password, username, dob, gender, credits, bio)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          `${firstName} ${lastName}`,
          faker.internet.email({ firstName, lastName }).toLowerCase(),
          faker.phone.number(),
          'hashed_dev_password',
          faker.internet.username({ firstName, lastName }).toLowerCase().slice(0, 24),
          dob.toISOString().split('T')[0],
          gender,
          faker.number.int({ min: 0, max: 500 }),
          faker.lorem.sentence(),
        ]
      );
      organizerIds.push(res.rows[0].id);
    }

    // ── 7. Boss Qualifications ────────────────────────────────────────────────
    for (const bossId of bossIds) {
      const badgeId = faker.helpers.arrayElement(badgeIds);
      await client.query(
        `INSERT INTO boss_qualifications (boss_id, badge_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [bossId, badgeId]
      );
    }

    // ── 8. Adventures ─────────────────────────────────────────────────────────
    const adventureIds: number[] = [];
    for (let i = 0; i < 6; i++) {
      const teamSize  = faker.number.int({ min: 2, max: 6 });
      const teamUsers = faker.helpers.arrayElements(userIds, teamSize);
      const catId     = faker.helpers.arrayElement(categoryIds);
      const bossId    = faker.helpers.arrayElement(bossIds);
      const orgId     = faker.helpers.arrayElement(organizerIds);

      const res = await client.query(
        `INSERT INTO adventures (name, boss_id, category_id, organizer_id, user_ids, is_active, room_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          `${faker.word.adjective()} ${faker.word.noun()} Challenge`,
          bossId,
          catId,
          orgId,
          teamUsers,
          faker.datatype.boolean(),
          faker.number.int({ min: 100000, max: 999999 }),
        ]
      );
      adventureIds.push(res.rows[0].id);
    }

    // ── 9. Events ─────────────────────────────────────────────────────────────
    for (const advId of adventureIds) {
      const numEvents = faker.number.int({ min: 1, max: 3 });
      for (let e = 0; e < numEvents; e++) {
        await client.query(
          `INSERT INTO events (activity, timing, venue, venue_link, adventure_id, instruction, is_boss_battle, attendance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            faker.helpers.arrayElement(['Match', 'Training', 'Tournament', 'Friendly']),
            faker.date.soon({ days: 30 }),
            faker.location.city() + ' Sports Arena',
            faker.internet.url(),
            advId,
            faker.lorem.sentence(),
            faker.datatype.boolean(),
            [],
          ]
        );
      }
    }

    // ── 10. Messages (group chat per adventure) ───────────────────────────────
    for (const advId of adventureIds) {
      for (let m = 0; m < 5; m++) {
        const senderType = faker.helpers.arrayElement(['user', 'boss', 'organizer']);
        const senderId =
          senderType === 'user'      ? faker.helpers.arrayElement(userIds)
          : senderType === 'boss'    ? faker.helpers.arrayElement(bossIds)
          : faker.helpers.arrayElement(organizerIds);

        await client.query(
          `INSERT INTO messages (message, sender_id, adventure_id, sender_type)
           VALUES ($1, $2, $3, $4)`,
          [faker.lorem.sentence().slice(0, 249), senderId, advId, senderType]
        );
      }
    }

    // ── 11. Private Messages ──────────────────────────────────────────────────
    const roles = ['user', 'boss', 'organizer'] as const;
    for (let i = 0; i < 10; i++) {
      const senderRole   = faker.helpers.arrayElement(roles);
      const receiverRole = faker.helpers.arrayElement(roles);
      const senderId =
        senderRole === 'user'   ? faker.helpers.arrayElement(userIds)
        : senderRole === 'boss' ? faker.helpers.arrayElement(bossIds)
        : faker.helpers.arrayElement(organizerIds);
      const receiverId =
        receiverRole === 'user'   ? faker.helpers.arrayElement(userIds)
        : receiverRole === 'boss' ? faker.helpers.arrayElement(bossIds)
        : faker.helpers.arrayElement(organizerIds);

      await client.query(
        `INSERT INTO private_messages (sender_id, sender_role, receiver_id, receiver_role, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [senderId, senderRole, receiverId, receiverRole, faker.lorem.sentence()]
      );
    }

    // ── 12. User Badges ───────────────────────────────────────────────────────
    for (const userId of userIds.slice(0, 10)) {
      const badgeId = faker.helpers.arrayElement(badgeIds);
      await client.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, badgeId]
      );
    }

    // ── 13. Polls ─────────────────────────────────────────────────────────────
    for (const advId of adventureIds.slice(0, 3)) {
      await client.query(
        `INSERT INTO polls (adventure_id, poll_number, question, options, votes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          advId,
          1,
          'What time works best for the next match?',
          ['Morning', 'Afternoon', 'Evening'],
          ['[]', '[]', '[]'],
        ]
      );
    }

    // ── 14. Results ───────────────────────────────────────────────────────────
    for (const advId of adventureIds.slice(0, 3)) {
      const teamSize   = 3;
      const teamUsers  = faker.helpers.arrayElements(userIds, teamSize);
      const starScores = teamUsers.map(() => faker.number.int({ min: 1, max: 5 }));
      const remarks    = teamUsers.map(() => faker.lorem.words(4));
      const badgeList  = teamUsers.map(() => faker.helpers.arrayElement(badgeIds));

      await client.query(
        `INSERT INTO results (adventure_id, result_number, badge_ids, user_ids, star_scores, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [advId, 1, badgeList, teamUsers, starScores, remarks]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
    console.log(`   - ${categoryIds.length} categories`);
    console.log(`   - ${badgeIds.length} badges`);
    console.log(`   - ${userIds.length} users`);
    console.log(`   - ${bossIds.length} bosses`);
    console.log(`   - ${organizerIds.length} organizers`);
    console.log(`   - ${adventureIds.length} adventures`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
