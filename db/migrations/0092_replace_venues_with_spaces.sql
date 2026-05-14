-- Drop all functions that depend on the old venue tables
DROP FUNCTION IF EXISTS get_schedule_with_partner(VARCHAR);
DROP FUNCTION IF EXISTS get_venue_partner_by_venue(INT);
DROP FUNCTION IF EXISTS get_schedules_for_venue(INT);
DROP FUNCTION IF EXISTS confirm_alloted_schedule(VARCHAR);
DROP FUNCTION IF EXISTS reject_alloted_schedule(VARCHAR);
DROP FUNCTION IF EXISTS request_alloted_schedule(INT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INT);
DROP FUNCTION IF EXISTS delete_alloted_schedule(INT);
DROP FUNCTION IF EXISTS create_alloted_schedule(INT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS delete_venue(INT);
DROP FUNCTION IF EXISTS get_venues();
DROP FUNCTION IF EXISTS create_venue(VARCHAR, TEXT, DECIMAL, DECIMAL, INT, INT, DECIMAL);
DROP FUNCTION IF EXISTS create_venue(VARCHAR, TEXT, DECIMAL, DECIMAL, INT, INT, INT);
DROP FUNCTION IF EXISTS create_venue(VARCHAR, TEXT, DECIMAL, DECIMAL, INT);
DROP FUNCTION IF EXISTS delete_venue_partner(INT);
DROP FUNCTION IF EXISTS get_venue_partners();
DROP FUNCTION IF EXISTS create_venue_partner(VARCHAR, VARCHAR, VARCHAR);

-- Drop old tables (order matters due to foreign keys)
DROP TABLE IF EXISTS alloted_schedules CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS venue_partners CASCADE;

-- ================== NEW TABLES ==================

CREATE TABLE spaces (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    link        TEXT,
    lat         DECIMAL(9, 6),
    long        DECIMAL(9, 6)
);

CREATE TABLE space_category_relations (
    space_id    INT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (space_id, category_id)
);

CREATE TABLE props (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    space_id    INT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE
);

CREATE TABLE prop_allocations (
    prop_id     INT NOT NULL REFERENCES props(id) ON DELETE CASCADE,
    space_id    INT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    date        DATE NOT NULL
);

CREATE TABLE slots (
    id                SERIAL PRIMARY KEY,
    space_id          INT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    date              DATE NOT NULL,
    time              TIME NOT NULL,
    duration_in_hours INT NOT NULL CHECK (duration_in_hours > 0)
);

-- ================== SPACE FUNCTIONS ==================

CREATE OR REPLACE FUNCTION get_all_spaces()
RETURNS SETOF spaces AS $$
BEGIN
  RETURN QUERY SELECT * FROM spaces ORDER BY id;
END;
$$ LANGUAGE plpgsql;

-- ================== ALTER match_requests ==================

ALTER TABLE match_requests
    DROP COLUMN IF EXISTS match_radius,
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude,
    ADD COLUMN space_id INT REFERENCES spaces(id) ON DELETE SET NULL;

-- Rebuild functions that referenced the dropped columns

DROP FUNCTION IF EXISTS public.create_match_request(INT, INT, DOUBLE PRECISION, INT, INT, INT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN, TEXT, INT);

CREATE OR REPLACE FUNCTION public.create_match_request(
    p_org_id INT, p_category_id INT, p_space_id INT,
    p_age_range_min INT, p_age_range_max INT,
    p_pay_per_head DOUBLE PRECISION, p_all_girls BOOLEAN, p_half_girls BOOLEAN,
    p_roadmap TEXT, p_badge_id INT
) RETURNS public.match_requests
LANGUAGE plpgsql AS $$
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
      org_id, category_id, space_id,
      age_range_min, age_range_max,
      pay_per_head, all_girls, half_girls, ages, genders, roadmap, badge_id
    )
    VALUES (
      p_org_id, p_category_id, p_space_id,
      p_age_range_min, p_age_range_max,
      p_pay_per_head, p_all_girls, p_half_girls,
      ARRAY[v_age], ARRAY[v_gender], p_roadmap, p_badge_id
    )
    RETURNING * INTO v_result;
  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.get_compatible_requests(TEXT, INT, INT[], INT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);

CREATE OR REPLACE FUNCTION public.get_compatible_requests(
  p_role        TEXT,
  p_category_id INT,
  p_badge_ids   INT[],
  p_age         INT,
  p_space_id    INT,
  p_gender      TEXT
) RETURNS SETOF public.match_requests
LANGUAGE sql AS $$
  SELECT * FROM match_requests
  WHERE
    is_active = TRUE
    AND (
      (p_role = 'user' AND category_id = p_category_id)
      OR (p_role = 'boss' AND badge_id = ANY(p_badge_ids))
    )
    AND age_range_min <= p_age
    AND age_range_max >= p_age
    AND space_id = p_space_id
    AND (
      (all_girls = TRUE AND p_gender = 'F')
      OR (
        half_girls = TRUE AND (
          p_gender = 'F'
          OR (
            array_length(genders, 1) > 0
            AND (SELECT COUNT(*) FROM unnest(genders) g WHERE g = 'F')
                >= array_length(genders, 1) / 2.0
          )
        )
      )
      OR (all_girls = FALSE AND half_girls = FALSE)
    )
    AND (
      (p_role = 'boss' AND boss_id IS NULL)
      OR p_role = 'user'
    );
$$;

DROP FUNCTION IF EXISTS public.check_reverse_compatibility(INT, FLOAT, FLOAT, FLOAT, INT, INT, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.check_reverse_compatibility(
  p_match_request_id INT,
  p_age_range_min    INT,
  p_age_range_max    INT,
  p_all_girls        BOOLEAN,
  p_half_girls       BOOLEAN
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  v_req        match_requests%ROWTYPE;
  v_age        INT;
  v_gender     TEXT;
  v_females    INT := 0;
  v_nonfemales INT := 0;
BEGIN
  SELECT * INTO v_req FROM match_requests WHERE id = p_match_request_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  FOREACH v_age IN ARRAY v_req.ages LOOP
    IF v_age < p_age_range_min OR v_age > p_age_range_max THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  FOREACH v_gender IN ARRAY v_req.genders LOOP
    IF p_all_girls AND v_gender <> 'F' THEN
      RETURN FALSE;
    ELSIF p_half_girls THEN
      IF v_gender = 'F' THEN v_females    := v_females    + 1;
      ELSE                   v_nonfemales := v_nonfemales + 1;
      END IF;
    END IF;
  END LOOP;

  IF p_half_girls AND v_nonfemales > v_females THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

DROP FUNCTION IF EXISTS public.match_request(INT, TEXT, INT, INT, INT, INT, INT, INT, DOUBLE PRECISION, INT, INT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, BOOLEAN, BOOLEAN);

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
      'cost', ROUND(p_snapshot_pay_per_head * 1.20 + 200)
    );
  END IF;
END;
$$;

-- ================== ALTER adventures ==================

ALTER TABLE adventures
    ADD COLUMN IF NOT EXISTS space_id INT REFERENCES spaces(id) ON DELETE SET NULL;

-- Rebuild complete_match to carry space_id from match_requests into adventures
DROP FUNCTION IF EXISTS public.complete_match(TEXT, INT);

CREATE OR REPLACE FUNCTION public.complete_match(p_name TEXT, p_id INT) RETURNS public.adventures
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
    UPDATE match_requests SET is_active = TRUE WHERE id = p_id;
    RAISE EXCEPTION 'cannot start adventure without an expert in the lobby';
  END IF;

  INSERT INTO adventures (name, boss_id, category_id, organizer_id, user_ids, badge_id, space_id, room_key)
  VALUES (
    p_name,
    v_match.boss_id,
    v_match.category_id,
    v_match.org_id,
    v_match.user_ids,
    v_match.badge_id,
    v_match.space_id,
    (FLOOR(RANDOM() * 900000) + 100000)::INT
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- ================== ALTER events ==================

ALTER TABLE events
    DROP COLUMN IF EXISTS venue,
    DROP COLUMN IF EXISTS venue_link,
    ADD COLUMN IF NOT EXISTS slot_id INT REFERENCES slots(id) ON DELETE SET NULL;

ALTER TABLE events RENAME COLUMN is_boss_battle TO is_challenge;

-- Rebuild create_event with slot_id instead of venue columns
DROP FUNCTION IF EXISTS public.create_event(TEXT, TIMESTAMPTZ, TEXT, TEXT, INT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.create_event(
  p_activity TEXT,
  p_slot_id INT,
  p_adventure_id INT,
  p_instruction TEXT,
  p_is_challenge BOOLEAN
) RETURNS public.events
LANGUAGE plpgsql AS $$
DECLARE
  v_result events%ROWTYPE;
BEGIN
  IF EXISTS (
    SELECT 1 FROM events
    WHERE adventure_id = p_adventure_id AND is_challenge = TRUE
  ) THEN
    RAISE EXCEPTION 'cannot add events after the boss battle has been scheduled';
  END IF;

  INSERT INTO events (
    activity, slot_id, adventure_id,
    instruction, is_challenge
  )
  VALUES (
    p_activity, p_slot_id, p_adventure_id,
    p_instruction, p_is_challenge
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
