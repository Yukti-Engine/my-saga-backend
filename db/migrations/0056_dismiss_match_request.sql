CREATE OR REPLACE FUNCTION public.dismiss_match_request(p_org_id integer)
RETURNS integer
LANGUAGE sql AS $$
  UPDATE match_requests
  SET is_active = FALSE
  WHERE org_id = p_org_id AND is_active = TRUE
  RETURNING id;
$$;
