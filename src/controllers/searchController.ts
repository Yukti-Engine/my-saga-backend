import type { Request, Response } from "express";
import pool from "../db.js";
import { calculateAge } from "../utils.js";
import { validatePositiveInt, validateIntRange, validateBoundedText, validateFloatRange, validateDateString } from "../validators.js";

export const getTicketStatus = async (req: Request, res: Response) => {
  const ticketV = validatePositiveInt(req.body.ticketId, "ticketId");
  if (!ticketV.ok) return res.status(400).json({ error: ticketV.error });

  const { rows } = await pool.query(
    `SELECT * FROM get_ticket_by_id($1::int)`,
    [ticketV.value]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Ticket not found" });
  return res.json(rows[0]);
};

export const getMyTickets = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  if (role !== "user" && role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be user, organizer, or boss" });

  const { rows } = await pool.query(
    `SELECT * FROM get_my_tickets($1::int, $2::text)`,
    [id, role]
  );
  return res.json(rows);
};

export const closeMyTicket = async (req: Request, res: Response) => {
  const { id, role } = req.body;
  if (role !== "user" && role !== "organizer" && role !== "boss")
    return res.status(400).json({ error: "role must be user, organizer, or boss" });
  const ticketV = validatePositiveInt(req.body.ticketId, "ticketId");
  if (!ticketV.ok) return res.status(400).json({ error: ticketV.error });

  const { rows } = await pool.query(
    `SELECT close_own_ticket($1::int, $2::int, $3::text) AS closed`,
    [ticketV.value, id, role]
  );
  if (!rows[0].closed)
    return res.status(404).json({ error: "Ticket not found, already closed, or not yours" });
  return res.json({ success: true });
};

export const getSpaces = async (req: Request, res: Response) => {
  const latV = validateFloatRange(req.body.latitude, "latitude", -90, 90);
  if (!latV.ok) return res.status(400).json({ error: latV.error });
  const longV = validateFloatRange(req.body.longitude, "longitude", -180, 180);
  if (!longV.ok) return res.status(400).json({ error: longV.error });

  const result = await pool.query(
    `SELECT * FROM get_nearby_spaces($1::float8, $2::float8)`,
    [latV.value, longV.value]
  );
  return res.json(result.rows);
};

export const getCategories = async (req: Request, res: Response) => {
  const result = await pool.query(`SELECT * FROM get_all_categories()`);
  return res.json(result.rows);
};

export const getSubcategories = async (req: Request, res: Response) => {
  const categoryV = validateBoundedText(req.body.category, "category", 1, 100);
  if (!categoryV.ok) return res.status(400).json({ error: categoryV.error });

  const result = await pool.query(`SELECT * FROM get_all_subcategories($1::text)`, [categoryV.value]);
  return res.json(result.rows);
};

export const getProfile = async (req: Request, res: Response) => {
  const profileIdV = validatePositiveInt(req.body.profileId, "profileId");
  if (!profileIdV.ok) return res.status(400).json({ error: profileIdV.error });
  const { profileRole } = req.body;
  if (profileRole !== "organizer" && profileRole !== "boss" && profileRole !== "user")
    return res.status(400).json({ error: "profileRole must be organizer, boss, or user" });
  const profileId = profileIdV.value;

  let person2;
  if (profileRole === "organizer")
    person2 = (await pool.query(`SELECT * FROM get_organizer($1::int)`, [profileId])).rows[0];
  else if (profileRole === "boss")
    person2 = (await pool.query(`SELECT * FROM get_boss($1::int)`, [profileId])).rows[0];
  else
    person2 = (await pool.query(`SELECT * FROM get_user($1::int)`, [profileId])).rows[0];

  if (!person2) return res.status(404).json({ error: "Profile not found" });

  return res.json({
    username: person2.username, age: calculateAge(person2.dob), gender: person2.gender,
    setting_1: person2.setting_1, setting_2: person2.setting_2,
    icon_key: person2.icon_key ?? null, bio: person2.bio
  });
};


export const getBadges = async (req: Request, res: Response) => {
  const { categoryId, badgeId } = req.body;
  const hasCategory = categoryId !== undefined && categoryId !== null;
  const hasBadge = badgeId !== undefined && badgeId !== null;
  if (hasCategory === hasBadge)
    return res.status(400).json({ error: "Provide exactly one of categoryId or badgeId" });

  if (hasBadge) {
    const v = validatePositiveInt(badgeId, "badgeId");
    if (!v.ok) return res.status(400).json({ error: v.error });
    return res.json((await pool.query(`SELECT * FROM get_badge($1::int)`, [v.value])).rows);
  }
  const v = validatePositiveInt(categoryId, "categoryId");
  if (!v.ok) return res.status(400).json({ error: v.error });
  return res.json((await pool.query(`SELECT * FROM get_badges($1::int)`, [v.value])).rows);
};



export const findLobbies = async (req: Request, res: Response) => {
  const { id, role, categoryId, badgeIds } = req.body;
  if (role !== "boss" && role !== "user")
    return res.status(400).json({ error: "role must be boss or user" });

  const spaceIdV = validatePositiveInt(req.body.spaceId, "spaceId");
  if (!spaceIdV.ok) return res.status(400).json({ error: spaceIdV.error });
  const ageMinV = validateIntRange(req.body.ageRangeMin, "ageRangeMin", 18, 100);
  if (!ageMinV.ok) return res.status(400).json({ error: ageMinV.error });
  const ageMaxV = validateIntRange(req.body.ageRangeMax, "ageRangeMax", 18, 100);
  if (!ageMaxV.ok) return res.status(400).json({ error: ageMaxV.error });
  if (ageMinV.value > ageMaxV.value)
    return res.status(400).json({ error: "ageRangeMin must be <= ageRangeMax" });

  let validCategoryId: number | null = null;
  let validBadgeIds: number[] | null = null;
  if (role === "user") {
    const v = validatePositiveInt(categoryId, "categoryId");
    if (!v.ok) return res.status(400).json({ error: v.error });
    validCategoryId = v.value;
  } else {
    if (!Array.isArray(badgeIds) || badgeIds.length === 0 || badgeIds.length > 50)
      return res.status(400).json({ error: "badgeIds must be a non-empty array (max 50)" });
    for (const bid of badgeIds) {
      if (!Number.isInteger(bid) || bid <= 0)
        return res.status(400).json({ error: "badgeIds must contain positive integers" });
    }
    const quals = await pool.query(`SELECT get_qualifications($1::int, $2::text) AS badge_id`, [id, "boss"]);
    const qualifiedBadgeIds = new Set(quals.rows.map((r: any) => Number(r.badge_id)));
    for (const bid of badgeIds) {
      if (!qualifiedBadgeIds.has(bid))
        return res.status(403).json({ error: "Not qualified for one or more badges" });
    }
    validBadgeIds = badgeIds;
  }

  let rows;
  if (role == "boss"){
    rows = (await pool.query(`SELECT * FROM get_boss($1::int)`, [id])).rows;
  }
  else if (role == "user"){
    rows = (await pool.query(`SELECT * FROM get_user($1::int)`, [id])).rows;
  }
  if (!rows || rows.length === 0)
    return res.status(404).json({ error: "no such person" });
  const person = rows[0];
  const age = calculateAge(person.dob);
  const compatible = await pool.query(
    `SELECT * FROM get_compatible_requests($1::text, $2::int, $3::int[], $4::int, $5::int, $6::text)`,
    [role, validCategoryId, validBadgeIds, age, spaceIdV.value, person.gender]
  );

  const potentialAdventures: any[] = [];
  for (const element of compatible.rows) {
    const check = await pool.query(
      `SELECT check_reverse_compatibility($1::int, $2::int, $3::int, $4::boolean, $5::boolean) AS ok`,
      [element.id, ageMinV.value, ageMaxV.value,
       person.gender === 'F' && person.setting_1,
       person.gender === 'F' && person.setting_2]
    );
    if (check.rows[0].ok) potentialAdventures.push(element);
  }
  return res.json(potentialAdventures);
};

export const getSlot = async (req: Request, res: Response) => {
  const slotIdV = validatePositiveInt(req.body.slotId, "slotId");
  if (!slotIdV.ok) return res.status(400).json({ error: slotIdV.error });

  const { rows } = await pool.query(
    `SELECT * FROM get_slot($1::int)`,
    [slotIdV.value]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Slot not found" });
  return res.json(rows[0]);
};

export const getBookedSlots = async (req: Request, res: Response) => {
  const spaceIdV = validatePositiveInt(req.body.spaceId, "spaceId");
  if (!spaceIdV.ok) return res.status(400).json({ error: spaceIdV.error });
  const dateV = validateDateString(req.body.date, "date");
  if (!dateV.ok) return res.status(400).json({ error: dateV.error });

  const { rows } = await pool.query(
    `SELECT * FROM get_booked_slots($1::int, $2::date)`,
    [spaceIdV.value, dateV.value]
  );
  return res.json(rows);
};
