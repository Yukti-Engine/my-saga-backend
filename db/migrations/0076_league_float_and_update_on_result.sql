ALTER TABLE badges ALTER COLUMN league TYPE numeric USING league::numeric;

CREATE OR REPLACE FUNCTION public.insert_result(
  p_adventure_id integer,
  p_user_ids integer[],
  p_star_scores integer[],
  p_remarks text[]
) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  v_badge_id   integer;
  v_league     numeric;
  v_threshold  integer;
  v_qualified  boolean[];
  v_eligible   boolean[];
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

  -- Determine eligibility and override qualified to false for non-eligible users
  FOR i IN 1 .. array_length(p_user_ids, 1) LOOP
    IF EXISTS (
      SELECT 1 FROM user_qualifications
      WHERE user_id = p_user_ids[i] AND badge_id = v_badge_id
    ) THEN
      v_eligible[i] := false;
      v_qualified[i] := false;
    ELSE
      v_eligible[i] := true;
    END IF;
  END LOOP;

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
    IF v_eligible[i] THEN
      IF v_qualified[i] THEN
        v_league := (v_league + 1.0) / 101.0 * 100.0;
        INSERT INTO user_qualifications (user_id, badge_id)
        VALUES (p_user_ids[i], v_badge_id);
      ELSE
        v_league := v_league / 101.0 * 100.0;
      END IF;
    END IF;

    UPDATE users
    SET level = level + (p_star_scores[i]::float / 100.0)
    WHERE id = p_user_ids[i];
  END LOOP;

  UPDATE badges SET league = v_league WHERE id = v_badge_id;

  RETURN v_result_num;
END;
$$;
