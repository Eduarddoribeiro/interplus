-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.get_experimental_occupation (
  p_category_id bigint,
  p_start_date  date,
  p_end_date    date
)
  RETURNS TABLE (
    experimental_date date,
    booked            bigint
  )
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select
    c.experimental_date,
    count(*) as booked
  from public.contacts c
  where c.category_id = p_category_id
    and c.experimental_date between p_start_date and p_end_date
    and c.status in ('pending_confirmation', 'confirmed')
  group by c.experimental_date;
$function$;

REVOKE ALL ON FUNCTION public.get_experimental_occupation(bigint, date, date) FROM PUBLIC;

GRANT ALL ON FUNCTION public.get_experimental_occupation(bigint, date, date) TO anon;

GRANT ALL ON FUNCTION public.get_experimental_occupation(bigint, date, date) TO authenticated;

GRANT ALL ON FUNCTION public.get_experimental_occupation(bigint, date, date) TO service_role;

CREATE TABLE public.categories (
  id                 bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  name               text                     NOT NULL,
  min_birth_date     date                     NOT NULL,
  max_birth_date     date                     NOT NULL,
  active             boolean                  DEFAULT true,
  order_index        integer                  DEFAULT 0,
  created_at         timestamp with time zone DEFAULT now(),
  weekday            text,
  start_time         time without time zone,
  end_time           time without time zone,
  training_day       text,
  training_start     time without time zone,
  training_end       time without time zone,
  experimental_limit integer                  DEFAULT 5,
  trial_status       text                     DEFAULT 'open'::text NOT NULL
);

ALTER TABLE public.categories
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

GRANT ALL ON public.categories TO anon;

GRANT ALL ON public.categories TO authenticated;

GRANT ALL ON public.categories TO service_role;

CREATE POLICY "Read active categories" ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING ((active = true));

CREATE TABLE public.contacts (
  id                   uuid                     DEFAULT gen_random_uuid() NOT NULL,
  child_name           text,
  birth_date           date,
  responsible_name     text,
  phone                text                     NOT NULL,
  email                text,
  source               text,
  neighborhood         text,
  trained_elsewhere    boolean                  DEFAULT false,
  observations         text,
  internal_notes       text,
  status               text                     DEFAULT 'new_contact'::text NOT NULL,
  experimental_date    date,
  experimental_time    time without time zone,
  unit                 text                     DEFAULT 'Viamão'::text,
  created_at           timestamp with time zone DEFAULT now(),
  updated_at           timestamp with time zone,
  previous_club        text,
  category_id          bigint,
  follow_up_date       date,
  enrolled_at          timestamp with time zone,
  experimental_result  text,
  lost_reason          text,
  waiting_list_reason  text,
  waiting_list_notes   text,
  waiting_list_at      timestamp with time zone,
  entry_channel        text,
  first_contact_at     date,
  enrollment_status    text,
  left_at              timestamp with time zone,
  left_reason          text,
  follow_up_started_at timestamp with time zone,
  follow_up_attempts   integer                  DEFAULT 0 NOT NULL,
  last_follow_up_at    timestamp with time zone,
  interest_category_id bigint,
  preferred_shift      text,
  qualification_status text
);

ALTER TABLE public.contacts
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_enrollment_status_check CHECK (enrollment_status IS NULL OR (enrollment_status = ANY (ARRAY['active'::text, 'cancelled'::text])));

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_experimental_result_check CHECK (experimental_result IS NULL OR (experimental_result = ANY (ARRAY['enrolled'::text, 'follow_up'::text, 'lost'::text])));

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_interest_category_id_fkey FOREIGN KEY (interest_category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_preferred_shift_check CHECK (preferred_shift IS NULL OR (preferred_shift = ANY (ARRAY['morning'::text, 'afternoon'::text, 'evening'::text, 'any'::text])));

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_qualification_status_check
    CHECK (qualification_status IS NULL OR (qualification_status = ANY (ARRAY['complete'::text, 'incomplete'::text, 'needs_confirmation'::text])));

GRANT ALL ON public.contacts TO anon;

GRANT ALL ON public.contacts TO authenticated;

GRANT ALL ON public.contacts TO service_role;

CREATE INDEX idx_contacts_status ON public.contacts (status);

CREATE INDEX contacts_interest_category_id_idx ON public.contacts (interest_category_id);

CREATE INDEX idx_contacts_phone ON public.contacts (phone);

CREATE INDEX idx_contacts_experimental_date ON public.contacts (experimental_date);

CREATE INDEX contacts_preferred_shift_idx ON public.contacts (preferred_shift);

CREATE INDEX contacts_qualification_status_idx ON public.contacts (qualification_status);

CREATE POLICY "Allow anonymous select" ON public.contacts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated select" ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated update" ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public contact insert" ON public.contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE public.experimental_sessions (
  id                 uuid                     DEFAULT gen_random_uuid() NOT NULL,
  contact_id         uuid                     NOT NULL,
  category_id        bigint,
  experimental_date  date                     NOT NULL,
  experimental_time  time without time zone,
  status             text                     DEFAULT 'pending_confirmation'::text NOT NULL,
  notes              text,
  created_at         timestamp with time zone DEFAULT now() NOT NULL,
  updated_at         timestamp with time zone DEFAULT now() NOT NULL,
  coach_notes        text,
  preferred_position text
);

ALTER TABLE public.experimental_sessions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.experimental_sessions
  ADD CONSTRAINT experimental_sessions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE public.experimental_sessions
  ADD CONSTRAINT experimental_sessions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE public.experimental_sessions
  ADD CONSTRAINT experimental_sessions_pkey PRIMARY KEY (id);

ALTER TABLE public.experimental_sessions
  ADD CONSTRAINT experimental_sessions_status_check
    CHECK (status = ANY (ARRAY['pending_confirmation'::text, 'confirmed'::text, 'attended'::text, 'no_show'::text, 'cancelled'::text]));

GRANT ALL ON public.experimental_sessions TO anon;

GRANT ALL ON public.experimental_sessions TO authenticated;

GRANT ALL ON public.experimental_sessions TO service_role;

CREATE INDEX experimental_sessions_contact_id_idx ON public.experimental_sessions (contact_id);

CREATE INDEX experimental_sessions_status_idx ON public.experimental_sessions (status);

CREATE INDEX experimental_sessions_date_idx ON public.experimental_sessions (experimental_date);

CREATE POLICY experimental_sessions_delete ON public.experimental_sessions
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY experimental_sessions_insert ON public.experimental_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY experimental_sessions_select ON public.experimental_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY experimental_sessions_update ON public.experimental_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.schedules (
  id          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_id bigint                   NOT NULL,
  name        text                     NOT NULL,
  coach       text,
  vacancies   integer                  DEFAULT 30,
  active      boolean                  DEFAULT true,
  created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE public.schedules
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);

GRANT ALL ON public.schedules TO anon;

GRANT ALL ON public.schedules TO authenticated;

GRANT ALL ON public.schedules TO service_role;
