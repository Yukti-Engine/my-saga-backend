ALTER TABLE venues
  ADD COLUMN head_count_limit INT,
  ADD COLUMN guarantee_per_head DECIMAL(10, 2);

DROP FUNCTION IF EXISTS create_venue(VARCHAR, TEXT, DECIMAL, DECIMAL, INT);
DROP FUNCTION IF EXISTS get_venues();

CREATE OR REPLACE FUNCTION create_venue(
  p_name VARCHAR(255),
  p_link TEXT,
  p_lat DECIMAL(9,6),
  p_long DECIMAL(9,6),
  p_partner_id INT,
  p_head_count_limit INT DEFAULT NULL,
  p_guarantee_per_head DECIMAL(10,2) DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO venues (venue_name, venue_link, venue_lat, venue_long, venue_partner_id, head_count_limit, guarantee_per_head)
  VALUES (p_name, p_link, p_lat, p_long, p_partner_id, p_head_count_limit, p_guarantee_per_head)
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
  head_count_limit INT,
  guarantee_per_head DECIMAL(10,2),
  partner_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
    SELECT v.venue_id, v.venue_name, v.venue_link, v.venue_lat, v.venue_long,
           v.created_at, v.venue_partner_id, v.head_count_limit, v.guarantee_per_head,
           vp.name AS partner_name
    FROM venues v
    LEFT JOIN venue_partners vp ON v.venue_partner_id = vp.id
    ORDER BY v.venue_id;
END;
$$ LANGUAGE plpgsql;
