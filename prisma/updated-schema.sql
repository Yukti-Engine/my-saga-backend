-- 1. Rename column jwt → access_token in users
ALTER TABLE users
  RENAME COLUMN jwt TO access_token;

-- 2. Create new pending_users table
CREATE TABLE IF NOT EXISTS pending_users (
  request_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. Add index for pending_users expiration
CREATE INDEX IF NOT EXISTS idx_pending_users_expires
  ON pending_users(expires_at);
