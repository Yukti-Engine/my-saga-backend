CREATE OR REPLACE FUNCTION get_my_tickets(p_reporter_id INT, p_reporter_role TEXT)
RETURNS TABLE (id INT, type TEXT, status TEXT, payload JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, resolved_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
    SELECT t.id, t.type::TEXT, t.status::TEXT, t.payload, t.created_at, t.updated_at, t.resolved_at
    FROM tickets t
    WHERE (t.payload->>'reporterId')::int = p_reporter_id
      AND t.payload->>'reporterRole' = p_reporter_role
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION close_own_ticket(p_ticket_id INT, p_reporter_id INT, p_reporter_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tickets
  SET status = 'closed', resolved_at = NOW(), updated_at = NOW()
  WHERE id = p_ticket_id
    AND status = 'open'
    AND (payload->>'reporterId')::int = p_reporter_id
    AND payload->>'reporterRole' = p_reporter_role;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
