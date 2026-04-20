CREATE OR REPLACE FUNCTION public.get_limitation(p_org_id integer)
RETURNS integer
LANGUAGE sql AS $$
  SELECT max_team_members_limitation FROM organizers WHERE id = p_org_id;
$$;
