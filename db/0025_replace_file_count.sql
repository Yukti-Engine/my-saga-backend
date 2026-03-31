CREATE OR REPLACE FUNCTION public.file_count(p_adventure_id integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE adventure_id = p_adventure_id
    AND message LIKE '<|file|(%';
$$;
