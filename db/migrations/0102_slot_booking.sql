-- Replace separate date + time columns with a single TIMESTAMPTZ
ALTER TABLE slots DROP COLUMN IF EXISTS date;
ALTER TABLE slots DROP COLUMN IF EXISTS time;
ALTER TABLE slots ADD COLUMN datetime TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE slots ALTER COLUMN datetime DROP DEFAULT;

-- Get all booked slots for a space on a given date (IST)
CREATE OR REPLACE FUNCTION get_booked_slots(p_space_id INT, p_date DATE)
RETURNS TABLE (
  id INT, space_id INT, datetime TIMESTAMPTZ, duration_in_hours INT
) AS $$
BEGIN
  RETURN QUERY
    SELECT s.id, s.space_id, s.datetime, s.duration_in_hours
    FROM slots s
    WHERE s.space_id = p_space_id
      AND (s.datetime AT TIME ZONE 'Asia/Kolkata')::DATE = p_date
    ORDER BY s.datetime;
END;
$$ LANGUAGE plpgsql;

-- Get a single slot by ID
CREATE OR REPLACE FUNCTION get_slot(p_slot_id INT)
RETURNS SETOF slots AS $$
BEGIN
  RETURN QUERY SELECT * FROM slots WHERE id = p_slot_id;
END;
$$ LANGUAGE plpgsql;

-- Book a slot: creates a new slot if it fits within 10:00–19:00 IST and
-- doesn't overlap any existing slot at the same space.
CREATE OR REPLACE FUNCTION book_slot(
  p_space_id INT,
  p_datetime TIMESTAMPTZ,
  p_duration INT
) RETURNS slots AS $$
DECLARE
  v_local TIMESTAMP := p_datetime AT TIME ZONE 'Asia/Kolkata';
  v_local_time TIME := v_local::TIME;
  v_end_time TIME := v_local_time + (p_duration || ' hours')::INTERVAL;
  v_end TIMESTAMPTZ := p_datetime + (p_duration || ' hours')::INTERVAL;
  v_result slots;
BEGIN
  IF p_duration < 1 OR p_duration > 9 THEN
    RAISE EXCEPTION 'duration must be between 1 and 9 hours';
  END IF;

  -- Must start at or after 10:00 IST and end at or before 19:00 IST
  IF v_local_time < '10:00'::TIME OR v_end_time > '19:00'::TIME THEN
    RAISE EXCEPTION 'slot must be within 10:00–19:00 IST';
  END IF;

  -- Check for overlapping slots at the same space
  IF EXISTS (
    SELECT 1 FROM slots s
    WHERE s.space_id = p_space_id
      AND p_datetime < s.datetime + (s.duration_in_hours || ' hours')::INTERVAL
      AND v_end > s.datetime
  ) THEN
    RAISE EXCEPTION 'slot overlaps with an existing booking';
  END IF;

  INSERT INTO slots (space_id, datetime, duration_in_hours)
  VALUES (p_space_id, p_datetime, p_duration)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
