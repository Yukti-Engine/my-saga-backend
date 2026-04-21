-- Fixes the TOCTOU race in create_user: the old SELECT-then-INSERT loop could
-- fail under concurrent signups that land on the same username base. Now the
-- INSERT is retried inside an exception handler so concurrent calls are safe.
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
      -- only the username constraint should fire here (phone/email are
      -- pre-checked by the app layer before calling this function)
      CONTINUE;
    END;
  END LOOP;
END;
$$;
