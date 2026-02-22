-- Create Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    title text NOT NULL,
    type text NOT NULL, -- 'Feriado', 'Reunião', 'Evento', etc.
    date date NOT NULL,
    description text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Note: Policies cannot use IF NOT EXISTS easily without DO block.
-- We assume if you get an error here, the policy already exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_policies
        WHERE  schemaname = 'public'
        AND    tablename = 'calendar_events'
        AND    policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.calendar_events
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM   pg_policies
        WHERE  schemaname = 'public'
        AND    tablename = 'calendar_events'
        AND    policyname = 'Enable insert for admins only'
    ) THEN
        CREATE POLICY "Enable insert for admins only" ON public.calendar_events
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM   pg_policies
        WHERE  schemaname = 'public'
        AND    tablename = 'calendar_events'
        AND    policyname = 'Enable update for admins only'
    ) THEN
        CREATE POLICY "Enable update for admins only" ON public.calendar_events
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM   pg_policies
        WHERE  schemaname = 'public'
        AND    tablename = 'calendar_events'
        AND    policyname = 'Enable delete for admins only'
    ) THEN
        CREATE POLICY "Enable delete for admins only" ON public.calendar_events
            FOR DELETE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
                )
            );
    END IF;
END
$$;

-- Add to Realtime Publication (checking if it is already a member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'calendar_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
  END IF;
END;
$$;
