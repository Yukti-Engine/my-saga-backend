-- ============ CATEGORIES ============

CREATE OR REPLACE FUNCTION admin_update_category(
  p_id INT, p_category TEXT, p_subcategory TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE categories
  SET category = COALESCE(p_category, category),
      subcategory = COALESCE(p_subcategory, subcategory)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_delete_category(p_id INT) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM categories WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============ BADGES ============

CREATE OR REPLACE FUNCTION admin_update_badge(
  p_id INT, p_title TEXT, p_category_id INT, p_league SMALLINT, p_description TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE badges
  SET title       = COALESCE(p_title, title),
      category_id = COALESCE(p_category_id, category_id),
      league      = COALESCE(p_league, league),
      description = COALESCE(p_description, description)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_delete_badge(p_id INT) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM badges WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============ THEMES ============

CREATE OR REPLACE FUNCTION admin_create_theme(p_name TEXT, p_description TEXT)
RETURNS INT AS $$
DECLARE v_id INT;
BEGIN
  INSERT INTO themes (name, description)
  VALUES (p_name, p_description)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_update_theme(
  p_id INT, p_name TEXT, p_description TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE themes
  SET name        = COALESCE(p_name, name),
      description = COALESCE(p_description, description)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_delete_theme(p_id INT) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM themes WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============ SPACES ============

CREATE OR REPLACE FUNCTION admin_create_space(
  p_name TEXT, p_link TEXT, p_lat DECIMAL(9,6), p_long DECIMAL(9,6)
) RETURNS INT AS $$
DECLARE v_id INT;
BEGIN
  INSERT INTO spaces (name, link, lat, long)
  VALUES (p_name, p_link, p_lat, p_long)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_list_spaces()
RETURNS SETOF spaces AS $$
BEGIN
  RETURN QUERY SELECT * FROM spaces ORDER BY id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_update_space(
  p_id INT, p_name TEXT, p_link TEXT, p_lat DECIMAL(9,6), p_long DECIMAL(9,6)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE spaces
  SET name = COALESCE(p_name, name),
      link = COALESCE(p_link, link),
      lat  = COALESCE(p_lat, lat),
      long = COALESCE(p_long, long)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_delete_space(p_id INT) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM spaces WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_set_space_categories(p_space_id INT, p_category_ids INT[])
RETURNS VOID AS $$
BEGIN
  DELETE FROM space_category_relations WHERE space_id = p_space_id;
  INSERT INTO space_category_relations (space_id, category_id)
  SELECT p_space_id, unnest(p_category_ids);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_get_space_categories(p_space_id INT)
RETURNS TABLE (category_id INT, category TEXT, subcategory TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.category::TEXT, c.subcategory::TEXT
    FROM space_category_relations scr
    JOIN categories c ON c.id = scr.category_id
    WHERE scr.space_id = p_space_id
    ORDER BY c.id;
END;
$$ LANGUAGE plpgsql;
