-- Check 1: complete_match requires a boss in the lobby
CREATE OR REPLACE FUNCTION public.complete_match(p_name text, p_id integer) RETURNS public.adventures
LANGUAGE plpgsql AS $$
DECLARE
  v_match  match_requests%ROWTYPE;
  v_result adventures%ROWTYPE;
BEGIN
  UPDATE match_requests
  SET is_active = FALSE
  WHERE id = p_id AND is_active = TRUE
  RETURNING * INTO v_match;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'match request not found or already inactive';
  END IF;

  IF v_match.boss_id IS NULL THEN
    -- Roll back the deactivation
    UPDATE match_requests SET is_active = TRUE WHERE id = p_id;
    RAISE EXCEPTION 'cannot start adventure without an expert in the lobby';
  END IF;

  INSERT INTO adventures (name, boss_id, category_id, organizer_id, user_ids, badge_id, room_key)
  VALUES (
    p_name,
    v_match.boss_id,
    v_match.category_id,
    v_match.org_id,
    v_match.user_ids,
    v_match.badge_id,
    (FLOOR(RANDOM() * 900000) + 100000)::INT
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Check 2: create_event blocks new events once a boss battle event exists
CREATE OR REPLACE FUNCTION public.create_event(
  p_activity text,
  p_timing timestamp with time zone,
  p_venue text,
  p_venue_link text,
  p_adventure_id integer,
  p_instruction text,
  p_is_boss_battle boolean
) RETURNS public.events
LANGUAGE plpgsql AS $$
DECLARE
  v_result events%ROWTYPE;
BEGIN
  IF EXISTS (
    SELECT 1 FROM events
    WHERE adventure_id = p_adventure_id AND is_boss_battle = TRUE
  ) THEN
    RAISE EXCEPTION 'cannot add events after the boss battle has been scheduled';
  END IF;

  INSERT INTO events (
    activity, timing, venue, venue_link, adventure_id,
    instruction, is_boss_battle
  )
  VALUES (
    p_activity, p_timing, p_venue, p_venue_link, p_adventure_id,
    p_instruction, p_is_boss_battle
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
