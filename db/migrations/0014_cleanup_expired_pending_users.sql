CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_users()
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
    DELETE FROM pending_users 
    WHERE expires_at < NOW();
    
    RETURN 'Cleanup completed.';
END;
$BODY$;