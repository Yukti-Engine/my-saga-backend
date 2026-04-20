-- Wrap all moderator-route SQL into named functions.

-- 1. Paginated user search (whitelist columns).
CREATE OR REPLACE FUNCTION public.mod_search_users(
  p_search text,
  p_limit  integer,
  p_offset integer
) RETURNS TABLE(
  id integer, name text, username text, email text, phone text,
  gender varchar(10), level smallint, penalties integer, gems integer
) LANGUAGE sql AS $$
  SELECT id, name, username, email, phone, gender, level, penalties, gems
  FROM users
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;

-- 2. Paginated organizer search.
CREATE OR REPLACE FUNCTION public.mod_search_organizers(
  p_search text,
  p_limit  integer,
  p_offset integer
) RETURNS TABLE(
  id integer, name text, username text, email text, phone text,
  gender varchar(10), credits integer
) LANGUAGE sql AS $$
  SELECT id, name, username, email, phone, gender, credits
  FROM organizers
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;

-- 3. Paginated boss search.
CREATE OR REPLACE FUNCTION public.mod_search_bosses(
  p_search text,
  p_limit  integer,
  p_offset integer
) RETURNS TABLE(
  id integer, name text, username text, email text, phone text,
  gender varchar(10), credits integer
) LANGUAGE sql AS $$
  SELECT id, name, username, email, phone, gender, credits
  FROM bosses
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;

-- 4. Grant gems to a user (returns new gems balance, or NULL if not found).
CREATE OR REPLACE FUNCTION public.mod_grant_gems(
  p_user_id integer,
  p_gems    integer
) RETURNS integer
LANGUAGE sql AS $$
  UPDATE users SET gems = gems + p_gems WHERE id = p_user_id RETURNING gems;
$$;

-- 5. Grant credits to organizer or boss.
CREATE OR REPLACE FUNCTION public.mod_grant_credits(
  p_id      integer,
  p_role    text,
  p_credits integer
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  new_credits integer;
BEGIN
  IF p_role = 'organizer' THEN
    UPDATE organizers SET credits = credits + p_credits WHERE id = p_id RETURNING credits INTO new_credits;
  ELSIF p_role = 'boss' THEN
    UPDATE bosses SET credits = credits + p_credits WHERE id = p_id RETURNING credits INTO new_credits;
  ELSE
    RAISE EXCEPTION 'role must be organizer or boss';
  END IF;
  RETURN new_credits;
END;
$$;

-- 6. Adventures listing (paginated, optional is_active filter).
CREATE OR REPLACE FUNCTION public.mod_list_adventures(
  p_is_active boolean,
  p_limit     integer,
  p_offset    integer
) RETURNS TABLE(
  id integer, name text, category_id integer, organizer_id integer,
  boss_id integer, user_ids integer[], is_active boolean,
  room_key integer, created_at timestamptz
) LANGUAGE sql AS $$
  SELECT id, name, category_id, organizer_id, boss_id, user_ids, is_active, room_key, created_at
  FROM adventures
  WHERE p_is_active IS NULL OR is_active = p_is_active
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- 7. Tournaments listing.
CREATE OR REPLACE FUNCTION public.mod_list_tournaments(
  p_limit integer, p_offset integer
) RETURNS SETOF public.tournaments
LANGUAGE sql AS $$
  SELECT * FROM tournaments ORDER BY id DESC LIMIT p_limit OFFSET p_offset;
$$;

-- 8. Categories listing.
CREATE OR REPLACE FUNCTION public.mod_list_categories(
  p_limit integer, p_offset integer
) RETURNS SETOF public.categories
LANGUAGE sql AS $$
  SELECT * FROM categories ORDER BY id LIMIT p_limit OFFSET p_offset;
$$;

-- 9. Badges listing.
CREATE OR REPLACE FUNCTION public.mod_list_badges(
  p_limit integer, p_offset integer
) RETURNS SETOF public.badges
LANGUAGE sql AS $$
  SELECT * FROM badges ORDER BY id LIMIT p_limit OFFSET p_offset;
$$;

-- 10. Add category qualification (resolves category name -> id).
-- Returns TRUE if added, FALSE if already present, raises if org/category missing.
CREATE OR REPLACE FUNCTION public.mod_add_category_qualification(
  p_organizer_id integer,
  p_category     text
) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_category_id integer;
BEGIN
  SELECT id INTO v_category_id FROM categories WHERE category = p_category;
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organizers WHERE id = p_organizer_id) THEN
    RAISE EXCEPTION 'Organizer not found';
  END IF;

  INSERT INTO organizer_qualifications (organizer_id, category_id)
  VALUES (p_organizer_id, v_category_id)
  ON CONFLICT DO NOTHING;

  RETURN FOUND;
END;
$$;

-- 11. Remove category qualification.
CREATE OR REPLACE FUNCTION public.mod_remove_category_qualification(
  p_organizer_id integer,
  p_category     text
) RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_category_id integer;
BEGIN
  SELECT id INTO v_category_id FROM categories WHERE category = p_category;
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  DELETE FROM organizer_qualifications
  WHERE organizer_id = p_organizer_id AND category_id = v_category_id;

  RETURN FOUND;
END;
$$;

-- 12. KYC folder lookup (for list-kyc and kyc-download-url).
CREATE OR REPLACE FUNCTION public.get_kyc_folder(
  p_id integer,
  p_role text
) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  v_folder text;
BEGIN
  IF p_role = 'organizer' THEN
    SELECT kyc_folder INTO v_folder FROM organizers WHERE id = p_id;
  ELSIF p_role = 'boss' THEN
    SELECT kyc_folder INTO v_folder FROM bosses WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'role must be organizer or boss';
  END IF;
  RETURN v_folder;
END;
$$;
