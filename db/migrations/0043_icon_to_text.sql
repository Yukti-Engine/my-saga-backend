ALTER TABLE users ALTER COLUMN icon TYPE text USING NULL;
ALTER TABLE organizers ALTER COLUMN icon TYPE text USING NULL;
ALTER TABLE bosses ALTER COLUMN icon TYPE text USING NULL;

CREATE OR REPLACE FUNCTION public.update_user(p_id integer, p_username text DEFAULT NULL, p_bio text DEFAULT NULL, p_email text DEFAULT NULL, p_setting1 boolean DEFAULT NULL, p_setting2 boolean DEFAULT NULL, p_icon text DEFAULT NULL)
RETURNS public.users LANGUAGE plpgsql AS $$
BEGIN
  UPDATE users SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;
  RETURN (SELECT * FROM users WHERE id = p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_organizer(p_id integer, p_username text DEFAULT NULL, p_setting1 boolean DEFAULT NULL, p_setting2 boolean DEFAULT NULL, p_bio text DEFAULT NULL, p_icon text DEFAULT NULL)
RETURNS public.organizers LANGUAGE plpgsql AS $$
BEGIN
  UPDATE organizers SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;
  RETURN (SELECT * FROM organizers WHERE id = p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_boss(p_id integer, p_username text DEFAULT NULL, p_setting1 boolean DEFAULT NULL, p_setting2 boolean DEFAULT NULL, p_bio text DEFAULT NULL, p_icon text DEFAULT NULL)
RETURNS public.bosses LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bosses SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;
  RETURN (SELECT * FROM bosses WHERE id = p_id);
END;
$$;
