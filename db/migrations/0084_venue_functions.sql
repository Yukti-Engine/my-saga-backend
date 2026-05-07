-- Venue Partners

CREATE OR REPLACE FUNCTION create_venue_partner(
  p_name VARCHAR(255),
  p_phone VARCHAR(20),
  p_email VARCHAR(255)
) RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO venue_partners (name, phone, email)
  VALUES (p_name, p_phone, p_email)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_venue_partners()
RETURNS SETOF venue_partners AS $$
BEGIN
  RETURN QUERY SELECT * FROM venue_partners ORDER BY id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_venue_partner(p_id INT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM venue_partners WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Venues

CREATE OR REPLACE FUNCTION create_venue(
  p_name VARCHAR(255),
  p_link TEXT,
  p_lat DECIMAL(9,6),
  p_long DECIMAL(9,6),
  p_partner_id INT
) RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO venues (venue_name, venue_link, venue_lat, venue_long, venue_partner_id)
  VALUES (p_name, p_link, p_lat, p_long, p_partner_id)
  RETURNING venue_id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_venues()
RETURNS TABLE (
  venue_id INT,
  venue_name VARCHAR(255),
  venue_link TEXT,
  venue_lat DECIMAL(9,6),
  venue_long DECIMAL(9,6),
  created_at TIMESTAMPTZ,
  venue_partner_id INT,
  partner_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
    SELECT v.venue_id, v.venue_name, v.venue_link, v.venue_lat, v.venue_long,
           v.created_at, v.venue_partner_id, vp.name AS partner_name
    FROM venues v
    LEFT JOIN venue_partners vp ON v.venue_partner_id = vp.id
    ORDER BY v.venue_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_venue(p_venue_id INT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM venues WHERE venue_id = p_venue_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Alloted Schedules

CREATE OR REPLACE FUNCTION create_alloted_schedule(
  p_venue_id INT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO alloted_schedules (venue_id, start_time, end_time)
  VALUES (p_venue_id, p_start_time, p_end_time)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_schedules_for_venue(p_venue_id INT)
RETURNS SETOF alloted_schedules AS $$
BEGIN
  RETURN QUERY SELECT * FROM alloted_schedules WHERE venue_id = p_venue_id ORDER BY start_time;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_alloted_schedule(p_id INT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM alloted_schedules WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
