-- After 0092 altered match_requests and 0094/0095 altered users,
-- functions returning public.users / SETOF match_requests have stale
-- cached return types.  DROP + CREATE to refresh them.

-- ================== create_user ==================
DROP FUNCTION IF EXISTS public.create_user(TEXT, TEXT, TEXT, DATE, TEXT);

CREATE OR REPLACE FUNCTION public.create_user(
  p_name   text,
  p_phone  text,
  p_email  text,
  p_dob    date,
  p_gender text
) RETURNS public.users LANGUAGE plpgsql AS $$
DECLARE
  v_base     TEXT;
  v_username TEXT;
  v_counter  INT := 1;
  v_user     users%ROWTYPE;
BEGIN
  v_base := LOWER(
    REGEXP_REPLACE(
      COALESCE(NULLIF(SPLIT_PART(p_email, '@', 1), ''), p_name, 'user'),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  v_base := TRIM(BOTH '-' FROM v_base);
  v_base := LEFT(v_base, 24);
  IF v_base = '' THEN v_base := 'user'; END IF;

  LOOP
    v_username := CASE WHEN v_counter = 1 THEN v_base ELSE v_base || (v_counter - 1)::text END;
    v_counter  := v_counter + 1;

    BEGIN
      INSERT INTO users (name, email, phone, gender, dob, username)
      VALUES (p_name, p_email, NULLIF(p_phone, ''), NULLIF(p_gender, ''), p_dob, v_username)
      RETURNING * INTO v_user;
      RETURN v_user;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- ================== update_user ==================
DROP FUNCTION IF EXISTS public.update_user(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);

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

-- ================== cut_inactive_match_requests ==================
DROP FUNCTION IF EXISTS public.cut_inactive_match_requests();

CREATE OR REPLACE FUNCTION public.cut_inactive_match_requests()
RETURNS SETOF match_requests LANGUAGE sql AS $$
  DELETE FROM match_requests
  WHERE is_active = false
  RETURNING *;
$$;
