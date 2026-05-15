
CREATE OR REPLACE FUNCTION public.match_request(
  p_id                    INT,
  p_role                  TEXT,
  p_age_range_min         INT,
  p_age_range_max         INT,
  p_snapshot_id           INT,
  p_snapshot_boss_id      INT,
  p_snapshot_org_id       INT,
  p_snapshot_category_id  INT,
  p_snapshot_space_id     INT,
  p_snapshot_age_min      INT,
  p_snapshot_age_max      INT,
  p_snapshot_pay_per_head DOUBLE PRECISION,
  p_snapshot_all_girls    BOOLEAN,
  p_snapshot_half_girls   BOOLEAN
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_dob      DATE;
  v_gender   TEXT;
  v_setting1 BOOLEAN;
  v_setting2 BOOLEAN;
  v_age      INT;
BEGIN
  IF p_role NOT IN ('user', 'boss') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

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

  UPDATE match_requests
  SET
    boss_id       = CASE WHEN p_role = 'boss' THEN p_id ELSE boss_id END,
    user_ids      = CASE WHEN p_role = 'user' THEN array_append(user_ids, p_id) ELSE user_ids END,
    genders       = array_append(genders, v_gender),
    ages          = array_append(ages, v_age),
    age_range_min = GREATEST(age_range_min, p_age_range_min),
    age_range_max = LEAST(age_range_max, p_age_range_max),
    all_girls     = (all_girls OR (v_setting1 AND v_gender='F')),
    half_girls    = (half_girls OR (v_setting2 AND v_gender='F'))
  WHERE
    id                             = p_snapshot_id
    AND boss_id IS NOT DISTINCT FROM p_snapshot_boss_id
    AND org_id                     = p_snapshot_org_id
    AND category_id                = p_snapshot_category_id
    AND space_id                   = p_snapshot_space_id
    AND age_range_min              = p_snapshot_age_min
    AND age_range_max              = p_snapshot_age_max
    AND pay_per_head               = p_snapshot_pay_per_head
    AND all_girls                  = p_snapshot_all_girls
    AND half_girls                 = p_snapshot_half_girls;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match request changed, duplicate join, or slot unavailable';
  END IF;

  IF p_role = 'boss' THEN
    RETURN jsonb_build_object('success', TRUE);
  ELSE
    RETURN jsonb_build_object(
      'success', TRUE,
      'cost', ROUND(p_snapshot_pay_per_head * 1.25 + 200)
    );
  END IF;
END;
$$;
