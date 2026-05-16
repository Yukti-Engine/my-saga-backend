-- Fix functions with stale cached return types after 0092-0095 altered
-- users, match_requests, adventures, and events tables.
-- Also fixes the broken update_user overload created by 0098.

-- ================== update_user ==================
-- 0098 created a broken overload referencing icon_version (dropped in 0066).
-- Drop it, then drop+recreate the correct version (stale SETOF public.users).
DROP FUNCTION IF EXISTS public.update_user(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_user(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.update_user(
  p_id        integer,
  p_username  text    DEFAULT NULL,
  p_bio       text    DEFAULT NULL,
  p_email     text    DEFAULT NULL,
  p_setting1  boolean DEFAULT NULL,
  p_setting2  boolean DEFAULT NULL,
  p_icon_key  text    DEFAULT NULL
) RETURNS SETOF public.users
LANGUAGE sql AS $$
  UPDATE users SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;

-- ================== find_user_by_phone ==================
DROP FUNCTION IF EXISTS public.find_user_by_phone(TEXT);

CREATE FUNCTION public.find_user_by_phone(p_phone text) RETURNS SETOF public.users
LANGUAGE sql AS $$
  SELECT * FROM users WHERE phone = p_phone;
$$;

-- ================== get_book_with_theme ==================
DROP FUNCTION IF EXISTS public.get_book_with_theme(INT);

CREATE OR REPLACE FUNCTION get_book_with_theme(p_user_id INT)
RETURNS TABLE (
  id INT, title TEXT, chapter INT, status TEXT,
  last_event_id INT, last_penalty_count INT,
  theme_name VARCHAR, theme_description TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT b.id, b.title::TEXT, b.chapter, b.status::TEXT,
           b.last_event_id, b.last_penalty_count,
           t.name, t.description
    FROM books b LEFT JOIN themes t ON t.id = b.theme_id
    WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================== dead overloads ==================
-- 12-param create_match_request from 0033 (superseded by 10-param in 0092)
DROP FUNCTION IF EXISTS public.create_match_request(INT, INT, DOUBLE PRECISION, INT, INT, INT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, TEXT);
