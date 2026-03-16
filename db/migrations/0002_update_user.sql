-- FUNCTION: public.update_user(integer, text, text, text, boolean, boolean, bytea)

DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, bytea);

CREATE OR REPLACE FUNCTION public.update_user(
	p_id integer,
	p_username text DEFAULT NULL::text,
	p_bio text DEFAULT NULL::text,
	p_email text DEFAULT NULL::text,
	p_setting1 boolean DEFAULT NULL::boolean,
	p_setting2 boolean DEFAULT NULL::boolean,
	p_icon bytea DEFAULT NULL::bytea)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

BEGIN
  UPDATE users
  SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;

  RETURN true;
END;
$BODY$;