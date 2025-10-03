-- PostgreSQL schema for adventure app
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  star_score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  gems INTEGER NOT NULL DEFAULT 0,
  -- Changed jwt to access_token
  access_token TEXT,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  age INTEGER,
  gender TEXT,
  setting_1 BOOLEAN NOT NULL DEFAULT FALSE,
  setting_2 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bosses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  username TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS organizers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  username TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS adventures (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  boss_id INTEGER REFERENCES bosses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  activity TEXT NOT NULL,
  timing TIMESTAMPTZ NOT NULL,
  venue TEXT,
  venue_link TEXT,
  adventure_id INTEGER REFERENCES adventures(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS adventure_members (
  adventure_id INTEGER NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (adventure_id, user_id)
);

-- Added new pending_users table
CREATE TABLE IF NOT EXISTS pending_users (
  request_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  dob TEXT NOT NULL,
  gender TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_adventure ON events(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_members_user ON adventure_members(user_id);
-- Added index for pending users expiration
CREATE INDEX IF NOT EXISTS idx_pending_users_expires ON pending_users(expires_at);
