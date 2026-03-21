ALTER TABLE public.categories RENAME COLUMN sub_category TO subcategory;

CREATE OR REPLACE FUNCTION public.create_category(
  p_category TEXT,
  p_subcategory TEXT DEFAULT NULL,
  p_word_2s TEXT[] DEFAULT NULL
)
RETURNS INT
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO categories (category, subcategory, word_2s)
  VALUES (p_category, p_subcategory, p_word_2s)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$BODY$;
