-- ================== LEGAL VERSIONS ==================

CREATE OR REPLACE FUNCTION get_legal_versions(p_app TEXT)
RETURNS TABLE (terms_version INT, privacy_version INT) AS $$
BEGIN
  RETURN QUERY SELECT lv.terms_version, lv.privacy_version FROM legal_versions lv WHERE lv.app = p_app;
END;
$$ LANGUAGE plpgsql;

-- ================== SIGNUP LINKS ==================

CREATE OR REPLACE FUNCTION check_signup_link(p_token TEXT)
RETURNS TABLE (role TEXT) AS $$
BEGIN
  RETURN QUERY SELECT sl.role::TEXT FROM signup_links sl WHERE sl.token = p_token AND sl.used_at IS NULL AND sl.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ================== TICKETS (moderator) ==================

CREATE OR REPLACE FUNCTION mod_get_tickets(p_status TEXT, p_type TEXT, p_limit INT, p_offset INT)
RETURNS SETOF tickets AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM tickets t
    WHERE (p_status IS NULL OR t.status = p_status)
      AND (p_type IS NULL OR t.type = p_type)
    ORDER BY t.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mod_resolve_ticket(p_id INT, p_status TEXT)
RETURNS SETOF tickets AS $$
BEGIN
  RETURN QUERY
    UPDATE tickets SET status = p_status, resolved_at = NOW(), updated_at = NOW()
    WHERE id = p_id RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- ================== BOOK WITH THEME ==================

CREATE OR REPLACE FUNCTION get_book_with_theme(p_user_id INT)
RETURNS TABLE (
  id INT, title TEXT, chapter INT, status TEXT,
  last_event_id INT, last_penalty_count INT,
  theme_name VARCHAR, theme_description TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT b.id, b.title::TEXT, b.chapter, b.status::TEXT,
           b.last_event_id, b.last_penalty_count,
           t.name, t.description
    FROM books b LEFT JOIN themes t ON t.id = b.theme_id
    WHERE b.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ================== STORY CHUNK QUERIES ==================

CREATE OR REPLACE FUNCTION get_full_story(p_book_id INT)
RETURNS TABLE (content TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT sc.content::TEXT FROM story_chunks sc
    WHERE sc.book_id = p_book_id
    ORDER BY sc.chapter ASC, sc.seq ASC;
END;
$$ LANGUAGE plpgsql;

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

-- ================== STORY CHUNKS (next seq) ==================

CREATE OR REPLACE FUNCTION get_next_story_seq(p_book_id INT, p_chapter INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT COALESCE(MAX(seq), 0) + 1 FROM story_chunks WHERE book_id = p_book_id AND chapter = p_chapter);
END;
$$ LANGUAGE plpgsql;

-- ================== LEGAL (by phone, for user signup verify) ==================

CREATE OR REPLACE FUNCTION accept_legal_user_by_phone(p_phone TEXT, p_terms_version INT, p_privacy_version INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                   privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
  WHERE phone = p_phone;
END;
$$ LANGUAGE plpgsql;

-- ================== USER STATS ==================

CREATE OR REPLACE FUNCTION apply_stat_changes(
  p_user_id INT,
  p_cognitive FLOAT8, p_drive FLOAT8, p_adaptability FLOAT8,
  p_integrity FLOAT8, p_emotional_intellect FLOAT8, p_creativity FLOAT8
) RETURNS TABLE (
  cognitive_index FLOAT8, drive_index FLOAT8, adaptability_index FLOAT8,
  integrity_index FLOAT8, emotional_intellect_index FLOAT8, creativity_index FLOAT8
) AS $$
BEGIN
  RETURN QUERY
    UPDATE users SET
      cognitive_index          = LEAST(GREATEST(users.cognitive_index          * p_cognitive, 0), 100),
      drive_index              = LEAST(GREATEST(users.drive_index              * p_drive, 0), 100),
      adaptability_index       = LEAST(GREATEST(users.adaptability_index       * p_adaptability, 0), 100),
      integrity_index          = LEAST(GREATEST(users.integrity_index          * p_integrity, 0), 100),
      emotional_intellect_index = LEAST(GREATEST(users.emotional_intellect_index * p_emotional_intellect, 0), 100),
      creativity_index         = LEAST(GREATEST(users.creativity_index         * p_creativity, 0), 100)
    WHERE id = p_user_id
    RETURNING users.cognitive_index, users.drive_index, users.adaptability_index,
              users.integrity_index, users.emotional_intellect_index, users.creativity_index;
END;
$$ LANGUAGE plpgsql;

-- ================== STORY CHUNKS (with stat_changes) ==================

CREATE OR REPLACE FUNCTION update_story_chunk_with_stats(p_chunk_id INT, p_content TEXT, p_stat_changes JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE story_chunks SET content = p_content, stat_changes = p_stat_changes WHERE id = p_chunk_id;
END;
$$ LANGUAGE plpgsql;

-- ================== LEGAL (post-approval, for approve signup) ==================

CREATE OR REPLACE FUNCTION accept_legal_on_approval(p_role TEXT, p_id INT, p_terms_version INT, p_privacy_version INT)
RETURNS VOID AS $$
BEGIN
  IF p_role = 'organizer' THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                          privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
    WHERE id = p_id;
  ELSIF p_role = 'boss' THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                      privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
    WHERE id = p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
