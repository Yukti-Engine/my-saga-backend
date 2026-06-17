-- promo_codes.sql
--
-- Promo code feature schema. Run this once against the database (the schema /
-- functions for this project are managed out-of-band against Cloud SQL, so this
-- file is the source of truth for the promo tables — apply it manually:
--   psql "$DATABASE_URL" -f src/sql/promo_codes.sql
--
-- A promo code gives a user either a flat rupee discount or a percentage
-- discount off the cost of joining a lobby (see userController.joinAdventure).
-- Codes are created by the admin with an optional expiry and usage limits.

CREATE TABLE IF NOT EXISTS promo_codes (
  id                 SERIAL PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,           -- stored uppercase
  discount_type      TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  flat_off_paise     BIGINT       CHECK (flat_off_paise IS NULL OR flat_off_paise > 0),
  percent_off        NUMERIC(5,2) CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
  max_discount_paise BIGINT       CHECK (max_discount_paise IS NULL OR max_discount_paise > 0),  -- optional cap for percent codes
  expires_at         TIMESTAMPTZ,                    -- NULL = never expires
  active             BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit        INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),  -- NULL = unlimited total redemptions
  used_count         INTEGER NOT NULL DEFAULT 0,
  per_user_limit     INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit > 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Exactly one of flat_off_paise / percent_off is set, matching discount_type.
  CONSTRAINT promo_discount_shape CHECK (
    (discount_type = 'flat'    AND flat_off_paise IS NOT NULL AND percent_off    IS NULL) OR
    (discount_type = 'percent' AND percent_off    IS NOT NULL AND flat_off_paise IS NULL)
  )
);

-- One row per successful application of a code. Used for the per-user limit and
-- as an audit trail. used_count on promo_codes is the fast total-usage guard.
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id               SERIAL PRIMARY KEY,
  promo_code_id    INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id          INTEGER NOT NULL,
  match_request_id INTEGER,
  discount_paise   BIGINT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code_user
  ON promo_code_redemptions (promo_code_id, user_id);
