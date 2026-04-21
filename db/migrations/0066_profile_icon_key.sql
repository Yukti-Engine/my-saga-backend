-- Profile icons: replace the deterministic `icon_version` + `{role}/{id}` path
-- with an unguessable random key. The bucket stays public, but the full path
-- `{role}/{icon_key}` can't be enumerated, and a fresh key on every upload
-- makes the URL change automatically (no ?v= needed for cache-busting).

-- Drop functions that reference `icon_version` first (they'll be recreated).
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS public.update_organizer(integer, text, boolean, boolean, text, boolean);
DROP FUNCTION IF EXISTS public.update_boss(integer, text, boolean, boolean, text, boolean);

ALTER TABLE public.users       DROP COLUMN IF EXISTS icon_version;
ALTER TABLE public.organizers  DROP COLUMN IF EXISTS icon_version;
ALTER TABLE public.bosses      DROP COLUMN IF EXISTS icon_version;

ALTER TABLE public.users       ADD COLUMN IF NOT EXISTS icon_key text;
ALTER TABLE public.organizers  ADD COLUMN IF NOT EXISTS icon_key text;
ALTER TABLE public.bosses      ADD COLUMN IF NOT EXISTS icon_key text;

-- Recreate update_user: p_icon_key text (NULL = leave unchanged).
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

CREATE OR REPLACE FUNCTION public.update_organizer(
  p_id        integer,
  p_username  text    DEFAULT NULL,
  p_setting1  boolean DEFAULT NULL,
  p_setting2  boolean DEFAULT NULL,
  p_bio       text    DEFAULT NULL,
  p_icon_key  text    DEFAULT NULL
) RETURNS SETOF public.organizers
LANGUAGE sql AS $$
  UPDATE organizers SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;

CREATE OR REPLACE FUNCTION public.update_boss(
  p_id        integer,
  p_username  text    DEFAULT NULL,
  p_setting1  boolean DEFAULT NULL,
  p_setting2  boolean DEFAULT NULL,
  p_bio       text    DEFAULT NULL,
  p_icon_key  text    DEFAULT NULL
) RETURNS SETOF public.bosses
LANGUAGE sql AS $$
  UPDATE bosses SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;
