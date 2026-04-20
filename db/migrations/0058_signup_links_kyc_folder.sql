-- kyc_folder is assigned at link-generation time; user never sees it.
ALTER TABLE public.signup_links ADD COLUMN IF NOT EXISTS kyc_folder text;

-- Update consume_signup_link to also return kyc_folder.
DROP FUNCTION IF EXISTS public.consume_signup_link(text);
CREATE OR REPLACE FUNCTION public.consume_signup_link(p_token text)
RETURNS TABLE(role text, email text, kyc_folder text)
LANGUAGE sql AS $$
  UPDATE signup_links
  SET used_at = now()
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING signup_links.role, signup_links.email, signup_links.kyc_folder;
$$;

-- Helper: look up a link's kyc_folder before it's consumed (for upload URLs).
CREATE OR REPLACE FUNCTION public.get_signup_link_kyc_folder(p_token text)
RETURNS text
LANGUAGE sql AS $$
  SELECT kyc_folder FROM signup_links
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now();
$$;
