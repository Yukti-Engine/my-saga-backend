-- chapter 0 = introduction (written at start-book, immediately concluded)
-- chapter 1+ = regular chapters the user builds via proceed/conclude
ALTER TABLE books ADD COLUMN IF NOT EXISTS chapter INT NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_event_id INT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS last_penalty_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS story_chunks (
  id         SERIAL PRIMARY KEY,
  book_id    INT  NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter    INT  NOT NULL,
  seq        INT  NOT NULL,
  -- 'open'    = any AI-written chunk (intro, chapter conclusions, chapter openers)
  -- 'proceed' = user-triggered continuation
  kind       TEXT NOT NULL CHECK (kind IN ('open', 'proceed')),
  content    TEXT NOT NULL,
  event_ids  INT[] NOT NULL DEFAULT '{}',
  stat_changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (book_id, chapter, seq)
);
