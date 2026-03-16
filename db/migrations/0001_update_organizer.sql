
DROP FUNCTION IF EXISTS public.update_organizer(integer, text, boolean, boolean, text, bytea);

CREATE OR REPLACE FUNCTION public.update_organizer(
	p_id integer,
	p_username text DEFAULT NULL::text,
	p_setting1 boolean DEFAULT NULL::boolean,
	p_setting2 boolean DEFAULT NULL::boolean,
	p_bio text DEFAULT NULL::text,
	p_icon bytea DEFAULT NULL::bytea)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

BEGIN
  UPDATE organizers
  SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;

  RETURN true;
END;
$BODY$;