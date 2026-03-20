CREATE OR REPLACE FUNCTION deactivate_completed_adventures()
RETURNS integer[]
LANGUAGE plpgsql
AS $$
DECLARE
    deactivated_ids integer[];
BEGIN
    UPDATE public.adventures
    SET is_active = false
    WHERE is_active = true
      AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id INTO deactivated_ids;

    RETURN deactivated_ids;
END;
$$;