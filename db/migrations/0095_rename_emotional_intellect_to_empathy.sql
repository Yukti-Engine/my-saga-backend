DROP FUNCTION IF EXISTS apply_stat_changes(INT, FLOAT8, FLOAT8, FLOAT8, FLOAT8, FLOAT8, FLOAT8);
ALTER TABLE users RENAME COLUMN emotional_intellect_index TO empathy_index;

DROP FUNCTION IF EXISTS apply_stat_changes(INT, FLOAT8, FLOAT8, FLOAT8, FLOAT8, FLOAT8);

CREATE OR REPLACE FUNCTION apply_stat_changes(
  p_user_id INT,
  p_cognitive FLOAT8, p_drive FLOAT8, p_adaptability FLOAT8,
  p_empathy FLOAT8, p_creativity FLOAT8
) RETURNS TABLE (
  cognitive_index FLOAT8, drive_index FLOAT8, adaptability_index FLOAT8,
  empathy_index FLOAT8, creativity_index FLOAT8
) AS $$
BEGIN
  RETURN QUERY
    UPDATE users SET
      cognitive_index  = LEAST(GREATEST(users.cognitive_index  * p_cognitive, 0), 100),
      drive_index      = LEAST(GREATEST(users.drive_index      * p_drive, 0), 100),
      adaptability_index = LEAST(GREATEST(users.adaptability_index * p_adaptability, 0), 100),
      empathy_index    = LEAST(GREATEST(users.empathy_index    * p_empathy, 0), 100),
      creativity_index = LEAST(GREATEST(users.creativity_index * p_creativity, 0), 100)
    WHERE id = p_user_id
    RETURNING users.cognitive_index, users.drive_index, users.adaptability_index,
              users.empathy_index, users.creativity_index;
END;
$$ LANGUAGE plpgsql;
