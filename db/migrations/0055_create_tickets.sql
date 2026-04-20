CREATE TABLE IF NOT EXISTS public.tickets (
  id serial PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  CONSTRAINT chk_tickets_type CHECK (type IN (
    'organizer_join_request',
    'report_user',
    'report_organizer',
    'report_boss'
  )),
  CONSTRAINT chk_tickets_status CHECK (status IN ('open', 'approved', 'rejected', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON public.tickets (type);
