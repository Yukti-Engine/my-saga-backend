CREATE OR REPLACE FUNCTION public.logout_absentees()
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    users_updated INT := 0;
    organizers_updated INT := 0;
    bosses_updated INT := 0;
BEGIN
  
  -- Update users table
  UPDATE users
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS users_updated = ROW_COUNT;
  
  -- Update organizers table
  UPDATE organizers
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS organizers_updated = ROW_COUNT;
  
  -- Update bosses table
  UPDATE bosses
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS bosses_updated = ROW_COUNT;
  
  RETURN 'Logged out absentees. Users: ' || users_updated || 
         ', Organizers: ' || organizers_updated || 
         ', Bosses: ' || bosses_updated;
END;
$BODY$;