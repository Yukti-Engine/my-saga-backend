CREATE OR REPLACE FUNCTION public.get_qualifications(
    p_id   integer,
    p_role text
)
    RETURNS SETOF integer
    LANGUAGE plpgsql
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
BEGIN
    IF p_role = 'boss' THEN
        RETURN QUERY SELECT badge_id FROM boss_qualifications WHERE boss_id = p_id;
    ELSIF p_role = 'user' THEN
        RETURN QUERY SELECT badge_id FROM user_qualifications WHERE user_id = p_id;
    ELSIF p_role = 'organizer' THEN
        RETURN QUERY SELECT category_id FROM organizer_qualifications WHERE organizer_id = p_id;
    END IF;
END;
$BODY$;
