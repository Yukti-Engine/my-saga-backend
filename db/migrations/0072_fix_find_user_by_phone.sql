CREATE OR REPLACE FUNCTION public.find_user_by_phone(p_phone text) RETURNS SETOF public.users
    LANGUAGE sql AS $$
  SELECT * FROM users WHERE phone = p_phone;
$$;
