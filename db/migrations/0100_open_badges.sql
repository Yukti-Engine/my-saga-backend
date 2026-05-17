CREATE TABLE ob_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  adventure_id INTEGER NOT NULL REFERENCES adventures(id),
  issued_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credential_json JSONB NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_ob_assertions_user ON ob_assertions(user_id);

CREATE OR REPLACE FUNCTION insert_ob_assertion(
  p_id UUID, p_user_id INT, p_badge_id INT, p_adventure_id INT, p_credential JSONB
) RETURNS VOID LANGUAGE sql AS $$
  INSERT INTO ob_assertions (id, user_id, badge_id, adventure_id, credential_json)
  VALUES (p_id, p_user_id, p_badge_id, p_adventure_id, p_credential);
$$;

CREATE OR REPLACE FUNCTION get_ob_assertions_by_user(p_user_id INT)
RETURNS TABLE (
  id UUID, badge_id INT, adventure_id INT,
  issued_on TIMESTAMPTZ, credential_json JSONB
) AS $$
BEGIN
  RETURN QUERY
    SELECT a.id, a.badge_id, a.adventure_id, a.issued_on, a.credential_json
    FROM ob_assertions a
    WHERE a.user_id = p_user_id AND a.revoked = FALSE
    ORDER BY a.issued_on DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_ob_assertion(p_id UUID)
RETURNS TABLE (
  id UUID, user_id INT, badge_id INT, adventure_id INT,
  issued_on TIMESTAMPTZ, credential_json JSONB, revoked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
    SELECT a.id, a.user_id, a.badge_id, a.adventure_id,
           a.issued_on, a.credential_json, a.revoked
    FROM ob_assertions a
    WHERE a.id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_badge_with_league(p_badge_id INT)
RETURNS TABLE (
  id INT, title TEXT, description TEXT, league SMALLINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT b.id::INT, b.title::TEXT, b.description::TEXT, b.league
    FROM badges b WHERE b.id = p_badge_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_email(p_user_id INT)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT u.email FROM users u WHERE u.id = p_user_id);
END;
$$ LANGUAGE plpgsql;
