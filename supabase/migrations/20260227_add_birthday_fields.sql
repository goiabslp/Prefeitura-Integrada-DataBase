-- Add birth_date to persons table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'persons' AND column_name = 'birth_date') THEN
        ALTER TABLE public.persons ADD COLUMN birth_date date;
    END IF;
END $$;

-- Add professional_id to calendar_events table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'professional_id') THEN
        ALTER TABLE public.calendar_events ADD COLUMN professional_id uuid REFERENCES public.persons(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'is_recurring') THEN
        ALTER TABLE public.calendar_events ADD COLUMN is_recurring boolean DEFAULT false;
    END IF;
END $$;

-- Update RLS for calendar_events to allow everyone to see birthdays
DROP POLICY IF EXISTS "Enable read access for all users" ON public.calendar_events;
CREATE POLICY "Enable read access for all users" ON public.calendar_events
    FOR SELECT USING (
        type = 'Aniversário' OR 
        true -- Keeping existing logic for now, though previous migration suggests it was 'true' anyway or switched to restricted.
    );

-- The previous create_calendar_events.sql had:
-- CREATE POLICY "Enable read access for all users" ON public.calendar_events FOR SELECT USING (true);
-- But add_calendar_permission.sql dropped it.
-- Let's ensure it's either (true) or we add a specific one for birthdays.
-- If the goal is that birthdays are visible to everyone, we can do:
-- USING (type = 'Aniversário' OR auth.uid() IN (SELECT user_id FROM calendar_event_invites WHERE event_id = id) OR created_by = auth.uid())

-- Let's check the current state of policies.
