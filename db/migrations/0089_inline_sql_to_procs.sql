-- ================== TICKETS ==================

CREATE OR REPLACE FUNCTION create_ticket(p_type TEXT, p_payload JSONB)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO tickets (type, payload) VALUES (p_type, p_payload) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ticket_by_id(p_id INT)
RETURNS TABLE (id INT, type TEXT, status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT t.id, t.type::TEXT, t.status::TEXT, t.created_at, t.updated_at, t.resolved_at FROM tickets t WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;

-- ================== ICON KEYS ==================

CREATE OR REPLACE FUNCTION get_user_icon_key(p_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT u.icon_key FROM users u WHERE u.id = p_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_organizer_icon_key(p_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT o.icon_key FROM organizers o WHERE o.id = p_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_boss_icon_key(p_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT b.icon_key FROM bosses b WHERE b.id = p_id);
END;
$$ LANGUAGE plpgsql;

-- ================== BOOKS & STORIES ==================

CREATE OR REPLACE FUNCTION get_user_book_id(p_user_id INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT b.id FROM books b WHERE b.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_theme(p_id INT)
RETURNS TABLE (name VARCHAR, description TEXT) AS $$
BEGIN
  RETURN QUERY SELECT t.name, t.description FROM themes t WHERE t.id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_name(p_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT u.name FROM users u WHERE u.id = p_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_book(p_title TEXT, p_user_id INT, p_theme_id INT)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO books (title, user_id, theme_id) VALUES (p_title, p_user_id, p_theme_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_story_chunk(p_book_id INT, p_chapter INT, p_seq INT, p_kind TEXT, p_content TEXT, p_event_ids INT[] DEFAULT '{}', p_stat_changes JSONB DEFAULT NULL)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO story_chunks (book_id, chapter, seq, kind, content, event_ids, stat_changes)
  VALUES (p_book_id, p_chapter, p_seq, p_kind, p_content, p_event_ids, p_stat_changes)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_book_chapter(p_book_id INT, p_chapter INT)
RETURNS VOID AS $$
BEGIN
  UPDATE books SET chapter = p_chapter WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_book_progress(p_book_id INT, p_last_event_id INT, p_last_penalty_count INT)
RETURNS VOID AS $$
BEGIN
  UPDATE books SET last_event_id = p_last_event_id, last_penalty_count = p_last_penalty_count WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_story_chunk_content(p_chunk_id INT, p_content TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE story_chunks SET content = p_content WHERE id = p_chunk_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rename_book(p_user_id INT, p_title TEXT)
RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  UPDATE books SET title = p_title WHERE user_id = p_user_id RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_penalties(p_id INT)
RETURNS TABLE (username VARCHAR, penalties INT) AS $$
BEGIN
  RETURN QUERY SELECT u.username, u.penalties FROM users u WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql;

-- ================== THEMES ==================

CREATE OR REPLACE FUNCTION get_all_themes()
RETURNS TABLE (id INT, name VARCHAR, description TEXT) AS $$
BEGIN
  RETURN QUERY SELECT t.id, t.name, t.description FROM themes t ORDER BY t.id ASC;
END;
$$ LANGUAGE plpgsql;

-- ================== BADGES ==================

CREATE OR REPLACE FUNCTION get_badge_category_id(p_badge_id INT)
RETURNS INT AS $$
BEGIN
  RETURN (SELECT b.category_id FROM badges b WHERE b.id = p_badge_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_badge_roadmaps(p_badge_id INT)
RETURNS VARCHAR(10000)[] AS $$
BEGIN
  RETURN (SELECT b.roadmaps FROM badges b WHERE b.id = p_badge_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_badges_for_roadmap()
RETURNS TABLE (id INT, title VARCHAR, description TEXT, league SMALLINT) AS $$
BEGIN
  RETURN QUERY SELECT b.id, b.title, b.description, b.league FROM badges b;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_badge_roadmaps(p_badge_id INT, p_roadmaps VARCHAR(10000)[])
RETURNS VOID AS $$
BEGIN
  UPDATE badges SET roadmaps = p_roadmaps WHERE id = p_badge_id;
END;
$$ LANGUAGE plpgsql;

-- ================== SIGNUP LINKS ==================

CREATE OR REPLACE FUNCTION create_signup_link(p_token TEXT, p_role TEXT, p_email TEXT, p_expires_at TIMESTAMPTZ, p_kyc_folder TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO signup_links (token, role, email, expires_at, kyc_folder)
  VALUES (p_token, p_role, p_email, p_expires_at, p_kyc_folder);
END;
$$ LANGUAGE plpgsql;

-- ================== PENDING SIGNUPS ==================

CREATE OR REPLACE FUNCTION create_pending_signup(
  p_token TEXT, p_role TEXT, p_email TEXT, p_name TEXT, p_phone TEXT,
  p_dob DATE, p_gender TEXT, p_username TEXT, p_password TEXT,
  p_kyc_folder TEXT, p_terms_version INT, p_privacy_version INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO pending_signups (token, role, email, name, phone, dob, gender, username, password, kyc_folder, terms_accepted_version, privacy_accepted_version)
  VALUES (p_token, p_role, p_email, p_name, p_phone, p_dob, p_gender, p_username, p_password, p_kyc_folder, p_terms_version, p_privacy_version);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION list_pending_signups()
RETURNS TABLE (id INT, role TEXT, email TEXT, name TEXT, phone TEXT, dob DATE, gender TEXT, username TEXT, kyc_folder TEXT, submitted_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
    SELECT ps.id, ps.role::TEXT, ps.email::TEXT, ps.name::TEXT, ps.phone::TEXT, ps.dob, ps.gender::TEXT, ps.username::TEXT, ps.kyc_folder::TEXT, ps.submitted_at
    FROM pending_signups ps ORDER BY ps.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_signup_kyc_folder(p_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT ps.kyc_folder FROM pending_signups ps WHERE ps.id = p_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_signup(p_id INT)
RETURNS SETOF pending_signups AS $$
BEGIN
  RETURN QUERY SELECT * FROM pending_signups ps WHERE ps.id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_pending_signup(p_id INT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM pending_signups WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ================== ADMIN CLEANUPS ==================

CREATE OR REPLACE FUNCTION cleanup_expired_signup_links()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM signup_links WHERE expires_at < NOW() AND used_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_stale_pending_signups()
RETURNS TABLE (kyc_folder TEXT) AS $$
BEGIN
  RETURN QUERY
    DELETE FROM pending_signups
    WHERE submitted_at < NOW() - INTERVAL '60 days'
    RETURNING pending_signups.kyc_folder::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_resolved_tickets()
RETURNS SETOF tickets AS $$
BEGIN
  RETURN QUERY
    DELETE FROM tickets
    WHERE status = 'closed'
      AND resolved_at < NOW() - INTERVAL '90 days'
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- ================== LEGAL ACCEPTANCE ==================

CREATE OR REPLACE FUNCTION accept_legal_user(p_id INT, p_accept_terms BOOLEAN, p_accept_privacy BOOLEAN, p_terms_version INT, p_privacy_version INT)
RETURNS VOID AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE users SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_legal_organizer(p_id INT, p_accept_terms BOOLEAN, p_accept_privacy BOOLEAN, p_terms_version INT, p_privacy_version INT)
RETURNS VOID AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE organizers SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_legal_boss(p_id INT, p_accept_terms BOOLEAN, p_accept_privacy BOOLEAN, p_terms_version INT, p_privacy_version INT)
RETURNS VOID AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE bosses SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
