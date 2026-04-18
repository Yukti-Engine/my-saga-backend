CREATE TABLE themes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(20)  NOT NULL,
  description VARCHAR(200)
);

CREATE TYPE book_status AS ENUM ('Completed', 'Writing');

CREATE TABLE books (
  id       SERIAL PRIMARY KEY,
  title    VARCHAR(20)  NOT NULL,
  story    TEXT,
  user_id  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status   book_status  NOT NULL DEFAULT 'Writing',
  theme_id INT          REFERENCES themes(id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION append_to_story(
  p_book_id INT,
  p_text    TEXT
)
RETURNS VOID
LANGUAGE plpgsql AS
$$
BEGIN
  UPDATE books
  SET    story = COALESCE(story, '') || p_text
  WHERE  id = p_book_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book with id % not found', p_book_id;
  END IF;
END;
$$;
