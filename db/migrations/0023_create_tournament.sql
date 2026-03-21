CREATE OR REPLACE FUNCTION public.create_tournament(
  p_name TEXT,
  p_badge_id INT DEFAULT NULL,
  p_prize_1 INT DEFAULT NULL,
  p_prize_2 INT DEFAULT NULL,
  p_prize_3 INT DEFAULT NULL,
  p_sponsored_by TEXT DEFAULT NULL,
  p_venue TEXT DEFAULT NULL,
  p_timing TIMESTAMPTZ DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_third_party_reward_detail TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO tournaments (name, badge_id, prize_1, prize_2, prize_3, sponsored_by, venue, timing, instructions, third_party_reward_detail)
  VALUES (p_name, p_badge_id, p_prize_1, p_prize_2, p_prize_3, p_sponsored_by, p_venue, p_timing, p_instructions, p_third_party_reward_detail)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$BODY$;
