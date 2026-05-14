ALTER TABLE users
    DROP COLUMN IF EXISTS integrity_index,
    DROP COLUMN IF EXISTS gems;

DROP FUNCTION IF EXISTS mod_grant_gems(INT, INT);

CREATE OR REPLACE FUNCTION apply_stat_changes(
  p_user_id INT,
  p_cognitive FLOAT8, p_drive FLOAT8, p_adaptability FLOAT8,
  p_emotional_intellect FLOAT8, p_creativity FLOAT8
) RETURNS TABLE (
  cognitive_index FLOAT8, drive_index FLOAT8, adaptability_index FLOAT8,
  emotional_intellect_index FLOAT8, creativity_index FLOAT8
) AS $$
BEGIN
  RETURN QUERY
    UPDATE users SET
      cognitive_index           = LEAST(GREATEST(users.cognitive_index           * p_cognitive, 0), 100),
      drive_index               = LEAST(GREATEST(users.drive_index              * p_drive, 0), 100),
      adaptability_index        = LEAST(GREATEST(users.adaptability_index       * p_adaptability, 0), 100),
      emotional_intellect_index = LEAST(GREATEST(users.emotional_intellect_index * p_emotional_intellect, 0), 100),
      creativity_index          = LEAST(GREATEST(users.creativity_index         * p_creativity, 0), 100)
    WHERE id = p_user_id
    RETURNING users.cognitive_index, users.drive_index, users.adaptability_index,
              users.emotional_intellect_index, users.creativity_index;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS mod_get_users(TEXT);

CREATE OR REPLACE FUNCTION mod_get_users(p_search TEXT DEFAULT NULL)
RETURNS TABLE(
  id integer, name text, username text, email text, phone text,
  gender varchar(10), level smallint, penalties integer
) LANGUAGE sql AS $$
  SELECT id, name, username, email, phone, gender, level, penalties
  FROM users
  WHERE p_search IS NULL
     OR name ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email ILIKE '%' || p_search || '%'
     OR phone ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT 100;
$$;
