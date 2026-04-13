CREATE OR REPLACE FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_match_radius double precision, p_min_team_members integer, p_age_range_min integer, p_age_range_max integer, p_latitude double precision, p_longitude double precision, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean, p_roadmap TEXT) RETURNS public.match_requests
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_dob    DATE;
  v_gender TEXT;
  v_age    INT;
  v_result match_requests%ROWTYPE;
BEGIN
  SELECT dob, gender INTO v_dob, v_gender
  FROM organizers WHERE id = p_org_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Organizer not found'; END IF;

  v_age := calculate_age(v_dob);

  INSERT INTO match_requests (
      org_id, category_id, match_radius, min_team_members,
      age_range_min, age_range_max, latitude, longitude,
      pay_per_head, all_girls, half_girls, ages, genders, roadmap
    )
    VALUES (
      p_org_id, p_category_id, p_match_radius, p_min_team_members,
      p_age_range_min, p_age_range_max, p_latitude, p_longitude,
      p_pay_per_head, p_all_girls, p_half_girls,
      ARRAY[v_age], ARRAY[v_gender], p_roadmap
    )
    RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;