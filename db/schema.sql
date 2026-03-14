
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;














CREATE TYPE public.chat_role AS ENUM (
    'user',
    'boss',
    'organizer'
);








CREATE FUNCTION public.add_gems(p_id integer, p_gems integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_gems <= 0 THEN
    RAISE EXCEPTION 'gemsToAdd must be positive';
  END IF;
  UPDATE users SET gems = gems + p_gems WHERE id = p_id;
  RETURN TRUE;
END;
$$;








CREATE FUNCTION public.add_message(p_sender_id integer, p_sender_type text, p_adventure_id integer, p_message text) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO messages (sender_id, sender_type, adventure_id, message)
  VALUES (p_sender_id, p_sender_type, p_adventure_id, p_message);
$$;








CREATE FUNCTION public.apply_for_tournament(p_id integer, p_organizer_id integer) RETURNS boolean
    LANGUAGE sql
    AS $$
  SELECT TRUE;
$$;








CREATE FUNCTION public.authenticate(p_id integer, p_role text, p_access_token text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_token text;
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN FALSE;
  END IF;

  
  IF p_role = 'user' THEN
    SELECT access_token INTO v_token
    FROM users
    WHERE id = p_id;
    
    IF FOUND AND v_token = p_access_token THEN
      RETURN TRUE;
    END IF;
  END IF;

  
  IF p_role = 'organizer' THEN
    SELECT access_token INTO v_token
    FROM organizers
    WHERE id = p_id;
    
    IF FOUND AND v_token = p_access_token THEN
      RETURN TRUE;
    END IF;
  END IF;

  
  IF p_role = 'boss' THEN
    SELECT access_token INTO v_token
    FROM bosses
    WHERE id = p_id;
    
    IF FOUND AND v_token = p_access_token THEN
      RETURN TRUE;
    END IF;
  END IF;

  
  RETURN FALSE;
END;
$$;








CREATE FUNCTION public.calculate_age(dob date) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT EXTRACT(YEAR FROM age(NOW(), dob))::INT;
$$;




SET default_tablespace = '';

SET default_table_access_method = heap;





CREATE TABLE public.events (
    id integer NOT NULL,
    activity text NOT NULL,
    timing timestamp with time zone NOT NULL,
    venue text,
    venue_link text,
    adventure_id integer,
    instruction text,
    is_boss_battle boolean DEFAULT false,
    attendance integer[] DEFAULT '{}'::integer[] NOT NULL
);








CREATE FUNCTION public.change_attendance(p_event_id integer, p_attendance integer[]) RETURNS public.events
    LANGUAGE sql
    AS $$
  UPDATE events
  SET attendance = p_attendance
  WHERE id = p_event_id
  RETURNING *;
$$;








CREATE TABLE public.user_badges (
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    earned_at timestamp without time zone DEFAULT now()
);








CREATE FUNCTION public.check_badge(p_id integer, p_badge_id integer) RETURNS SETOF public.user_badges
    LANGUAGE sql
    AS $$
  SELECT * FROM user_badges
  WHERE user_id = p_id AND badge_id = p_badge_id;
$$;








CREATE TABLE public.adventures (
    id integer NOT NULL,
    name text NOT NULL,
    boss_id integer,
    category_id integer,
    organizer_id integer NOT NULL,
    user_ids integer[] DEFAULT '{}'::integer[],
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    room_key integer
);








CREATE FUNCTION public.complete_match(p_name text, p_id integer) RETURNS public.adventures
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_match  match_requests%ROWTYPE;
  v_result adventures%ROWTYPE;
BEGIN
  UPDATE match_requests
  SET is_active = FALSE
  WHERE id = p_id AND is_active = TRUE
  RETURNING * INTO v_match;

  INSERT INTO adventures (name, boss_id, category_id, organizer_id, user_ids, room_key)
  VALUES (
    p_name,
    v_match.boss_id,
    v_match.category_id,
    v_match.org_id,
    v_match.user_ids,
    (FLOOR(RANDOM() * 900000) + 100000)::INT
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;








CREATE FUNCTION public.count_messages(p_adventure_id integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*) FROM messages WHERE adventure_id = p_adventure_id;
$$;








CREATE FUNCTION public.count_notifications(p_receiver_id integer, p_receiver_role text) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*) FROM private_messages
  WHERE receiver_id = p_receiver_id AND receiver_role = p_receiver_role::chat_role;
$$;








CREATE FUNCTION public.create_event(p_activity text, p_timing timestamp with time zone, p_venue text, p_venue_link text, p_adventure_id integer, p_instruction text, p_is_boss_battle boolean) RETURNS public.events
    LANGUAGE sql
    AS $$
  INSERT INTO events (
    activity, timing, venue, venue_link, adventure_id,
    instruction, is_boss_battle
  )
  VALUES (
    p_activity, p_timing, p_venue, p_venue_link, p_adventure_id,
    p_instruction, p_is_boss_battle
  )
  RETURNING *;
$$;








CREATE TABLE public.match_requests (
    id integer NOT NULL,
    boss_id integer,
    org_id integer NOT NULL,
    category_id integer NOT NULL,
    match_radius integer,
    min_team_members integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    age_range_max integer,
    age_range_min integer,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    user_ids integer[],
    pay_per_head integer,
    pay_per_head_2 integer,
    all_girls boolean,
    half_girls boolean,
    ages integer[] DEFAULT '{}'::integer[],
    genders character varying(2)[] DEFAULT '{}'::character varying[],
    is_active boolean DEFAULT true,
    CONSTRAINT chk_min_team_members_range CHECK (((min_team_members >= 4) AND (min_team_members <= 8)))
);








CREATE FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_match_radius double precision, p_min_team_members integer, p_age_range_min integer, p_age_range_max integer, p_latitude double precision, p_longitude double precision, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean) RETURNS public.match_requests
    LANGUAGE plpgsql
    AS $$
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
      org_id, category_id, match_radius, min_team_members,
      age_range_min, age_range_max, latitude, longitude,
      pay_per_head, all_girls, half_girls, ages, genders
    )
    VALUES (
      p_org_id, p_category_id, p_match_radius, p_min_team_members,
      p_age_range_min, p_age_range_max, p_latitude, p_longitude,
      p_pay_per_head, p_all_girls, p_half_girls,
      ARRAY[v_age], ARRAY[v_gender]
    )
    RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;








CREATE FUNCTION public.create_pending_user(p_request_id text, p_name text, p_phone text, p_email text, p_dob text, p_gender text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO pending_users (request_id, name, phone, email, dob, gender, expires_at)
  VALUES (
    p_request_id, p_name, p_phone, p_email, p_dob, p_gender,
    NOW() + INTERVAL '5 minutes'
  )
  ON CONFLICT (request_id) DO UPDATE
    SET name       = EXCLUDED.name,
        phone      = EXCLUDED.phone,
        email      = EXCLUDED.email,
        dob        = EXCLUDED.dob,
        gender     = EXCLUDED.gender,
        expires_at = EXCLUDED.expires_at;

  RETURN p_request_id;
END;
$$;








CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    star_score integer DEFAULT 0 NOT NULL,
    gems integer DEFAULT 0 NOT NULL,
    access_token text,
    username text NOT NULL,
    bio text,
    gender text,
    setting_1 boolean DEFAULT false NOT NULL,
    setting_2 boolean DEFAULT false NOT NULL,
    penalties integer DEFAULT 0 NOT NULL,
    icon bytea,
    dob date,
    messages_read integer DEFAULT 0 NOT NULL,
    blocked boolean DEFAULT false,
    refreshed_at timestamp with time zone,
    level double precision DEFAULT 1.0,
    request_id text,
    CONSTRAINT users_penalties_check CHECK (((penalties >= 0) AND (penalties <= 4)))
);








CREATE FUNCTION public.create_user(p_name text, p_phone text, p_email text, p_dob date, p_gender text) RETURNS public.users
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_email_local TEXT;
  v_base        TEXT;
  v_username    TEXT;
  v_counter     INT := 1;
  v_user        users%ROWTYPE;
BEGIN
  v_email_local := SPLIT_PART(p_email, '@', 1);
  v_base := LOWER(
    REGEXP_REPLACE(
      COALESCE(NULLIF(v_email_local, ''), p_name, 'user'),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  v_base := TRIM(BOTH '-' FROM v_base);
  v_base := LEFT(v_base, 24);
  IF v_base = '' THEN v_base := 'user'; END IF;

  v_username := v_base;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = v_username);
    v_username := v_base || v_counter;
    v_counter  := v_counter + 1;
  END LOOP;

  INSERT INTO users (name, email, phone, gender, dob, username)
  VALUES (p_name, p_email, NULLIF(p_phone, ''), NULLIF(p_gender, ''), p_dob, v_username)
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;








CREATE FUNCTION public.current_match_request(p_id integer, p_role text) RETURNS SETOF public.match_requests
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN;
  END IF;

  
  IF p_role = 'user' THEN
    RETURN QUERY
    SELECT * FROM match_requests
    WHERE user_ids @> ARRAY[p_id] AND is_active = TRUE;
  END IF;

  
  IF p_role = 'organizer' THEN
    RETURN QUERY
    SELECT * FROM match_requests
    WHERE org_id = p_id AND is_active = TRUE;
  END IF;

  
  IF p_role = 'boss' THEN
    RETURN QUERY
    SELECT * FROM match_requests
    WHERE boss_id = p_id AND is_active = TRUE;
  END IF;
END;
$$;








CREATE FUNCTION public.deduct_gems(p_id integer, p_gems integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_current INT;
BEGIN
  IF p_gems <= 0 THEN
    RAISE EXCEPTION 'gemsToDeduct must be positive';
  END IF;

  SELECT gems INTO v_current FROM users WHERE id = p_id;

  IF v_current < p_gems THEN
    RAISE EXCEPTION 'Insufficient gems';
  END IF;

  UPDATE users SET gems = gems - p_gems WHERE id = p_id;
  RETURN TRUE;
END;
$$;








CREATE FUNCTION public.delete_user(p_id integer) RETURNS public.users
    LANGUAGE sql
    AS $$
  DELETE FROM users WHERE id = p_id RETURNING *;
$$;








CREATE FUNCTION public.file_count(p_adventure_id integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE adventure_id = p_adventure_id
    AND message LIKE '<|file|%';
$$;








CREATE TABLE public.pending_users (
    request_id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    dob text NOT NULL,
    gender text NOT NULL,
    expires_at timestamp with time zone NOT NULL
);








CREATE FUNCTION public.find_pending_user(p_request_id text) RETURNS public.pending_users
    LANGUAGE sql
    AS $$
  SELECT * FROM pending_users WHERE request_id = p_request_id;
$$;








CREATE FUNCTION public.find_user_by_phone(p_phone text) RETURNS public.users
    LANGUAGE sql
    AS $$
  SELECT * FROM users WHERE phone = p_phone;
$$;








CREATE FUNCTION public.get_active_adventures(p_id integer, p_role text) RETURNS SETOF public.adventures
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN;
  END IF;

  
  IF p_role = 'user' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = TRUE AND user_ids @> ARRAY[p_id]
    ORDER BY created_at DESC;
  END IF;

  
  IF p_role = 'organizer' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = TRUE AND organizer_id = p_id
    ORDER BY created_at DESC;
  END IF;

  
  IF p_role = 'boss' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = TRUE AND boss_id = p_id
    ORDER BY created_at DESC;
  END IF;
END;
$$;








CREATE FUNCTION public.get_adventure_of(p_event_id integer) RETURNS integer
    LANGUAGE sql
    AS $$
  SELECT adventure_id FROM events WHERE id = p_event_id;
$$;








CREATE FUNCTION public.get_adventures(p_id integer, p_role text, p_active boolean) RETURNS SETOF public.adventures
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN;
  END IF;

  
  IF p_role = 'user' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE user_ids @> ARRAY[p_id] AND is_active = p_active
    ORDER BY created_at DESC;
    RETURN;
  END IF;

  
  IF p_role = 'organizer' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE organizer_id = p_id AND is_active = p_active
    ORDER BY created_at DESC;
    RETURN;
  END IF;

  
  IF p_role = 'boss' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE boss_id = p_id AND is_active = p_active
    ORDER BY created_at DESC;
    RETURN;
  END IF;
END;
$$;








CREATE FUNCTION public.get_all_categories() RETURNS TABLE(category text)
    LANGUAGE sql
    AS $$
  SELECT DISTINCT category FROM categories;
$$;








CREATE TABLE public.offers (
    offer_name character varying(255),
    price double precision,
    gems integer
);








CREATE FUNCTION public.get_all_offers() RETURNS SETOF public.offers
    LANGUAGE sql
    AS $$
  SELECT * FROM offers;
$$;








CREATE TABLE public.categories (
    id integer NOT NULL,
    category character varying(255),
    sub_category character varying(255),
    icon bytea,
    word_2s character varying(50)[]
);








CREATE FUNCTION public.get_all_subcategories(p_category text) RETURNS SETOF public.categories
    LANGUAGE sql
    AS $$
  SELECT * FROM categories WHERE category = p_category;
$$;








CREATE TABLE public.bosses (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    credits integer DEFAULT 0 NOT NULL,
    username text NOT NULL,
    setting_1 boolean,
    setting_2 boolean,
    password text NOT NULL,
    access_token character varying(255),
    dob date,
    gender character varying(10),
    icon bytea,
    messages_read integer DEFAULT 0 NOT NULL,
    refreshed_at timestamp with time zone,
    bio character varying(1000)
);








CREATE FUNCTION public.get_boss(p_id integer) RETURNS public.bosses
    LANGUAGE sql
    AS $$
  SELECT * FROM bosses WHERE id = p_id;
$$;








CREATE FUNCTION public.get_boss_by_email(p_email text) RETURNS public.bosses
    LANGUAGE sql
    AS $$
  SELECT * FROM bosses WHERE email = p_email;
$$;








CREATE FUNCTION public.get_compatible_requests(p_role text, p_category_id integer, p_age integer, p_latitude double precision, p_longitude double precision, p_gender text) RETURNS SETOF public.match_requests
    LANGUAGE sql
    AS $$
  SELECT * FROM match_requests
  WHERE
    category_id = p_category_id
    AND age_range_min <= p_age
    AND age_range_max >= p_age
    AND (
      6371 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(p_latitude - latitude) / 2), 2) +
        COS(RADIANS(latitude)) * COS(RADIANS(p_latitude)) *
        POWER(SIN(RADIANS(p_longitude - longitude) / 2), 2)
      ))
    ) <= match_radius
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








CREATE FUNCTION public.get_event(p_event_id integer) RETURNS public.events
    LANGUAGE sql
    AS $$
  SELECT * FROM events WHERE id = p_event_id;
$$;








CREATE FUNCTION public.get_inactive_adventures(p_id integer, p_role text, p_a integer, p_b integer) RETURNS SETOF public.adventures
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN;
  END IF;

  
  IF p_role = 'user' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = FALSE AND user_ids @> ARRAY[p_id]
    ORDER BY created_at DESC
    LIMIT p_b OFFSET p_a;
  END IF;

  
  IF p_role = 'organizer' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = FALSE AND organizer_id = p_id
    ORDER BY created_at DESC
    LIMIT p_b OFFSET p_a;
  END IF;

  
  IF p_role = 'boss' THEN
    RETURN QUERY
    SELECT * FROM adventures
    WHERE is_active = FALSE AND boss_id = p_id
    ORDER BY created_at DESC
    LIMIT p_b OFFSET p_a;
  END IF;
END;
$$;








CREATE TABLE public.messages (
    id integer NOT NULL,
    message character varying(250) NOT NULL,
    sender_id integer NOT NULL,
    adventure_id integer NOT NULL,
    sender_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['user'::text, 'boss'::text, 'organizer'::text])))
);








CREATE FUNCTION public.get_messages_from_a_to_b(p_adventure_id integer, p_offset integer, p_limit integer) RETURNS SETOF public.messages
    LANGUAGE sql
    AS $$
  SELECT *
  FROM messages
  WHERE adventure_id = p_adventure_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;








CREATE TABLE public.private_messages (
    id bigint NOT NULL,
    sender_id integer NOT NULL,
    sender_role public.chat_role NOT NULL,
    receiver_id integer NOT NULL,
    receiver_role public.chat_role NOT NULL,
    message text NOT NULL,
    sent_at timestamp without time zone DEFAULT now()
);








CREATE FUNCTION public.get_notifications(p_receiver_id integer, p_receiver_role text, p_a integer, p_b integer) RETURNS SETOF public.private_messages
    LANGUAGE sql
    AS $$
  SELECT * FROM private_messages
  WHERE receiver_id = p_receiver_id AND receiver_role = p_receiver_role::chat_role
  ORDER BY sent_at DESC
  LIMIT p_b OFFSET p_a;
$$;








CREATE TABLE public.organizers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    credits integer DEFAULT 0 NOT NULL,
    username text NOT NULL,
    access_token character varying(255),
    dob date,
    gender character varying(10),
    setting_1 boolean,
    setting_2 boolean,
    icon bytea,
    password text NOT NULL,
    messages_read integer DEFAULT 0 NOT NULL,
    refreshed_at timestamp with time zone,
    bio character varying(1000)
);








CREATE FUNCTION public.get_organizer(p_id integer) RETURNS public.organizers
    LANGUAGE sql
    AS $$
  SELECT * FROM organizers WHERE id = p_id;
$$;








CREATE FUNCTION public.get_organizer_by_email(p_email text) RETURNS public.organizers
    LANGUAGE sql
    AS $$
  SELECT * FROM organizers WHERE email = p_email;
$$;








CREATE FUNCTION public.get_pending_user(p_phone text) RETURNS public.pending_users
    LANGUAGE sql
    AS $$
  SELECT * FROM pending_users WHERE phone = p_phone;
$$;








CREATE TABLE public.polls (
    adventure_id integer NOT NULL,
    poll_number integer NOT NULL,
    question character varying(1000) NOT NULL,
    options character varying(100)[] DEFAULT '{}'::character varying(100)[] NOT NULL,
    votes character varying(50)[] DEFAULT '{}'::character varying(50)[] NOT NULL
);








CREATE FUNCTION public.get_poll(p_adventure_id integer, p_poll_number integer) RETURNS public.polls
    LANGUAGE sql
    AS $$
  SELECT * FROM polls
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number;
$$;








CREATE TABLE public.boss_qualifications (
    boss_id integer NOT NULL,
    badge_id integer NOT NULL
);








CREATE FUNCTION public.get_qualification(p_boss_id integer) RETURNS SETOF public.boss_qualifications
    LANGUAGE sql
    AS $$
  SELECT * FROM boss_qualifications WHERE boss_id = p_boss_id;
$$;








CREATE TABLE public.results (
    adventure_id integer NOT NULL,
    result_number integer NOT NULL,
    badge_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    user_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    star_scores smallint[] DEFAULT '{}'::smallint[] NOT NULL,
    remarks character varying(500)[] DEFAULT '{}'::character varying(500)[] NOT NULL
);








CREATE FUNCTION public.get_result(p_adventure_id integer, p_result_number integer) RETURNS public.results
    LANGUAGE sql
    AS $$
  SELECT * FROM results
  WHERE adventure_id = p_adventure_id AND result_number = p_result_number;
$$;








CREATE FUNCTION public.get_user(p_id integer) RETURNS public.users
    LANGUAGE sql
    AS $$
  SELECT * FROM users WHERE id = p_id;
$$;








CREATE FUNCTION public.get_word2s(p_id integer) RETURNS public.categories
    LANGUAGE sql
    AS $$
  SELECT * FROM categories WHERE id = p_id;
$$;








CREATE FUNCTION public.insert_poll(p_adventure_id integer, p_question text, p_options text[]) RETURNS integer
    LANGUAGE sql
    AS $$
  INSERT INTO polls (adventure_id, question, options, votes, poll_number)
  SELECT
    p_adventure_id,
    p_question,
    p_options,
    ARRAY(SELECT '[]'::jsonb FROM unnest(p_options)),
    COALESCE(MAX(poll_number), 0) + 1
  FROM polls
  WHERE adventure_id = p_adventure_id
  RETURNING poll_number;
$$;








CREATE FUNCTION public.insert_result(p_adventure_id integer, p_badge_ids integer[], p_user_ids integer[], p_star_scores integer[], p_remarks text[]) RETURNS integer
    LANGUAGE sql
    AS $$
  INSERT INTO results (adventure_id, badge_ids, user_ids, star_scores, remarks, result_number)
  SELECT
    p_adventure_id,
    p_badge_ids,
    p_user_ids,
    p_star_scores,
    p_remarks,
    COALESCE(MAX(result_number), 0) + 1
  FROM results
  WHERE adventure_id = p_adventure_id
  RETURNING result_number;
$$;








CREATE FUNCTION public.is_related_to_adventure(p_id integer, p_role text, p_adventure_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_adventure adventures%ROWTYPE;
BEGIN
  SELECT * INTO v_adventure
  FROM adventures
  WHERE is_active = TRUE AND id = p_adventure_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF p_role = 'organizer' THEN
    RETURN v_adventure.organizer_id = p_id;
  ELSIF p_role = 'boss' THEN
    RETURN v_adventure.boss_id = p_id;
  ELSE
    RETURN p_id = ANY(v_adventure.user_ids);
  END IF;
END;
$$;








CREATE FUNCTION public.logout(p_id integer, p_role text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN FALSE;
  END IF;

  
  IF p_role = 'user' THEN
    UPDATE users
    SET access_token = NULL
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  
  IF p_role = 'organizer' THEN
    UPDATE organizers
    SET access_token = NULL
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  
  IF p_role = 'boss' THEN
    UPDATE bosses
    SET access_token = NULL
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  RETURN FALSE;
END;
$$;








CREATE FUNCTION public.match_request(p_id integer, p_role text, p_min_team_members integer, p_age_range_min integer, p_age_range_max integer, p_pay_per_head2 double precision, p_snapshot_id integer, p_snapshot_boss_id integer, p_snapshot_org_id integer, p_snapshot_category_id integer, p_snapshot_match_radius double precision, p_snapshot_min_team integer, p_snapshot_age_min integer, p_snapshot_age_max integer, p_snapshot_latitude double precision, p_snapshot_longitude double precision, p_snapshot_pay_per_head double precision, p_snapshot_pay_per_head2 double precision, p_snapshot_all_girls boolean, p_snapshot_half_girls boolean) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_dob      DATE;
  v_gender   TEXT;
  v_setting1 BOOLEAN;
  v_setting2 BOOLEAN;
  v_age      INT;
  v_table    TEXT;
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
    boss_id          = CASE WHEN p_role = 'boss' THEN p_id ELSE boss_id END,
    user_ids         = CASE WHEN p_role = 'user' THEN array_append(user_ids, p_id) ELSE user_ids END,
    genders          = array_append(genders, v_gender),
    ages             = array_append(ages, v_age),
    min_team_members = GREATEST(min_team_members, p_min_team_members),
    age_range_min    = LEAST(age_range_min, p_age_range_min),
    age_range_max    = GREATEST(age_range_max, p_age_range_max),
    all_girls        = (all_girls OR v_setting1),
    half_girls       = (half_girls OR v_setting2),
    pay_per_head_2   = CASE WHEN p_role = 'boss' THEN p_pay_per_head2 ELSE pay_per_head_2 END
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
    AND pay_per_head_2 IS NOT DISTINCT FROM p_snapshot_pay_per_head2
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
      'cost', ROUND((p_snapshot_pay_per_head + p_snapshot_pay_per_head2) * 1.25)
    );
  END IF;
END;
$$;








CREATE TABLE public.tournaments (
    id integer NOT NULL,
    name text,
    user_ids integer[] DEFAULT '{}'::integer[],
    badge_id integer,
    prize_1 integer,
    prize_2 integer,
    prize_3 integer,
    sponsored_by text,
    venue text,
    timing timestamp without time zone,
    instructions text,
    third_party_reward_detail text,
    org_ids integer[] DEFAULT '{}'::integer[],
    boss_ids integer[] DEFAULT '{}'::integer[]
);








CREATE FUNCTION public.purchase_ticket(p_id integer, p_user_id integer) RETURNS public.tournaments
    LANGUAGE sql
    AS $$
  UPDATE tournaments
  SET user_ids = array_append(user_ids, p_user_id)
  WHERE id = p_id
  RETURNING *;
$$;








CREATE FUNCTION public.remove_pending_user(p_request_id text) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM pending_users WHERE request_id = p_request_id;
$$;








CREATE FUNCTION public.reward_badge(p_id integer, p_badge_id integer) RETURNS public.user_badges
    LANGUAGE sql
    AS $$
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_id, p_badge_id)
  RETURNING *;
$$;








CREATE FUNCTION public.room_available(p_room_name text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_adventure_id INT;
  v_room_key     INT;
BEGIN
  v_adventure_id := SPLIT_PART(p_room_name, '_', 1)::INT;
  v_room_key     := SPLIT_PART(p_room_name, '_', 2)::INT;

  RETURN EXISTS (
    SELECT 1 FROM adventures
    WHERE is_active = TRUE
      AND id = v_adventure_id
      AND room_key = v_room_key
  );
END;
$$;








CREATE FUNCTION public.send_notification(p_sender_id integer, p_sender_role text, p_message text, p_receiver_id integer, p_receiver_role text) RETURNS public.private_messages
    LANGUAGE sql
    AS $$
  INSERT INTO private_messages (sender_id, sender_role, receiver_id, receiver_role, message)
  VALUES (p_sender_id, p_sender_role::chat_role, p_receiver_id, p_receiver_role::chat_role, p_message)
  RETURNING *;
$$;








CREATE FUNCTION public.update_access_token(p_id integer, p_role text, p_new_access_token text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN FALSE;
  END IF;

  
  IF p_role = 'user' THEN
    UPDATE users
    SET access_token = p_new_access_token
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  
  IF p_role = 'organizer' THEN
    UPDATE organizers
    SET access_token = p_new_access_token
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  
  IF p_role = 'boss' THEN
    UPDATE bosses
    SET access_token = p_new_access_token
    WHERE id = p_id;
    RETURN FOUND;
  END IF;

  RETURN FALSE;
END;
$$;








CREATE FUNCTION public.update_boss(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon bytea DEFAULT NULL::bytea) RETURNS public.bosses
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE bosses
  SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;

  RETURN (SELECT * FROM bosses WHERE id = p_id);
END;
$$;








CREATE FUNCTION public.update_organizer(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon bytea DEFAULT NULL::bytea) RETURNS public.organizers
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE organizers
  SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;

  RETURN (SELECT * FROM organizers WHERE id = p_id);
END;
$$;








CREATE FUNCTION public.update_poll_add_vote(p_adventure_id integer, p_poll_number integer, p_option_index integer, p_person_key text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_votes JSONB[];
BEGIN
  SELECT votes INTO v_votes
  FROM polls
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  
  IF v_votes[p_option_index + 1] @> to_jsonb(p_person_key) THEN
    RETURN;
  END IF;

  v_votes[p_option_index + 1] := v_votes[p_option_index + 1] || to_jsonb(p_person_key);

  UPDATE polls
  SET votes = v_votes
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number;
END;
$$;








CREATE FUNCTION public.update_poll_remove_vote(p_adventure_id integer, p_poll_number integer, p_option_index integer, p_person_key text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_votes     JSONB[];
  v_new_array JSONB;
BEGIN
  SELECT votes INTO v_votes
  FROM polls
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF v_votes[p_option_index + 1] IS NULL THEN
    RETURN;
  END IF;

  SELECT jsonb_agg(elem)
  INTO v_new_array
  FROM jsonb_array_elements(v_votes[p_option_index + 1]) AS elem
  WHERE elem <> to_jsonb(p_person_key);

  v_votes[p_option_index + 1] := COALESCE(v_new_array, '[]'::jsonb);

  UPDATE polls
  SET votes = v_votes
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number;
END;
$$;








CREATE FUNCTION public.update_user(p_id integer, p_username text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_icon bytea DEFAULT NULL::bytea) RETURNS public.users
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
  SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon      = COALESCE(p_icon,     icon)
  WHERE id = p_id;

  RETURN (SELECT * FROM users WHERE id = p_id);
END;
$$;








CREATE FUNCTION public.update_user_request_id(p_phone text, p_request_id text) RETURNS public.users
    LANGUAGE sql
    AS $$
  UPDATE users
  SET request_id = p_request_id
  WHERE phone = p_phone
  RETURNING *;
$$;








CREATE SEQUENCE public.adventures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.adventures_id_seq OWNED BY public.adventures.id;






CREATE TABLE public.badges (
    id integer NOT NULL,
    title character varying(255),
    category_id integer,
    icon bytea,
    league smallint,
    description character varying(1024)
);








CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;






CREATE SEQUENCE public.bosses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.bosses_id_seq OWNED BY public.bosses.id;






CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;






CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;






CREATE SEQUENCE public.match_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.match_request_id_seq OWNED BY public.match_requests.id;






CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;






CREATE SEQUENCE public.organizers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.organizers_id_seq OWNED BY public.organizers.id;






CREATE SEQUENCE public.private_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.private_messages_id_seq OWNED BY public.private_messages.id;






CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;






CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;








ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;






ALTER TABLE ONLY public.adventures ALTER COLUMN id SET DEFAULT nextval('public.adventures_id_seq'::regclass);






ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);






ALTER TABLE ONLY public.bosses ALTER COLUMN id SET DEFAULT nextval('public.bosses_id_seq'::regclass);






ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);






ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);






ALTER TABLE ONLY public.match_requests ALTER COLUMN id SET DEFAULT nextval('public.match_request_id_seq'::regclass);






ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);






ALTER TABLE ONLY public.organizers ALTER COLUMN id SET DEFAULT nextval('public.organizers_id_seq'::regclass);






ALTER TABLE ONLY public.private_messages ALTER COLUMN id SET DEFAULT nextval('public.private_messages_id_seq'::regclass);






ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);






ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);






ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.bosses
    ADD CONSTRAINT bosses_email_key UNIQUE (email);






ALTER TABLE ONLY public.bosses
    ADD CONSTRAINT bosses_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT match_request_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_email_key UNIQUE (email);






ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.pending_users
    ADD CONSTRAINT pending_users_pkey PRIMARY KEY (request_id);






ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);






ALTER TABLE ONLY public.polls
    ADD CONSTRAINT unique_poll_per_adventure UNIQUE (adventure_id, poll_number);






ALTER TABLE ONLY public.results
    ADD CONSTRAINT unique_result_per_adventure UNIQUE (adventure_id, result_number);






ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT uq_boss_badge UNIQUE (boss_id, badge_id);






ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);






ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);






ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);






CREATE INDEX idx_events_adventure ON public.events USING btree (adventure_id);






CREATE INDEX idx_inbox_latest ON public.private_messages USING btree (receiver_id, receiver_role, sent_at DESC);






CREATE INDEX idx_pending_users_expires ON public.pending_users USING btree (expires_at);






CREATE INDEX idx_sent_latest ON public.private_messages USING btree (sender_id, sender_role, sent_at DESC);






ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_boss_id_fkey FOREIGN KEY (boss_id) REFERENCES public.bosses(id) ON DELETE SET NULL;






ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_adventure_id_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id) ON DELETE SET NULL;






ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_adventure FOREIGN KEY (adventure_id) REFERENCES public.adventures(id);






ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT fk_adventure FOREIGN KEY (badge_id) REFERENCES public.badges(id);






ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT fk_adventure_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id);






ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT fk_badge FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;






ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_badge FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;






ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT fk_boss FOREIGN KEY (boss_id) REFERENCES public.bosses(id) ON DELETE CASCADE;






ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_boss FOREIGN KEY (boss_id) REFERENCES public.bosses(id);






ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT fk_categories FOREIGN KEY (category_id) REFERENCES public.categories(id);






ALTER TABLE ONLY public.badges
    ADD CONSTRAINT fk_categories FOREIGN KEY (category_id) REFERENCES public.categories(id);






ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.categories(id);






ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES public.organizers(id);






ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;






ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_adventure_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id) ON UPDATE CASCADE ON DELETE CASCADE;






ALTER TABLE ONLY public.results
    ADD CONSTRAINT polls_adventure_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id);



