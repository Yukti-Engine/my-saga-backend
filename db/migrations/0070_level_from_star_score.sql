CREATE OR REPLACE FUNCTION public.insert_result(
  p_adventure_id integer,
  p_user_ids integer[],
  p_star_scores integer[],
  p_remarks text[]
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_badge_id   integer;
  v_league     smallint;
  v_threshold  integer;
  v_qualified  boolean[];
  v_result_num integer;
  i            integer;
BEGIN
  SELECT a.badge_id, b.league
    INTO v_badge_id, v_league
  FROM adventures a
  LEFT JOIN badges b ON b.id = a.badge_id
  WHERE a.id = p_adventure_id;

  IF v_badge_id IS NULL THEN
    RAISE EXCEPTION 'Adventure has no badge';
  END IF;

  v_threshold := 100 - COALESCE(v_league, 0);

  v_qualified := ARRAY(
    SELECT (s >= v_threshold) FROM unnest(p_star_scores) AS s
  );

  INSERT INTO results (adventure_id, user_ids, star_scores, remarks, qualified, result_number)
  SELECT
    p_adventure_id,
    p_user_ids,
    p_star_scores,
    p_remarks,
    v_qualified,
    COALESCE(MAX(result_number), 0) + 1
  FROM results
  WHERE adventure_id = p_adventure_id
  RETURNING result_number INTO v_result_num;

  FOR i IN 1 .. array_length(p_user_ids, 1) LOOP
    IF v_qualified[i] THEN
      INSERT INTO user_qualifications (user_id, badge_id)
      VALUES (p_user_ids[i], v_badge_id)
      ON CONFLICT DO NOTHING;
    END IF;

    UPDATE users
    SET level = level + (p_star_scores[i]::float / 100.0)
    WHERE id = p_user_ids[i];
  END LOOP;

  RETURN v_result_num;
END;
$$;
