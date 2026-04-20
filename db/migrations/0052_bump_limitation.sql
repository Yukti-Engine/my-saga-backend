CREATE OR REPLACE FUNCTION public.bump_limitation(p_org_id integer)
RETURNS integer
LANGUAGE sql AS $$
  UPDATE organizers
  SET max_team_members_limitation = max_team_members_limitation + 1
  WHERE id = p_org_id AND max_team_members_limitation < 20
  RETURNING max_team_members_limitation;
$$;
