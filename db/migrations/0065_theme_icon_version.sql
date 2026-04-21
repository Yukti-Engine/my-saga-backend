-- Theme icons stored in my-saga-theme-icons bucket.
-- URL: https://storage.googleapis.com/my-saga-theme-icons/<theme_id>?v=<icon_version>
-- icon_version = 0 means no icon uploaded yet.

ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;
