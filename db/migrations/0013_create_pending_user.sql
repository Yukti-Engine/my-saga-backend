CREATE OR REPLACE FUNCTION public.create_pending_user(
	p_request_id text,
	p_name text,
	p_phone text,
	p_email text,
	p_dob text,
	p_gender text)
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

BEGIN
  INSERT INTO pending_users (request_id, name, phone, email, dob, gender, expires_at)
  VALUES (
    p_request_id, p_name, p_phone, p_email, p_dob, p_gender,
    NOW() + INTERVAL '40 minutes'
  )
  ON CONFLICT (request_id) DO UPDATE
    SET name       = EXCLUDED.name,
        phone      = EXCLUDED.phone,
        email      = EXCLUDED.email,
        dob        = EXCLUDED.dob,
        gender     = EXCLUDED.gender,
        expires_at = EXCLUDED.expires_at;

  RETURN p_request_id;
END;
$BODY$;
