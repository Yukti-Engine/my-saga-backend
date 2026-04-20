-- 1. kyc_folder column on organizers and bosses.
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS kyc_folder text;
ALTER TABLE public.bosses     ADD COLUMN IF NOT EXISTS kyc_folder text;

-- 2. signup_links table: one-time tokens for organizer/boss onboarding.
CREATE TABLE IF NOT EXISTS public.signup_links (
  id serial PRIMARY KEY,
  token text NOT NULL UNIQUE,
  role text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  CONSTRAINT chk_signup_link_role CHECK (role IN ('organizer', 'boss'))
);

CREATE INDEX IF NOT EXISTS idx_signup_links_email ON public.signup_links (email);

-- 3. Recreate create_organizer/create_boss with kyc_folder.
DROP FUNCTION IF EXISTS public.create_organizer(text, text, text, text, text, date, text);
CREATE OR REPLACE FUNCTION public.create_organizer(
  p_name       text,
  p_email      text,
  p_password   text,
  p_username   text,
  p_phone      text,
  p_dob        date,
  p_gender     text,
  p_kyc_folder text
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.organizers (name, email, password, username, phone, dob, gender, kyc_folder)
  VALUES (p_name, p_email, encode(p_password::bytea, 'base64'), p_username, p_phone, p_dob, p_gender, p_kyc_folder)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

DROP FUNCTION IF EXISTS public.create_boss(text, text, text, text, text, date, text);
CREATE OR REPLACE FUNCTION public.create_boss(
  p_name       text,
  p_email      text,
  p_password   text,
  p_username   text,
  p_phone      text,
  p_dob        date,
  p_gender     text,
  p_kyc_folder text
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.bosses (name, email, password, username, phone, dob, gender, kyc_folder)
  VALUES (p_name, p_email, encode(p_password::bytea, 'base64'), p_username, p_phone, p_dob, p_gender, p_kyc_folder)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- 4. Consume a signup link atomically (returns role+email, or NULL rows if invalid).
CREATE OR REPLACE FUNCTION public.consume_signup_link(p_token text)
RETURNS TABLE(role text, email text)
LANGUAGE sql AS $$
  UPDATE signup_links
  SET used_at = now()
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING signup_links.role, signup_links.email;
$$;
