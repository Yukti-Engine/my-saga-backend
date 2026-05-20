-- 0105_fix_get_all_themes.sql
-- DROP + CREATE to clear any stale cached return type on get_all_themes().

DROP FUNCTION IF EXISTS public.get_all_themes();

CREATE FUNCTION public.get_all_themes()
RETURNS TABLE (id INT, name TEXT, description TEXT)
LANGUAGE sql STABLE AS $$
  SELECT t.id, t.name::TEXT, t.description::TEXT
  FROM themes t
  ORDER BY t.id ASC;
$$;
