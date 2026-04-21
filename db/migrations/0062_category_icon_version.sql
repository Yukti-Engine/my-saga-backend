-- Category icons move to GCS bucket my-saga-category-icons.
-- URL: https://storage.googleapis.com/my-saga-category-icons/<category_id>?v=<icon_version>
-- icon_version = 0 means no icon uploaded yet.

-- Drop functions that return SETOF/rowtype of categories before altering the table.
DROP FUNCTION IF EXISTS public.get_all_subcategories(text);
DROP FUNCTION IF EXISTS public.get_word2s(integer);

ALTER TABLE public.categories DROP COLUMN IF EXISTS icon;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon_version integer NOT NULL DEFAULT 0;

-- Recreate functions.
CREATE OR REPLACE FUNCTION public.get_all_subcategories(p_category text)
RETURNS SETOF public.categories
LANGUAGE sql AS $$
  SELECT * FROM categories WHERE category = p_category;
$$;
