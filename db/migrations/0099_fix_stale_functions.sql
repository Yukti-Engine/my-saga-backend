-- Fix functions with stale cached return types after 0092-0095 altered
-- users, match_requests, adventures, and events tables.
-- Also fixes the broken update_user overload created by 0098.
-- Rebuilds all book/story functions from 0090 as a precaution.

-- ================== update_user ==================
DROP FUNCTION IF EXISTS public.update_user(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_user(INT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION public.update_user(
  p_id        integer,
  p_username  text    DEFAULT NULL,
  p_bio       text    DEFAULT NULL,
  p_email     text    DEFAULT NULL,
  p_setting1  boolean DEFAULT NULL,
  p_setting2  boolean DEFAULT NULL,
  p_icon_key  text    DEFAULT NULL
) RETURNS SETOF public.users
LANGUAGE sql AS $$
  UPDATE users SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;

-- ================== find_user_by_phone ==================
DROP FUNCTION IF EXISTS public.find_user_by_phone(TEXT);

CREATE FUNCTION public.find_user_by_phone(p_phone text) RETURNS SETOF public.users
LANGUAGE sql AS $$
  SELECT * FROM users WHERE phone = p_phone;
$$;

-- ================== get_book_with_theme ==================
DROP FUNCTION IF EXISTS public.get_book_with_theme(INT);

CREATE OR REPLACE FUNCTION get_book_with_theme(p_user_id INT)
RETURNS TABLE (
  id INT, title TEXT, chapter INT, status TEXT,
  last_event_id INT, last_penalty_count INT,
  theme_name TEXT, theme_description TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT b.id::INT, b.title::TEXT, b.chapter::INT, b.status::TEXT,
           b.last_event_id::INT, b.last_penalty_count::INT,
           t.name::TEXT, t.description::TEXT
    FROM books b LEFT JOIN themes t ON t.id = b.theme_id
    WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================== get_book_chunks ==================
DROP FUNCTION IF EXISTS public.get_book_chunks(INT);

CREATE OR REPLACE FUNCTION get_book_chunks(p_book_id INT)
RETURNS TABLE (chapter INT, seq INT, kind TEXT, content TEXT, event_ids INT[], stat_changes JSONB, created_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
    SELECT sc.chapter, sc.seq, sc.kind::TEXT, sc.content::TEXT, sc.event_ids, sc.stat_changes, sc.created_at
    FROM story_chunks sc
    WHERE sc.book_id = p_book_id
    ORDER BY sc.chapter ASC, sc.seq ASC;
END;
$$ LANGUAGE plpgsql;

-- ================== get_full_story ==================
DROP FUNCTION IF EXISTS public.get_full_story(INT);

CREATE OR REPLACE FUNCTION get_full_story(p_book_id INT)
RETURNS TABLE (content TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT sc.content::TEXT FROM story_chunks sc
    WHERE sc.book_id = p_book_id
    ORDER BY sc.chapter ASC, sc.seq ASC;
END;
$$ LANGUAGE plpgsql;

-- ================== get_last_chunk ==================
DROP FUNCTION IF EXISTS public.get_last_chunk(INT);

CREATE OR REPLACE FUNCTION get_last_chunk(p_book_id INT)
RETURNS TABLE (id INT, chapter INT, seq INT, kind TEXT, event_ids INT[]) AS $$
BEGIN
  RETURN QUERY
    SELECT sc.id, sc.chapter, sc.seq, sc.kind::TEXT, sc.event_ids
    FROM story_chunks sc
    WHERE sc.book_id = p_book_id
    ORDER BY sc.chapter DESC, sc.seq DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ================== get_prior_story ==================
DROP FUNCTION IF EXISTS public.get_prior_story(INT, INT, INT);

CREATE OR REPLACE FUNCTION get_prior_story(p_book_id INT, p_chapter INT, p_seq INT)
RETURNS TABLE (content TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT sc.content::TEXT FROM story_chunks sc
    WHERE sc.book_id = p_book_id
      AND (sc.chapter < p_chapter OR (sc.chapter = p_chapter AND sc.seq < p_seq))
    ORDER BY sc.chapter ASC, sc.seq ASC;
END;
$$ LANGUAGE plpgsql;

-- ================== get_last_chunk_kind ==================
DROP FUNCTION IF EXISTS public.get_last_chunk_kind(INT, INT);

CREATE OR REPLACE FUNCTION get_last_chunk_kind(p_book_id INT, p_chapter INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT sc.kind FROM story_chunks sc
    WHERE sc.book_id = p_book_id AND sc.chapter = p_chapter
    ORDER BY sc.seq DESC LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ================== get_next_story_seq ==================
DROP FUNCTION IF EXISTS public.get_next_story_seq(INT, INT);

CREATE OR REPLACE FUNCTION get_next_story_seq(p_book_id INT, p_chapter INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COALESCE(MAX(seq), 0) + 1 FROM story_chunks WHERE book_id = p_book_id AND chapter = p_chapter);
END;
$$ LANGUAGE plpgsql;

-- ================== dead overloads ==================
DROP FUNCTION IF EXISTS public.create_match_request(INT, INT, DOUBLE PRECISION, INT, INT, INT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, TEXT);
