
CREATE OR REPLACE FUNCTION public.get_badge(
	p_badge_id integer)
    RETURNS badges
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
  SELECT * FROM badges WHERE id = p_badge_id
$BODY$;
