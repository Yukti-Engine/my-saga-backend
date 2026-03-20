CREATE OR REPLACE FUNCTION public.create_boss(
  p_name     text,
  p_email    text,
  p_password text,
  p_username text,
  p_phone    text DEFAULT NULL,
  p_dob      date DEFAULT NULL,
  p_gender   text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.bosses (name, email, password, username, phone, dob, gender)
  VALUES (p_name, p_email, encode(p_password::bytea, 'base64'), p_username, p_phone, p_dob, p_gender)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;
