CREATE OR REPLACE FUNCTION get_venue_partner_by_venue(p_venue_id INT)
RETURNS TABLE (
  venue_name VARCHAR(255),
  partner_name VARCHAR(255),
  partner_email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
    SELECT v.venue_name, vp.name, vp.email
    FROM venues v
    JOIN venue_partners vp ON v.venue_partner_id = vp.id
    WHERE v.venue_id = p_venue_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_schedule_with_partner(p_token VARCHAR(128))
RETURNS TABLE (
  venue_name VARCHAR(255),
  partner_name VARCHAR(255),
  partner_email VARCHAR(255),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT v.venue_name, vp.name, vp.email, s.start_time, s.end_time
    FROM alloted_schedules s
    JOIN venues v ON s.venue_id = v.venue_id
    JOIN venue_partners vp ON v.venue_partner_id = vp.id
    WHERE s.token = p_token;
END;
$$ LANGUAGE plpgsql;
