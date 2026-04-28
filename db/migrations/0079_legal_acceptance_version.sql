-- Track which version of T&C and Privacy Policy each role has accepted.
-- 0 = not yet accepted. Increment the app-side constant when docs are updated.

ALTER TABLE users
  ADD COLUMN terms_accepted_version    integer                     NOT NULL DEFAULT 0,
  ADD COLUMN terms_accepted_at         timestamp with time zone,
  ADD COLUMN privacy_accepted_version  integer                     NOT NULL DEFAULT 0,
  ADD COLUMN privacy_accepted_at       timestamp with time zone;

ALTER TABLE organizers
  ADD COLUMN terms_accepted_version    integer                     NOT NULL DEFAULT 0,
  ADD COLUMN terms_accepted_at         timestamp with time zone,
  ADD COLUMN privacy_accepted_version  integer                     NOT NULL DEFAULT 0,
  ADD COLUMN privacy_accepted_at       timestamp with time zone;

ALTER TABLE bosses
  ADD COLUMN terms_accepted_version    integer                     NOT NULL DEFAULT 0,
  ADD COLUMN terms_accepted_at         timestamp with time zone,
  ADD COLUMN privacy_accepted_version  integer                     NOT NULL DEFAULT 0,
  ADD COLUMN privacy_accepted_at       timestamp with time zone;
