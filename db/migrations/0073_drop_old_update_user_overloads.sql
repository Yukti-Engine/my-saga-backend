-- Drop old update_user overloads that are no longer used.
-- NOTE: do NOT drop (integer,text,text,text,boolean,boolean,text) — that is the live signature from 0066.
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, bytea);
DROP FUNCTION IF EXISTS public.update_user(integer, text, text, text, boolean, boolean, boolean);
