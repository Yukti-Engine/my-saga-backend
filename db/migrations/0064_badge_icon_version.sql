-- Badge icon_version for cache-busting against my-saga-badge-icons bucket.
-- URL: https://storage.googleapis.com/my-saga-badge-icons/<badge_id>?v=<icon_version>
-- icon_version = 0 means no icon uploaded yet.

ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;
