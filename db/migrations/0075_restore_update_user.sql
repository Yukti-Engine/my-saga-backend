-- 0073 accidentally dropped update_user(integer,text,text,text,boolean,boolean,text),
-- which is the live function created in 0066. Restore it.
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
