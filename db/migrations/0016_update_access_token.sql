CREATE OR REPLACE FUNCTION public.update_access_token(
	p_id integer,
	p_role text,
	p_new_access_token text)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN FALSE;
  END IF;
  
  IF p_role = 'user' THEN
    UPDATE users
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  IF p_role = 'organizer' THEN
    UPDATE organizers
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  IF p_role = 'boss' THEN
    UPDATE bosses
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$BODY$;