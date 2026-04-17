DROP FUNCTION IF EXISTS public.match_request(
  integer, text, integer, integer, integer,
  double precision,  -- p_pay_per_head2
  integer, integer, integer, integer, double precision,
  integer, integer, integer,
  double precision, double precision, double precision, double precision,
  boolean, boolean
);

CREATE OR REPLACE FUNCTION public.match_request(
	p_id integer,
	p_role text,
	p_min_team_members integer,
	p_age_range_min integer,
	p_age_range_max integer,
	p_snapshot_id integer,
	p_snapshot_boss_id integer,
	p_snapshot_org_id integer,
	p_snapshot_category_id integer,
	p_snapshot_match_radius double precision,
	p_snapshot_min_team integer,
	p_snapshot_age_min integer,
	p_snapshot_age_max integer,
	p_snapshot_latitude double precision,
	p_snapshot_longitude double precision,
	p_snapshot_pay_per_head double precision,
	p_snapshot_all_girls boolean,
	p_snapshot_half_girls boolean)
    RETURNS jsonb
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
  v_dob      DATE;
  v_gender   TEXT;
  v_setting1 BOOLEAN;
  v_setting2 BOOLEAN;
  v_age      INT;
BEGIN
  -- Check if role is valid
  IF p_role NOT IN ('user', 'boss') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  -- Get person details based on role
  IF p_role = 'boss' THEN
    SELECT dob, gender, setting_1, setting_2
    INTO v_dob, v_gender, v_setting1, v_setting2
    FROM bosses WHERE id = p_id;
  ELSIF p_role = 'user' THEN
    SELECT dob, gender, setting_1, setting_2
    INTO v_dob, v_gender, v_setting1, v_setting2
    FROM users WHERE id = p_id;
  END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  v_age := calculate_age(v_dob);

  -- Update match request
  UPDATE match_requests
  SET
    boss_id          = CASE WHEN p_role = 'boss' THEN p_id ELSE boss_id END,
    user_ids         = CASE WHEN p_role = 'user' THEN array_append(user_ids, p_id) ELSE user_ids END,
    genders          = array_append(genders, v_gender),
    ages             = array_append(ages, v_age),
    min_team_members = GREATEST(min_team_members, p_min_team_members),
    age_range_min    = LEAST(age_range_min, p_age_range_min),
    age_range_max    = GREATEST(age_range_max, p_age_range_max),
    all_girls        = (all_girls OR (v_setting1 AND v_gender='F')),
    half_girls       = (half_girls OR (v_setting2 AND v_gender='F'))
  WHERE
    id                             = p_snapshot_id
    AND boss_id IS NOT DISTINCT FROM p_snapshot_boss_id
    AND org_id                     = p_snapshot_org_id
    AND category_id                = p_snapshot_category_id
    AND match_radius               = p_snapshot_match_radius
    AND min_team_members           = p_snapshot_min_team
    AND age_range_min              = p_snapshot_age_min
    AND age_range_max              = p_snapshot_age_max
    AND latitude                   = p_snapshot_latitude
    AND longitude                  = p_snapshot_longitude
    AND pay_per_head               = p_snapshot_pay_per_head
    AND all_girls                  = p_snapshot_all_girls
    AND half_girls                 = p_snapshot_half_girls;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match request changed, duplicate join, or slot unavailable';
  END IF;

  -- Return different response based on role
  IF p_role = 'boss' THEN
    RETURN jsonb_build_object('success', TRUE);
  ELSE
    RETURN jsonb_build_object(
      'success', TRUE,
      'cost', ROUND(p_snapshot_pay_per_head * 1.25 + 200)
    );
  END IF;
END;
$BODY$;

ALTER TABLE match_requests DROP COLUMN pay_per_head_2;