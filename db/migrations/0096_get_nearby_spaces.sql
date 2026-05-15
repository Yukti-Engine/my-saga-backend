DROP FUNCTION IF EXISTS get_all_spaces();

CREATE OR REPLACE FUNCTION get_nearby_spaces(p_lat DOUBLE PRECISION, p_long DOUBLE PRECISION)
RETURNS SETOF spaces AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM spaces
    WHERE lat IS NOT NULL AND long IS NOT NULL
      AND 6371 * acos(
            cos(radians(p_lat)) * cos(radians(lat))
            * cos(radians(long) - radians(p_long))
            + sin(radians(p_lat)) * sin(radians(lat))
          ) <= 15
    ORDER BY id;
END;
$$ LANGUAGE plpgsql;
