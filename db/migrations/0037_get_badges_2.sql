DROP FUNCTION get_badges;
CREATE OR REPLACE FUNCTION public.get_badges(
    p_category_id integer)
    RETURNS SETOF badges
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
  SELECT * FROM badges WHERE category_id = p_category_id;
$BODY$;