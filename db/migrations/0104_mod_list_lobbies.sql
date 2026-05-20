-- 0104_mod_list_lobbies.sql
-- Moderator view of active match-request lobbies.
-- Returns paginated rows from match_requests joined with boss/organizer/category/space names.

CREATE OR REPLACE FUNCTION mod_list_lobbies(
  p_boss_id     int     DEFAULT NULL,
  p_category_id int     DEFAULT NULL,
  p_limit       int     DEFAULT 50,
  p_offset      int     DEFAULT 0
)
RETURNS TABLE (
  id             int,
  created_at     timestamptz,
  boss_id        int,
  boss_name      text,
  org_id         int,
  org_name       text,
  category_id    int,
  category_name  text,
  space_id       int,
  space_name     text,
  space_lat      numeric,
  space_long     numeric,
  age_range_min  int,
  age_range_max  int,
  pay_per_head   numeric,
  all_girls      boolean,
  half_girls     boolean,
  member_count   int
)
LANGUAGE sql STABLE AS $$
  SELECT
    mr.id,
    mr.created_at,
    mr.boss_id,
    b.name            AS boss_name,
    mr.org_id,
    o.name            AS org_name,
    mr.category_id,
    c.category        AS category_name,
    mr.space_id,
    s.name            AS space_name,
    s.lat             AS space_lat,
    s.long            AS space_long,
    mr.age_range_min,
    mr.age_range_max,
    mr.pay_per_head,
    mr.all_girls,
    mr.half_girls,
    COALESCE(array_length(mr.user_ids, 1), 0) AS member_count
  FROM  match_requests  mr
  JOIN  organizers      o ON o.id = mr.org_id
  JOIN  categories      c ON c.id = mr.category_id
  LEFT  JOIN bosses     b ON b.id = mr.boss_id
  LEFT  JOIN spaces     s ON s.id = mr.space_id
  WHERE mr.is_active = TRUE
    AND (p_boss_id     IS NULL OR mr.boss_id     = p_boss_id)
    AND (p_category_id IS NULL OR mr.category_id = p_category_id)
  ORDER BY mr.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
