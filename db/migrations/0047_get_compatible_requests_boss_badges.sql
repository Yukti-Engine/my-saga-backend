DROP FUNCTION IF EXISTS public.get_compatible_requests(text, integer, integer, double precision, double precision, text);

CREATE OR REPLACE FUNCTION public.get_compatible_requests(
  p_role       text,
  p_category_id integer,
  p_badge_ids  integer[],
  p_age        integer,
  p_latitude   double precision,
  p_longitude  double precision,
  p_gender     text
) RETURNS SETOF public.match_requests
LANGUAGE sql AS $$
  SELECT * FROM match_requests
  WHERE
    (
      (p_role = 'user' AND category_id = p_category_id)
      OR (p_role = 'boss' AND badge_id = ANY(p_badge_ids))
    )
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
