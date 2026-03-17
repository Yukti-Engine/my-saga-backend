CREATE TABLE IF NOT EXISTS public.user_qualifications
(
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id),
    CONSTRAINT fk_badge FOREIGN KEY (badge_id)
        REFERENCES public.badges (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);
