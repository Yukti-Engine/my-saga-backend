CREATE OR REPLACE FUNCTION public.cut_inactive_match_requests()
    RETURNS SETOF match_requests
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
  DELETE FROM match_requests 
  WHERE is_active = false
  RETURNING *;
$BODY$;
 