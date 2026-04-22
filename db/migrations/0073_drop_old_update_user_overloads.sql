-- Drop all old update_user overloads that accumulate across migrations
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, bytea);
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, text);
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, boolean);
