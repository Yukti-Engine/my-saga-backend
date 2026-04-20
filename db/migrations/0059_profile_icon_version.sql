-- Replace profile icon URL column with an integer version counter.
-- Frontend builds URL as https://storage.googleapis.com/my-saga-profiles/<role>/<id>?v=<icon_version>.
-- icon_version = 0 means no icon uploaded yet.

ALTER TABLE public.users       DROP COLUMN IF EXISTS icon;
ALTER TABLE public.organizers  DROP COLUMN IF EXISTS icon;
ALTER TABLE public.bosses      DROP COLUMN IF EXISTS icon;

ALTER TABLE public.users       ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;
ALTER TABLE public.organizers  ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;
ALTER TABLE public.bosses      ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;

-- Recreate update_* functions: p_bump_icon=true increments icon_version, else leaves it.
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, text);
CREATE OR REPLACE FUNCTION public.update_user(
  p_id integer,
  p_username text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_setting1 boolean DEFAULT NULL,
  p_setting2 boolean DEFAULT NULL,
  p_bump_icon boolean DEFAULT FALSE
) RETURNS public.users LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET
    username     = COALESCE(p_username, username),
    bio          = COALESCE(p_bio,      bio),
    email        = COALESCE(p_email,    email),
    setting_1    = COALESCE(p_setting1, setting_1),
    setting_2    = COALESCE(p_setting2, setting_2),
    icon_version = CASE WHEN p_bump_icon THEN icon_version + 1 ELSE icon_version END
  WHERE id = p_id;
  RETURN (SELECT * FROM users WHERE id = p_id);
END;
$$;

DROP FUNCTION IF EXISTS public.update_organizer(integer, text, boolean, boolean, text, text);
CREATE OR REPLACE FUNCTION public.update_organizer(
  p_id integer,
  p_username text DEFAULT NULL,
  p_setting1 boolean DEFAULT NULL,
  p_setting2 boolean DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_bump_icon boolean DEFAULT FALSE
) RETURNS public.organizers LANGUAGE plpgsql AS $$
BEGIN
  UPDATE organizers SET
    username     = COALESCE(p_username, username),
    setting_1    = COALESCE(p_setting1, setting_1),
    setting_2    = COALESCE(p_setting2, setting_2),
    bio          = COALESCE(p_bio,      bio),
    icon_version = CASE WHEN p_bump_icon THEN icon_version + 1 ELSE icon_version END
  WHERE id = p_id;
  RETURN (SELECT * FROM organizers WHERE id = p_id);
END;
$$;

DROP FUNCTION IF EXISTS public.update_boss(integer, text, boolean, boolean, text, text);
CREATE OR REPLACE FUNCTION public.update_boss(
  p_id integer,
  p_username text DEFAULT NULL,
  p_setting1 boolean DEFAULT NULL,
  p_setting2 boolean DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_bump_icon boolean DEFAULT FALSE
) RETURNS public.bosses LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bosses SET
    username     = COALESCE(p_username, username),
    setting_1    = COALESCE(p_setting1, setting_1),
    setting_2    = COALESCE(p_setting2, setting_2),
    bio          = COALESCE(p_bio,      bio),
    icon_version = CASE WHEN p_bump_icon THEN icon_version + 1 ELSE icon_version END
  WHERE id = p_id;
  RETURN (SELECT * FROM bosses WHERE id = p_id);
END;
$$;
