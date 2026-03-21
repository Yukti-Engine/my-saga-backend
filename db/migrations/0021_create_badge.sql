CREATE OR REPLACE FUNCTION public.create_badge(
  p_title TEXT,
  p_category_id INT DEFAULT NULL,
  p_league SMALLINT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO badges (title, category_id, league, description)
  VALUES (p_title, p_category_id, p_league, p_description)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$BODY$;
