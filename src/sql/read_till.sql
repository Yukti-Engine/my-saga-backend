-- read_till.sql
--
-- Notification read marker. Each account (user / organizer / boss) stores the
-- highest notification number it has seen; notifications 1..read_till are
-- considered read. Updated via the /<role>/notified-till routes.
-- Apply once:  psql "$DATABASE_URL" -f src/sql/read_till.sql

ALTER TABLE users      ADD COLUMN IF NOT EXISTS read_till INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS read_till INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bosses     ADD COLUMN IF NOT EXISTS read_till INTEGER NOT NULL DEFAULT 0;
