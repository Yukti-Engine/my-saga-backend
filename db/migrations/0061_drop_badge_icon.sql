-- Badge icons move to GCS bucket my-saga-badge-icons.
-- URL: https://storage.googleapis.com/my-saga-badge-icons/<badge_id>

-- Functions returning SETOF badges / badges rowtype must be dropped before altering the table.
DROP FUNCTION IF EXISTS public.get_badge(integer);
DROP FUNCTION IF EXISTS public.get_badges(integer);
DROP FUNCTION IF EXISTS public.mod_list_badges(integer, integer);
DROP FUNCTION IF EXISTS public.create_badge(text, integer, smallint, text, bytea);

ALTER TABLE public.badges DROP COLUMN IF EXISTS icon;

-- Recreate without icon.
CREATE OR REPLACE FUNCTION public.get_badge(p_badge_id integer)
RETURNS SETOF public.badges
LANGUAGE sql AS $$
  SELECT * FROM badges WHERE id = p_badge_id;
$$;

CREATE OR REPLACE FUNCTION public.get_badges(p_category_id integer)
RETURNS SETOF public.badges
LANGUAGE sql AS $$
  SELECT * FROM badges WHERE category_id = p_category_id;
$$;

CREATE OR REPLACE FUNCTION public.mod_list_badges(p_limit integer, p_offset integer)
RETURNS SETOF public.badges
LANGUAGE sql AS $$
  SELECT * FROM badges ORDER BY id LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION public.create_badge(
  p_title       text,
  p_category_id integer  DEFAULT NULL,
  p_league      smallint DEFAULT NULL,
  p_description text     DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_id integer;
BEGIN
  INSERT INTO badges (title, category_id, league, description)
  VALUES (p_title, p_category_id, p_league, p_description)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
