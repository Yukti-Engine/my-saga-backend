--
-- PostgreSQL database dump
--

\restrict RT1hra8XZH7zcQdCfVwUwEneRJ3d5zXR7BQGE1NncmnhajrRzsagCIah0u2gjrK

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.6

-- Started on 2026-05-27 15:27:47

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

--
-- TOC entry 1106 (class 1247 OID 17555)
-- Name: book_status; Type: TYPE; Schema: public; Owner: user1
--

CREATE TYPE public.book_status AS ENUM (
    'Completed',
    'Writing'
);


ALTER TYPE public.book_status OWNER TO user1;

--
-- TOC entry 1049 (class 1247 OID 16573)
-- Name: chat_role; Type: TYPE; Schema: public; Owner: user1
--

CREATE TYPE public.chat_role AS ENUM (
    'user',
    'boss',
    'organizer'
);


ALTER TYPE public.chat_role OWNER TO user1;

--
-- TOC entry 288 (class 1255 OID 18035)
-- Name: accept_legal_boss(integer, boolean, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.accept_legal_boss(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE bosses SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION public.accept_legal_boss(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 312 (class 1255 OID 18040)
-- Name: accept_legal_on_approval(text, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.accept_legal_on_approval(p_role text, p_id integer, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_role = 'organizer' THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                          privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
    WHERE id = p_id;
  ELSIF p_role = 'boss' THEN
    UPDATE bosses SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                      privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
    WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION public.accept_legal_on_approval(p_role text, p_id integer, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 402 (class 1255 OID 18034)
-- Name: accept_legal_organizer(integer, boolean, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.accept_legal_organizer(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE organizers SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE organizers SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION public.accept_legal_organizer(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 427 (class 1255 OID 18033)
-- Name: accept_legal_user(integer, boolean, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.accept_legal_user(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF p_accept_terms AND p_accept_privacy THEN
    UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(), privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_terms THEN
    UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW() WHERE id = p_id;
  ELSIF p_accept_privacy THEN
    UPDATE users SET privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW() WHERE id = p_id;
  END IF;
END;
$$;


ALTER FUNCTION public.accept_legal_user(p_id integer, p_accept_terms boolean, p_accept_privacy boolean, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 428 (class 1255 OID 18039)
-- Name: accept_legal_user_by_phone(text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.accept_legal_user_by_phone(p_phone text, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users SET terms_accepted_version = p_terms_version, terms_accepted_at = NOW(),
                   privacy_accepted_version = p_privacy_version, privacy_accepted_at = NOW()
  WHERE phone = p_phone;
END;
$$;


ALTER FUNCTION public.accept_legal_user_by_phone(p_phone text, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 411 (class 1255 OID 16711)
-- Name: add_message(integer, text, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.add_message(p_sender_id integer, p_sender_type text, p_adventure_id integer, p_message text) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO messages (sender_id, sender_type, adventure_id, message)
  VALUES (p_sender_id, p_sender_type, p_adventure_id, p_message);
$$;


ALTER FUNCTION public.add_message(p_sender_id integer, p_sender_type text, p_adventure_id integer, p_message text) OWNER TO user1;

--
-- TOC entry 365 (class 1255 OID 18407)
-- Name: admin_create_space(text, text, numeric, numeric); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_create_space(p_name text, p_link text, p_lat numeric, p_long numeric) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE v_id INT;
BEGIN
  INSERT INTO spaces (name, link, lat, long)
  VALUES (p_name, p_link, p_lat, p_long)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.admin_create_space(p_name text, p_link text, p_lat numeric, p_long numeric) OWNER TO user1;

--
-- TOC entry 384 (class 1255 OID 18404)
-- Name: admin_create_theme(text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_create_theme(p_name text, p_description text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE v_id INT;
BEGIN
  INSERT INTO themes (name, description)
  VALUES (p_name, p_description)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.admin_create_theme(p_name text, p_description text) OWNER TO user1;

--
-- TOC entry 280 (class 1255 OID 18403)
-- Name: admin_delete_badge(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_delete_badge(p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM badges WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_delete_badge(p_id integer) OWNER TO user1;

--
-- TOC entry 304 (class 1255 OID 18401)
-- Name: admin_delete_category(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_delete_category(p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM categories WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_delete_category(p_id integer) OWNER TO user1;

--
-- TOC entry 337 (class 1255 OID 18410)
-- Name: admin_delete_space(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_delete_space(p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM spaces WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_delete_space(p_id integer) OWNER TO user1;

--
-- TOC entry 380 (class 1255 OID 18406)
-- Name: admin_delete_theme(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_delete_theme(p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM themes WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_delete_theme(p_id integer) OWNER TO user1;

--
-- TOC entry 327 (class 1255 OID 18412)
-- Name: admin_get_space_categories(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_get_space_categories(p_space_id integer) RETURNS TABLE(category_id integer, category text, subcategory text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT c.id, c.category::TEXT, c.subcategory::TEXT
    FROM space_category_relations scr
    JOIN categories c ON c.id = scr.category_id
    WHERE scr.space_id = p_space_id
    ORDER BY c.id;
END;
$$;


ALTER FUNCTION public.admin_get_space_categories(p_space_id integer) OWNER TO user1;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 260 (class 1259 OID 18105)
-- Name: spaces; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.spaces (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    link text,
    lat numeric(9,6),
    long numeric(9,6)
);


ALTER TABLE public.spaces OWNER TO user1;

--
-- TOC entry 379 (class 1255 OID 18408)
-- Name: admin_list_spaces(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_list_spaces() RETURNS SETOF public.spaces
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM spaces ORDER BY id;
END;
$$;


ALTER FUNCTION public.admin_list_spaces() OWNER TO user1;

--
-- TOC entry 397 (class 1255 OID 18411)
-- Name: admin_set_space_categories(integer, integer[]); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_set_space_categories(p_space_id integer, p_category_ids integer[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM space_category_relations WHERE space_id = p_space_id;
  INSERT INTO space_category_relations (space_id, category_id)
  SELECT p_space_id, unnest(p_category_ids);
END;
$$;


ALTER FUNCTION public.admin_set_space_categories(p_space_id integer, p_category_ids integer[]) OWNER TO user1;

--
-- TOC entry 314 (class 1255 OID 18402)
-- Name: admin_update_badge(integer, text, integer, smallint, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_update_badge(p_id integer, p_title text, p_category_id integer, p_league smallint, p_description text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE badges
  SET title       = COALESCE(p_title, title),
      category_id = COALESCE(p_category_id, category_id),
      league      = COALESCE(p_league, league),
      description = COALESCE(p_description, description)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_update_badge(p_id integer, p_title text, p_category_id integer, p_league smallint, p_description text) OWNER TO user1;

--
-- TOC entry 425 (class 1255 OID 18400)
-- Name: admin_update_category(integer, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_update_category(p_id integer, p_category text, p_subcategory text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE categories
  SET category = COALESCE(p_category, category),
      subcategory = COALESCE(p_subcategory, subcategory)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_update_category(p_id integer, p_category text, p_subcategory text) OWNER TO user1;

--
-- TOC entry 400 (class 1255 OID 18409)
-- Name: admin_update_space(integer, text, text, numeric, numeric); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_update_space(p_id integer, p_name text, p_link text, p_lat numeric, p_long numeric) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE spaces
  SET name = COALESCE(p_name, name),
      link = COALESCE(p_link, link),
      lat  = COALESCE(p_lat, lat),
      long = COALESCE(p_long, long)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_update_space(p_id integer, p_name text, p_link text, p_lat numeric, p_long numeric) OWNER TO user1;

--
-- TOC entry 376 (class 1255 OID 18405)
-- Name: admin_update_theme(integer, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.admin_update_theme(p_id integer, p_name text, p_description text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE themes
  SET name        = COALESCE(p_name, name),
      description = COALESCE(p_description, description)
  WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.admin_update_theme(p_id integer, p_name text, p_description text) OWNER TO user1;

--
-- TOC entry 414 (class 1255 OID 16712)
-- Name: apply_for_tournament(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.apply_for_tournament(p_id integer, p_organizer_id integer) RETURNS boolean
    LANGUAGE sql
    AS $$
  SELECT TRUE;
$$;


ALTER FUNCTION public.apply_for_tournament(p_id integer, p_organizer_id integer) OWNER TO user1;

--
-- TOC entry 289 (class 1255 OID 18390)
-- Name: apply_stat_changes(integer, double precision, double precision, double precision, double precision, double precision); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.apply_stat_changes(p_user_id integer, p_intellect double precision, p_drive double precision, p_adaptability double precision, p_empathy double precision, p_creativity double precision) RETURNS TABLE(intellect_index double precision, drive_index double precision, adaptability_index double precision, empathy_index double precision, creativity_index double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    UPDATE users SET
      intellect_index    = LEAST(GREATEST(users.intellect_index    * p_intellect, 0), 100),
      drive_index        = LEAST(GREATEST(users.drive_index        * p_drive, 0), 100),
      adaptability_index = LEAST(GREATEST(users.adaptability_index * p_adaptability, 0), 100),
      empathy_index      = LEAST(GREATEST(users.empathy_index      * p_empathy, 0), 100),
      creativity_index   = LEAST(GREATEST(users.creativity_index   * p_creativity, 0), 100)
    WHERE id = p_user_id
    RETURNING users.intellect_index, users.drive_index, users.adaptability_index,
              users.empathy_index, users.creativity_index;
END;
$$;


ALTER FUNCTION public.apply_stat_changes(p_user_id integer, p_intellect double precision, p_drive double precision, p_adaptability double precision, p_empathy double precision, p_creativity double precision) OWNER TO user1;

--
-- TOC entry 404 (class 1255 OID 16713)
-- Name: authenticate(integer, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.authenticate(p_id integer, p_role text, p_access_token text) OWNER TO user1;

--
-- TOC entry 265 (class 1259 OID 18160)
-- Name: slots; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.slots (
    id integer NOT NULL,
    space_id integer NOT NULL,
    duration_in_hours integer NOT NULL,
    datetime timestamp with time zone NOT NULL,
    CONSTRAINT slots_duration_in_hours_check CHECK ((duration_in_hours > 0))
);


ALTER TABLE public.slots OWNER TO user1;

--
-- TOC entry 351 (class 1255 OID 18394)
-- Name: book_slot(integer, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.book_slot(p_space_id integer, p_datetime timestamp with time zone, p_duration integer) RETURNS public.slots
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.book_slot(p_space_id integer, p_datetime timestamp with time zone, p_duration integer) OWNER TO user1;

--
-- TOC entry 283 (class 1255 OID 17645)
-- Name: bump_limitation(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.bump_limitation(p_org_id integer) RETURNS integer
    LANGUAGE sql
    AS $$
  UPDATE organizers
  SET max_team_members_limitation = max_team_members_limitation + 1
  WHERE id = p_org_id AND max_team_members_limitation < 20
  RETURNING max_team_members_limitation;
$$;


ALTER FUNCTION public.bump_limitation(p_org_id integer) OWNER TO user1;

--
-- TOC entry 323 (class 1255 OID 16714)
-- Name: calculate_age(date); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.calculate_age(dob date) RETURNS integer
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT EXTRACT(YEAR FROM age(NOW(), dob))::INT;
$$;


ALTER FUNCTION public.calculate_age(dob date) OWNER TO user1;

--
-- TOC entry 227 (class 1259 OID 16648)
-- Name: events; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.events (
    id integer NOT NULL,
    activity text NOT NULL,
    adventure_id integer,
    instruction text,
    is_challenge boolean DEFAULT false,
    attendance integer[] DEFAULT '{}'::integer[] NOT NULL,
    slot_id integer,
    stats_delta character varying(5)[],
    summarized boolean,
    summary text
);


ALTER TABLE public.events OWNER TO user1;

--
-- TOC entry 333 (class 1255 OID 16715)
-- Name: change_attendance(integer, integer[]); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.change_attendance(p_event_id integer, p_attendance integer[]) RETURNS public.events
    LANGUAGE sql
    AS $$
  UPDATE events
  SET attendance = p_attendance
  WHERE id = p_event_id
  RETURNING *;
$$;


ALTER FUNCTION public.change_attendance(p_event_id integer, p_attendance integer[]) OWNER TO user1;

--
-- TOC entry 374 (class 1255 OID 18180)
-- Name: check_reverse_compatibility(integer, integer, integer, boolean, boolean); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.check_reverse_compatibility(p_match_request_id integer, p_age_range_min integer, p_age_range_max integer, p_all_girls boolean, p_half_girls boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION public.check_reverse_compatibility(p_match_request_id integer, p_age_range_min integer, p_age_range_max integer, p_all_girls boolean, p_half_girls boolean) OWNER TO user1;

--
-- TOC entry 405 (class 1255 OID 18036)
-- Name: check_signup_link(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.check_signup_link(p_token text) RETURNS TABLE(role text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT sl.role::TEXT FROM signup_links sl WHERE sl.token = p_token AND sl.used_at IS NULL AND sl.expires_at > NOW();
END;
$$;


ALTER FUNCTION public.check_signup_link(p_token text) OWNER TO user1;

--
-- TOC entry 429 (class 1255 OID 16921)
-- Name: cleanup_expired_pending_users(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.cleanup_expired_pending_users() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM pending_users 
    WHERE expires_at < NOW();
    
    RETURN 'Cleanup completed.';
END;
$$;


ALTER FUNCTION public.cleanup_expired_pending_users() OWNER TO user1;

--
-- TOC entry 363 (class 1255 OID 18030)
-- Name: cleanup_expired_signup_links(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.cleanup_expired_signup_links() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM signup_links WHERE expires_at < NOW() AND used_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_signup_links() OWNER TO user1;

--
-- TOC entry 250 (class 1259 OID 17656)
-- Name: tickets; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_tickets_status CHECK ((status = ANY (ARRAY['open'::text, 'approved'::text, 'rejected'::text, 'closed'::text]))),
    CONSTRAINT chk_tickets_type CHECK ((type = ANY (ARRAY['organizer_join_request'::text, 'report_user'::text, 'report_organizer'::text, 'report_boss'::text])))
);


ALTER TABLE public.tickets OWNER TO user1;

--
-- TOC entry 346 (class 1255 OID 18032)
-- Name: cleanup_resolved_tickets(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.cleanup_resolved_tickets() RETURNS SETOF public.tickets
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    DELETE FROM tickets
    WHERE status = 'closed'
      AND resolved_at < NOW() - INTERVAL '90 days'
    RETURNING *;
END;
$$;


ALTER FUNCTION public.cleanup_resolved_tickets() OWNER TO user1;

--
-- TOC entry 409 (class 1255 OID 18031)
-- Name: cleanup_stale_pending_signups(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.cleanup_stale_pending_signups() RETURNS TABLE(kyc_folder text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    DELETE FROM pending_signups
    WHERE submitted_at < NOW() - INTERVAL '60 days'
    RETURNING pending_signups.kyc_folder::TEXT;
END;
$$;


ALTER FUNCTION public.cleanup_stale_pending_signups() OWNER TO user1;

--
-- TOC entry 370 (class 1255 OID 18094)
-- Name: close_own_ticket(integer, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.close_own_ticket(p_ticket_id integer, p_reporter_id integer, p_reporter_role text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$

BEGIN
  UPDATE tickets
  SET status = 'closed', updated_at = NOW()
  WHERE id = p_ticket_id
    AND status = 'open'
    AND (payload->>'reporterId')::int = p_reporter_id
    AND payload->>'reporterRole' = p_reporter_role;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.close_own_ticket(p_ticket_id integer, p_reporter_id integer, p_reporter_role text) OWNER TO user1;

--
-- TOC entry 228 (class 1259 OID 16659)
-- Name: adventures; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.adventures (
    id integer NOT NULL,
    name text NOT NULL,
    boss_id integer,
    category_id integer,
    organizer_id integer NOT NULL,
    user_ids integer[] DEFAULT '{}'::integer[],
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    room_key integer,
    badge_id integer,
    space_id integer
);


ALTER TABLE public.adventures OWNER TO user1;

--
-- TOC entry 324 (class 1255 OID 18187)
-- Name: complete_match(text, integer); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.complete_match(p_name text, p_id integer) OWNER TO user1;

--
-- TOC entry 290 (class 1255 OID 17718)
-- Name: consume_signup_link(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.consume_signup_link(p_token text) RETURNS TABLE(role text, email text, kyc_folder text)
    LANGUAGE sql
    AS $$
  UPDATE signup_links
  SET used_at = now()
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now()
  RETURNING signup_links.role, signup_links.email, signup_links.kyc_folder;
$$;


ALTER FUNCTION public.consume_signup_link(p_token text) OWNER TO user1;

--
-- TOC entry 415 (class 1255 OID 16717)
-- Name: count_messages(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.count_messages(p_adventure_id integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*) FROM messages WHERE adventure_id = p_adventure_id;
$$;


ALTER FUNCTION public.count_messages(p_adventure_id integer) OWNER TO user1;

--
-- TOC entry 284 (class 1255 OID 16718)
-- Name: count_notifications(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.count_notifications(p_receiver_id integer, p_receiver_role text) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*) FROM private_messages
  WHERE receiver_id = p_receiver_id AND receiver_role = p_receiver_role::chat_role;
$$;


ALTER FUNCTION public.count_notifications(p_receiver_id integer, p_receiver_role text) OWNER TO user1;

--
-- TOC entry 286 (class 1255 OID 16926)
-- Name: create_badge(text, integer, smallint, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_badge(p_title text, p_category_id integer DEFAULT NULL::integer, p_league smallint DEFAULT NULL::smallint, p_description text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id integer;
BEGIN
  INSERT INTO badges (title, category_id, league, description)
  VALUES (p_title, p_category_id, p_league, p_description)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.create_badge(p_title text, p_category_id integer, p_league smallint, p_description text) OWNER TO user1;

--
-- TOC entry 378 (class 1255 OID 18012)
-- Name: create_book(text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_book(p_title text, p_user_id integer, p_theme_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO books (title, user_id, theme_id) VALUES (p_title, p_user_id, p_theme_id) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.create_book(p_title text, p_user_id integer, p_theme_id integer) OWNER TO user1;

--
-- TOC entry 308 (class 1255 OID 17716)
-- Name: create_boss(text, text, text, text, text, date, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_boss(p_name text, p_email text, p_password text, p_username text, p_phone text, p_dob date, p_gender text, p_kyc_folder text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.bosses (name, email, password, username, phone, dob, gender, kyc_folder)
  VALUES (p_name, p_email, encode(p_password::bytea, 'base64'), p_username, p_phone, p_dob, p_gender, p_kyc_folder)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;


ALTER FUNCTION public.create_boss(p_name text, p_email text, p_password text, p_username text, p_phone text, p_dob date, p_gender text, p_kyc_folder text) OWNER TO user1;

--
-- TOC entry 396 (class 1255 OID 16927)
-- Name: create_category(text, text, text[]); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_category(p_category text, p_subcategory text DEFAULT NULL::text, p_word_2s text[] DEFAULT NULL::text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO categories (category, subcategory, word_2s)
  VALUES (p_category, p_subcategory, p_word_2s)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION public.create_category(p_category text, p_subcategory text, p_word_2s text[]) OWNER TO user1;

--
-- TOC entry 353 (class 1255 OID 18193)
-- Name: create_event(text, integer, integer, text, boolean); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_event(p_activity text, p_slot_id integer, p_adventure_id integer, p_instruction text, p_is_challenge boolean) RETURNS public.events
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION public.create_event(p_activity text, p_slot_id integer, p_adventure_id integer, p_instruction text, p_is_challenge boolean) OWNER TO user1;

--
-- TOC entry 229 (class 1259 OID 16667)
-- Name: match_requests; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.match_requests (
    id integer NOT NULL,
    boss_id integer,
    org_id integer NOT NULL,
    category_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    age_range_max integer,
    age_range_min integer,
    user_ids integer[],
    pay_per_head integer,
    all_girls boolean,
    half_girls boolean,
    ages integer[] DEFAULT '{}'::integer[],
    genders character varying(2)[] DEFAULT '{}'::character varying[],
    is_active boolean DEFAULT true,
    roadmap character varying(10000),
    badge_id integer,
    space_id integer
);


ALTER TABLE public.match_requests OWNER TO user1;

--
-- TOC entry 371 (class 1255 OID 18178)
-- Name: create_match_request(integer, integer, integer, integer, integer, double precision, boolean, boolean, text, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_space_id integer, p_age_range_min integer, p_age_range_max integer, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean, p_roadmap text, p_badge_id integer) RETURNS public.match_requests
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


ALTER FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_space_id integer, p_age_range_min integer, p_age_range_max integer, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean, p_roadmap text, p_badge_id integer) OWNER TO user1;

--
-- TOC entry 269 (class 1255 OID 16720)
-- Name: create_match_request(integer, integer, double precision, integer, integer, integer, double precision, double precision, double precision, boolean, boolean); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_match_radius double precision, p_min_team_members integer, p_age_range_min integer, p_age_range_max integer, p_latitude double precision, p_longitude double precision, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean) OWNER TO user1;

--
-- TOC entry 358 (class 1255 OID 17641)
-- Name: create_match_request(integer, integer, double precision, integer, integer, double precision, double precision, double precision, boolean, boolean, text, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_match_radius double precision, p_age_range_min integer, p_age_range_max integer, p_latitude double precision, p_longitude double precision, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean, p_roadmap text, p_badge_id integer) RETURNS public.match_requests
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
      org_id, category_id, match_radius,
      age_range_min, age_range_max, latitude, longitude,
      pay_per_head, all_girls, half_girls, ages, genders, roadmap, badge_id
    )
    VALUES (
      p_org_id, p_category_id, p_match_radius,
      p_age_range_min, p_age_range_max, p_latitude, p_longitude,
      p_pay_per_head, p_all_girls, p_half_girls,
      ARRAY[v_age], ARRAY[v_gender], p_roadmap, p_badge_id
    )
    RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;


ALTER FUNCTION public.create_match_request(p_org_id integer, p_category_id integer, p_match_radius double precision, p_age_range_min integer, p_age_range_max integer, p_latitude double precision, p_longitude double precision, p_pay_per_head double precision, p_all_girls boolean, p_half_girls boolean, p_roadmap text, p_badge_id integer) OWNER TO user1;

--
-- TOC entry 350 (class 1255 OID 17715)
-- Name: create_organizer(text, text, text, text, text, date, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_organizer(p_name text, p_email text, p_password text, p_username text, p_phone text, p_dob date, p_gender text, p_kyc_folder text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_id integer;
BEGIN
  INSERT INTO public.organizers (name, email, password, username, phone, dob, gender, kyc_folder)
  VALUES (p_name, p_email, encode(p_password::bytea, 'base64'), p_username, p_phone, p_dob, p_gender, p_kyc_folder)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;


ALTER FUNCTION public.create_organizer(p_name text, p_email text, p_password text, p_username text, p_phone text, p_dob date, p_gender text, p_kyc_folder text) OWNER TO user1;

--
-- TOC entry 381 (class 1255 OID 18025)
-- Name: create_pending_signup(text, text, text, text, text, date, text, text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_pending_signup(p_token text, p_role text, p_email text, p_name text, p_phone text, p_dob date, p_gender text, p_username text, p_password text, p_kyc_folder text, p_terms_version integer, p_privacy_version integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO pending_signups (token, role, email, name, phone, dob, gender, username, password, kyc_folder, terms_accepted_version, privacy_accepted_version)
  VALUES (p_token, p_role, p_email, p_name, p_phone, p_dob, p_gender, p_username, p_password, p_kyc_folder, p_terms_version, p_privacy_version);
END;
$$;


ALTER FUNCTION public.create_pending_signup(p_token text, p_role text, p_email text, p_name text, p_phone text, p_dob date, p_gender text, p_username text, p_password text, p_kyc_folder text, p_terms_version integer, p_privacy_version integer) OWNER TO user1;

--
-- TOC entry 295 (class 1255 OID 16721)
-- Name: create_pending_user(text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_pending_user(p_request_id text, p_name text, p_phone text, p_email text, p_dob text, p_gender text) RETURNS text
    LANGUAGE plpgsql
    AS $$

BEGIN
  INSERT INTO pending_users (request_id, name, phone, email, dob, gender, expires_at)
  VALUES (
    p_request_id, p_name, p_phone, p_email, p_dob, p_gender,
    NOW() + INTERVAL '40 minutes'
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


ALTER FUNCTION public.create_pending_user(p_request_id text, p_name text, p_phone text, p_email text, p_dob text, p_gender text) OWNER TO user1;

--
-- TOC entry 302 (class 1255 OID 18024)
-- Name: create_signup_link(text, text, text, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_signup_link(p_token text, p_role text, p_email text, p_expires_at timestamp with time zone, p_kyc_folder text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO signup_links (token, role, email, expires_at, kyc_folder)
  VALUES (p_token, p_role, p_email, p_expires_at, p_kyc_folder);
END;
$$;


ALTER FUNCTION public.create_signup_link(p_token text, p_role text, p_email text, p_expires_at timestamp with time zone, p_kyc_folder text) OWNER TO user1;

--
-- TOC entry 313 (class 1255 OID 18004)
-- Name: create_ticket(text, jsonb); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_ticket(p_type text, p_payload jsonb) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO tickets (type, payload) VALUES (p_type, p_payload) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.create_ticket(p_type text, p_payload jsonb) OWNER TO user1;

--
-- TOC entry 315 (class 1255 OID 16928)
-- Name: create_tournament(text, integer, integer, integer, integer, text, text, timestamp with time zone, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_tournament(p_name text, p_badge_id integer DEFAULT NULL::integer, p_prize_1 integer DEFAULT NULL::integer, p_prize_2 integer DEFAULT NULL::integer, p_prize_3 integer DEFAULT NULL::integer, p_sponsored_by text DEFAULT NULL::text, p_venue text DEFAULT NULL::text, p_timing timestamp with time zone DEFAULT NULL::timestamp with time zone, p_instructions text DEFAULT NULL::text, p_third_party_reward_detail text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id INT;
BEGIN
  INSERT INTO tournaments (name, badge_id, prize_1, prize_2, prize_3, sponsored_by, venue, timing, instructions, third_party_reward_detail)
  VALUES (p_name, p_badge_id, p_prize_1, p_prize_2, p_prize_3, p_sponsored_by, p_venue, p_timing, p_instructions, p_third_party_reward_detail)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION public.create_tournament(p_name text, p_badge_id integer, p_prize_1 integer, p_prize_2 integer, p_prize_3 integer, p_sponsored_by text, p_venue text, p_timing timestamp with time zone, p_instructions text, p_third_party_reward_detail text) OWNER TO user1;

--
-- TOC entry 231 (class 1259 OID 16682)
-- Name: users; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    access_token text,
    username text NOT NULL,
    bio text,
    gender text,
    setting_1 boolean DEFAULT false NOT NULL,
    setting_2 boolean DEFAULT false NOT NULL,
    penalties integer DEFAULT 0 NOT NULL,
    dob date,
    blocked boolean DEFAULT false,
    refreshed_at timestamp with time zone,
    level double precision DEFAULT 1.0,
    request_id text,
    intellect_index double precision DEFAULT 50,
    drive_index double precision DEFAULT 50,
    adaptability_index double precision DEFAULT 50,
    empathy_index double precision DEFAULT 50,
    creativity_index double precision DEFAULT 50,
    icon_key text,
    terms_accepted_version integer DEFAULT 0 NOT NULL,
    terms_accepted_at timestamp with time zone,
    privacy_accepted_version integer DEFAULT 0 NOT NULL,
    privacy_accepted_at timestamp with time zone,
    CONSTRAINT users_penalties_check CHECK (((penalties >= 0) AND (penalties <= 4)))
);


ALTER TABLE public.users OWNER TO user1;

--
-- TOC entry 293 (class 1255 OID 18294)
-- Name: create_user(text, text, text, date, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.create_user(p_name text, p_phone text, p_email text, p_dob date, p_gender text) RETURNS public.users
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_base     TEXT;
  v_username TEXT;
  v_counter  INT := 1;
  v_user     users%ROWTYPE;
BEGIN
  v_base := LOWER(
    REGEXP_REPLACE(
      COALESCE(NULLIF(SPLIT_PART(p_email, '@', 1), ''), p_name, 'user'),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  v_base := TRIM(BOTH '-' FROM v_base);
  v_base := LEFT(v_base, 24);
  IF v_base = '' THEN v_base := 'user'; END IF;

  LOOP
    v_username := CASE WHEN v_counter = 1 THEN v_base ELSE v_base || (v_counter - 1)::text END;
    v_counter  := v_counter + 1;

    BEGIN
      INSERT INTO users (name, email, phone, gender, dob, username)
      VALUES (p_name, p_email, NULLIF(p_phone, ''), NULLIF(p_gender, ''), p_dob, v_username)
      RETURNING * INTO v_user;
      RETURN v_user;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
END;
$$;


ALTER FUNCTION public.create_user(p_name text, p_phone text, p_email text, p_dob date, p_gender text) OWNER TO user1;

--
-- TOC entry 305 (class 1255 OID 16723)
-- Name: current_match_request(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.current_match_request(p_id integer, p_role text) OWNER TO user1;

--
-- TOC entry 328 (class 1255 OID 18296)
-- Name: cut_inactive_match_requests(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.cut_inactive_match_requests() RETURNS SETOF public.match_requests
    LANGUAGE sql
    AS $$
  DELETE FROM match_requests
  WHERE is_active = false
  RETURNING *;
$$;


ALTER FUNCTION public.cut_inactive_match_requests() OWNER TO user1;

--
-- TOC entry 362 (class 1255 OID 16923)
-- Name: deactivate_completed_adventures(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.deactivate_completed_adventures() RETURNS integer[]
    LANGUAGE plpgsql
    AS $$
DECLARE
    deactivated_ids integer[];
BEGIN
    UPDATE public.adventures
    SET is_active = false
    WHERE is_active = true
      AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id INTO deactivated_ids;

    RETURN deactivated_ids;
END;
$$;


ALTER FUNCTION public.deactivate_completed_adventures() OWNER TO user1;

--
-- TOC entry 329 (class 1255 OID 18029)
-- Name: delete_pending_signup(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.delete_pending_signup(p_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM pending_signups WHERE id = p_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.delete_pending_signup(p_id integer) OWNER TO user1;

--
-- TOC entry 357 (class 1255 OID 16725)
-- Name: delete_user(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.delete_user(p_id integer) RETURNS public.users
    LANGUAGE sql
    AS $$
  DELETE FROM users WHERE id = p_id RETURNING *;
$$;


ALTER FUNCTION public.delete_user(p_id integer) OWNER TO user1;

--
-- TOC entry 367 (class 1255 OID 17672)
-- Name: dismiss_match_request(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.dismiss_match_request(p_org_id integer) RETURNS TABLE(id integer, user_ids integer[], pay_per_head integer)
    LANGUAGE sql
    AS $$
  UPDATE match_requests
  SET is_active = FALSE
  WHERE org_id = p_org_id AND is_active = TRUE
  RETURNING match_requests.id, match_requests.user_ids, match_requests.pay_per_head;
$$;


ALTER FUNCTION public.dismiss_match_request(p_org_id integer) OWNER TO user1;

--
-- TOC entry 392 (class 1255 OID 16726)
-- Name: file_count(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.file_count(p_adventure_id integer) RETURNS bigint
    LANGUAGE sql
    AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE adventure_id = p_adventure_id
    AND message LIKE '<|file|(%';
$$;


ALTER FUNCTION public.file_count(p_adventure_id integer) OWNER TO user1;

--
-- TOC entry 230 (class 1259 OID 16677)
-- Name: pending_users; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.pending_users (
    request_id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    dob text NOT NULL,
    gender text NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.pending_users OWNER TO user1;

--
-- TOC entry 395 (class 1255 OID 16727)
-- Name: find_pending_user(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.find_pending_user(p_request_id text) RETURNS public.pending_users
    LANGUAGE sql
    AS $$
  SELECT * FROM pending_users WHERE request_id = p_request_id;
$$;


ALTER FUNCTION public.find_pending_user(p_request_id text) OWNER TO user1;

--
-- TOC entry 345 (class 1255 OID 18307)
-- Name: find_user_by_phone(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.find_user_by_phone(p_phone text) RETURNS SETOF public.users
    LANGUAGE sql
    AS $$
  SELECT * FROM users WHERE phone = p_phone;
$$;


ALTER FUNCTION public.find_user_by_phone(p_phone text) OWNER TO user1;

--
-- TOC entry 320 (class 1255 OID 16729)
-- Name: get_active_adventures(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.get_active_adventures(p_id integer, p_role text) OWNER TO user1;

--
-- TOC entry 377 (class 1255 OID 16730)
-- Name: get_adventure_of(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_adventure_of(p_event_id integer) RETURNS integer
    LANGUAGE sql
    AS $$
  SELECT adventure_id FROM events WHERE id = p_event_id;
$$;


ALTER FUNCTION public.get_adventure_of(p_event_id integer) OWNER TO user1;

--
-- TOC entry 360 (class 1255 OID 16731)
-- Name: get_adventures(integer, text, boolean); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.get_adventures(p_id integer, p_role text, p_active boolean) OWNER TO user1;

--
-- TOC entry 334 (class 1255 OID 18022)
-- Name: get_all_badges_for_roadmap(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_all_badges_for_roadmap() RETURNS TABLE(id integer, title character varying, description text, league smallint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT b.id, b.title, b.description, b.league FROM badges b;
END;
$$;


ALTER FUNCTION public.get_all_badges_for_roadmap() OWNER TO user1;

--
-- TOC entry 326 (class 1255 OID 16732)
-- Name: get_all_categories(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_all_categories() RETURNS TABLE(category text)
    LANGUAGE sql
    AS $$
  SELECT DISTINCT category FROM categories;
$$;


ALTER FUNCTION public.get_all_categories() OWNER TO user1;

--
-- TOC entry 221 (class 1259 OID 16609)
-- Name: categories; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    category character varying(255),
    subcategory character varying(255),
    min_pay_per_head double precision,
    max_pay_per_head double precision
);


ALTER TABLE public.categories OWNER TO user1;

--
-- TOC entry 310 (class 1255 OID 17784)
-- Name: get_all_subcategories(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_all_subcategories(p_category text) RETURNS SETOF public.categories
    LANGUAGE sql
    AS $$
  SELECT * FROM categories WHERE category = p_category;
$$;


ALTER FUNCTION public.get_all_subcategories(p_category text) OWNER TO user1;

--
-- TOC entry 369 (class 1255 OID 18430)
-- Name: get_all_themes(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_all_themes() RETURNS TABLE(id integer, name text, description text)
    LANGUAGE sql STABLE
    AS $$
  SELECT t.id, t.name::TEXT, t.description::TEXT
  FROM themes t
  ORDER BY t.id ASC;
$$;


ALTER FUNCTION public.get_all_themes() OWNER TO user1;

--
-- TOC entry 220 (class 1259 OID 16600)
-- Name: badges; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.badges (
    id integer NOT NULL,
    title character varying(255),
    category_id integer,
    league numeric,
    description character varying(1024),
    roadmaps character varying(10000)[]
);


ALTER TABLE public.badges OWNER TO user1;

--
-- TOC entry 355 (class 1255 OID 17777)
-- Name: get_badge(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_badge(p_badge_id integer) RETURNS SETOF public.badges
    LANGUAGE sql
    AS $$
  SELECT * FROM badges WHERE id = p_badge_id;
$$;


ALTER FUNCTION public.get_badge(p_badge_id integer) OWNER TO user1;

--
-- TOC entry 348 (class 1255 OID 18020)
-- Name: get_badge_category_id(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_badge_category_id(p_badge_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT b.category_id FROM badges b WHERE b.id = p_badge_id);
END;
$$;


ALTER FUNCTION public.get_badge_category_id(p_badge_id integer) OWNER TO user1;

--
-- TOC entry 309 (class 1255 OID 18021)
-- Name: get_badge_roadmaps(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_badge_roadmaps(p_badge_id integer) RETURNS character varying[]
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT b.roadmaps FROM badges b WHERE b.id = p_badge_id);
END;
$$;


ALTER FUNCTION public.get_badge_roadmaps(p_badge_id integer) OWNER TO user1;

--
-- TOC entry 319 (class 1255 OID 18357)
-- Name: get_badge_with_league(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_badge_with_league(p_badge_id integer) RETURNS TABLE(id integer, title text, description text, league smallint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT b.id::INT, b.title::TEXT, b.description::TEXT, b.league
    FROM badges b WHERE b.id = p_badge_id;
END;
$$;


ALTER FUNCTION public.get_badge_with_league(p_badge_id integer) OWNER TO user1;

--
-- TOC entry 311 (class 1255 OID 17778)
-- Name: get_badges(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_badges(p_category_id integer) RETURNS SETOF public.badges
    LANGUAGE sql
    AS $$
  SELECT * FROM badges WHERE category_id = p_category_id;
$$;


ALTER FUNCTION public.get_badges(p_category_id integer) OWNER TO user1;

--
-- TOC entry 340 (class 1255 OID 26634)
-- Name: get_book_chunks(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_book_chunks(p_book_id integer) RETURNS TABLE(id integer, chapter integer, seq integer, kind text, content text, event_id integer, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  SELECT id, chapter, seq, kind, content, event_id, created_at
  FROM story_chunks
  WHERE book_id = p_book_id
  ORDER BY chapter ASC, seq ASC;
$$;


ALTER FUNCTION public.get_book_chunks(p_book_id integer) OWNER TO user1;

--
-- TOC entry 347 (class 1255 OID 26624)
-- Name: get_book_with_theme(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_book_with_theme(p_user_id integer) RETURNS TABLE(id integer, title text, chapter integer, status text, last_event_id integer, theme_name text, theme_description text)
    LANGUAGE plpgsql
    AS $$

BEGIN
  RETURN QUERY
    SELECT b.id::INT, b.title::TEXT, b.chapter::INT, b.status::TEXT,
           b.last_event_id::INT, 
           t.name::TEXT, t.description::TEXT
    FROM books b LEFT JOIN themes t ON t.id = b.theme_id
    WHERE b.user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.get_book_with_theme(p_user_id integer) OWNER TO user1;

--
-- TOC entry 297 (class 1255 OID 18393)
-- Name: get_booked_slots(integer, date); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_booked_slots(p_space_id integer, p_date date) RETURNS TABLE(id integer, space_id integer, datetime timestamp with time zone, duration_in_hours integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT s.id, s.space_id, s.datetime, s.duration_in_hours
    FROM slots s
    WHERE s.space_id = p_space_id
      AND (s.datetime AT TIME ZONE 'Asia/Kolkata')::DATE = p_date
    ORDER BY s.datetime;
END;
$$;


ALTER FUNCTION public.get_booked_slots(p_space_id integer, p_date date) OWNER TO user1;

--
-- TOC entry 217 (class 1259 OID 16579)
-- Name: bosses; Type: TABLE; Schema: public; Owner: user1
--

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
    refreshed_at timestamp with time zone,
    bio character varying(1000),
    kyc_folder text,
    icon_key text,
    terms_accepted_version integer DEFAULT 0 NOT NULL,
    terms_accepted_at timestamp with time zone,
    privacy_accepted_version integer DEFAULT 0 NOT NULL,
    privacy_accepted_at timestamp with time zone
);


ALTER TABLE public.bosses OWNER TO user1;

--
-- TOC entry 307 (class 1255 OID 16735)
-- Name: get_boss(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_boss(p_id integer) RETURNS public.bosses
    LANGUAGE sql
    AS $$
  SELECT * FROM bosses WHERE id = p_id;
$$;


ALTER FUNCTION public.get_boss(p_id integer) OWNER TO user1;

--
-- TOC entry 375 (class 1255 OID 16736)
-- Name: get_boss_by_email(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_boss_by_email(p_email text) RETURNS public.bosses
    LANGUAGE sql
    AS $$
  SELECT * FROM bosses WHERE email = p_email;
$$;


ALTER FUNCTION public.get_boss_by_email(p_email text) OWNER TO user1;

--
-- TOC entry 393 (class 1255 OID 18008)
-- Name: get_boss_icon_key(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_boss_icon_key(p_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT b.icon_key FROM bosses b WHERE b.id = p_id);
END;
$$;


ALTER FUNCTION public.get_boss_icon_key(p_id integer) OWNER TO user1;

--
-- TOC entry 426 (class 1255 OID 18179)
-- Name: get_compatible_requests(text, integer, integer[], integer, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_compatible_requests(p_role text, p_category_id integer, p_badge_ids integer[], p_age integer, p_space_id integer, p_gender text) RETURNS SETOF public.match_requests
    LANGUAGE sql
    AS $$
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


ALTER FUNCTION public.get_compatible_requests(p_role text, p_category_id integer, p_badge_ids integer[], p_age integer, p_space_id integer, p_gender text) OWNER TO user1;

--
-- TOC entry 431 (class 1255 OID 16738)
-- Name: get_event(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_event(p_event_id integer) RETURNS public.events
    LANGUAGE sql
    AS $$
  SELECT * FROM events WHERE id = p_event_id;
$$;


ALTER FUNCTION public.get_event(p_event_id integer) OWNER TO user1;

--
-- TOC entry 341 (class 1255 OID 16739)
-- Name: get_inactive_adventures(integer, text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.get_inactive_adventures(p_id integer, p_role text, p_a integer, p_b integer) OWNER TO user1;

--
-- TOC entry 322 (class 1255 OID 17739)
-- Name: get_kyc_folder(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_kyc_folder(p_id integer, p_role text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_folder text;
BEGIN
  IF p_role = 'organizer' THEN
    SELECT kyc_folder INTO v_folder FROM organizers WHERE id = p_id;
  ELSIF p_role = 'boss' THEN
    SELECT kyc_folder INTO v_folder FROM bosses WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'role must be organizer or boss';
  END IF;
  RETURN v_folder;
END;
$$;


ALTER FUNCTION public.get_kyc_folder(p_id integer, p_role text) OWNER TO user1;

--
-- TOC entry 296 (class 1255 OID 18086)
-- Name: get_legal_versions(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_legal_versions(p_app text) RETURNS TABLE(terms_version integer, privacy_version integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT lv.terms_version, lv.privacy_version FROM legal_versions lv WHERE lv.app = p_app;
END;
$$;


ALTER FUNCTION public.get_legal_versions(p_app text) OWNER TO user1;

--
-- TOC entry 285 (class 1255 OID 17639)
-- Name: get_limitation(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_limitation(p_org_id integer) RETURNS integer
    LANGUAGE sql
    AS $$
  SELECT max_team_members_limitation FROM organizers WHERE id = p_org_id;
$$;


ALTER FUNCTION public.get_limitation(p_org_id integer) OWNER TO user1;

--
-- TOC entry 218 (class 1259 OID 16586)
-- Name: messages; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    message character varying(250) NOT NULL,
    sender_id integer NOT NULL,
    adventure_id integer NOT NULL,
    sender_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['user'::text, 'boss'::text, 'organizer'::text])))
);


ALTER TABLE public.messages OWNER TO user1;

--
-- TOC entry 344 (class 1255 OID 16593)
-- Name: get_messages_from_a_to_b(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_messages_from_a_to_b(p_adventure_id integer, p_offset integer, p_limit integer) RETURNS SETOF public.messages
    LANGUAGE sql
    AS $$
  SELECT *
  FROM messages
  WHERE adventure_id = p_adventure_id
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.get_messages_from_a_to_b(p_adventure_id integer, p_offset integer, p_limit integer) OWNER TO user1;

--
-- TOC entry 403 (class 1255 OID 26628)
-- Name: get_my_tickets(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_my_tickets(p_reporter_id integer, p_reporter_role text) RETURNS TABLE(id integer, type text, status text, payload jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$

BEGIN
  RETURN QUERY
    SELECT t.id, t.type::TEXT, t.status::TEXT, t.payload, t.created_at, t.updated_at
    FROM tickets t
    WHERE (t.payload->>'reporterId')::int = p_reporter_id
      AND t.payload->>'reporterRole' = p_reporter_role
    ORDER BY t.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_my_tickets(p_reporter_id integer, p_reporter_role text) OWNER TO user1;

--
-- TOC entry 299 (class 1255 OID 18292)
-- Name: get_nearby_spaces(double precision, double precision); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_nearby_spaces(p_lat double precision, p_long double precision) RETURNS SETOF public.spaces
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM spaces
    WHERE lat IS NOT NULL AND long IS NOT NULL
      AND 6371 * acos(
            cos(radians(p_lat)) * cos(radians(lat))
            * cos(radians(long) - radians(p_long))
            + sin(radians(p_lat)) * sin(radians(lat))
          ) <= 15
    ORDER BY id;
END;
$$;


ALTER FUNCTION public.get_nearby_spaces(p_lat double precision, p_long double precision) OWNER TO user1;

--
-- TOC entry 219 (class 1259 OID 16594)
-- Name: private_messages; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.private_messages (
    id bigint NOT NULL,
    sender_id integer NOT NULL,
    sender_role public.chat_role NOT NULL,
    receiver_id integer NOT NULL,
    receiver_role public.chat_role NOT NULL,
    message text NOT NULL,
    sent_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.private_messages OWNER TO user1;

--
-- TOC entry 361 (class 1255 OID 16605)
-- Name: get_notifications(integer, text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_notifications(p_receiver_id integer, p_receiver_role text, p_a integer, p_b integer) RETURNS SETOF public.private_messages
    LANGUAGE sql
    AS $$
  SELECT * FROM private_messages
  WHERE receiver_id = p_receiver_id AND receiver_role = p_receiver_role::chat_role
  ORDER BY sent_at DESC
  LIMIT p_b OFFSET p_a;
$$;


ALTER FUNCTION public.get_notifications(p_receiver_id integer, p_receiver_role text, p_a integer, p_b integer) OWNER TO user1;

--
-- TOC entry 390 (class 1255 OID 18356)
-- Name: get_ob_assertion(uuid); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_ob_assertion(p_id uuid) RETURNS TABLE(id uuid, user_id integer, badge_id integer, adventure_id integer, issued_on timestamp with time zone, credential_json jsonb, revoked boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT a.id, a.user_id, a.badge_id, a.adventure_id,
           a.issued_on, a.credential_json, a.revoked
    FROM ob_assertions a
    WHERE a.id = p_id;
END;
$$;


ALTER FUNCTION public.get_ob_assertion(p_id uuid) OWNER TO user1;

--
-- TOC entry 276 (class 1255 OID 18355)
-- Name: get_ob_assertions_by_user(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_ob_assertions_by_user(p_user_id integer) RETURNS TABLE(id uuid, badge_id integer, adventure_id integer, issued_on timestamp with time zone, credential_json jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT a.id, a.badge_id, a.adventure_id, a.issued_on, a.credential_json
    FROM ob_assertions a
    WHERE a.user_id = p_user_id AND a.revoked = FALSE
    ORDER BY a.issued_on DESC;
END;
$$;


ALTER FUNCTION public.get_ob_assertions_by_user(p_user_id integer) OWNER TO user1;

--
-- TOC entry 222 (class 1259 OID 16614)
-- Name: organizers; Type: TABLE; Schema: public; Owner: user1
--

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
    password text NOT NULL,
    refreshed_at timestamp with time zone,
    bio character varying(1000),
    rating double precision DEFAULT 3.9,
    max_team_members_limitation integer DEFAULT 10,
    kyc_folder text,
    icon_key text,
    terms_accepted_version integer DEFAULT 0 NOT NULL,
    terms_accepted_at timestamp with time zone,
    privacy_accepted_version integer DEFAULT 0 NOT NULL,
    privacy_accepted_at timestamp with time zone
);


ALTER TABLE public.organizers OWNER TO user1;

--
-- TOC entry 382 (class 1255 OID 16698)
-- Name: get_organizer(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_organizer(p_id integer) RETURNS public.organizers
    LANGUAGE sql
    AS $$
  SELECT * FROM organizers WHERE id = p_id;
$$;


ALTER FUNCTION public.get_organizer(p_id integer) OWNER TO user1;

--
-- TOC entry 418 (class 1255 OID 16699)
-- Name: get_organizer_by_email(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_organizer_by_email(p_email text) RETURNS public.organizers
    LANGUAGE sql
    AS $$
  SELECT * FROM organizers WHERE email = p_email;
$$;


ALTER FUNCTION public.get_organizer_by_email(p_email text) OWNER TO user1;

--
-- TOC entry 410 (class 1255 OID 18007)
-- Name: get_organizer_icon_key(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_organizer_icon_key(p_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT o.icon_key FROM organizers o WHERE o.id = p_id);
END;
$$;


ALTER FUNCTION public.get_organizer_icon_key(p_id integer) OWNER TO user1;

--
-- TOC entry 257 (class 1259 OID 17912)
-- Name: pending_signups; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.pending_signups (
    id integer NOT NULL,
    token text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    dob date NOT NULL,
    gender text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    kyc_folder text NOT NULL,
    terms_accepted_version integer NOT NULL,
    privacy_accepted_version integer NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pending_signups_role_check CHECK ((role = ANY (ARRAY['organizer'::text, 'boss'::text])))
);


ALTER TABLE public.pending_signups OWNER TO user1;

--
-- TOC entry 354 (class 1255 OID 18028)
-- Name: get_pending_signup(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_pending_signup(p_id integer) RETURNS SETOF public.pending_signups
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM pending_signups ps WHERE ps.id = p_id;
END;
$$;


ALTER FUNCTION public.get_pending_signup(p_id integer) OWNER TO user1;

--
-- TOC entry 368 (class 1255 OID 18027)
-- Name: get_pending_signup_kyc_folder(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_pending_signup_kyc_folder(p_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT ps.kyc_folder FROM pending_signups ps WHERE ps.id = p_id);
END;
$$;


ALTER FUNCTION public.get_pending_signup_kyc_folder(p_id integer) OWNER TO user1;

--
-- TOC entry 330 (class 1255 OID 16700)
-- Name: get_pending_user(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_pending_user(p_phone text) RETURNS public.pending_users
    LANGUAGE sql
    AS $$
  SELECT * FROM pending_users WHERE phone = p_phone;
$$;


ALTER FUNCTION public.get_pending_user(p_phone text) OWNER TO user1;

--
-- TOC entry 223 (class 1259 OID 16621)
-- Name: polls; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.polls (
    adventure_id integer NOT NULL,
    poll_number integer NOT NULL,
    question character varying(1000) NOT NULL,
    options character varying(100)[] DEFAULT '{}'::character varying(100)[] NOT NULL,
    votes character varying(50)[] DEFAULT '{}'::character varying(50)[] NOT NULL
);


ALTER TABLE public.polls OWNER TO user1;

--
-- TOC entry 394 (class 1255 OID 16697)
-- Name: get_poll(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_poll(p_adventure_id integer, p_poll_number integer) RETURNS public.polls
    LANGUAGE sql
    AS $$
  SELECT * FROM polls
  WHERE adventure_id = p_adventure_id AND poll_number = p_poll_number;
$$;


ALTER FUNCTION public.get_poll(p_adventure_id integer, p_poll_number integer) OWNER TO user1;

--
-- TOC entry 421 (class 1255 OID 26629)
-- Name: get_qualifications(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_qualifications(p_id integer, p_role text) RETURNS SETOF jsonb
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_role = 'boss' THEN
        RETURN QUERY SELECT to_jsonb(b.*) FROM boss_qualifications b WHERE b.boss_id = p_id;
    ELSIF p_role = 'user' THEN
        RETURN QUERY SELECT to_jsonb(u.*) FROM user_qualifications u WHERE u.user_id = p_id;
    ELSIF p_role = 'organizer' THEN
        RETURN QUERY SELECT to_jsonb(o.*) FROM organizer_qualifications o WHERE o.organizer_id = p_id;
    END IF;
END;
$$;


ALTER FUNCTION public.get_qualifications(p_id integer, p_role text) OWNER TO user1;

--
-- TOC entry 225 (class 1259 OID 16631)
-- Name: results; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.results (
    adventure_id integer NOT NULL,
    result_number integer NOT NULL,
    user_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    star_scores smallint[] DEFAULT '{}'::smallint[] NOT NULL,
    remarks character varying(500)[] DEFAULT '{}'::character varying(500)[] NOT NULL,
    qualified boolean[] DEFAULT '{}'::boolean[] NOT NULL
);


ALTER TABLE public.results OWNER TO user1;

--
-- TOC entry 298 (class 1255 OID 16702)
-- Name: get_result(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_result(p_adventure_id integer, p_result_number integer) RETURNS public.results
    LANGUAGE sql
    AS $$
  SELECT * FROM results
  WHERE adventure_id = p_adventure_id AND result_number = p_result_number;
$$;


ALTER FUNCTION public.get_result(p_adventure_id integer, p_result_number integer) OWNER TO user1;

--
-- TOC entry 423 (class 1255 OID 17719)
-- Name: get_signup_link_kyc_folder(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_signup_link_kyc_folder(p_token text) RETURNS text
    LANGUAGE sql
    AS $$
  SELECT kyc_folder FROM signup_links
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > now();
$$;


ALTER FUNCTION public.get_signup_link_kyc_folder(p_token text) OWNER TO user1;

--
-- TOC entry 274 (class 1255 OID 18399)
-- Name: get_slot(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_slot(p_slot_id integer) RETURNS SETOF public.slots
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM slots WHERE id = p_slot_id;
END;
$$;


ALTER FUNCTION public.get_slot(p_slot_id integer) OWNER TO user1;

--
-- TOC entry 282 (class 1255 OID 26631)
-- Name: get_theme(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_theme(p_id integer) RETURNS TABLE(name character varying, description character varying)
    LANGUAGE plpgsql
    AS $$

BEGIN
  RETURN QUERY SELECT t.name, t.description FROM themes t WHERE t.id = p_id;
END;
$$;


ALTER FUNCTION public.get_theme(p_id integer) OWNER TO user1;

--
-- TOC entry 336 (class 1255 OID 26625)
-- Name: get_ticket_by_id(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_ticket_by_id(p_id integer) RETURNS TABLE(id integer, type text, status text, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$

BEGIN
  RETURN QUERY SELECT t.id, t.type::TEXT, t.status::TEXT, t.created_at, t.updated_at FROM tickets t WHERE t.id = p_id;
END;
$$;


ALTER FUNCTION public.get_ticket_by_id(p_id integer) OWNER TO user1;

--
-- TOC entry 268 (class 1255 OID 16703)
-- Name: get_user(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user(p_id integer) RETURNS public.users
    LANGUAGE sql
    AS $$
  SELECT * FROM users WHERE id = p_id;
$$;


ALTER FUNCTION public.get_user(p_id integer) OWNER TO user1;

--
-- TOC entry 273 (class 1255 OID 18009)
-- Name: get_user_book_id(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user_book_id(p_user_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT b.id FROM books b WHERE b.user_id = p_user_id);
END;
$$;


ALTER FUNCTION public.get_user_book_id(p_user_id integer) OWNER TO user1;

--
-- TOC entry 385 (class 1255 OID 18358)
-- Name: get_user_email(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user_email(p_user_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT u.email FROM users u WHERE u.id = p_user_id);
END;
$$;


ALTER FUNCTION public.get_user_email(p_user_id integer) OWNER TO user1;

--
-- TOC entry 356 (class 1255 OID 18006)
-- Name: get_user_icon_key(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user_icon_key(p_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT u.icon_key FROM users u WHERE u.id = p_id);
END;
$$;


ALTER FUNCTION public.get_user_icon_key(p_id integer) OWNER TO user1;

--
-- TOC entry 291 (class 1255 OID 18011)
-- Name: get_user_name(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user_name(p_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN (SELECT u.name FROM users u WHERE u.id = p_id);
END;
$$;


ALTER FUNCTION public.get_user_name(p_id integer) OWNER TO user1;

--
-- TOC entry 342 (class 1255 OID 18018)
-- Name: get_user_penalties(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.get_user_penalties(p_id integer) RETURNS TABLE(username character varying, penalties integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY SELECT u.username, u.penalties FROM users u WHERE u.id = p_id;
END;
$$;


ALTER FUNCTION public.get_user_penalties(p_id integer) OWNER TO user1;

--
-- TOC entry 389 (class 1255 OID 18354)
-- Name: insert_ob_assertion(uuid, integer, integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.insert_ob_assertion(p_id uuid, p_user_id integer, p_badge_id integer, p_adventure_id integer, p_credential jsonb) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO ob_assertions (id, user_id, badge_id, adventure_id, credential_json)
  VALUES (p_id, p_user_id, p_badge_id, p_adventure_id, p_credential);
$$;


ALTER FUNCTION public.insert_ob_assertion(p_id uuid, p_user_id integer, p_badge_id integer, p_adventure_id integer, p_credential jsonb) OWNER TO user1;

--
-- TOC entry 424 (class 1255 OID 16705)
-- Name: insert_poll(integer, text, text[]); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.insert_poll(p_adventure_id integer, p_question text, p_options text[]) OWNER TO user1;

--
-- TOC entry 373 (class 1255 OID 17653)
-- Name: insert_result(integer, integer[], integer[], text[]); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.insert_result(p_adventure_id integer, p_user_ids integer[], p_star_scores integer[], p_remarks text[]) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION public.insert_result(p_adventure_id integer, p_user_ids integer[], p_star_scores integer[], p_remarks text[]) OWNER TO user1;

--
-- TOC entry 408 (class 1255 OID 16707)
-- Name: is_related_to_adventure(integer, text, integer); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.is_related_to_adventure(p_id integer, p_role text, p_adventure_id integer) OWNER TO user1;

--
-- TOC entry 279 (class 1255 OID 18026)
-- Name: list_pending_signups(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.list_pending_signups() RETURNS TABLE(id integer, role text, email text, name text, phone text, dob date, gender text, username text, kyc_folder text, submitted_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT ps.id, ps.role::TEXT, ps.email::TEXT, ps.name::TEXT, ps.phone::TEXT, ps.dob, ps.gender::TEXT, ps.username::TEXT, ps.kyc_folder::TEXT, ps.submitted_at
    FROM pending_signups ps ORDER BY ps.submitted_at DESC;
END;
$$;


ALTER FUNCTION public.list_pending_signups() OWNER TO user1;

--
-- TOC entry 399 (class 1255 OID 16708)
-- Name: logout(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.logout(p_id integer, p_role text) OWNER TO user1;

--
-- TOC entry 372 (class 1255 OID 16922)
-- Name: logout_absentees(); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.logout_absentees() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    users_updated INT := 0;
    organizers_updated INT := 0;
    bosses_updated INT := 0;
BEGIN
  
  -- Update users table
  UPDATE users
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS users_updated = ROW_COUNT;
  
  -- Update organizers table
  UPDATE organizers
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS organizers_updated = ROW_COUNT;
  
  -- Update bosses table
  UPDATE bosses
  SET access_token = NULL
  WHERE refreshed_at < NOW() - INTERVAL '30 days'
    AND access_token IS NOT NULL;
  GET DIAGNOSTICS bosses_updated = ROW_COUNT;
  
  RETURN 'Logged out absentees. Users: ' || users_updated || 
         ', Organizers: ' || organizers_updated || 
         ', Bosses: ' || bosses_updated;
END;
$$;


ALTER FUNCTION public.logout_absentees() OWNER TO user1;

--
-- TOC entry 318 (class 1255 OID 18181)
-- Name: match_request(integer, text, integer, integer, integer, integer, integer, integer, integer, integer, integer, double precision, boolean, boolean); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.match_request(p_id integer, p_role text, p_age_range_min integer, p_age_range_max integer, p_snapshot_id integer, p_snapshot_boss_id integer, p_snapshot_org_id integer, p_snapshot_category_id integer, p_snapshot_space_id integer, p_snapshot_age_min integer, p_snapshot_age_max integer, p_snapshot_pay_per_head double precision, p_snapshot_all_girls boolean, p_snapshot_half_girls boolean) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
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


ALTER FUNCTION public.match_request(p_id integer, p_role text, p_age_range_min integer, p_age_range_max integer, p_snapshot_id integer, p_snapshot_boss_id integer, p_snapshot_org_id integer, p_snapshot_category_id integer, p_snapshot_space_id integer, p_snapshot_age_min integer, p_snapshot_age_max integer, p_snapshot_pay_per_head double precision, p_snapshot_all_girls boolean, p_snapshot_half_girls boolean) OWNER TO user1;

--
-- TOC entry 406 (class 1255 OID 17737)
-- Name: mod_add_category_qualification(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_add_category_qualification(p_organizer_id integer, p_category text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_category_id integer;
BEGIN
  SELECT id INTO v_category_id FROM categories WHERE category = p_category;
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM organizers WHERE id = p_organizer_id) THEN
    RAISE EXCEPTION 'Organizer not found';
  END IF;

  INSERT INTO organizer_qualifications (organizer_id, category_id)
  VALUES (p_organizer_id, v_category_id)
  ON CONFLICT DO NOTHING;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mod_add_category_qualification(p_organizer_id integer, p_category text) OWNER TO user1;

--
-- TOC entry 301 (class 1255 OID 18037)
-- Name: mod_get_tickets(text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_get_tickets(p_status text, p_type text, p_limit integer, p_offset integer) RETURNS SETOF public.tickets
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM tickets t
    WHERE (p_status IS NULL OR t.status = p_status)
      AND (p_type IS NULL OR t.type = p_type)
    ORDER BY t.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.mod_get_tickets(p_status text, p_type text, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 387 (class 1255 OID 18287)
-- Name: mod_get_users(text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_get_users(p_search text DEFAULT NULL::text) RETURNS TABLE(id integer, name text, username text, email text, phone text, gender character varying, level smallint, penalties integer)
    LANGUAGE sql
    AS $$
  SELECT id, name, username, email, phone, gender, level, penalties
  FROM users
  WHERE p_search IS NULL
     OR name ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email ILIKE '%' || p_search || '%'
     OR phone ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT 100;
$$;


ALTER FUNCTION public.mod_get_users(p_search text) OWNER TO user1;

--
-- TOC entry 306 (class 1255 OID 17732)
-- Name: mod_grant_credits(integer, text, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_grant_credits(p_id integer, p_role text, p_credits integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_credits integer;
BEGIN
  IF p_role = 'organizer' THEN
    UPDATE organizers SET credits = credits + p_credits WHERE id = p_id RETURNING credits INTO new_credits;
  ELSIF p_role = 'boss' THEN
    UPDATE bosses SET credits = credits + p_credits WHERE id = p_id RETURNING credits INTO new_credits;
  ELSE
    RAISE EXCEPTION 'role must be organizer or boss';
  END IF;
  RETURN new_credits;
END;
$$;


ALTER FUNCTION public.mod_grant_credits(p_id integer, p_role text, p_credits integer) OWNER TO user1;

--
-- TOC entry 292 (class 1255 OID 17733)
-- Name: mod_list_adventures(boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_list_adventures(p_is_active boolean, p_limit integer, p_offset integer) RETURNS TABLE(id integer, name text, category_id integer, organizer_id integer, boss_id integer, user_ids integer[], is_active boolean, room_key integer, created_at timestamp with time zone)
    LANGUAGE sql
    AS $$
  SELECT id, name, category_id, organizer_id, boss_id, user_ids, is_active, room_key, created_at
  FROM adventures
  WHERE p_is_active IS NULL OR is_active = p_is_active
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_list_adventures(p_is_active boolean, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 359 (class 1255 OID 17779)
-- Name: mod_list_badges(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_list_badges(p_limit integer, p_offset integer) RETURNS SETOF public.badges
    LANGUAGE sql
    AS $$
  SELECT * FROM badges ORDER BY id LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_list_badges(p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 417 (class 1255 OID 17735)
-- Name: mod_list_categories(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_list_categories(p_limit integer, p_offset integer) RETURNS SETOF public.categories
    LANGUAGE sql
    AS $$
  SELECT * FROM categories ORDER BY id LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_list_categories(p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 272 (class 1255 OID 18428)
-- Name: mod_list_lobbies(integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_list_lobbies(p_boss_id integer DEFAULT NULL::integer, p_category_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id integer, created_at timestamp with time zone, boss_id integer, boss_name text, org_id integer, org_name text, category_id integer, category_name text, space_id integer, space_name text, space_lat numeric, space_long numeric, age_range_min integer, age_range_max integer, pay_per_head numeric, all_girls boolean, half_girls boolean, member_count integer)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    mr.id,
    mr.created_at,
    mr.boss_id,
    b.name            AS boss_name,
    mr.org_id,
    o.name            AS org_name,
    mr.category_id,
    c.category        AS category_name,
    mr.space_id,
    s.name            AS space_name,
    s.lat             AS space_lat,
    s.long            AS space_long,
    mr.age_range_min,
    mr.age_range_max,
    mr.pay_per_head,
    mr.all_girls,
    mr.half_girls,
    COALESCE(array_length(mr.user_ids, 1), 0) AS member_count
  FROM  match_requests  mr
  JOIN  organizers      o ON o.id = mr.org_id
  JOIN  categories      c ON c.id = mr.category_id
  LEFT  JOIN bosses     b ON b.id = mr.boss_id
  LEFT  JOIN spaces     s ON s.id = mr.space_id
  WHERE mr.is_active = TRUE
    AND (p_boss_id     IS NULL OR mr.boss_id     = p_boss_id)
    AND (p_category_id IS NULL OR mr.category_id = p_category_id)
  ORDER BY mr.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_list_lobbies(p_boss_id integer, p_category_id integer, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 226 (class 1259 OID 16640)
-- Name: tournaments; Type: TABLE; Schema: public; Owner: user1
--

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
    timing timestamp with time zone,
    instructions text,
    third_party_reward_detail text,
    org_ids integer[] DEFAULT '{}'::integer[],
    boss_ids integer[] DEFAULT '{}'::integer[]
);


ALTER TABLE public.tournaments OWNER TO user1;

--
-- TOC entry 287 (class 1255 OID 17734)
-- Name: mod_list_tournaments(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_list_tournaments(p_limit integer, p_offset integer) RETURNS SETOF public.tournaments
    LANGUAGE sql
    AS $$
  SELECT * FROM tournaments ORDER BY id DESC LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_list_tournaments(p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 343 (class 1255 OID 17738)
-- Name: mod_remove_category_qualification(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_remove_category_qualification(p_organizer_id integer, p_category text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_category_id integer;
BEGIN
  SELECT id INTO v_category_id FROM categories WHERE category = p_category;
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  DELETE FROM organizer_qualifications
  WHERE organizer_id = p_organizer_id AND category_id = v_category_id;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mod_remove_category_qualification(p_organizer_id integer, p_category text) OWNER TO user1;

--
-- TOC entry 391 (class 1255 OID 26626)
-- Name: mod_resolve_ticket(integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_resolve_ticket(p_id integer) RETURNS SETOF public.tickets
    LANGUAGE plpgsql
    AS $$

BEGIN
  RETURN QUERY
    UPDATE tickets SET status = 'closed', updated_at = NOW()
    WHERE id = p_id RETURNING *;
END;
$$;


ALTER FUNCTION public.mod_resolve_ticket(p_id integer) OWNER TO user1;

--
-- TOC entry 325 (class 1255 OID 17730)
-- Name: mod_search_bosses(text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_search_bosses(p_search text, p_limit integer, p_offset integer) RETURNS TABLE(id integer, name text, username text, email text, phone text, gender character varying, credits integer)
    LANGUAGE sql
    AS $$
  SELECT id, name, username, email, phone, gender, credits
  FROM bosses
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_search_bosses(p_search text, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 419 (class 1255 OID 17729)
-- Name: mod_search_organizers(text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_search_organizers(p_search text, p_limit integer, p_offset integer) RETURNS TABLE(id integer, name text, username text, email text, phone text, gender character varying, credits integer)
    LANGUAGE sql
    AS $$
  SELECT id, name, username, email, phone, gender, credits
  FROM organizers
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_search_organizers(p_search text, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 352 (class 1255 OID 17728)
-- Name: mod_search_users(text, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.mod_search_users(p_search text, p_limit integer, p_offset integer) RETURNS TABLE(id integer, name text, username text, email text, phone text, gender character varying, level smallint, penalties integer, gems integer)
    LANGUAGE sql
    AS $$
  SELECT id, name, username, email, phone, gender, level, penalties, gems
  FROM users
  WHERE p_search IS NULL
     OR name     ILIKE '%' || p_search || '%'
     OR username ILIKE '%' || p_search || '%'
     OR email    ILIKE '%' || p_search || '%'
  ORDER BY id
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.mod_search_users(p_search text, p_limit integer, p_offset integer) OWNER TO user1;

--
-- TOC entry 412 (class 1255 OID 16740)
-- Name: purchase_ticket(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.purchase_ticket(p_id integer, p_user_id integer) RETURNS public.tournaments
    LANGUAGE sql
    AS $$
  UPDATE tournaments
  SET user_ids = array_append(user_ids, p_user_id)
  WHERE id = p_id
  RETURNING *;
$$;


ALTER FUNCTION public.purchase_ticket(p_id integer, p_user_id integer) OWNER TO user1;

--
-- TOC entry 338 (class 1255 OID 18017)
-- Name: rename_book(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.rename_book(p_user_id integer, p_title text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id INT;
BEGIN
  UPDATE books SET title = p_title WHERE user_id = p_user_id RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION public.rename_book(p_user_id integer, p_title text) OWNER TO user1;

--
-- TOC entry 413 (class 1255 OID 17992)
-- Name: request_alloted_schedule(integer, timestamp with time zone, timestamp with time zone, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.request_alloted_schedule(p_venue_id integer, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_role character varying, p_requester_id integer, p_token character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.request_alloted_schedule(p_venue_id integer, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_role character varying, p_requester_id integer, p_token character varying) OWNER TO user1;

--
-- TOC entry 366 (class 1255 OID 16743)
-- Name: room_available(text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.room_available(p_room_name text) OWNER TO user1;

--
-- TOC entry 407 (class 1255 OID 16744)
-- Name: send_notification(integer, text, text, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.send_notification(p_sender_id integer, p_sender_role text, p_message text, p_receiver_id integer, p_receiver_role text) RETURNS public.private_messages
    LANGUAGE sql
    AS $$
  INSERT INTO private_messages (sender_id, sender_role, receiver_id, receiver_role, message)
  VALUES (p_sender_id, p_sender_role::chat_role, p_receiver_id, p_receiver_role::chat_role, p_message)
  RETURNING *;
$$;


ALTER FUNCTION public.send_notification(p_sender_id integer, p_sender_role text, p_message text, p_receiver_id integer, p_receiver_role text) OWNER TO user1;

--
-- TOC entry 331 (class 1255 OID 26630)
-- Name: summarize_event(integer, integer[], character varying[], text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.summarize_event(p_event_id integer, p_attendance integer[], p_stats_delta character varying[], p_summary text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  i         INT;
  v_uid     INT;
  v_delta   VARCHAR(5);
  v_adv_id  INT;
BEGIN
  IF array_length(p_attendance, 1) IS DISTINCT FROM array_length(p_stats_delta, 1) THEN
    RAISE EXCEPTION 'attendance and statsDelta must be the same length';
  END IF;

  UPDATE events
  SET attendance  = p_attendance,
      stats_delta = p_stats_delta,
      summary     = p_summary,
      summarized  = TRUE
  WHERE id = p_event_id
    AND summarized IS NOT TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or already summarized';
  END IF;

  -- Apply stat changes to attendees
  FOR i IN 1..array_length(p_attendance, 1) LOOP
    v_uid   := p_attendance[i];
    v_delta := p_stats_delta[i];
    PERFORM apply_stat_changes(
      v_uid,
      CASE SUBSTRING(v_delta, 1, 1) WHEN '+' THEN 1.01 WHEN '-' THEN 0.99 ELSE 1.0 END,
      CASE SUBSTRING(v_delta, 2, 1) WHEN '+' THEN 1.01 WHEN '-' THEN 0.99 ELSE 1.0 END,
      CASE SUBSTRING(v_delta, 3, 1) WHEN '+' THEN 1.01 WHEN '-' THEN 0.99 ELSE 1.0 END,
      CASE SUBSTRING(v_delta, 4, 1) WHEN '+' THEN 1.01 WHEN '-' THEN 0.99 ELSE 1.0 END,
      CASE SUBSTRING(v_delta, 5, 1) WHEN '+' THEN 1.01 WHEN '-' THEN 0.99 ELSE 1.0 END
    );
  END LOOP;

  -- Drive -1% for absentees (in adventure.user_ids but not in attendance)
  SELECT adventure_id INTO v_adv_id FROM events WHERE id = p_event_id;

  FOR v_uid IN
    SELECT unnest(adv.user_ids)
    FROM adventures adv
    WHERE adv.id = v_adv_id
    EXCEPT
    SELECT unnest(p_attendance)
  LOOP
    PERFORM apply_stat_changes(v_uid, 1.0, 0.99, 1.0, 1.0, 1.0);
  END LOOP;
END;
$$;


ALTER FUNCTION public.summarize_event(p_event_id integer, p_attendance integer[], p_stats_delta character varying[], p_summary text) OWNER TO user1;

--
-- TOC entry 278 (class 1255 OID 16745)
-- Name: update_access_token(integer, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_access_token(p_id integer, p_role text, p_new_access_token text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  
  IF p_role NOT IN ('user', 'organizer', 'boss') THEN
    RETURN FALSE;
  END IF;
  
  IF p_role = 'user' THEN
    UPDATE users
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  IF p_role = 'organizer' THEN
    UPDATE organizers
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  IF p_role = 'boss' THEN
    UPDATE bosses
    SET access_token = p_new_access_token,
        refreshed_at = NOW()
    WHERE id = p_id;
    RETURN FOUND;
  END IF;
  
  RETURN FALSE;
END;
$$;


ALTER FUNCTION public.update_access_token(p_id integer, p_role text, p_new_access_token text) OWNER TO user1;

--
-- TOC entry 420 (class 1255 OID 18023)
-- Name: update_badge_roadmaps(integer, character varying[]); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_badge_roadmaps(p_badge_id integer, p_roadmaps character varying[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE badges SET roadmaps = p_roadmaps WHERE id = p_badge_id;
END;
$$;


ALTER FUNCTION public.update_badge_roadmaps(p_badge_id integer, p_roadmaps character varying[]) OWNER TO user1;

--
-- TOC entry 270 (class 1255 OID 18014)
-- Name: update_book_chapter(integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_book_chapter(p_book_id integer, p_chapter integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE books SET chapter = p_chapter WHERE id = p_book_id;
END;
$$;


ALTER FUNCTION public.update_book_chapter(p_book_id integer, p_chapter integer) OWNER TO user1;

--
-- TOC entry 317 (class 1255 OID 18015)
-- Name: update_book_progress(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_book_progress(p_book_id integer, p_last_event_id integer, p_last_penalty_count integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE books SET last_event_id = p_last_event_id, last_penalty_count = p_last_penalty_count WHERE id = p_book_id;
END;
$$;


ALTER FUNCTION public.update_book_progress(p_book_id integer, p_last_event_id integer, p_last_penalty_count integer) OWNER TO user1;

--
-- TOC entry 383 (class 1255 OID 16899)
-- Name: update_boss(integer, text, boolean, boolean, text, bytea); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_boss(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon bytea DEFAULT NULL::bytea) RETURNS boolean
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

  RETURN true;
END;
$$;


ALTER FUNCTION public.update_boss(p_id integer, p_username text, p_setting1 boolean, p_setting2 boolean, p_bio text, p_icon bytea) OWNER TO user1;

--
-- TOC entry 430 (class 1255 OID 17796)
-- Name: update_boss(integer, text, boolean, boolean, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_boss(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon_key text DEFAULT NULL::text) RETURNS SETOF public.bosses
    LANGUAGE sql
    AS $$
  UPDATE bosses SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;


ALTER FUNCTION public.update_boss(p_id integer, p_username text, p_setting1 boolean, p_setting2 boolean, p_bio text, p_icon_key text) OWNER TO user1;

--
-- TOC entry 349 (class 1255 OID 16896)
-- Name: update_organizer(integer, text, boolean, boolean, text, bytea); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_organizer(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon bytea DEFAULT NULL::bytea) RETURNS boolean
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

  RETURN true;
END;
$$;


ALTER FUNCTION public.update_organizer(p_id integer, p_username text, p_setting1 boolean, p_setting2 boolean, p_bio text, p_icon bytea) OWNER TO user1;

--
-- TOC entry 388 (class 1255 OID 17795)
-- Name: update_organizer(integer, text, boolean, boolean, text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_organizer(p_id integer, p_username text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_bio text DEFAULT NULL::text, p_icon_key text DEFAULT NULL::text) RETURNS SETOF public.organizers
    LANGUAGE sql
    AS $$
  UPDATE organizers SET
    username  = COALESCE(p_username, username),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    bio       = COALESCE(p_bio,      bio),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;


ALTER FUNCTION public.update_organizer(p_id integer, p_username text, p_setting1 boolean, p_setting2 boolean, p_bio text, p_icon_key text) OWNER TO user1;

--
-- TOC entry 294 (class 1255 OID 16748)
-- Name: update_poll_add_vote(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.update_poll_add_vote(p_adventure_id integer, p_poll_number integer, p_option_index integer, p_person_key text) OWNER TO user1;

--
-- TOC entry 303 (class 1255 OID 16749)
-- Name: update_poll_remove_vote(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

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


ALTER FUNCTION public.update_poll_remove_vote(p_adventure_id integer, p_poll_number integer, p_option_index integer, p_person_key text) OWNER TO user1;

--
-- TOC entry 281 (class 1255 OID 18016)
-- Name: update_story_chunk_content(integer, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_story_chunk_content(p_chunk_id integer, p_content text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE story_chunks SET content = p_content WHERE id = p_chunk_id;
END;
$$;


ALTER FUNCTION public.update_story_chunk_content(p_chunk_id integer, p_content text) OWNER TO user1;

--
-- TOC entry 271 (class 1255 OID 18043)
-- Name: update_story_chunk_with_stats(integer, text, jsonb); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_story_chunk_with_stats(p_chunk_id integer, p_content text, p_stat_changes jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE story_chunks SET content = p_content, stat_changes = p_stat_changes WHERE id = p_chunk_id;
END;
$$;


ALTER FUNCTION public.update_story_chunk_with_stats(p_chunk_id integer, p_content text, p_stat_changes jsonb) OWNER TO user1;

--
-- TOC entry 332 (class 1255 OID 18306)
-- Name: update_user(integer, text, text, text, boolean, boolean, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_user(p_id integer, p_username text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_setting1 boolean DEFAULT NULL::boolean, p_setting2 boolean DEFAULT NULL::boolean, p_icon_key text DEFAULT NULL::text) RETURNS SETOF public.users
    LANGUAGE sql
    AS $$
  UPDATE users SET
    username  = COALESCE(p_username, username),
    bio       = COALESCE(p_bio,      bio),
    email     = COALESCE(p_email,    email),
    setting_1 = COALESCE(p_setting1, setting_1),
    setting_2 = COALESCE(p_setting2, setting_2),
    icon_key  = COALESCE(p_icon_key, icon_key)
  WHERE id = p_id
  RETURNING *;
$$;


ALTER FUNCTION public.update_user(p_id integer, p_username text, p_bio text, p_email text, p_setting1 boolean, p_setting2 boolean, p_icon_key text) OWNER TO user1;

--
-- TOC entry 335 (class 1255 OID 16751)
-- Name: update_user_request_id(text, text); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.update_user_request_id(p_phone text, p_request_id text) RETURNS public.users
    LANGUAGE sql
    AS $$
  UPDATE users
  SET request_id = p_request_id
  WHERE phone = p_phone
  RETURNING *;
$$;


ALTER FUNCTION public.update_user_request_id(p_phone text, p_request_id text) OWNER TO user1;

--
-- TOC entry 416 (class 1255 OID 17944)
-- Name: upsert_rating(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: user1
--

CREATE FUNCTION public.upsert_rating(p_organizer_id integer, p_user_id integer, p_rating integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO ratings (organizer_id, user_id, rating)
  VALUES (p_organizer_id, p_user_id, p_rating)
  ON CONFLICT (organizer_id, user_id)
  DO UPDATE SET rating = p_rating, created_at = NOW();

  UPDATE organizers
  SET rating = (SELECT AVG(rating)::FLOAT FROM ratings WHERE organizer_id = p_organizer_id)
  WHERE id = p_organizer_id;
END;
$$;


ALTER FUNCTION public.upsert_rating(p_organizer_id integer, p_user_id integer, p_rating integer) OWNER TO user1;

--
-- TOC entry 232 (class 1259 OID 16752)
-- Name: adventures_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.adventures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.adventures_id_seq OWNER TO user1;

--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 232
-- Name: adventures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.adventures_id_seq OWNED BY public.adventures.id;


--
-- TOC entry 233 (class 1259 OID 16753)
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badges_id_seq OWNER TO user1;

--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 233
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- TOC entry 248 (class 1259 OID 17560)
-- Name: books; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.books (
    id integer NOT NULL,
    title character varying(20) NOT NULL,
    user_id integer NOT NULL,
    status public.book_status DEFAULT 'Writing'::public.book_status NOT NULL,
    theme_id integer,
    chapter integer DEFAULT 0 NOT NULL,
    last_event_id integer
);


ALTER TABLE public.books OWNER TO user1;

--
-- TOC entry 247 (class 1259 OID 17559)
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO user1;

--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 247
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- TOC entry 224 (class 1259 OID 16628)
-- Name: boss_qualifications; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.boss_qualifications (
    boss_id integer NOT NULL,
    badge_id integer NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.boss_qualifications OWNER TO user1;

--
-- TOC entry 234 (class 1259 OID 16754)
-- Name: bosses_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.bosses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bosses_id_seq OWNER TO user1;

--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 234
-- Name: bosses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.bosses_id_seq OWNED BY public.bosses.id;


--
-- TOC entry 235 (class 1259 OID 16755)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO user1;

--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 235
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 236 (class 1259 OID 16756)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO user1;

--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 236
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 255 (class 1259 OID 17877)
-- Name: legal_versions; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.legal_versions (
    app text NOT NULL,
    terms_version integer DEFAULT 1 NOT NULL,
    privacy_version integer DEFAULT 1 NOT NULL,
    CONSTRAINT legal_versions_app_check CHECK ((app = ANY (ARRAY['user'::text, 'guide'::text, 'expert'::text])))
);


ALTER TABLE public.legal_versions OWNER TO user1;

--
-- TOC entry 237 (class 1259 OID 16757)
-- Name: match_request_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.match_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_request_id_seq OWNER TO user1;

--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 237
-- Name: match_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.match_request_id_seq OWNED BY public.match_requests.id;


--
-- TOC entry 238 (class 1259 OID 16758)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO user1;

--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 238
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 266 (class 1259 OID 18328)
-- Name: ob_assertions; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.ob_assertions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    adventure_id integer NOT NULL,
    issued_on timestamp with time zone DEFAULT now() NOT NULL,
    credential_json jsonb NOT NULL,
    revoked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.ob_assertions OWNER TO user1;

--
-- TOC entry 244 (class 1259 OID 17009)
-- Name: organizer_qualifications; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.organizer_qualifications (
    organizer_id integer NOT NULL,
    category_id integer NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.organizer_qualifications OWNER TO user1;

--
-- TOC entry 239 (class 1259 OID 16759)
-- Name: organizers_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.organizers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.organizers_id_seq OWNER TO user1;

--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 239
-- Name: organizers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.organizers_id_seq OWNED BY public.organizers.id;


--
-- TOC entry 256 (class 1259 OID 17911)
-- Name: pending_signups_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.pending_signups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_signups_id_seq OWNER TO user1;

--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 256
-- Name: pending_signups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.pending_signups_id_seq OWNED BY public.pending_signups.id;


--
-- TOC entry 240 (class 1259 OID 16760)
-- Name: private_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.private_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.private_messages_id_seq OWNER TO user1;

--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 240
-- Name: private_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.private_messages_id_seq OWNED BY public.private_messages.id;


--
-- TOC entry 267 (class 1259 OID 18432)
-- Name: prop_badge_relations; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.prop_badge_relations (
    prop_id integer NOT NULL,
    badge_id integer NOT NULL
);


ALTER TABLE public.prop_badge_relations OWNER TO user1;

--
-- TOC entry 263 (class 1259 OID 18129)
-- Name: props; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.props (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    space_id integer NOT NULL
);


ALTER TABLE public.props OWNER TO user1;

--
-- TOC entry 262 (class 1259 OID 18128)
-- Name: props_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.props_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.props_id_seq OWNER TO user1;

--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 262
-- Name: props_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.props_id_seq OWNED BY public.props.id;


--
-- TOC entry 258 (class 1259 OID 17927)
-- Name: ratings; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.ratings (
    organizer_id integer NOT NULL,
    user_id integer NOT NULL,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO user1;

--
-- TOC entry 252 (class 1259 OID 17702)
-- Name: signup_links; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.signup_links (
    id integer NOT NULL,
    token text NOT NULL,
    role text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    kyc_folder text,
    CONSTRAINT chk_signup_link_role CHECK ((role = ANY (ARRAY['organizer'::text, 'boss'::text])))
);


ALTER TABLE public.signup_links OWNER TO user1;

--
-- TOC entry 251 (class 1259 OID 17701)
-- Name: signup_links_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.signup_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.signup_links_id_seq OWNER TO user1;

--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 251
-- Name: signup_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.signup_links_id_seq OWNED BY public.signup_links.id;


--
-- TOC entry 264 (class 1259 OID 18159)
-- Name: slots_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slots_id_seq OWNER TO user1;

--
-- TOC entry 4486 (class 0 OID 0)
-- Dependencies: 264
-- Name: slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.slots_id_seq OWNED BY public.slots.id;


--
-- TOC entry 261 (class 1259 OID 18113)
-- Name: space_category_relations; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.space_category_relations (
    space_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.space_category_relations OWNER TO user1;


--
-- Wallet & Payment Infrastructure
--

CREATE TABLE public.wallets (
    user_id   INTEGER PRIMARY KEY REFERENCES public.users(id),
    balance   BIGINT  NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

ALTER TABLE public.wallets OWNER TO user1;

CREATE TYPE public.wallet_tx_type   AS ENUM ('topup', 'lobby_debit', 'lobby_refund');
CREATE TYPE public.wallet_tx_status AS ENUM ('created', 'success', 'failed');

CREATE TABLE public.wallet_transactions (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES public.users(id),
    type                 public.wallet_tx_type NOT NULL,
    amount_paise         BIGINT NOT NULL CHECK (amount_paise > 0),
    razorpay_order_id    TEXT,
    razorpay_payment_id  TEXT,
    match_request_id     INTEGER,
    status               public.wallet_tx_status NOT NULL DEFAULT 'created',
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions OWNER TO user1;

CREATE TYPE public.payout_recipient AS ENUM ('boss', 'organizer', 'platform');
CREATE TYPE public.payout_status    AS ENUM ('held', 'released', 'failed');

CREATE TABLE public.payouts (
    id                   SERIAL PRIMARY KEY,
    adventure_id         INTEGER NOT NULL REFERENCES public.adventures(id),
    recipient_type       public.payout_recipient NOT NULL,
    recipient_id         INTEGER NOT NULL,
    amount_paise         BIGINT NOT NULL CHECK (amount_paise > 0),
    razorpay_transfer_id TEXT,
    status               public.payout_status NOT NULL DEFAULT 'held',
    hold_until           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payouts OWNER TO user1;

ALTER TABLE public.bosses     ADD COLUMN razorpay_account_id TEXT;
ALTER TABLE public.organizers ADD COLUMN razorpay_account_id TEXT;


--
-- Wallet DB functions
--

CREATE FUNCTION public.ensure_wallet(p_user_id integer) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  INSERT INTO wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id;
  RETURN v_balance;
END;
$$;

ALTER FUNCTION public.ensure_wallet(p_user_id integer) OWNER TO user1;

CREATE FUNCTION public.credit_wallet(p_user_id integer, p_amount bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET balance = wallets.balance + p_amount;
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id;
  RETURN v_balance;
END;
$$;

ALTER FUNCTION public.credit_wallet(p_user_id integer, p_amount bigint) OWNER TO user1;

CREATE FUNCTION public.debit_wallet(p_user_id integer, p_amount bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  UPDATE wallets SET balance = balance - p_amount
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO v_balance;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  RETURN v_balance;
END;
$$;

ALTER FUNCTION public.debit_wallet(p_user_id integer, p_amount bigint) OWNER TO user1;

CREATE FUNCTION public.create_payout(
  p_adventure_id integer,
  p_recipient_type public.payout_recipient,
  p_recipient_id integer,
  p_amount_paise bigint,
  p_hold_until timestamptz
) RETURNS integer
    LANGUAGE sql
    AS $$
  INSERT INTO payouts (adventure_id, recipient_type, recipient_id, amount_paise, hold_until)
  VALUES (p_adventure_id, p_recipient_type, p_recipient_id, p_amount_paise, p_hold_until)
  RETURNING id;
$$;

ALTER FUNCTION public.create_payout(integer, public.payout_recipient, integer, bigint, timestamptz) OWNER TO user1;

--
-- TOC entry 259 (class 1259 OID 18104)
-- Name: spaces_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.spaces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spaces_id_seq OWNER TO user1;

--
-- TOC entry 4488 (class 0 OID 0)
-- Dependencies: 259
-- Name: spaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.spaces_id_seq OWNED BY public.spaces.id;


--
-- TOC entry 254 (class 1259 OID 17802)
-- Name: story_chunks; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.story_chunks (
    id integer NOT NULL,
    book_id integer NOT NULL,
    chapter integer NOT NULL,
    seq integer NOT NULL,
    kind text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id integer,
    CONSTRAINT story_chunks_kind_check CHECK ((kind = ANY (ARRAY['open'::text, 'proceed'::text, 'conclusion'::text])))
);


ALTER TABLE public.story_chunks OWNER TO user1;

--
-- TOC entry 253 (class 1259 OID 17801)
-- Name: story_chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.story_chunks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.story_chunks_id_seq OWNER TO user1;

--
-- TOC entry 4490 (class 0 OID 0)
-- Dependencies: 253
-- Name: story_chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.story_chunks_id_seq OWNED BY public.story_chunks.id;


--
-- TOC entry 246 (class 1259 OID 17548)
-- Name: themes; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.themes (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    description character varying(200)
);


ALTER TABLE public.themes OWNER TO user1;

--
-- TOC entry 245 (class 1259 OID 17547)
-- Name: themes_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.themes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.themes_id_seq OWNER TO user1;

--
-- TOC entry 4492 (class 0 OID 0)
-- Dependencies: 245
-- Name: themes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.themes_id_seq OWNED BY public.themes.id;


--
-- TOC entry 249 (class 1259 OID 17655)
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO user1;

--
-- TOC entry 4493 (class 0 OID 0)
-- Dependencies: 249
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- TOC entry 241 (class 1259 OID 16761)
-- Name: tournaments_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.tournaments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournaments_id_seq OWNER TO user1;

--
-- TOC entry 4494 (class 0 OID 0)
-- Dependencies: 241
-- Name: tournaments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.tournaments_id_seq OWNED BY public.tournaments.id;


--
-- TOC entry 243 (class 1259 OID 16902)
-- Name: user_qualifications; Type: TABLE; Schema: public; Owner: user1
--

CREATE TABLE public.user_qualifications (
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_qualifications OWNER TO user1;

--
-- TOC entry 242 (class 1259 OID 16762)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user1
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO user1;

--
-- TOC entry 4496 (class 0 OID 0)
-- Dependencies: 242
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user1
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4116 (class 2604 OID 16763)
-- Name: adventures id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures ALTER COLUMN id SET DEFAULT nextval('public.adventures_id_seq'::regclass);


--
-- TOC entry 4094 (class 2604 OID 16764)
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- TOC entry 4141 (class 2604 OID 17563)
-- Name: books id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- TOC entry 4086 (class 2604 OID 16765)
-- Name: bosses id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.bosses ALTER COLUMN id SET DEFAULT nextval('public.bosses_id_seq'::regclass);


--
-- TOC entry 4095 (class 2604 OID 16766)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4113 (class 2604 OID 16767)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 4120 (class 2604 OID 16768)
-- Name: match_requests id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests ALTER COLUMN id SET DEFAULT nextval('public.match_request_id_seq'::regclass);


--
-- TOC entry 4090 (class 2604 OID 16769)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 4096 (class 2604 OID 16770)
-- Name: organizers id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizers ALTER COLUMN id SET DEFAULT nextval('public.organizers_id_seq'::regclass);


--
-- TOC entry 4155 (class 2604 OID 17915)
-- Name: pending_signups id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.pending_signups ALTER COLUMN id SET DEFAULT nextval('public.pending_signups_id_seq'::regclass);


--
-- TOC entry 4092 (class 2604 OID 16771)
-- Name: private_messages id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.private_messages ALTER COLUMN id SET DEFAULT nextval('public.private_messages_id_seq'::regclass);


--
-- TOC entry 4159 (class 2604 OID 18132)
-- Name: props id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.props ALTER COLUMN id SET DEFAULT nextval('public.props_id_seq'::regclass);


--
-- TOC entry 4149 (class 2604 OID 17705)
-- Name: signup_links id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.signup_links ALTER COLUMN id SET DEFAULT nextval('public.signup_links_id_seq'::regclass);


--
-- TOC entry 4160 (class 2604 OID 18163)
-- Name: slots id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.slots ALTER COLUMN id SET DEFAULT nextval('public.slots_id_seq'::regclass);


--
-- TOC entry 4158 (class 2604 OID 18108)
-- Name: spaces id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.spaces ALTER COLUMN id SET DEFAULT nextval('public.spaces_id_seq'::regclass);


--
-- TOC entry 4151 (class 2604 OID 17805)
-- Name: story_chunks id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.story_chunks ALTER COLUMN id SET DEFAULT nextval('public.story_chunks_id_seq'::regclass);


--
-- TOC entry 4140 (class 2604 OID 17551)
-- Name: themes id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.themes ALTER COLUMN id SET DEFAULT nextval('public.themes_id_seq'::regclass);


--
-- TOC entry 4144 (class 2604 OID 17659)
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- TOC entry 4109 (class 2604 OID 16772)
-- Name: tournaments id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN id SET DEFAULT nextval('public.tournaments_id_seq'::regclass);


--
-- TOC entry 4125 (class 2604 OID 16773)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4204 (class 2606 OID 16775)
-- Name: adventures adventures_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_pkey PRIMARY KEY (id);


--
-- TOC entry 4185 (class 2606 OID 16777)
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- TOC entry 4223 (class 2606 OID 17568)
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- TOC entry 4175 (class 2606 OID 16779)
-- Name: bosses bosses_email_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.bosses
    ADD CONSTRAINT bosses_email_key UNIQUE (email);


--
-- TOC entry 4177 (class 2606 OID 16781)
-- Name: bosses bosses_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.bosses
    ADD CONSTRAINT bosses_pkey PRIMARY KEY (id);


--
-- TOC entry 4187 (class 2606 OID 16783)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4201 (class 2606 OID 16785)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4238 (class 2606 OID 17886)
-- Name: legal_versions legal_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.legal_versions
    ADD CONSTRAINT legal_versions_pkey PRIMARY KEY (app);


--
-- TOC entry 4206 (class 2606 OID 16787)
-- Name: match_requests match_request_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT match_request_pkey PRIMARY KEY (id);


--
-- TOC entry 4179 (class 2606 OID 16789)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4255 (class 2606 OID 18337)
-- Name: ob_assertions ob_assertions_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ob_assertions
    ADD CONSTRAINT ob_assertions_pkey PRIMARY KEY (id);


--
-- TOC entry 4219 (class 2606 OID 17013)
-- Name: organizer_qualifications organizer_qualifications_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizer_qualifications
    ADD CONSTRAINT organizer_qualifications_pkey PRIMARY KEY (organizer_id, category_id);


--
-- TOC entry 4189 (class 2606 OID 16791)
-- Name: organizers organizers_email_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_email_key UNIQUE (email);


--
-- TOC entry 4191 (class 2606 OID 16793)
-- Name: organizers organizers_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_pkey PRIMARY KEY (id);


--
-- TOC entry 4240 (class 2606 OID 17921)
-- Name: pending_signups pending_signups_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.pending_signups
    ADD CONSTRAINT pending_signups_pkey PRIMARY KEY (id);


--
-- TOC entry 4242 (class 2606 OID 17923)
-- Name: pending_signups pending_signups_token_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.pending_signups
    ADD CONSTRAINT pending_signups_token_key UNIQUE (token);


--
-- TOC entry 4209 (class 2606 OID 16795)
-- Name: pending_users pending_users_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.pending_users
    ADD CONSTRAINT pending_users_pkey PRIMARY KEY (request_id);


--
-- TOC entry 4183 (class 2606 OID 16797)
-- Name: private_messages private_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4257 (class 2606 OID 18436)
-- Name: prop_badge_relations prop_badge_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.prop_badge_relations
    ADD CONSTRAINT prop_badge_relations_pkey PRIMARY KEY (prop_id, badge_id);


--
-- TOC entry 4250 (class 2606 OID 18135)
-- Name: props props_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT props_pkey PRIMARY KEY (id);


--
-- TOC entry 4244 (class 2606 OID 17933)
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (organizer_id, user_id);


--
-- TOC entry 4230 (class 2606 OID 17711)
-- Name: signup_links signup_links_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.signup_links
    ADD CONSTRAINT signup_links_pkey PRIMARY KEY (id);


--
-- TOC entry 4232 (class 2606 OID 17713)
-- Name: signup_links signup_links_token_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.signup_links
    ADD CONSTRAINT signup_links_token_key UNIQUE (token);


--
-- TOC entry 4252 (class 2606 OID 18166)
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- TOC entry 4248 (class 2606 OID 18117)
-- Name: space_category_relations space_category_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.space_category_relations
    ADD CONSTRAINT space_category_relations_pkey PRIMARY KEY (space_id, category_id);


--
-- TOC entry 4246 (class 2606 OID 18112)
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- TOC entry 4234 (class 2606 OID 17814)
-- Name: story_chunks story_chunks_book_id_chapter_seq_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.story_chunks
    ADD CONSTRAINT story_chunks_book_id_chapter_seq_key UNIQUE (book_id, chapter, seq);


--
-- TOC entry 4236 (class 2606 OID 17812)
-- Name: story_chunks story_chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.story_chunks
    ADD CONSTRAINT story_chunks_pkey PRIMARY KEY (id);


--
-- TOC entry 4221 (class 2606 OID 17553)
-- Name: themes themes_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- TOC entry 4227 (class 2606 OID 17669)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 4199 (class 2606 OID 16799)
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (id);


--
-- TOC entry 4193 (class 2606 OID 16801)
-- Name: polls unique_poll_per_adventure; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT unique_poll_per_adventure UNIQUE (adventure_id, poll_number);


--
-- TOC entry 4197 (class 2606 OID 16803)
-- Name: results unique_result_per_adventure; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT unique_result_per_adventure UNIQUE (adventure_id, result_number);


--
-- TOC entry 4211 (class 2606 OID 17045)
-- Name: users unique_username; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_username UNIQUE (username);


--
-- TOC entry 4195 (class 2606 OID 16805)
-- Name: boss_qualifications uq_boss_badge; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT uq_boss_badge UNIQUE (boss_id, badge_id);


--
-- TOC entry 4217 (class 2606 OID 16906)
-- Name: user_qualifications uq_user_badge; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.user_qualifications
    ADD CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id);


--
-- TOC entry 4213 (class 2606 OID 16809)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 4215 (class 2606 OID 16811)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4202 (class 1259 OID 16812)
-- Name: idx_events_adventure; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_events_adventure ON public.events USING btree (adventure_id);


--
-- TOC entry 4180 (class 1259 OID 16813)
-- Name: idx_inbox_latest; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_inbox_latest ON public.private_messages USING btree (receiver_id, receiver_role, sent_at DESC);


--
-- TOC entry 4253 (class 1259 OID 18353)
-- Name: idx_ob_assertions_user; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_ob_assertions_user ON public.ob_assertions USING btree (user_id);


--
-- TOC entry 4207 (class 1259 OID 16814)
-- Name: idx_pending_users_expires; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_pending_users_expires ON public.pending_users USING btree (expires_at);


--
-- TOC entry 4181 (class 1259 OID 16815)
-- Name: idx_sent_latest; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_sent_latest ON public.private_messages USING btree (sender_id, sender_role, sent_at DESC);


--
-- TOC entry 4228 (class 1259 OID 17714)
-- Name: idx_signup_links_email; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_signup_links_email ON public.signup_links USING btree (email);


--
-- TOC entry 4224 (class 1259 OID 17670)
-- Name: idx_tickets_status; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_tickets_status ON public.tickets USING btree (status);


--
-- TOC entry 4225 (class 1259 OID 17671)
-- Name: idx_tickets_type; Type: INDEX; Schema: public; Owner: user1
--

CREATE INDEX idx_tickets_type ON public.tickets USING btree (type);


--
-- TOC entry 4267 (class 2606 OID 17646)
-- Name: adventures adventures_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- TOC entry 4268 (class 2606 OID 16816)
-- Name: adventures adventures_boss_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_boss_id_fkey FOREIGN KEY (boss_id) REFERENCES public.bosses(id) ON DELETE SET NULL;


--
-- TOC entry 4269 (class 2606 OID 18182)
-- Name: adventures adventures_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT adventures_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE SET NULL;


--
-- TOC entry 4281 (class 2606 OID 17574)
-- Name: books books_theme_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE SET NULL;


--
-- TOC entry 4282 (class 2606 OID 17569)
-- Name: books books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4265 (class 2606 OID 16821)
-- Name: events events_adventure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_adventure_id_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id) ON DELETE SET NULL;


--
-- TOC entry 4266 (class 2606 OID 18188)
-- Name: events events_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.slots(id) ON DELETE SET NULL;


--
-- TOC entry 4258 (class 2606 OID 16826)
-- Name: messages fk_adventure; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_adventure FOREIGN KEY (adventure_id) REFERENCES public.adventures(id);


--
-- TOC entry 4264 (class 2606 OID 16831)
-- Name: tournaments fk_adventure; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT fk_adventure FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- TOC entry 4270 (class 2606 OID 16836)
-- Name: adventures fk_adventure_organizer; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT fk_adventure_organizer FOREIGN KEY (organizer_id) REFERENCES public.organizers(id);


--
-- TOC entry 4261 (class 2606 OID 16841)
-- Name: boss_qualifications fk_badge; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT fk_badge FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- TOC entry 4277 (class 2606 OID 16907)
-- Name: user_qualifications fk_badge; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.user_qualifications
    ADD CONSTRAINT fk_badge FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- TOC entry 4262 (class 2606 OID 16851)
-- Name: boss_qualifications fk_boss; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.boss_qualifications
    ADD CONSTRAINT fk_boss FOREIGN KEY (boss_id) REFERENCES public.bosses(id) ON DELETE CASCADE;


--
-- TOC entry 4272 (class 2606 OID 16856)
-- Name: match_requests fk_boss; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_boss FOREIGN KEY (boss_id) REFERENCES public.bosses(id);


--
-- TOC entry 4271 (class 2606 OID 16861)
-- Name: adventures fk_categories; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.adventures
    ADD CONSTRAINT fk_categories FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4259 (class 2606 OID 16866)
-- Name: badges fk_categories; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT fk_categories FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4273 (class 2606 OID 16871)
-- Name: match_requests fk_category; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 4279 (class 2606 OID 17019)
-- Name: organizer_qualifications fk_oq_categories; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizer_qualifications
    ADD CONSTRAINT fk_oq_categories FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4280 (class 2606 OID 17014)
-- Name: organizer_qualifications fk_oq_organizers; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.organizer_qualifications
    ADD CONSTRAINT fk_oq_organizers FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4274 (class 2606 OID 16876)
-- Name: match_requests fk_org; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES public.organizers(id);


--
-- TOC entry 4278 (class 2606 OID 16912)
-- Name: user_qualifications fk_user; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.user_qualifications
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4275 (class 2606 OID 17025)
-- Name: match_requests match_requests_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT match_requests_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- TOC entry 4276 (class 2606 OID 18173)
-- Name: match_requests match_requests_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.match_requests
    ADD CONSTRAINT match_requests_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE SET NULL;


--
-- TOC entry 4290 (class 2606 OID 18348)
-- Name: ob_assertions ob_assertions_adventure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ob_assertions
    ADD CONSTRAINT ob_assertions_adventure_id_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id);


--
-- TOC entry 4291 (class 2606 OID 18343)
-- Name: ob_assertions ob_assertions_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ob_assertions
    ADD CONSTRAINT ob_assertions_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- TOC entry 4292 (class 2606 OID 18338)
-- Name: ob_assertions ob_assertions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ob_assertions
    ADD CONSTRAINT ob_assertions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4260 (class 2606 OID 16886)
-- Name: polls polls_adventure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.polls
    ADD CONSTRAINT polls_adventure_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4263 (class 2606 OID 16891)
-- Name: results polls_adventure_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT polls_adventure_fkey FOREIGN KEY (adventure_id) REFERENCES public.adventures(id);


--
-- TOC entry 4293 (class 2606 OID 18442)
-- Name: prop_badge_relations prop_badge_relations_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.prop_badge_relations
    ADD CONSTRAINT prop_badge_relations_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--
-- TOC entry 4294 (class 2606 OID 18437)
-- Name: prop_badge_relations prop_badge_relations_prop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.prop_badge_relations
    ADD CONSTRAINT prop_badge_relations_prop_id_fkey FOREIGN KEY (prop_id) REFERENCES public.props(id) ON DELETE CASCADE;


--
-- TOC entry 4288 (class 2606 OID 18141)
-- Name: props props_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.props
    ADD CONSTRAINT props_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- TOC entry 4284 (class 2606 OID 17934)
-- Name: ratings ratings_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;


--
-- TOC entry 4285 (class 2606 OID 17939)
-- Name: ratings ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4289 (class 2606 OID 18167)
-- Name: slots slots_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- TOC entry 4286 (class 2606 OID 18123)
-- Name: space_category_relations space_category_relations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.space_category_relations
    ADD CONSTRAINT space_category_relations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 4287 (class 2606 OID 18118)
-- Name: space_category_relations space_category_relations_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.space_category_relations
    ADD CONSTRAINT space_category_relations_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON DELETE CASCADE;


--
-- TOC entry 4283 (class 2606 OID 17815)
-- Name: story_chunks story_chunks_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user1
--

ALTER TABLE ONLY public.story_chunks
    ADD CONSTRAINT story_chunks_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO cloudsqlsuperuser;
GRANT USAGE ON SCHEMA public TO "navneeth@yuktiengine.com";


--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE spaces; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.spaces TO "navneeth@yuktiengine.com";


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE slots; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.slots TO "navneeth@yuktiengine.com";


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE events; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.events TO "navneeth@yuktiengine.com";


--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE tickets; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.tickets TO "navneeth@yuktiengine.com";


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE adventures; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.adventures TO "navneeth@yuktiengine.com";


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE match_requests; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.match_requests TO "navneeth@yuktiengine.com";


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE users; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.users TO "navneeth@yuktiengine.com";


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE pending_users; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.pending_users TO "navneeth@yuktiengine.com";


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.categories TO "navneeth@yuktiengine.com";


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE badges; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.badges TO "navneeth@yuktiengine.com";


--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE bosses; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.bosses TO "navneeth@yuktiengine.com";


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.messages TO "navneeth@yuktiengine.com";


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE private_messages; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.private_messages TO "navneeth@yuktiengine.com";


--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE organizers; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.organizers TO "navneeth@yuktiengine.com";


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE pending_signups; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.pending_signups TO "navneeth@yuktiengine.com";


--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE polls; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.polls TO "navneeth@yuktiengine.com";


--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE results; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.results TO "navneeth@yuktiengine.com";


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE tournaments; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.tournaments TO "navneeth@yuktiengine.com";


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE books; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.books TO "navneeth@yuktiengine.com";


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE boss_qualifications; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.boss_qualifications TO "navneeth@yuktiengine.com";


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE legal_versions; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.legal_versions TO "navneeth@yuktiengine.com";


--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE ob_assertions; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.ob_assertions TO "navneeth@yuktiengine.com";


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE organizer_qualifications; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.organizer_qualifications TO "navneeth@yuktiengine.com";


--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE prop_badge_relations; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.prop_badge_relations TO "navneeth@yuktiengine.com";


--
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE props; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.props TO "navneeth@yuktiengine.com";


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE ratings; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.ratings TO "navneeth@yuktiengine.com";


--
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE signup_links; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.signup_links TO "navneeth@yuktiengine.com";


--
-- TOC entry 4487 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE space_category_relations; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.space_category_relations TO "navneeth@yuktiengine.com";


--
-- TOC entry 4489 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE story_chunks; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.story_chunks TO "navneeth@yuktiengine.com";


--
-- TOC entry 4491 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE themes; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.themes TO "navneeth@yuktiengine.com";


--
-- TOC entry 4495 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE user_qualifications; Type: ACL; Schema: public; Owner: user1
--

GRANT SELECT ON TABLE public.user_qualifications TO "navneeth@yuktiengine.com";


--
-- TOC entry 2342 (class 826 OID 16934)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: user1
--

ALTER DEFAULT PRIVILEGES FOR ROLE user1 IN SCHEMA public GRANT SELECT ON TABLES TO "navneeth@yuktiengine.com";


-- Completed on 2026-05-27 15:28:00

--
-- PostgreSQL database dump complete
--

\unrestrict RT1hra8XZH7zcQdCfVwUwEneRJ3d5zXR7BQGE1NncmnhajrRzsagCIah0u2gjrK

