CREATE TABLE ratings (
  organizer_id INT NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organizer_id, user_id)
);

CREATE OR REPLACE FUNCTION upsert_rating(
  p_organizer_id INT,
  p_user_id INT,
  p_rating INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ratings (organizer_id, user_id, rating)
  VALUES (p_organizer_id, p_user_id, p_rating)
  ON CONFLICT (organizer_id, user_id)
  DO UPDATE SET rating = p_rating, created_at = NOW();

  UPDATE organizers
  SET rating = (SELECT AVG(rating)::FLOAT FROM ratings WHERE organizer_id = p_organizer_id)
  WHERE id = p_organizer_id;
END;
$$ LANGUAGE plpgsql;
