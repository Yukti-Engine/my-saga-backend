
CREATE OR REPLACE FUNCTION public.get_event(
	p_event_id integer)
    RETURNS events
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
  SELECT * FROM events WHERE id = p_event_id;
$BODY$;