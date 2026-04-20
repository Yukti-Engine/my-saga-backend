ALTER TABLE public.user_qualifications
  ADD COLUMN IF NOT EXISTS earned_at timestamp with time zone DEFAULT now() NOT NULL;
