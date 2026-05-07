ALTER TABLE alloted_schedules
  ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN token VARCHAR(128) NOT NULL DEFAULT '',
  ADD COLUMN requested_by_role VARCHAR(10),
  ADD COLUMN requested_by_id INT;

-- Drop old functions so we can recreate with new signatures/return types
DROP FUNCTION IF EXISTS create_alloted_schedule(INT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_schedules_for_venue(INT);
DROP FUNCTION IF EXISTS delete_alloted_schedule(INT);

-- Validates all business rules and inserts if valid.
-- Returns the new id on success; raises an exception on failure.
CREATE OR REPLACE FUNCTION request_alloted_schedule(
  p_venue_id INT,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_role VARCHAR(10),
  p_requester_id INT,
  p_token VARCHAR(128)
) RETURNS INT AS $$
DECLARE
  v_duration INTERVAL;
  v_existing INT;
  v_overlap INT;
  v_id INT;
BEGIN
  -- Max 3 hours duration
  v_duration := p_end_time - p_start_time;
  IF v_duration > INTERVAL '3 hours' THEN
    RAISE EXCEPTION 'duration exceeds 3 hours';
  END IF;

  -- Start must be > NOW + 18 hours
  IF p_start_time <= NOW() + INTERVAL '18 hours' THEN
    RAISE EXCEPTION 'start time must be at least 18 hours from now';
  END IF;

  -- Start must be < NOW + 3 days
  IF p_start_time >= NOW() + INTERVAL '3 days' THEN
    RAISE EXCEPTION 'start time must be within 3 days from now';
  END IF;

  -- Max 3 schedules per venue (any status)
  SELECT COUNT(*) INTO v_existing
  FROM alloted_schedules
  WHERE venue_id = p_venue_id;
  IF v_existing >= 3 THEN
    RAISE EXCEPTION 'venue already has 3 schedules (busy)';
  END IF;

  -- No overlapping schedules for the same venue
  SELECT COUNT(*) INTO v_overlap
  FROM alloted_schedules
  WHERE venue_id = p_venue_id
    AND start_time < p_end_time
    AND end_time > p_start_time;
  IF v_overlap > 0 THEN
    RAISE EXCEPTION 'overlaps with an existing schedule';
  END IF;

  INSERT INTO alloted_schedules (venue_id, start_time, end_time, is_confirmed, token, requested_by_role, requested_by_id)
  VALUES (p_venue_id, p_start_time, p_end_time, FALSE, p_token, p_role, p_requester_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Confirm a schedule by token
CREATE OR REPLACE FUNCTION confirm_alloted_schedule(p_token VARCHAR(128))
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE alloted_schedules SET is_confirmed = TRUE WHERE token = p_token AND NOT is_confirmed;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Reject (delete) a schedule by token
CREATE OR REPLACE FUNCTION reject_alloted_schedule(p_token VARCHAR(128))
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM alloted_schedules WHERE token = p_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Updated getter that returns the new columns
CREATE OR REPLACE FUNCTION get_schedules_for_venue(p_venue_id INT)
RETURNS TABLE (
  id INT,
  venue_id INT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_confirmed BOOLEAN,
  requested_by_role VARCHAR(10),
  requested_by_id INT
) AS $$
BEGIN
  RETURN QUERY
    SELECT s.id, s.venue_id, s.start_time, s.end_time,
           s.is_confirmed, s.requested_by_role, s.requested_by_id
    FROM alloted_schedules s
    WHERE s.venue_id = p_venue_id
    ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;
