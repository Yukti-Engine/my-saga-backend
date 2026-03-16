CREATE OR REPLACE FUNCTION check_reverse_compatibility(
  p_match_request_id INT,
  p_latitude         FLOAT,
  p_longitude        FLOAT,
  p_match_radius     FLOAT,
  p_age_range_min    INT,
  p_age_range_max    INT,
  p_all_girls        BOOLEAN,
  p_half_girls       BOOLEAN
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_req        match_requests%ROWTYPE;
  v_dist_km    FLOAT;
  v_age        INT;
  v_gender     TEXT;
  v_females    INT := 0;
  v_nonfemales INT := 0;
BEGIN
  SELECT * INTO v_req FROM match_requests WHERE id = p_match_request_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Distance check
  v_dist_km := 6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(p_latitude  - v_req.latitude)  / 2), 2) +
    COS(RADIANS(v_req.latitude)) * COS(RADIANS(p_latitude)) *
    POWER(SIN(RADIANS(p_longitude - v_req.longitude) / 2), 2)
  ));
  IF v_dist_km > p_match_radius THEN RETURN FALSE; END IF;

  -- Age check: every member in the request must fit within the joiner's age range
  FOREACH v_age IN ARRAY v_req.ages LOOP
    IF v_age < p_age_range_min OR v_age > p_age_range_max THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- Gender check
  FOREACH v_gender IN ARRAY v_req.genders LOOP
    IF p_all_girls AND v_gender <> 'F' THEN
      RETURN FALSE;
    ELSIF p_half_girls THEN
      IF v_gender = 'F' THEN v_females    := v_females    + 1;
      ELSE                   v_nonfemales := v_nonfemales + 1;
      END IF;
    END IF;
  END LOOP;

  IF p_half_girls AND v_nonfemales > v_females THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;