CREATE OR REPLACE FUNCTION public.limit_more()
RETURNS integer
LANGUAGE sql AS $$
  WITH updated AS (
    UPDATE organizers
    SET max_team_members_limitation = max_team_members_limitation - 1
    WHERE max_team_members_limitation > 10
    RETURNING 1
  )
  SELECT COUNT(*)::int FROM updated;
$$;
